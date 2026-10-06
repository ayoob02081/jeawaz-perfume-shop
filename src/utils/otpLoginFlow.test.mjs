import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  OTP_LIFETIME_MS,
  OTP_NETWORK_MESSAGE,
  OTP_RATE_LIMIT_MESSAGE,
  OTP_REQUEST_FAILURE_MESSAGE,
  OTP_RESEND_COOLDOWN_MS,
  OTP_SESSION_STORAGE_KEY,
  OTP_INVALID_CODE_MESSAGE,
  OTP_VERIFY_FAILURE_MESSAGE,
  canEditPhone,
  clearOtpSession,
  createOtpRequestGuard,
  createOtpSession,
  decidePhoneSubmit,
  getOtpRequestErrorMessage,
  getOtpScreenStatus,
  getOtpVerifyErrorMessage,
  getResendRequest,
  getRetryRequest,
  getVerifyRequest,
  initialOtpLoginState,
  isCurrentAttempt,
  isOtpFlowBusy,
  isPreSendOtpRejection,
  isWebOtpActive,
  otpLoginReducer,
  otpSessionForPhone,
  readOtpSession,
  resendRemainingSeconds,
  writeOtpSession,
} from "./otpLoginFlow.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const loginSource = read("../app/(user)/auth/_components/Login.jsx");

const PHONE_A = "09121111111";
const PHONE_B = "09122222222";
const NOW = 1_800_000_000_000;

function createStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

const sessionFor = (phone, now = NOW) =>
  createOtpSession({
    phone,
    expiresAt: new Date(now + OTP_LIFETIME_MS).toISOString(),
    now,
  });

const reduce = (state, ...actions) => actions.reduce(otpLoginReducer, state);

// An Axios error carrying the backend's common error envelope.
const httpError = (status, message) => ({
  isAxiosError: true,
  response: { status, data: { statusCode: status, message } },
});

// Phone submitted: the code screen shows while the request is sent.
const sendingFor = (phone = PHONE_A, state = initialOtpLoginState) =>
  otpLoginReducer(state, { type: "requestStarted", phone });

// Phone requested and its code confirmed.
function otpStepFor(phone = PHONE_A, now = NOW) {
  const start = sendingFor(phone);
  return reduce(start, {
    type: "requestSucceeded",
    attempt: start.attempt,
    session: sessionFor(phone, now),
  });
}

const failedFor = (phone = PHONE_A, message = OTP_NETWORK_MESSAGE) => {
  const start = sendingFor(phone);
  return otpLoginReducer(start, {
    type: "requestFailed",
    attempt: start.attempt,
    message,
  });
};

// --- request ----------------------------------------------------------------

test("a request in flight blocks another start", async () => {
  const pending = sendingFor(PHONE_A);
  assert.equal(pending.requestStatus, "pending");
  assert.equal(isOtpFlowBusy(pending), true);
  // A second submit in the same attempt changes nothing.
  assert.equal(
    otpLoginReducer(pending, { type: "requestStarted", phone: PHONE_B }),
    pending,
  );
  assert.match(
    loginSource,
    /if \(isRequestPending\(flowRef\.current\)\) return;\s*dispatch\(\{ type: "requestStarted", phone \}\);/,
  );

  // One HTTP request per phone: a same-phone start while in flight shares it.
  const guard = createOtpRequestGuard();
  let calls = 0;
  let release;
  const task = () => {
    calls += 1;
    return new Promise((resolve) => (release = resolve));
  };
  const first = guard.run(PHONE_A, task);
  const joined = guard.run(PHONE_A, task);
  assert.equal(joined, first);
  assert.equal(guard.isPending(PHONE_A), true);
  assert.equal(guard.isPending(PHONE_B), false);

  await Promise.resolve();
  release("sent");
  assert.deepEqual(await first, { ok: true, value: "sent" });
  assert.deepEqual(await joined, { ok: true, value: "sent" });
  assert.equal(calls, 1);
  assert.equal(guard.isPending(PHONE_A), false);
});

test("the guard releases a phone after a failure and runs other phones apart", async () => {
  const guard = createOtpRequestGuard();
  const error = Object.assign(new Error("fail"), { isAxiosError: true });
  const failed = await guard.run(PHONE_A, () => {
    throw error;
  });
  assert.deepEqual(failed, { ok: false, error });
  assert.equal(guard.isPending(PHONE_A), false);

  const [a, b] = await Promise.all([
    guard.run(PHONE_A, async () => "a"),
    guard.run(PHONE_B, async () => "b"),
  ]);
  assert.deepEqual([a.value, b.value], ["a", "b"]);
});

test("request success records the issued phone and enters the code step", () => {
  const state = otpStepFor(PHONE_A);

  assert.equal(state.step, "otp");
  assert.equal(state.otpPhone, PHONE_A);
  assert.equal(state.resendAt, NOW + OTP_RESEND_COOLDOWN_MS);
  assert.equal(state.requestStatus, "idle");
  assert.equal(state.requestError, null);
  assert.equal(state.verifyStatus, "idle");
  assert.equal(state.attempt, initialOtpLoginState.attempt + 1);
});

// --- sending / ready / send-error --------------------------------------------

test("a phone submit enters the code screen at once, as sending", () => {
  const sending = sendingFor(PHONE_A);

  assert.equal(sending.step, "otp");
  assert.equal(getOtpScreenStatus(sending), "sending");
  assert.equal(sending.pendingPhone, PHONE_A);
  // Nothing is claimed before the backend confirms a code.
  assert.equal(sending.otpPhone, null);
  assert.equal(sending.resendAt, null);
  assert.equal(sending.attempt, initialOtpLoginState.attempt);
  assert.equal(getOtpScreenStatus(initialOtpLoginState), null);
});

test("no code can be verified, resent or read by WebOTP while sending", () => {
  const sending = sendingFor(PHONE_A);

  assert.deepEqual(getVerifyRequest(sending, "12345"), {
    ok: false,
    reason: "sending",
  });
  assert.equal(getResendRequest(sending, NOW + 10 * 60_000).ok, false);
  assert.equal(getRetryRequest(sending).ok, false);
  assert.equal(isWebOtpActive(sending), false);
  assert.match(loginSource, /enabled: isWebOtpActive\(flow\) && !isPasswordType/);
  assert.match(loginSource, /readOnly=\{otpScreen !== "ready" \|\| verifyPending\}/);
});

test("success promotes the pending phone to the confirmed phone", () => {
  const ready = otpStepFor(PHONE_A);

  assert.equal(getOtpScreenStatus(ready), "ready");
  assert.equal(ready.otpPhone, PHONE_A);
  assert.equal(ready.pendingPhone, null);
  assert.equal(isWebOtpActive(ready), true);
  assert.equal(getVerifyRequest(ready, "12345").ok, true);
});

test("a failed first request stays on the code screen as send-error", () => {
  const failed = failedFor(PHONE_A);

  assert.equal(failed.step, "otp");
  assert.equal(getOtpScreenStatus(failed), "send-error");
  assert.equal(failed.otpPhone, null);
  assert.equal(failed.pendingPhone, PHONE_A);
  assert.equal(failed.requestStatus, "error");
  assert.equal(failed.requestError, OTP_NETWORK_MESSAGE);
  assert.equal(isOtpFlowBusy(failed), false);
  // Still no code: inputs stay read-only, nothing to verify or listen for.
  assert.deepEqual(getVerifyRequest(failed, "12345"), {
    ok: false,
    reason: "send-error",
  });
  assert.equal(isWebOtpActive(failed), false);
  // The screen shows the message; only a failed resend uses a toast.
  assert.match(loginSource, /if \(flowRef\.current\.otpPhone\) toast\.error\(message\);/);
});

test("a failed first request offers retry and edit", () => {
  const failed = failedFor(PHONE_A);

  assert.deepEqual(getRetryRequest(failed), { ok: true, phoneNumber: PHONE_A });
  assert.equal(canEditPhone(failed), true);

  const edited = otpLoginReducer(failed, { type: "phoneEdited" });
  assert.equal(edited.step, "phone");
  assert.equal(edited.pendingPhone, null);
  assert.equal(edited.requestError, null);
  assert.equal(edited.requestStatus, "idle");
});

test("retry sends to the same pending phone and stays on the code screen", () => {
  const failed = failedFor(PHONE_A);
  const retry = getRetryRequest(failed);
  const retrying = otpLoginReducer(failed, {
    type: "requestStarted",
    phone: retry.phoneNumber,
  });

  assert.equal(getOtpScreenStatus(retrying), "sending");
  assert.equal(retrying.pendingPhone, PHONE_A);
  assert.equal(retrying.requestError, null);
  assert.match(loginSource, /const retry = getRetryRequest\(flowRef\.current\);\s*if \(retry\.ok\) requestOtp\(retry\.phoneNumber\);/);
});

test("editing while sending makes the pending result stale", () => {
  const sending = sendingFor(PHONE_A);
  assert.equal(canEditPhone(sending), true);

  const edited = otpLoginReducer(sending, { type: "phoneEdited" });
  assert.equal(edited.step, "phone");
  for (const action of [
    { type: "requestSucceeded", attempt: sending.attempt, session: sessionFor(PHONE_A) },
    { type: "requestFailed", attempt: sending.attempt, message: "x" },
  ]) {
    assert.equal(otpLoginReducer(edited, action), edited);
  }
});

test("a late success cannot resurrect an older attempt", () => {
  const sendingA = sendingFor(PHONE_A);
  const sendingB = sendingFor(
    PHONE_B,
    otpLoginReducer(sendingA, { type: "phoneEdited" }),
  );

  const afterLateA = otpLoginReducer(sendingB, {
    type: "requestSucceeded",
    attempt: sendingA.attempt,
    session: sessionFor(PHONE_A),
  });
  assert.equal(afterLateA, sendingB);
  assert.equal(getOtpScreenStatus(afterLateA), "sending");
  assert.equal(afterLateA.pendingPhone, PHONE_B);
  assert.equal(afterLateA.otpPhone, null);
});

test("a stale success is kept for its phone but never over another phone", () => {
  const storage = createStorage();
  const sessionB = sessionFor(PHONE_B);
  writeOtpSession(storage, sessionB, { replaceOtherPhone: true, now: NOW });

  writeOtpSession(storage, sessionFor(PHONE_A), {
    replaceOtherPhone: false,
    now: NOW,
  });
  assert.equal(readOtpSession(storage, NOW).phone, PHONE_B);

  // With nothing else stored (e.g. the modal was closed) it is recorded.
  const empty = createStorage();
  writeOtpSession(empty, sessionFor(PHONE_A), { replaceOtherPhone: false, now: NOW });
  assert.equal(readOtpSession(empty, NOW).phone, PHONE_A);
  assert.match(loginSource, /replaceOtherPhone: current,/);
});

// --- resend -----------------------------------------------------------------

const COOLDOWN_REJECTION = httpError(400, "لطفاً ۶۰ ثانیه بعد دوباره تلاش کنید");
const TEN_MINUTE_REJECTION = httpError(
  400,
  "تعداد درخواست بیش از حد مجاز است. چند دقیقه دیگر تلاش کنید",
);
const SMS_FAILURE = httpError(400, "ارسال کد تایید با مشکل مواجه شد");

// A ready code for phone A, then a resend started after the cooldown.
function resendingFor(phone = PHONE_A) {
  const ready = otpStepFor(phone);
  return {
    ready,
    resending: otpLoginReducer(ready, { type: "requestStarted", phone }),
  };
}

const resendFailed = (resending, error, now = NOW + OTP_RESEND_COOLDOWN_MS) =>
  otpLoginReducer(resending, {
    type: "requestFailed",
    attempt: resending.attempt,
    message: getOtpRequestErrorMessage(error),
    preSend: isPreSendOtpRejection(error),
    now,
  });

test("WebOTP stops as soon as a resend starts", () => {
  const { ready, resending } = resendingFor();
  assert.equal(isWebOtpActive(ready), true);
  assert.equal(getOtpScreenStatus(resending), "resending");
  assert.equal(isWebOtpActive(resending), false);
  assert.equal(resending.otpPhone, PHONE_A);
  assert.equal(resending.attempt, ready.attempt);
});

test("no code can be verified while a resend is pending", () => {
  const { resending } = resendingFor();
  assert.deepEqual(getVerifyRequest(resending, "12345"), {
    ok: false,
    reason: "resending",
  });
  assert.equal(getResendRequest(resending, NOW + 10 * 60_000).ok, false);
  assert.equal(getRetryRequest(resending).ok, false);
});

test("the code inputs are read-only while a resend is pending", () => {
  const { resending } = resendingFor();
  // Login makes the slots read-only for every screen other than "ready".
  assert.notEqual(getOtpScreenStatus(resending), "ready");
  assert.match(loginSource, /readOnly=\{otpScreen !== "ready" \|\| verifyPending\}/);
});

test("a successful resend starts a new attempt and reactivates WebOTP", () => {
  const { ready, resending } = resendingFor();
  const later = NOW + OTP_RESEND_COOLDOWN_MS;
  const resent = otpLoginReducer(resending, {
    type: "requestSucceeded",
    attempt: resending.attempt,
    session: sessionFor(PHONE_A, later),
  });

  assert.equal(getOtpScreenStatus(resent), "ready");
  assert.equal(isWebOtpActive(resent), true);
  assert.equal(resent.attempt, ready.attempt + 1);
  assert.equal(resent.otpPhone, PHONE_A);
  assert.equal(resent.otpExpiresAt, later + OTP_LIFETIME_MS);
  assert.equal(resent.resendAt, later + OTP_RESEND_COOLDOWN_MS);
});

test("a successful resend clears the old digits", () => {
  // Digits live in Login: cleared with the success, and the slots remount
  // (empty, first slot focused) for the new attempt.
  assert.match(
    loginSource,
    /setOtp\(""\);\s*dispatch\(\{ type: "requestSucceeded", attempt, session: result\.value \}\);/,
  );
  assert.match(loginSource, /<PersianOTPInput\s+key=\{flow\.attempt\}/);
});

test("only the backend's pre-send rejections are recognised as such", () => {
  assert.equal(isPreSendOtpRejection(COOLDOWN_REJECTION), true);
  assert.equal(isPreSendOtpRejection(TEN_MINUTE_REJECTION), true);
  assert.equal(
    isPreSendOtpRejection(httpError(429, "ThrottlerException: Too Many Requests")),
    true,
  );
  // SMS failure is a 400 too, but happens after the old codes were used up.
  assert.equal(isPreSendOtpRejection(SMS_FAILURE), false);
  for (const error of [
    httpError(400, "شماره موبایل معتبر نیست"),
    httpError(400, ["لطفاً ۶۰ ثانیه بعد دوباره تلاش کنید"]),
    httpError(400, "Bad Request"),
    httpError(500, "Internal server error"),
    { isAxiosError: true, request: {}, message: "Network Error" },
    new Error("boom"),
    undefined,
  ]) {
    assert.equal(isPreSendOtpRejection(error), false);
  }
});

test("a pre-send rejection keeps the previous code while it is still valid", () => {
  for (const error of [COOLDOWN_REJECTION, TEN_MINUTE_REJECTION]) {
    const { ready, resending } = resendingFor();
    const failed = resendFailed(resending, error);

    assert.equal(getOtpScreenStatus(failed), "ready");
    assert.equal(failed.otpPhone, PHONE_A);
    assert.equal(failed.otpExpiresAt, ready.otpExpiresAt);
    assert.equal(failed.requestError, getOtpRequestErrorMessage(error));
    assert.equal(isWebOtpActive(failed), true);
    assert.equal(getVerifyRequest(failed, "12345").ok, true);
  }

  // Once the previous code has expired there is nothing left to keep.
  const { resending } = resendingFor();
  const expired = resendFailed(resending, COOLDOWN_REJECTION, NOW + OTP_LIFETIME_MS);
  assert.equal(getOtpScreenStatus(expired), "send-error");
});

test("an SMS failure during resend does not keep the ready screen", () => {
  const { resending } = resendingFor();
  const failed = resendFailed(resending, SMS_FAILURE);

  assert.equal(getOtpScreenStatus(failed), "send-error");
  assert.equal(failed.otpPhone, null);
  assert.equal(failed.otpExpiresAt, null);
  assert.equal(failed.resendAt, null);
  assert.equal(failed.requestError, "ارسال کد تایید با مشکل مواجه شد");
  assert.deepEqual(getVerifyRequest(failed, "12345"), {
    ok: false,
    reason: "send-error",
  });
  assert.equal(isWebOtpActive(failed), false);
});

test("a network or unknown resend failure does not keep the ready screen", () => {
  for (const error of [
    { isAxiosError: true, request: {}, message: "Network Error" },
    httpError(500, "Internal server error"),
    httpError(400, "Bad Request"),
    new Error("boom"),
  ]) {
    const { resending } = resendingFor();
    const failed = resendFailed(resending, error);
    assert.equal(getOtpScreenStatus(failed), "send-error");
    assert.equal(getVerifyRequest(failed, "12345").ok, false);
    assert.equal(isWebOtpActive(failed), false);
  }
  // A failure without a classification is never treated as pre-send.
  const { resending } = resendingFor();
  const unclassified = otpLoginReducer(resending, {
    type: "requestFailed",
    attempt: resending.attempt,
    message: OTP_NETWORK_MESSAGE,
  });
  assert.equal(getOtpScreenStatus(unclassified), "send-error");
});

test("an uncertain resend failure removes the stored session for that phone", () => {
  const storage = createStorage();
  writeOtpSession(storage, sessionFor(PHONE_A), { now: NOW });
  assert.equal(readOtpSession(storage, NOW).phone, PHONE_A);

  // Login's rule: keep it only for a pre-send rejection, otherwise clear it.
  assert.match(
    loginSource,
    /\} else if \(!preSend\) \{[\s\S]*?clearOtpSession\(getBrowserStorage\(\), phone\);/,
  );
  clearOtpSession(storage, PHONE_A);
  assert.equal(readOtpSession(storage, NOW), null);
  assert.deepEqual(
    decidePhoneSubmit({ phone: PHONE_A, session: readOtpSession(storage, NOW), now: NOW }),
    { action: "request" },
  );
});

test("retry after an uncertain resend failure requests the same phone again", () => {
  const { resending } = resendingFor();
  const failed = resendFailed(resending, SMS_FAILURE);

  assert.deepEqual(getRetryRequest(failed), { ok: true, phoneNumber: PHONE_A });
  const retrying = otpLoginReducer(failed, {
    type: "requestStarted",
    phone: PHONE_A,
  });
  assert.equal(getOtpScreenStatus(retrying), "sending");
  assert.equal(retrying.pendingPhone, PHONE_A);
});

test("editing after an uncertain resend failure returns to the phone step", () => {
  const { resending } = resendingFor();
  const failed = resendFailed(resending, SMS_FAILURE);

  assert.equal(canEditPhone(failed), true);
  const edited = otpLoginReducer(failed, { type: "phoneEdited" });
  assert.deepEqual(
    { ...edited, attempt: 0 },
    { ...initialOtpLoginState, attempt: 0 },
  );
  assert.equal(edited.attempt, failed.attempt + 1);
});

test("the first request still goes phone → sending → ready or send-error", () => {
  const sending = sendingFor(PHONE_A);
  assert.equal(getOtpScreenStatus(sending), "sending");

  const ready = otpLoginReducer(sending, {
    type: "requestSucceeded",
    attempt: sending.attempt,
    session: sessionFor(PHONE_A),
  });
  assert.equal(getOtpScreenStatus(ready), "ready");

  // Even a pre-send rejection has no previous code to keep here.
  const failed = otpLoginReducer(sending, {
    type: "requestFailed",
    attempt: sending.attempt,
    message: OTP_RATE_LIMIT_MESSAGE,
    preSend: true,
    now: NOW,
  });
  assert.equal(getOtpScreenStatus(failed), "send-error");
  assert.equal(failed.pendingPhone, PHONE_A);
});

test("editing is refused only while a code is being verified", () => {
  const ready = otpStepFor(PHONE_A);
  const verifying = otpLoginReducer(ready, {
    type: "verifyStarted",
    attempt: ready.attempt,
  });
  assert.equal(canEditPhone(ready), true);
  assert.equal(canEditPhone(verifying), false);
});

test("the same phone with a still-valid code resumes without a request", () => {
  const session = sessionFor(PHONE_A);
  const decision = decidePhoneSubmit({
    phone: PHONE_A,
    session,
    now: NOW + 30_000,
  });
  assert.deepEqual(decision, { action: "resume", session });

  const resumed = otpLoginReducer(initialOtpLoginState, {
    type: "otpResumed",
    session,
  });
  assert.equal(resumed.step, "otp");
  assert.equal(resumed.otpPhone, PHONE_A);
  assert.equal(resumed.resendAt, session.resendAt);
  assert.equal(resumed.attempt, initialOtpLoginState.attempt + 1);
});

test("a different phone always requests, even during another phone's cooldown", () => {
  const session = sessionFor(PHONE_A);
  assert.deepEqual(
    decidePhoneSubmit({ phone: PHONE_B, session, now: NOW + 1_000 }),
    { action: "request" },
  );
  assert.deepEqual(
    decidePhoneSubmit({ phone: PHONE_B, session: null, now: NOW }),
    { action: "request" },
  );
  // A nearly expired code for the same phone is not worth resuming.
  assert.deepEqual(
    decidePhoneSubmit({
      phone: PHONE_A,
      session,
      now: session.expiresAt - 5_000,
    }),
    { action: "request" },
  );
});

// --- edit phone -------------------------------------------------------------

test("editing the phone keeps the phone text in the form", () => {
  const edited = otpLoginReducer(otpStepFor(PHONE_A), { type: "phoneEdited" });
  assert.equal(edited.step, "phone");
  // The flow never holds the typed phone, and Login never resets the form.
  assert.equal("phoneNumber" in edited, false);
  assert.doesNotMatch(loginSource, /\breset\(/);
  assert.doesNotMatch(loginSource, /setValue\(/);
});

test("editing the phone clears the code-related state", () => {
  const failedVerify = reduce(
    otpStepFor(PHONE_A),
    { type: "verifyStarted", attempt: 1 },
    { type: "verifyFailed", attempt: 1, message: OTP_INVALID_CODE_MESSAGE },
  );
  const edited = otpLoginReducer(failedVerify, { type: "phoneEdited" });

  assert.deepEqual(
    { ...edited, attempt: 0 },
    { ...initialOtpLoginState, attempt: 0 },
  );
  assert.match(
    loginSource,
    /const handleEditPhone = \(\) => \{\s*if \(!canEditPhone\(flowRef\.current\)\) return;\s*setOtp\(""\);\s*dispatch\(\{ type: "phoneEdited" \}\);/,
  );
});

test("editing the phone starts a new attempt, so older results are stale", () => {
  const state = otpStepFor(PHONE_A);
  const captured = state.attempt;
  const edited = otpLoginReducer(state, { type: "phoneEdited" });

  assert.equal(edited.attempt, captured + 1);
  assert.equal(isCurrentAttempt(edited, captured), false);

  // A request started before the edit cannot bring the code step back.
  const lateSuccess = otpLoginReducer(edited, {
    type: "requestSucceeded",
    attempt: captured,
    session: sessionFor(PHONE_A),
  });
  assert.equal(lateSuccess, edited);
});

// --- verify -----------------------------------------------------------------

test("verification targets the phone the code was issued for", () => {
  const state = otpStepFor(PHONE_A);

  assert.deepEqual(getVerifyRequest(state, "12345"), {
    ok: true,
    phoneNumber: PHONE_A,
    code: "12345",
    attempt: state.attempt,
  });
  assert.deepEqual(getVerifyRequest(state, "123"), {
    ok: false,
    reason: "incomplete",
  });
  // Without a confirmed phone nothing is verified.
  assert.deepEqual(getVerifyRequest(initialOtpLoginState, "12345"), {
    ok: false,
    reason: "no-otp-phone",
  });
  assert.deepEqual(
    getVerifyRequest({ ...state, otpPhone: null }, "12345"),
    { ok: false, reason: "send-error" },
  );
  // Not while a resend is replacing the code.
  const resending = otpLoginReducer(state, { type: "requestStarted", phone: PHONE_A });
  assert.deepEqual(getVerifyRequest(resending, "12345"), {
    ok: false,
    reason: "resending",
  });
});

test("a stale verification result changes nothing", () => {
  const state = otpStepFor(PHONE_A);
  const captured = state.attempt;
  const pending = otpLoginReducer(state, {
    type: "verifyStarted",
    attempt: captured,
  });
  assert.equal(pending.verifyStatus, "pending");
  assert.equal(
    otpLoginReducer(pending, { type: "verifyStarted", attempt: captured }),
    pending,
  );

  const edited = otpLoginReducer({ ...pending, verifyStatus: "idle" }, {
    type: "phoneEdited",
  });
  for (const action of [
    { type: "verifyFailed", attempt: captured, message: "x" },
    { type: "verifySucceeded", attempt: captured },
    { type: "requestFailed", attempt: captured, message: "x" },
  ]) {
    assert.equal(otpLoginReducer(edited, action), edited);
  }
  assert.match(loginSource, /if \(result\.skipped \|\| !isCurrent\(attempt\)\) return;/);
});

test("a successful verification keeps the flow busy until navigation", () => {
  const state = otpStepFor(PHONE_A);
  const done = reduce(
    state,
    { type: "verifyStarted", attempt: state.attempt },
    { type: "verifySucceeded", attempt: state.attempt },
  );
  assert.equal(done.verifyStatus, "success");
  assert.equal(isOtpFlowBusy(done), true);
});

// --- resend -----------------------------------------------------------------

test("resend replaces the code in place and starts a new attempt", () => {
  const state = otpStepFor(PHONE_A);
  const failedVerify = reduce(
    state,
    { type: "verifyStarted", attempt: state.attempt },
    { type: "verifyFailed", attempt: state.attempt, message: "x" },
  );
  const later = NOW + OTP_RESEND_COOLDOWN_MS;
  const resending = otpLoginReducer(failedVerify, { type: "requestStarted", phone: PHONE_A });
  assert.equal(resending.step, "otp");

  const resent = otpLoginReducer(resending, {
    type: "requestSucceeded",
    attempt: resending.attempt,
    session: sessionFor(PHONE_A, later),
  });
  assert.equal(resent.step, "otp");
  assert.equal(resent.otpPhone, PHONE_A);
  assert.equal(resent.attempt, state.attempt + 1);
  assert.equal(resent.verifyStatus, "idle");
  assert.equal(resent.verifyError, null);
  assert.equal(resent.resendAt, later + OTP_RESEND_COOLDOWN_MS);
  // The entered digits are cleared together with the new attempt.
  assert.match(
    loginSource,
    /setOtp\(""\);\s*dispatch\(\{ type: "requestSucceeded", attempt, session: result\.value \}\);/,
  );
});

test("resend is tied to the issued phone and waits for the cooldown", () => {
  const state = otpStepFor(PHONE_A);

  assert.deepEqual(getResendRequest(state, NOW + 10_000), {
    ok: false,
    reason: "cooldown",
  });
  assert.deepEqual(getResendRequest(state, NOW + OTP_RESEND_COOLDOWN_MS), {
    ok: true,
    phoneNumber: PHONE_A,
  });
  assert.deepEqual(
    getResendRequest(
      otpLoginReducer(state, { type: "requestStarted", phone: PHONE_A }),
      NOW + OTP_RESEND_COOLDOWN_MS,
    ),
    { ok: false, reason: "resending" },
  );
  // A verification in flight also blocks a resend.
  assert.deepEqual(
    getResendRequest(
      otpLoginReducer(state, { type: "verifyStarted", attempt: state.attempt }),
      NOW + OTP_RESEND_COOLDOWN_MS,
    ),
    { ok: false, reason: "busy" },
  );
  assert.deepEqual(getResendRequest(initialOtpLoginState, NOW), {
    ok: false,
    reason: "no-otp-phone",
  });
  assert.match(loginSource, /requestOtp\(resend\.phoneNumber\)/);
});

// --- timing and persistence -------------------------------------------------

test("code expiry and resend cooldown are tracked separately", () => {
  const session = sessionFor(PHONE_A);
  assert.equal(session.expiresAt, NOW + OTP_LIFETIME_MS);
  assert.equal(session.resendAt, NOW + OTP_RESEND_COOLDOWN_MS);
  // Resend becomes available while the code is still valid.
  assert.ok(session.resendAt < session.expiresAt);

  // A backend expiry beyond the known lifetime (clock skew) is capped.
  const skewed = createOtpSession({
    phone: PHONE_A,
    expiresAt: new Date(NOW + 10 * OTP_LIFETIME_MS).toISOString(),
    now: NOW,
  });
  assert.equal(skewed.expiresAt, NOW + OTP_LIFETIME_MS);
  // A missing expiry is never resumable.
  const missing = createOtpSession({ phone: PHONE_A, expiresAt: undefined, now: NOW });
  assert.equal(otpSessionForPhone(missing, PHONE_A, NOW), null);

  assert.equal(resendRemainingSeconds(session.resendAt, NOW), 60);
  assert.equal(resendRemainingSeconds(session.resendAt, NOW + 59_001), 1);
  assert.equal(resendRemainingSeconds(session.resendAt, NOW + 60_000), 0);
  assert.equal(resendRemainingSeconds(NOW + 10 * 60_000, NOW), 60);
  assert.equal(resendRemainingSeconds(null, NOW), 0);
});

test("a stored session for phone A never applies to phone B", () => {
  const storage = createStorage();
  writeOtpSession(storage, sessionFor(PHONE_A));

  const stored = readOtpSession(storage, NOW + 1_000);
  assert.equal(stored.phone, PHONE_A);
  assert.equal(otpSessionForPhone(stored, PHONE_B, NOW + 1_000), null);
  assert.deepEqual(
    decidePhoneSubmit({ phone: PHONE_B, session: stored, now: NOW + 1_000 }),
    { action: "request" },
  );

  // Clearing for another phone keeps A's session; clearing for A removes it.
  clearOtpSession(storage, PHONE_B);
  assert.ok(storage.data.has(OTP_SESSION_STORAGE_KEY));
  clearOtpSession(storage, PHONE_A);
  assert.equal(storage.data.has(OTP_SESSION_STORAGE_KEY), false);
});

test("expired, malformed or legacy stored timers are ignored", () => {
  const expired = createStorage({
    [OTP_SESSION_STORAGE_KEY]: JSON.stringify(sessionFor(PHONE_A)),
    otp_expires_at: String(NOW + 60_000),
  });
  assert.equal(readOtpSession(expired, NOW + OTP_LIFETIME_MS), null);
  assert.equal(expired.data.has(OTP_SESSION_STORAGE_KEY), false);
  // The old global, phone-less countdown is dropped.
  assert.equal(expired.data.has("otp_expires_at"), false);

  for (const raw of [
    "not json",
    "null",
    JSON.stringify({ expiresAt: NOW + 60_000, resendAt: NOW }),
    JSON.stringify({ phone: PHONE_A, expiresAt: "soon", resendAt: NOW }),
  ]) {
    const storage = createStorage({ [OTP_SESSION_STORAGE_KEY]: raw });
    assert.equal(readOtpSession(storage, NOW), null, raw);
  }

  const throwing = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
    removeItem() {
      throw new Error("blocked");
    },
  };
  assert.equal(readOtpSession(throwing, NOW), null);
  assert.equal(readOtpSession(null, NOW), null);
  assert.doesNotThrow(() => writeOtpSession(throwing, sessionFor(PHONE_A)));
  assert.doesNotThrow(() => clearOtpSession(throwing, PHONE_A));
});

// --- error messages ---------------------------------------------------------

test("backend Persian messages are shown as they are", () => {
  for (const message of [
    "لطفاً ۶۰ ثانیه بعد دوباره تلاش کنید",
    "تعداد درخواست بیش از حد مجاز است. چند دقیقه دیگر تلاش کنید",
    "ارسال کد تایید با مشکل مواجه شد",
    "شماره موبایل معتبر نیست",
  ]) {
    assert.equal(getOtpRequestErrorMessage(httpError(400, message)), message);
  }
  assert.equal(
    getOtpRequestErrorMessage(
      httpError(400, ["phoneNumber must be a string", "شماره موبایل معتبر نیست"]),
    ),
    "شماره موبایل معتبر نیست",
  );
  // English/internal messages are never shown.
  assert.equal(
    getOtpRequestErrorMessage(httpError(400, "property x should not exist")),
    OTP_REQUEST_FAILURE_MESSAGE,
  );
  assert.equal(
    getOtpVerifyErrorMessage(httpError(401, "کد نامعتبر یا منقضی است")),
    OTP_INVALID_CODE_MESSAGE,
  );
  // The token-refresh attempt may replace the original 401 with its own.
  assert.equal(
    getOtpVerifyErrorMessage(httpError(401, "Unauthorized")),
    OTP_INVALID_CODE_MESSAGE,
  );
});

test("rate limits, network failures and server errors map to safe Persian", () => {
  const throttled = httpError(429, "ThrottlerException: Too Many Requests");
  assert.equal(getOtpRequestErrorMessage(throttled), OTP_RATE_LIMIT_MESSAGE);
  assert.equal(getOtpVerifyErrorMessage(throttled), OTP_RATE_LIMIT_MESSAGE);

  const offline = { isAxiosError: true, request: {}, message: "Network Error" };
  assert.equal(getOtpRequestErrorMessage(offline), OTP_NETWORK_MESSAGE);
  assert.equal(getOtpVerifyErrorMessage(offline), OTP_NETWORK_MESSAGE);

  const server = httpError(500, "Internal server error");
  assert.equal(getOtpRequestErrorMessage(server), OTP_REQUEST_FAILURE_MESSAGE);
  assert.equal(getOtpVerifyErrorMessage(server), OTP_VERIFY_FAILURE_MESSAGE);
  // Even a Persian 5xx body is not trusted.
  assert.equal(
    getOtpRequestErrorMessage(httpError(502, "خطای داخلی")),
    OTP_REQUEST_FAILURE_MESSAGE,
  );

  assert.equal(getOtpRequestErrorMessage(new Error("boom")), OTP_REQUEST_FAILURE_MESSAGE);
  assert.equal(getOtpVerifyErrorMessage(undefined), OTP_VERIFY_FAILURE_MESSAGE);
  assert.notEqual(OTP_REQUEST_FAILURE_MESSAGE, OTP_VERIFY_FAILURE_MESSAGE);
});

// --- route exit -------------------------------------------------------------

test("the full login page leaves by replacing, the modal by going back", () => {
  const pageSource = read("../app/(user)/auth/login/page.jsx");
  const modalSource = read("../app/@modal/(.)auth/login/page.jsx");
  assert.match(pageSource, /<Login closeBtn=\{false\} afterLoginHref="\/" \/>/);
  assert.match(modalSource, /<Login closeBtn=\{true\} \/>/);
  assert.match(
    loginSource,
    /afterLoginHref \? router\.replace\(afterLoginHref\) : router\.back\(\)/,
  );
});
