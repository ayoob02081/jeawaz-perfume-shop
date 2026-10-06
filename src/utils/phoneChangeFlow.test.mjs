import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  PHONE_CHANGE_MESSAGES,
  canRequest,
  canResend,
  canVerify,
  getPhoneChangeRequestErrorMessage,
  getPhoneChangeVerifyErrorMessage,
  getVerifyRequest,
  initialPhoneChangeState,
  isProfileUpToDate,
  isSamePhone,
  looksLikeIranianMobile,
  maskPhoneForDisplay,
  phoneChangeReducer,
  secondsUntil,
} from "./phoneChangeFlow.mjs";

const NOW = Date.UTC(2026, 9, 1, 12, 0, 0);
const run = (actions, state = initialPhoneChangeState) =>
  actions.reduce(phoneChangeReducer, state);
const httpError = (status, message) => ({
  isAxiosError: true,
  response: { status, data: { message } },
});

// A dialog in the codes step for 09122222222.
const codesStep = (challengeId = "c-1", now = NOW) =>
  run([
    { type: "phoneInputChanged", value: "09122222222" },
    { type: "requestStarted", phoneNumber: "09122222222" },
    {
      type: "requestSucceeded",
      challengeId,
      expiresAt: new Date(now + 90_000).toISOString(),
      now,
    },
  ]);

test("ENTER_PHONE → request → VERIFY_CODES keeps the challenge, its expiry and the requested number", () => {
  const typed = run([{ type: "phoneInputChanged", value: "09122222222" }]);
  assert.equal(canRequest(typed), true);

  const requesting = phoneChangeReducer(typed, {
    type: "requestStarted",
    phoneNumber: "09122222222",
  });
  assert.equal(requesting.step, "requesting");
  assert.equal(canRequest(requesting), false);

  const state = phoneChangeReducer(requesting, {
    type: "requestSucceeded",
    challengeId: "c-1",
    expiresAt: new Date(NOW + 90_000).toISOString(),
    now: NOW,
  });
  assert.deepEqual(
    { ...state },
    {
      ...initialPhoneChangeState,
      step: "verifyCodes",
      phoneInput: "09122222222",
      requestedPhone: "09122222222",
      challengeId: "c-1",
      expiresAt: NOW + 90_000,
      resendAt: NOW + 60_000,
    },
  );
});

test("the client never extends the server expiry beyond 90 seconds", () => {
  const state = run(
    [{ type: "requestSucceeded", challengeId: "c", expiresAt: new Date(NOW + 10 * 60_000).toISOString(), now: NOW }],
    { ...initialPhoneChangeState, step: "requesting", requestedPhone: "09122222222" },
  );
  assert.equal(state.expiresAt, NOW + 90_000);

  const shorter = run(
    [{ type: "requestSucceeded", challengeId: "c", expiresAt: new Date(NOW + 30_000).toISOString(), now: NOW }],
    { ...initialPhoneChangeState, step: "requesting", requestedPhone: "09122222222" },
  );
  assert.equal(shorter.expiresAt, NOW + 30_000);
});

test("a failed first request returns to the phone step with the message and the typed number", () => {
  const state = run([
    { type: "phoneInputChanged", value: "09122222222" },
    { type: "requestStarted", phoneNumber: "09122222222" },
    { type: "requestFailed", message: "این شماره موبایل قبلاً توسط حساب دیگری ثبت شده است" },
  ]);
  assert.equal(state.step, "enterPhone");
  assert.equal(state.phoneInput, "09122222222");
  assert.equal(state.requestedPhone, null);
  assert.equal(state.error, "این شماره موبایل قبلاً توسط حساب دیگری ثبت شده است");
  assert.equal(
    phoneChangeReducer(state, { type: "phoneInputChanged", value: "0912" }).error,
    null,
  );
});

test("resend: allowed after 60 s, replaces the challenge and clears both codes; a failed resend keeps everything", () => {
  const typed = run(
    [
      { type: "codeChanged", field: "currentPhoneCode", value: "11111" },
      { type: "codeChanged", field: "newPhoneCode", value: "22222" },
    ],
    codesStep(),
  );
  assert.equal(canResend(typed, NOW + 59_000), false);
  assert.equal(canResend(typed, NOW + 60_000), true);

  const resending = phoneChangeReducer(typed, { type: "requestStarted", phoneNumber: "09122222222" });
  assert.equal(resending.resending, true);
  assert.equal(canResend(resending, NOW + 60_000), false);
  assert.equal(canVerify(resending, NOW + 60_000), false);

  const failed = phoneChangeReducer(resending, { type: "requestFailed", message: "لطفاً ۶۰ ثانیه بعد دوباره تلاش کنید" });
  assert.equal(failed.step, "verifyCodes");
  assert.equal(failed.challengeId, "c-1");
  assert.equal(failed.currentPhoneCode, "11111");
  assert.equal(failed.error, "لطفاً ۶۰ ثانیه بعد دوباره تلاش کنید");

  const later = NOW + 61_000;
  const resent = run(
    [
      { type: "requestStarted", phoneNumber: "09122222222" },
      { type: "requestSucceeded", challengeId: "c-2", expiresAt: new Date(later + 90_000).toISOString(), now: later },
    ],
    typed,
  );
  assert.equal(resent.challengeId, "c-2");
  assert.equal(resent.currentPhoneCode, "");
  assert.equal(resent.newPhoneCode, "");
  assert.equal(resent.expiresAt, later + 90_000);
  assert.equal(resent.resendAt, later + 60_000);
  assert.equal(resent.requestedPhone, "09122222222");
});

test("codes: digits only (Persian digits accepted), at most 5, independent fields", () => {
  const state = run(
    [
      { type: "codeChanged", field: "currentPhoneCode", value: "۱۲۳۴۵۶" },
      { type: "codeChanged", field: "newPhoneCode", value: "9a8b7" },
      { type: "codeChanged", field: "challengeId", value: "x" },
    ],
    codesStep(),
  );
  assert.equal(state.currentPhoneCode, "12345");
  assert.equal(state.newPhoneCode, "987");
  assert.equal(state.challengeId, "c-1");
});

test("verify is possible only with both full codes, before expiry and with no request in flight", () => {
  const ready = run(
    [
      { type: "codeChanged", field: "currentPhoneCode", value: "11111" },
      { type: "codeChanged", field: "newPhoneCode", value: "22222" },
    ],
    codesStep(),
  );
  assert.equal(canVerify(ready, NOW + 1_000), true);
  assert.equal(canVerify(ready, NOW + 90_000), false);
  assert.equal(canVerify({ ...ready, newPhoneCode: "2222" }, NOW), false);
  assert.deepEqual(getVerifyRequest(ready), {
    challengeId: "c-1",
    currentPhoneCode: "11111",
    newPhoneCode: "22222",
  });

  const verifying = phoneChangeReducer(ready, { type: "verifyStarted" });
  assert.equal(verifying.step, "verifying");
  assert.equal(canVerify(verifying, NOW), false);
  assert.equal(phoneChangeReducer(verifying, { type: "verifyStarted" }), verifying);
});

test("verify failure keeps the codes for correction; success clears every secret", () => {
  const verifying = run(
    [
      { type: "codeChanged", field: "currentPhoneCode", value: "11111" },
      { type: "codeChanged", field: "newPhoneCode", value: "22222" },
      { type: "verifyStarted" },
    ],
    codesStep(),
  );

  const failed = phoneChangeReducer(verifying, { type: "verifyFailed", message: PHONE_CHANGE_MESSAGES.invalidCode });
  assert.equal(failed.step, "verifyCodes");
  assert.equal(failed.currentPhoneCode, "11111");
  assert.equal(failed.error, PHONE_CHANGE_MESSAGES.invalidCode);

  const success = phoneChangeReducer(verifying, { type: "verifySucceeded", phoneNumber: "989122222222" });
  assert.deepEqual({ ...success }, {
    ...initialPhoneChangeState,
    step: "success",
    changedPhone: "989122222222",
  });
});

test("cancel/reset returns to a clean initial state from any step", () => {
  for (const state of [
    codesStep(),
    run([{ type: "verifyStarted" }], codesStep()),
    run([{ type: "phoneInputChanged", value: "0912" }]),
  ]) {
    assert.equal(phoneChangeReducer(state, { type: "reset" }), initialPhoneChangeState);
  }
});

test("stale answers cannot move the flow (out-of-step actions are ignored)", () => {
  assert.equal(
    phoneChangeReducer(initialPhoneChangeState, { type: "requestSucceeded", challengeId: "x", now: NOW }),
    initialPhoneChangeState,
  );
  assert.equal(phoneChangeReducer(initialPhoneChangeState, { type: "verifySucceeded" }), initialPhoneChangeState);
  assert.equal(phoneChangeReducer(initialPhoneChangeState, { type: "verifyFailed", message: "x" }), initialPhoneChangeState);
});

test("request errors: Persian 400/409 messages as sent, 503 unavailable, 401 session, 429, network and 5xx fallbacks", () => {
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
  assert.equal(
    getPhoneChangeRequestErrorMessage(httpError(503, "تغییر شماره موبایل در حال حاضر امکان‌پذیر نیست")),
    PHONE_CHANGE_MESSAGES.unavailable,
  );
  assert.equal(getPhoneChangeRequestErrorMessage(httpError(401, "Unauthorized")), PHONE_CHANGE_MESSAGES.sessionExpired);
  assert.equal(getPhoneChangeRequestErrorMessage(httpError(429, "ThrottlerException")), PHONE_CHANGE_MESSAGES.rateLimited);
  // English validator output and server errors are never shown.
  assert.equal(getPhoneChangeRequestErrorMessage(httpError(400, ["phoneNumber must be a string"])), PHONE_CHANGE_MESSAGES.requestFailed);
  assert.equal(getPhoneChangeRequestErrorMessage(httpError(500, "Internal server error")), PHONE_CHANGE_MESSAGES.requestFailed);
  assert.equal(getPhoneChangeRequestErrorMessage({ isAxiosError: true, request: {} }), PHONE_CHANGE_MESSAGES.network);
  assert.equal(getPhoneChangeRequestErrorMessage(new Error("boom")), PHONE_CHANGE_MESSAGES.requestFailed);
});

test("verify errors: every 401 is the one generic code message; 400 limits and 409 conflict as sent", () => {
  for (const message of ["کد نامعتبر یا منقضی است", "User not found", "Unauthorized"]) {
    assert.equal(getPhoneChangeVerifyErrorMessage(httpError(401, message)), PHONE_CHANGE_MESSAGES.invalidCode);
  }
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
