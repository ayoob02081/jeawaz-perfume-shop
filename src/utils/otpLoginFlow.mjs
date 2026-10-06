// OTP login flow for the phone → code steps of the Login component. The
// backend is authoritative (POST /auth/request-otp issues and sends a code,
// POST /auth/verify-otp checks it); this module only keeps the browser from
// contradicting itself.
//
// A phone submit enters the code step at once, while the request is sent.
// `pendingPhone` is the phone currently being requested (it may not have a
// code yet); `otpPhone` is the phone the backend confirmed a code for. It is
// set only from a successful request (or a stored session for that exact
// phone), and verification and resend always use it, never the live phone
// field. The code screen is "sending", "ready", "resending" or "send-error"
// (getOtpScreenStatus); only "ready" accepts a code.
//
// A resend replaces the code: the backend first rejects a too-early or
// too-frequent request, then marks the phone's previous codes used, then
// sends the new one. So a resend that fails before that point keeps the
// previous code, and any other failure leaves no code the browser can trust
// (isPreSendOtpRejection).
//
// `attempt` identifies one visit of the code step. Every request success,
// resume and phone edit increments it; a request, verification or WebOTP
// result captured under an older attempt is stale and must change nothing.

import { isCompleteOtp } from "./otpInputContract.mjs";

// Backend: a code lives 90 s and a phone may request again after 60 s.
export const OTP_LIFETIME_MS = 90_000;
export const OTP_RESEND_COOLDOWN_MS = 60_000;
const OTP_RESEND_COOLDOWN_SECONDS = OTP_RESEND_COOLDOWN_MS / 1000;

// A stored code with less validity left than this is not worth resuming.
export const OTP_RESUME_MIN_REMAINING_MS = 10_000;

export const OTP_SESSION_STORAGE_KEY = "otp_session";
// The previous global, phone-less countdown. Removed whenever sessions are read.
const LEGACY_OTP_TIMER_KEY = "otp_expires_at";

export const initialOtpLoginState = Object.freeze({
  step: "phone", // phone | otp
  pendingPhone: null,
  otpPhone: null,
  otpExpiresAt: null,
  resendAt: null,
  requestStatus: "idle", // idle | pending | error
  requestError: null,
  verifyStatus: "idle", // idle | pending | success | error
  verifyError: null,
  attempt: 0,
});

export const isCurrentAttempt = (state, attempt) => state.attempt === attempt;

export const isRequestPending = (state) => state.requestStatus === "pending";

// A successful verification stays busy: navigation follows.
export const isVerifyBusy = (state) =>
  state.verifyStatus === "pending" || state.verifyStatus === "success";

export const isOtpFlowBusy = (state) =>
  isRequestPending(state) || isVerifyBusy(state);

// null on the phone step. With a confirmed code "ready", or "resending" while
// a resend is in flight; without one "sending", or "send-error" after a
// failed request.
export function getOtpScreenStatus(state) {
  if (state.step !== "otp") return null;
  if (state.otpPhone) return isRequestPending(state) ? "resending" : "ready";
  return isRequestPending(state) ? "sending" : "send-error";
}

// WebOTP listens only for a confirmed code: never while a code is being sent
// or replaced, so neither a late SMS nor the new one can be submitted against
// the old attempt.
export const isWebOtpActive = (state) => getOtpScreenStatus(state) === "ready";

// Editing the phone is allowed while sending (the result becomes stale), not
// while a code is being verified.
export const canEditPhone = (state) => !isVerifyBusy(state);

// Leaving the code step: the phone text lives in the form and is kept.
const phoneStep = (state) => ({
  ...initialOtpLoginState,
  attempt: state.attempt + 1,
});

const otpStep = (state, session) => ({
  ...state,
  step: "otp",
  pendingPhone: null,
  otpPhone: session.phone,
  otpExpiresAt: session.expiresAt,
  resendAt: session.resendAt,
  requestStatus: "idle",
  requestError: null,
  verifyStatus: "idle",
  verifyError: null,
  attempt: state.attempt + 1,
});

export function otpLoginReducer(state, action) {
  switch (action.type) {
    // From the phone step (or a retry) this is the "sending" screen; from a
    // ready screen it is "resending" (otpPhone kept, the code not usable).
    case "requestStarted":
      if (isRequestPending(state)) return state;
      return {
        ...state,
        step: "otp",
        pendingPhone: action.phone,
        requestStatus: "pending",
        requestError: null,
        verifyError: null,
      };

    case "requestSucceeded":
      if (!isCurrentAttempt(state, action.attempt)) return state;
      return otpStep(state, action.session);

    // `preSend`: the backend rejected the request before touching previous
    // codes. Only then, and only while it has not expired, does a resend keep
    // the previous code (back to "ready"). Any other resend failure may have
    // invalidated it: nothing is confirmed any more ("send-error", retry to
    // the same phone).
    case "requestFailed": {
      if (!isCurrentAttempt(state, action.attempt)) return state;
      const failed = {
        ...state,
        requestStatus: "error",
        requestError: action.message,
      };
      const keepsCode =
        action.preSend === true && state.otpExpiresAt > action.now;
      if (!state.otpPhone || keepsCode) return failed;
      return {
        ...failed,
        pendingPhone: state.pendingPhone ?? state.otpPhone,
        otpPhone: null,
        otpExpiresAt: null,
        resendAt: null,
      };
    }

    case "otpResumed":
      return otpStep(state, action.session);

    case "phoneEdited":
      return phoneStep(state);

    case "verifyStarted":
      if (!isCurrentAttempt(state, action.attempt) || isVerifyBusy(state)) {
        return state;
      }
      return { ...state, verifyStatus: "pending", verifyError: null };

    case "verifySucceeded":
      if (!isCurrentAttempt(state, action.attempt)) return state;
      return { ...state, verifyStatus: "success", verifyError: null };

    case "verifyFailed":
      if (!isCurrentAttempt(state, action.attempt)) return state;
      return { ...state, verifyStatus: "error", verifyError: action.message };

    default:
      return state;
  }
}

// One OTP request per phone at a time. Within one attempt a second submit is
// already refused by the pending state (the flow updates it synchronously);
// this also covers a new attempt for the same phone (edit, then the same
// number again) while the first request is in flight: it shares that
// request's result instead of sending another SMS. Callers apply a result
// only to their own, still-current attempt.
export function createOtpRequestGuard() {
  const inFlight = new Map();
  return {
    isPending(phone) {
      return inFlight.has(phone);
    },
    run(phone, task) {
      if (inFlight.has(phone)) return inFlight.get(phone);
      const request = Promise.resolve()
        .then(task)
        .then(
          (value) => ({ ok: true, value }),
          (error) => ({ ok: false, error }),
        )
        .finally(() => inFlight.delete(phone));
      inFlight.set(phone, request);
      return request;
    },
  };
}

// Retry after a failed first request, to the same pending phone.
export function getRetryRequest(state) {
  if (getOtpScreenStatus(state) !== "send-error" || !state.pendingPhone) {
    return { ok: false, reason: "not-failed" };
  }
  return { ok: true, phoneNumber: state.pendingPhone };
}

// ---------------------------------------------------------------------------
// OTP session: the code issued for one phone, persisted so a reopened login
// can return to the code step for that same phone without another request.
// ---------------------------------------------------------------------------

// `expiresAt` is the backend's value; it is capped at the known lifetime so a
// server clock ahead of the browser cannot stretch it. `resendAt` is derived
// from the response time and is only a conservative client-side hint.
export function createOtpSession({ phone, expiresAt, now }) {
  const parsed = new Date(expiresAt ?? NaN).getTime();
  return {
    phone,
    expiresAt: Number.isFinite(parsed)
      ? Math.min(parsed, now + OTP_LIFETIME_MS)
      : now,
    resendAt: now + OTP_RESEND_COOLDOWN_MS,
  };
}

function parseOtpSession(value) {
  if (!value || typeof value !== "object") return null;
  const { phone, expiresAt, resendAt } = value;
  if (typeof phone !== "string" || !phone) return null;
  if (!Number.isFinite(expiresAt) || !Number.isFinite(resendAt)) return null;
  return { phone, expiresAt, resendAt };
}

export function getBrowserStorage(win = globalThis.window) {
  try {
    return win?.localStorage ?? null;
  } catch {
    return null;
  }
}

// The stored session, or null when missing, malformed or expired. Storage
// failures (private mode, blocked site data) behave like an empty storage.
export function readOtpSession(storage, now) {
  if (!storage) return null;
  try {
    storage.removeItem(LEGACY_OTP_TIMER_KEY);
    const raw = storage.getItem(OTP_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = parseOtpSession(JSON.parse(raw));
    if (session && session.expiresAt > now) return session;
    storage.removeItem(OTP_SESSION_STORAGE_KEY);
  } catch {
    // Unreadable storage or JSON: nothing to resume.
  }
  return null;
}

// `replaceOtherPhone: false` (a stale or closed flow recording a real code)
// never displaces a still-valid session of a different phone.
export function writeOtpSession(
  storage,
  session,
  { replaceOtherPhone = true, now = 0 } = {},
) {
  try {
    if (!replaceOtherPhone) {
      const stored = readOtpSession(storage, now);
      if (stored && stored.phone !== session.phone) return;
    }
    storage?.setItem(OTP_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Not persisted; the current flow keeps its own state.
  }
}

// Removes the stored session only when it belongs to `phone`.
export function clearOtpSession(storage, phone) {
  try {
    const raw = storage?.getItem(OTP_SESSION_STORAGE_KEY);
    if (raw && parseOtpSession(JSON.parse(raw))?.phone === phone) {
      storage.removeItem(OTP_SESSION_STORAGE_KEY);
    }
  } catch {
    // Nothing else to do.
  }
}

// A session applies only to the exact phone it was issued for.
export function otpSessionForPhone(session, phone, now) {
  if (!session || !phone || session.phone !== phone) return null;
  return session.expiresAt - now > OTP_RESUME_MIN_REMAINING_MS ? session : null;
}

// Phone step submit: resume the code step for a still-valid code issued to
// this same phone, otherwise request a new code.
export function decidePhoneSubmit({ phone, session, now }) {
  const resumable = otpSessionForPhone(session, phone, now);
  return resumable
    ? { action: "resume", session: resumable }
    : { action: "request" };
}

export function resendRemainingSeconds(resendAt, now) {
  if (!Number.isFinite(resendAt)) return 0;
  const seconds = Math.ceil((resendAt - now) / 1000);
  return Math.min(OTP_RESEND_COOLDOWN_SECONDS, Math.max(0, seconds));
}

export function getResendRequest(state, now) {
  const screen = getOtpScreenStatus(state);
  if (screen === null) return { ok: false, reason: "no-otp-phone" };
  if (screen !== "ready") return { ok: false, reason: screen };
  if (isOtpFlowBusy(state)) return { ok: false, reason: "busy" };
  if (resendRemainingSeconds(state.resendAt, now) > 0) {
    return { ok: false, reason: "cooldown" };
  }
  return { ok: true, phoneNumber: state.otpPhone };
}

// Verification always targets the phone the code was issued for, and only on
// the ready screen: never while a code is being sent or replaced, or after a
// failed request.
export function getVerifyRequest(state, code) {
  const screen = getOtpScreenStatus(state);
  if (screen === null) return { ok: false, reason: "no-otp-phone" };
  if (screen !== "ready") return { ok: false, reason: screen };
  if (!isCompleteOtp(code)) return { ok: false, reason: "incomplete" };
  return {
    ok: true,
    phoneNumber: state.otpPhone,
    code,
    attempt: state.attempt,
  };
}

// ---------------------------------------------------------------------------
// Error messages: user-facing Persian only. Raw errors and English/internal
// backend messages (e.g. ThrottlerException) are never shown.
// ---------------------------------------------------------------------------

export const OTP_NETWORK_MESSAGE =
  "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.";
export const OTP_RATE_LIMIT_MESSAGE =
  "تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.";
export const OTP_REQUEST_FAILURE_MESSAGE =
  "ارسال کد ورود ممکن نشد. لطفاً دوباره تلاش کنید.";
export const OTP_VERIFY_FAILURE_MESSAGE = "ورود ناموفق بود، دوباره تلاش کنید";
export const OTP_INVALID_CODE_MESSAGE = "کد نامعتبر یا منقضی است";

const PERSIAN_TEXT = /[؀-ۿ]/;

// Backend (auth.service requestOtp) rejections that happen before the phone's
// previous codes are marked used: the 60-second cooldown and the 10-minute
// limit (both 400, matched by their exact text, since the SMS-sending failure
// after invalidation is a 400 too). The throttler's 429 is answered before
// the handler runs. Anything else — SMS failure, 5xx, network loss, any
// unrecognised response — may have invalidated the previous code.
const PRE_SEND_REJECTION_MESSAGES = new Set([
  "لطفاً ۶۰ ثانیه بعد دوباره تلاش کنید",
  "تعداد درخواست بیش از حد مجاز است. چند دقیقه دیگر تلاش کنید",
]);

export function isPreSendOtpRejection(error) {
  const response = error?.response;
  if (!response) return false;
  if (response.status === 429) return true;
  const message = response.data?.message;
  return (
    response.status === 400 &&
    typeof message === "string" &&
    PRE_SEND_REJECTION_MESSAGES.has(message.trim())
  );
}

function persianServerMessage(data) {
  const raw = data?.message;
  const messages = Array.isArray(raw) ? raw : [raw];
  const persian = messages.find(
    (item) => typeof item === "string" && PERSIAN_TEXT.test(item),
  );
  return persian ? persian.trim() : null;
}

function getOtpErrorMessage(error, { fallback, unauthorized }) {
  const response = error?.response;
  if (!response) {
    return error?.isAxiosError || error?.request ? OTP_NETWORK_MESSAGE : fallback;
  }
  const { status } = response;
  if (status === 429) return OTP_RATE_LIMIT_MESSAGE;
  if (status === 401 && unauthorized) return unauthorized;
  if (status >= 400 && status < 500) {
    return persianServerMessage(response.data) || fallback;
  }
  return fallback;
}

// Backend 400s here are already Persian: invalid phone, 60-second cooldown,
// too many requests in 10 minutes, SMS sending failure.
export const getOtpRequestErrorMessage = (error) =>
  getOtpErrorMessage(error, { fallback: OTP_REQUEST_FAILURE_MESSAGE });

// A wrong or expired code is a 401. The HTTP client first tries a token
// refresh on any 401 and may reject with that refresh's error instead, so
// every 401 here means the code was not accepted.
export const getOtpVerifyErrorMessage = (error) =>
  getOtpErrorMessage(error, {
    fallback: OTP_VERIFY_FAILURE_MESSAGE,
    unauthorized: OTP_INVALID_CODE_MESSAGE,
  });
