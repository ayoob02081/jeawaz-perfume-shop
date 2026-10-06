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

test("the dialog uses the dedicated endpoints' services and refreshes the user after a verified change", () => {
  assert.match(dialogSource, /requestPhoneChangeApi\(phoneNumber\)/);
  assert.match(dialogSource, /verifyPhoneChangeApi\(request\)/);
  assert.doesNotMatch(dialogSource, /updateUserApi|updateUser\(|\/users\/me/);
  // checkAuth runs after the verify call succeeded.
  const verified = dialogSource.indexOf("result = await verifyPhoneChangeApi(request)");
  const refreshed = dialogSource.indexOf("await checkAuth();", verified);
  assert.ok(verified > 0 && refreshed > verified);
  assert.doesNotMatch(dialogSource, /setUser\(/);
});

test("nothing from the login OTP is reused: no WebOTP, no stored OTP session, no browser storage", () => {
  assert.doesNotMatch(dialogSource, /useWebOtp|otpLoginFlow|otp_session|useOtpTimer/);
  assert.doesNotMatch(dialogSource, /localStorage|sessionStorage|getBrowserStorage|document\.cookie/);
  assert.doesNotMatch(dialogSource, /searchParams|router\.(push|replace)\(/);
});

test("the two code inputs never take browser SMS suggestions, and only the first takes focus", () => {
  const inputs = dialogSource.match(/<PersianOTPInput[\s\S]*?\/>/g) ?? [];
  assert.equal(inputs.length, 2);
  for (const input of inputs) {
    assert.match(input, /autoComplete="off"/);
    assert.match(input, /key=\{`(current|new)-\$\{state\.challengeId\}`\}/);
  }
  assert.match(inputs[0], /field: "currentPhoneCode"/);
  assert.match(inputs[1], /field: "newPhoneCode"/);
  assert.doesNotMatch(inputs[0], /autoFocus=\{false\}/);
  assert.match(inputs[1], /autoFocus=\{false\}/);
});

test("closing the dialog clears the flow and ignores answers that arrive later", () => {
  assert.match(dialogSource, /const close = \(\) => \{\s*sessionRef\.current \+= 1;[\s\S]*?dispatch\(\{ type: "reset" \}\);\s*onClose\(\);/);
  assert.match(dialogSource, /onClose=\{close\}/);
  assert.match(dialogSource, /if \(session !== sessionRef\.current\) return;/);
});
