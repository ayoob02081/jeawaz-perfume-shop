// Wiring of the profile phone-change flow (the rules themselves are in
// phoneChangeFlow.test.mjs and the requests in services/phoneChangeApi.test.mjs).
// Source checks only, kept to the contract: no class names or layout.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const srcDir = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFileSync(join(srcDir, path), "utf8");
const code = (source) => source.replace(/^\s*\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

const editProfileSource = read("app/(profile)/profile/_components/EditProfileForm.jsx");
const dialogSource = code(read("app/(profile)/profile/_components/PhoneChangeDialog.jsx"));

test("the profile keeps the phone read-only and opens a dedicated dialog from a separate action", () => {
  assert.match(editProfileSource, /readOnly: true/);
  assert.match(editProfileSource, /aria-readonly="true"/);
  assert.match(editProfileSource, /buildProfileUpdatePayload\(data\)/);
  assert.match(editProfileSource, /type="button"\s*onClick=\{\(\) => setIsPhoneChangeOpen\(true\)\}/);
  assert.match(editProfileSource, />\s*تغییر شماره موبایل\s*</);
  // The dialog sits after the profile form, never inside it.
  const formEnd = editProfileSource.lastIndexOf("</form>");
  assert.ok(formEnd > 0 && editProfileSource.indexOf("<PhoneChangeDialog") > formEnd);
  assert.match(editProfileSource, /currentPhone=\{phoneNumber\}/);
});

test("the dialog uses the four stage services; the user is refreshed only after a committed change", () => {
  assert.match(dialogSource, /run\(\{ type: "currentRequestStarted" \}, requestCurrentPhoneCodeApi,/);
  assert.match(dialogSource, /verifyCurrentPhoneCodeApi\(request\)/);
  assert.match(dialogSource, /requestNewPhoneCodeApi\(request\)/);
  assert.match(dialogSource, /verifyNewPhoneCodeApi\(request\)/);
  assert.doesNotMatch(dialogSource, /requestPhoneChangeApi|verifyPhoneChangeApi/);
  assert.doesNotMatch(dialogSource, /updateUserApi|updateUser\(|\/users\/me/);
  // The success toast and checkAuth belong to the committed final step only.
  const finalStep = dialogSource.indexOf("verifyNewPhoneCodeApi(request)");
  const committed = dialogSource.indexOf("onCommitted:", finalStep);
  assert.ok(finalStep > 0 && committed > finalStep);
  assert.match(
    dialogSource.slice(committed, committed + 200),
    /toast\.success\(PHONE_CHANGE_MESSAGES\.changed\);\s*checkAuth\(\);/,
  );
  assert.equal(dialogSource.match(/toast\.success\(/g).length, 1);
  assert.doesNotMatch(dialogSource, /setUser\(/);
});

test("step 2 opens only on the server's confirmation: the proof comes from the verify answer", () => {
  assert.match(dialogSource, /type: "currentVerified",\s*proofId: result\?\.proofId,/);
  assert.equal(dialogSource.match(/type: "currentVerified"/g).length, 1);
  // No call ever chains into the next SMS.
  const verifyCurrent = dialogSource.slice(
    dialogSource.indexOf("const verifyCurrentCode"),
    dialogSource.indexOf("const handleCurrentSubmit"),
  );
  assert.doesNotMatch(verifyCurrent, /requestNewPhoneCodeApi|requestNewCode/);
});

test("one Modal with sequential panels, never a second dialog", () => {
  assert.equal(dialogSource.match(/<Modal\b/g).length, 1);
  assert.equal(dialogSource.match(/role="dialog"/g).length, 1);
  assert.match(dialogSource, /\{isCurrentStep\(state\) && \(/);
  assert.match(dialogSource, /\{isNewStep\(state\) && \(/);
});

test("nothing from the login OTP is reused: no WebOTP, no stored OTP session, no browser storage", () => {
  assert.doesNotMatch(dialogSource, /useWebOtp|otpLoginFlow|otp_session|useOtpTimer/);
  assert.doesNotMatch(dialogSource, /localStorage|sessionStorage|getBrowserStorage|document\.cookie/);
  assert.doesNotMatch(dialogSource, /searchParams|router\.(push|replace)\(/);
});

test("step 1 code may take the browser SMS suggestion; step 2 code never does (it could offer the step 1 code)", () => {
  const inputs = dialogSource.match(/<PersianOTPInput[\s\S]*?\/>/g) ?? [];
  assert.equal(inputs.length, 2);
  const [current, next] = inputs;
  assert.match(current, /key=\{`current-\$\{state\.currentChallengeId\}`\}/);
  assert.match(current, /type: "currentCodeChanged"/);
  assert.match(current, /autoComplete="one-time-code"/);
  assert.match(next, /key=\{`new-\$\{state\.newChallengeId\}`\}/);
  assert.match(next, /type: "newCodeChanged"/);
  assert.match(next, /autoComplete="off"/);
});

test("step 2 keeps the code field below the number field in the same panel", () => {
  const panel = dialogSource.slice(dialogSource.indexOf("{isNewStep(state) && ("));
  const numberField = panel.indexOf('id="phone-change-new"');
  const codeField = panel.indexOf("<PersianOTPInput");
  assert.ok(numberField > 0 && codeField > numberField);
  assert.match(panel, /readOnly=\{phoneLocked\}/);
  assert.match(panel, /onClick=\{handleEditNewPhone\}/);
});

test("closing the dialog clears the flow and ignores answers that arrive later", () => {
  assert.match(dialogSource, /const close = \(\) => \{\s*sessionRef\.current \+= 1;[\s\S]*?dispatch\(\{ type: "reset" \}\);\s*onClose\(\);/);
  assert.match(dialogSource, /onClose=\{close\}/);
  assert.match(dialogSource, /if \(session === sessionRef\.current\) \{/);
  // One request at a time: the busy guard comes before the start action.
  assert.match(dialogSource, /if \(busyRef\.current\) return;\s*busyRef\.current = true;\s*const session = sessionRef\.current;\s*dispatch\(start\);/);
});
