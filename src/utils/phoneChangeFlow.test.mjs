import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  PHONE_CHANGE_MESSAGES,
  canEditNewPhone,
  canRequestCurrent,
  canRequestNew,
  canResendCurrent,
  canResendNew,
  canVerifyCurrent,
  canVerifyNew,
  getCurrentVerifyRequest,
  getNewRequest,
  getNewVerifyRequest,
  getPhoneChangeRequestErrorMessage,
  getPhoneChangeVerifyErrorMessage,
  initialPhoneChangeState,
  isCurrentStep,
  isNewStep,
  isProfileUpToDate,
  isProofExpired,
  isRestartRequired,
  isSamePhone,
  looksLikeIranianMobile,
  maskPhoneForDisplay,
  phoneChangeReducer,
  secondsUntil,
} from "./phoneChangeFlow.mjs";

const NOW = Date.UTC(2026, 9, 12, 12, 0, 0);
const ME = "989121111111";
const MINUTE = 60_000;
const run = (actions, state = initialPhoneChangeState) =>
  actions.reduce(phoneChangeReducer, state);
const iso = (time) => new Date(time).toISOString();
const httpError = (status, message) => ({
  isAxiosError: true,
  response: { status, data: { message } },
});

// Step 1 with the current-number code sent.
const currentCodeStep = (now = NOW) =>
  run([
    { type: "currentRequestStarted" },
    { type: "currentRequestSucceeded", challengeId: "cur-1", expiresAt: iso(now + 90_000), now },
  ]);

// Step 2, right after the server confirmed the current number.
const newPhoneStep = (now = NOW) =>
  run(
    [
      { type: "currentCodeChanged", value: "11111" },
      { type: "currentVerifyStarted" },
      { type: "currentVerified", proofId: "proof-1", proofExpiresAt: iso(now + 10 * MINUTE), now },
    ],
    currentCodeStep(now),
  );

// Step 2 with the new-number code sent to 09122222222.
const newCodeStep = (now = NOW) =>
  run(
    [
      { type: "phoneInputChanged", value: "09122222222" },
      { type: "newRequestStarted", phoneNumber: "09122222222" },
      { type: "newRequestSucceeded", challengeId: "new-1", expiresAt: iso(now + 90_000), now },
    ],
    newPhoneStep(now),
  );

test("the dialog starts at step 1: only the current-number code can be requested", () => {
  const state = initialPhoneChangeState;
  assert.equal(state.step, "currentIdle");
  assert.equal(isCurrentStep(state), true);
  assert.equal(isNewStep(state), false);
  assert.equal(canRequestCurrent(state, NOW), true);
  // Nothing of step 2 is reachable from here.
  for (const action of [
    { type: "phoneInputChanged", value: "09122222222" },
    { type: "newRequestStarted", phoneNumber: "09122222222" },
    { type: "newRequestSucceeded", challengeId: "x", now: NOW },
    { type: "currentVerified", proofId: "forged", now: NOW },
    { type: "verifySucceeded", phoneNumber: "989122222222" },
  ]) {
    assert.equal(phoneChangeReducer(state, action), state, action.type);
  }
  assert.equal(canRequestNew({ ...state, phoneInput: "09122222222", proofId: "p" }, NOW, ME), false);
});

test("step 1: request → the code field in the same panel, with the server expiry and a 60 s resend", () => {
  const requesting = phoneChangeReducer(initialPhoneChangeState, { type: "currentRequestStarted" });
  assert.equal(requesting.step, "currentRequesting");
  assert.equal(canRequestCurrent(requesting, NOW), false);

  const state = currentCodeStep();
  assert.deepEqual({ ...state }, {
    ...initialPhoneChangeState,
    step: "currentCode",
    currentChallengeId: "cur-1",
    currentExpiresAt: NOW + 90_000,
    currentResendAt: NOW + 60_000,
  });
  assert.equal(isCurrentStep(state), true);

  // The client never stretches the server expiry past 90 s.
  const skewed = run(
    [
      { type: "currentRequestStarted" },
      { type: "currentRequestSucceeded", challengeId: "c", expiresAt: iso(NOW + 10 * MINUTE), now: NOW },
    ],
  );
  assert.equal(skewed.currentExpiresAt, NOW + 90_000);
});

test("step 1: a failed request returns to the idle panel with the message", () => {
  const state = run([
    { type: "currentRequestStarted" },
    { type: "currentRequestFailed", message: "لطفاً ۶۰ ثانیه بعد دوباره تلاش کنید" },
  ]);
  assert.equal(state.step, "currentIdle");
  assert.equal(state.error, "لطفاً ۶۰ ثانیه بعد دوباره تلاش کنید");
  assert.equal(canRequestCurrent(state, NOW), true);
});

test("step 1: the code is digits only (Persian accepted), 5 at most; verify needs a full unexpired code", () => {
  const typed = run([{ type: "currentCodeChanged", value: "۱۲۳۴۵۶" }], currentCodeStep());
  assert.equal(typed.currentCode, "12345");
  assert.equal(canVerifyCurrent(typed, NOW + 1_000), true);
  assert.equal(canVerifyCurrent(typed, NOW + 90_000), false);
  assert.equal(canVerifyCurrent({ ...typed, currentCode: "1234" }, NOW), false);
  assert.deepEqual(getCurrentVerifyRequest(typed), { challengeId: "cur-1", code: "12345" });

  const verifying = phoneChangeReducer(typed, { type: "currentVerifyStarted" });
  assert.equal(verifying.step, "currentVerifying");
  assert.equal(canVerifyCurrent(verifying, NOW), false);
  assert.equal(phoneChangeReducer(verifying, { type: "currentVerifyStarted" }), verifying);

  const failed = phoneChangeReducer(verifying, { type: "currentVerifyFailed", message: PHONE_CHANGE_MESSAGES.invalidCode });
  assert.equal(failed.step, "currentCode");
  assert.equal(failed.currentCode, "12345");
  assert.equal(failed.error, PHONE_CHANGE_MESSAGES.invalidCode);
});

test("step 1: resend after 60 s replaces the code; a failed resend keeps it", () => {
  const typed = run([{ type: "currentCodeChanged", value: "11111" }], currentCodeStep());
  assert.equal(canResendCurrent(typed, NOW + 59_000), false);
  assert.equal(canResendCurrent(typed, NOW + 60_000), true);

  const resending = phoneChangeReducer(typed, { type: "currentRequestStarted" });
  assert.equal(resending.resending, true);
  assert.equal(canResendCurrent(resending, NOW + 60_000), false);
  assert.equal(canVerifyCurrent(resending, NOW + 1_000), false);
  assert.equal(phoneChangeReducer(resending, { type: "currentVerifyStarted" }), resending);

  const failed = phoneChangeReducer(resending, { type: "currentRequestFailed", message: "x" });
  assert.deepEqual(
    [failed.step, failed.currentChallengeId, failed.currentCode, failed.resending, failed.error],
    ["currentCode", "cur-1", "11111", false, "x"],
  );

  const later = NOW + 61_000;
  const resent = phoneChangeReducer(resending, {
    type: "currentRequestSucceeded", challengeId: "cur-2", expiresAt: iso(later + 90_000), now: later,
  });
  assert.deepEqual(
    [resent.currentChallengeId, resent.currentCode, resent.currentExpiresAt, resent.currentResendAt],
    ["cur-2", "", later + 90_000, later + 60_000],
  );
});

test("step 2 opens only on the server's confirmation, which carries the proof; the used code is dropped", () => {
  const verifying = run(
    [{ type: "currentCodeChanged", value: "11111" }, { type: "currentVerifyStarted" }],
    currentCodeStep(),
  );
  // No proof in the answer: nothing moves.
  assert.equal(phoneChangeReducer(verifying, { type: "currentVerified", now: NOW }), verifying);
  // A confirmation for a code that is not being verified is ignored.
  const typed = run([{ type: "currentCodeChanged", value: "11111" }], currentCodeStep());
  assert.equal(
    phoneChangeReducer(typed, { type: "currentVerified", proofId: "p", proofExpiresAt: iso(NOW + MINUTE), now: NOW }),
    typed,
  );

  const state = newPhoneStep();
  assert.equal(state.step, "newPhone");
  assert.equal(isNewStep(state), true);
  assert.deepEqual(
    [state.proofId, state.proofExpiresAt, state.currentChallengeId, state.currentCode],
    ["proof-1", NOW + 10 * MINUTE, null, ""],
  );
  // The proof deadline is never later than this browser's own 10 minutes.
  const skewed = run(
    [{ type: "currentVerified", proofId: "p", proofExpiresAt: iso(NOW + 60 * MINUTE), now: NOW }],
    verifying,
  );
  assert.equal(skewed.proofExpiresAt, NOW + 10 * MINUTE);
});

test("step 2: the number field gates the request (valid, not the current number, proof alive)", () => {
  const state = newPhoneStep();
  assert.equal(canRequestNew(state, NOW, ME), false);
  const typed = phoneChangeReducer(state, { type: "phoneInputChanged", value: "09122222222" });
  assert.equal(canRequestNew(typed, NOW, ME), true);
  assert.equal(canRequestNew({ ...typed, phoneInput: "0912" }, NOW, ME), false);
  assert.equal(canRequestNew({ ...typed, phoneInput: "09121111111" }, NOW, ME), false);
  assert.equal(canRequestNew(typed, NOW + 10 * MINUTE, ME), false);
  assert.equal(isProofExpired(typed, NOW + 10 * MINUTE), true);
  assert.equal(canRequestNew({ ...typed, proofId: null }, NOW, ME), false);
  assert.deepEqual(getNewRequest(typed), { proofId: "proof-1", phoneNumber: "09122222222" });
});

test("step 2: request → the code field appears below the number, which locks; the code never outlives the proof", () => {
  const typed = run([{ type: "phoneInputChanged", value: "09122222222" }], newPhoneStep());
  const requesting = phoneChangeReducer(typed, { type: "newRequestStarted", phoneNumber: "09122222222" });
  assert.equal(requesting.step, "newRequesting");
  assert.equal(requesting.requestedPhone, "09122222222");
  assert.equal(phoneChangeReducer(requesting, { type: "phoneInputChanged", value: "0" }), requesting);

  const state = newCodeStep();
  assert.deepEqual(
    [state.step, state.newChallengeId, state.newExpiresAt, state.newResendAt, state.proofId],
    ["newCode", "new-1", NOW + 90_000, NOW + 60_000, "proof-1"],
  );
  assert.equal(phoneChangeReducer(state, { type: "phoneInputChanged", value: "0" }), state);

  // 30 s of proof left: the code's deadline is capped.
  const late = NOW + 10 * MINUTE - 30_000;
  const capped = run(
    [
      { type: "newRequestStarted", phoneNumber: "09122222222" },
      { type: "newRequestSucceeded", challengeId: "n", expiresAt: iso(late + 90_000), now: late },
    ],
    typed,
  );
  assert.equal(capped.newExpiresAt, NOW + 10 * MINUTE);
});

test("step 2: a failed request returns to the number with the message; the proof stays", () => {
  const state = run(
    [
      { type: "phoneInputChanged", value: "09122222222" },
      { type: "newRequestStarted", phoneNumber: "09122222222" },
      { type: "newRequestFailed", message: "این شماره موبایل قبلاً توسط حساب دیگری ثبت شده است" },
    ],
    newPhoneStep(),
  );
  assert.deepEqual(
    [state.step, state.phoneInput, state.requestedPhone, state.proofId, state.error],
    ["newPhone", "09122222222", null, "proof-1", "این شماره موبایل قبلاً توسط حساب دیگری ثبت شده است"],
  );
});

test("step 2: editing the number drops the sent code and keeps the proof and the resend cooldown", () => {
  const typed = run([{ type: "newCodeChanged", value: "22222" }], newCodeStep());
  assert.equal(canEditNewPhone(typed), true);

  const editing = phoneChangeReducer(typed, { type: "editNewPhone" });
  assert.deepEqual(
    [editing.step, editing.phoneInput, editing.requestedPhone, editing.newChallengeId, editing.newCode, editing.proofId, editing.newResendAt],
    ["newPhone", "09122222222", null, null, "", "proof-1", NOW + 60_000],
  );
  const other = phoneChangeReducer(editing, { type: "phoneInputChanged", value: "09123333333" });
  // Another number waits for the server cooldown too.
  assert.equal(canRequestNew(other, NOW + 59_000, ME), false);
  assert.equal(canRequestNew(other, NOW + 60_000, ME), true);

  // Not while a resend or the verification is in flight.
  const resending = phoneChangeReducer(typed, { type: "newRequestStarted", phoneNumber: "09122222222" });
  assert.equal(canEditNewPhone(resending), false);
  assert.equal(phoneChangeReducer(resending, { type: "editNewPhone" }), resending);
  const verifying = phoneChangeReducer(typed, { type: "newVerifyStarted" });
  assert.equal(phoneChangeReducer(verifying, { type: "editNewPhone" }), verifying);
});

test("step 2: resend after 60 s replaces the code for the same number", () => {
  const typed = run([{ type: "newCodeChanged", value: "22222" }], newCodeStep());
  assert.equal(canResendNew(typed, NOW + 59_000), false);
  assert.equal(canResendNew(typed, NOW + 60_000), true);
  assert.equal(canResendNew(typed, NOW + 10 * MINUTE), false);

  const later = NOW + 61_000;
  const resent = run(
    [
      { type: "newRequestStarted", phoneNumber: "09122222222" },
      { type: "newRequestSucceeded", challengeId: "new-2", expiresAt: iso(later + 90_000), now: later },
    ],
    typed,
  );
  assert.deepEqual(
    [resent.newChallengeId, resent.newCode, resent.requestedPhone, resent.proofId],
    ["new-2", "", "09122222222", "proof-1"],
  );
  const failed = run(
    [{ type: "newRequestStarted", phoneNumber: "09122222222" }, { type: "newRequestFailed", message: "x" }],
    typed,
  );
  assert.deepEqual([failed.step, failed.newChallengeId, failed.newCode], ["newCode", "new-1", "22222"]);
});

test("step 2: verify needs a full code before both the code and the proof expire", () => {
  const typed = run([{ type: "newCodeChanged", value: "۲۲۲۲۲" }], newCodeStep());
  assert.equal(typed.newCode, "22222");
  assert.equal(canVerifyNew(typed, NOW + 1_000), true);
  assert.equal(canVerifyNew(typed, NOW + 90_000), false);
  assert.equal(canVerifyNew({ ...typed, proofExpiresAt: NOW + 500 }, NOW + 1_000), false);
  assert.equal(canVerifyNew({ ...typed, newCode: "2222" }, NOW), false);
  assert.deepEqual(getNewVerifyRequest(typed), { challengeId: "new-1", code: "22222" });

  const verifying = phoneChangeReducer(typed, { type: "newVerifyStarted" });
  assert.equal(canVerifyNew(verifying, NOW), false);
  const failed = phoneChangeReducer(verifying, { type: "newVerifyFailed", message: PHONE_CHANGE_MESSAGES.invalidCode });
  assert.deepEqual([failed.step, failed.newCode, failed.error], ["newCode", "22222", PHONE_CHANGE_MESSAGES.invalidCode]);
});

test("success clears every secret (proof, ids, codes, numbers)", () => {
  const verifying = run([{ type: "newCodeChanged", value: "22222" }, { type: "newVerifyStarted" }], newCodeStep());
  const success = phoneChangeReducer(verifying, { type: "verifySucceeded", phoneNumber: "989122222222" });
  assert.deepEqual({ ...success }, {
    ...initialPhoneChangeState,
    step: "success",
    changedPhone: "989122222222",
  });
});

test("a server 403 (proof gone) from any step-2 state returns to step 1, dropping every secret but keeping the step-1 cooldown", () => {
  const typed = run([{ type: "newCodeChanged", value: "22222" }], newCodeStep());
  for (const state of [
    newPhoneStep(),
    run([{ type: "phoneInputChanged", value: "09122222222" }, { type: "newRequestStarted", phoneNumber: "09122222222" }], newPhoneStep()),
    typed,
    phoneChangeReducer(typed, { type: "newVerifyStarted" }),
  ]) {
    const restarted = phoneChangeReducer(state, { type: "restartRequired", message: PHONE_CHANGE_MESSAGES.restartRequired });
    assert.deepEqual({ ...restarted }, {
      ...initialPhoneChangeState,
      currentResendAt: NOW + 60_000,
      error: PHONE_CHANGE_MESSAGES.restartRequired,
    });
    assert.equal(canRequestCurrent(restarted, NOW + 59_000), false);
    assert.equal(canRequestCurrent(restarted, NOW + 60_000), true);
  }
  // Step 1 is not affected by a stray restart.
  const current = currentCodeStep();
  assert.equal(phoneChangeReducer(current, { type: "restartRequired" }), current);
});

test("cancel/reset returns to a clean initial state from any step", () => {
  for (const state of [currentCodeStep(), newPhoneStep(), newCodeStep()]) {
    assert.equal(phoneChangeReducer(state, { type: "reset" }), initialPhoneChangeState);
  }
});

test("stale answers cannot move the flow (out-of-step actions are ignored)", () => {
  const code = newCodeStep();
  for (const action of [
    { type: "currentRequestSucceeded", challengeId: "x", now: NOW },
    { type: "currentVerified", proofId: "x", now: NOW },
    { type: "currentVerifyFailed", message: "x" },
    { type: "newVerifyFailed", message: "x" },
    { type: "verifySucceeded", phoneNumber: "x" },
    { type: "newRequestSucceeded", challengeId: "x", now: NOW },
  ]) {
    assert.equal(phoneChangeReducer(code, action), code, action.type);
  }
  assert.equal(
    phoneChangeReducer(initialPhoneChangeState, { type: "newVerifyFailed", message: "x" }),
    initialPhoneChangeState,
  );
});

test("request errors: Persian 400/409 as sent, 503 unavailable, 401 session, 403 restart, 429, network and 5xx fallbacks", () => {
  for (const message of [
    "شماره موبایل معتبر نیست",
    "شماره جدید با شماره فعلی یکسان است",
    "لطفاً ۶۰ ثانیه بعد دوباره تلاش کنید",
    "تعداد درخواست بیش از حد مجاز است. چند دقیقه دیگر تلاش کنید",
    "ارسال کد تایید با مشکل مواجه شد",
    "تغییر شماره برای این حساب نیاز به بررسی پشتیبانی دارد",
  ]) {
    assert.equal(getPhoneChangeRequestErrorMessage(httpError(400, message)), message);
  }
  assert.equal(
    getPhoneChangeRequestErrorMessage(httpError(409, "این شماره موبایل قبلاً توسط حساب دیگری ثبت شده است")),
    "این شماره موبایل قبلاً توسط حساب دیگری ثبت شده است",
  );
  assert.equal(getPhoneChangeRequestErrorMessage(httpError(503, "x")), PHONE_CHANGE_MESSAGES.unavailable);
  assert.equal(getPhoneChangeRequestErrorMessage(httpError(401, "Unauthorized")), PHONE_CHANGE_MESSAGES.sessionExpired);
  assert.equal(getPhoneChangeRequestErrorMessage(httpError(403, "x")), PHONE_CHANGE_MESSAGES.restartRequired);
  assert.equal(getPhoneChangeRequestErrorMessage(httpError(429, "ThrottlerException")), PHONE_CHANGE_MESSAGES.rateLimited);
  // English validator output and server errors are never shown.
  assert.equal(getPhoneChangeRequestErrorMessage(httpError(400, ["property x should not exist"])), PHONE_CHANGE_MESSAGES.requestFailed);
  assert.equal(getPhoneChangeRequestErrorMessage(httpError(500, "Internal server error")), PHONE_CHANGE_MESSAGES.requestFailed);
  assert.equal(getPhoneChangeRequestErrorMessage({ isAxiosError: true, request: {} }), PHONE_CHANGE_MESSAGES.network);
  assert.equal(getPhoneChangeRequestErrorMessage(new Error("boom")), PHONE_CHANGE_MESSAGES.requestFailed);
  assert.equal(isRestartRequired(httpError(403, "x")), true);
  assert.equal(isRestartRequired(httpError(401, "x")), false);
  assert.equal(isRestartRequired(new Error("x")), false);
});

test("verify errors: every 401 is the one generic code message; 403 restart; 400 limits and 409 conflict as sent", () => {
  for (const message of ["کد نامعتبر یا منقضی است", "User not found", "Unauthorized"]) {
    assert.equal(getPhoneChangeVerifyErrorMessage(httpError(401, message)), PHONE_CHANGE_MESSAGES.invalidCode);
  }
  assert.equal(getPhoneChangeVerifyErrorMessage(httpError(403, "x")), PHONE_CHANGE_MESSAGES.restartRequired);
  assert.equal(
    getPhoneChangeVerifyErrorMessage(httpError(400, "تعداد درخواست بیش از حد مجاز است. چند دقیقه دیگر تلاش کنید")),
    "تعداد درخواست بیش از حد مجاز است. چند دقیقه دیگر تلاش کنید",
  );
  assert.equal(
    getPhoneChangeVerifyErrorMessage(httpError(409, "این شماره موبایل قبلاً توسط حساب دیگری ثبت شده است")),
    "این شماره موبایل قبلاً توسط حساب دیگری ثبت شده است",
  );
  assert.equal(getPhoneChangeVerifyErrorMessage(httpError(500, "x")), PHONE_CHANGE_MESSAGES.verifyFailed);
  assert.equal(getPhoneChangeVerifyErrorMessage({ isAxiosError: true, request: {} }), PHONE_CHANGE_MESSAGES.network);
});

test("the client restart text matches the backend's restartRequired answer", () => {
  assert.equal(
    PHONE_CHANGE_MESSAGES.restartRequired,
    "تایید شماره فعلی معتبر نیست یا منقضی شده است. لطفاً دوباره از ابتدا شروع کنید",
  );
});

test("phone helpers: UX pre-check, same-number comparison, masking and countdowns", () => {
  for (const value of ["09122222222", "9122222222", "989122222222", "+989122222222", "00989122222222", "0912 222 2222", "۰۹۱۲۲۲۲۲۲۲۲"]) {
    assert.equal(looksLikeIranianMobile(value), true, value);
  }
  for (const value of ["", "0912222222", "08122222222", "+19122222222", "abc"]) {
    assert.equal(looksLikeIranianMobile(value), false, value);
  }
  assert.equal(isSamePhone("989122222222", "09122222222"), true);
  assert.equal(isSamePhone("989122222222", "09122222223"), false);
  assert.equal(isSamePhone("", ""), false);
  assert.equal(maskPhoneForDisplay("989121234567"), "*******4567");
  assert.equal(maskPhoneForDisplay(null), "");
  assert.equal(secondsUntil(NOW + 1_500, NOW), 2);
  assert.equal(secondsUntil(NOW - 1, NOW), 0);
  assert.equal(secondsUntil(null, NOW), 0);
  assert.equal(isProfileUpToDate({ phoneNumber: "989122222222" }, "989122222222"), true);
  assert.equal(isProfileUpToDate({ phoneNumber: "989121111111" }, "989122222222"), false);
  assert.equal(isProfileUpToDate(null, "989122222222"), false);
});

test("the flow module uses no browser storage and nothing from the login OTP flow", () => {
  const source = readFileSync(new URL("./phoneChangeFlow.mjs", import.meta.url), "utf8");
  const code = source.replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(code, /localStorage|sessionStorage|document\.cookie|window\.|location/);
  assert.doesNotMatch(code, /otpLoginFlow|useWebOtp|otp_session/);
});
