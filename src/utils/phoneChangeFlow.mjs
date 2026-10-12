// Phone-number change flow for the profile, in two sequential steps inside
// one dialog. The backend is authoritative; this module only keeps the dialog
// consistent:
//   1. current number: POST /auth/phone-change/current/request sends one code
//      to the account's current number; .../current/verify checks it and
//      answers a proof id (server state, valid for 10 minutes).
//   2. new number: POST /auth/phone-change/new/request (proof id + number)
//      sends one code to the new number; .../new/verify checks it and moves
//      the account. A 403 from either means the proof is gone: start over.
// Each step sends one SMS, only after the previous step succeeded on the
// server; nothing ever sends the next code automatically.
//
// Everything lives in React memory: nothing (challenge ids, proof, numbers,
// codes) is ever written to localStorage, sessionStorage, cookies or the URL.
// A reload or closing the dialog simply starts over. It shares no state with
// the login OTP flow.

export const PHONE_CHANGE_CODE_LENGTH = 5;
// Backend: a code lives 90 seconds; a new one of the same step can be
// requested after 60; a verified current number authorizes step 2 for 10
// minutes.
export const PHONE_CHANGE_CODE_LIFETIME_MS = 90_000;
export const PHONE_CHANGE_RESEND_COOLDOWN_MS = 60_000;
export const PHONE_CHANGE_PROOF_LIFETIME_MS = 10 * 60_000;

export const PHONE_CHANGE_MESSAGES = {
  invalidPhone: "شماره موبایل معتبر نیست",
  samePhone: "شماره جدید با شماره فعلی یکسان است",
  invalidCode: "کد نامعتبر یا منقضی است",
  unavailable: "تغییر شماره موبایل در حال حاضر در دسترس نیست.",
  sessionExpired: "برای ادامه، دوباره وارد حساب کاربری شوید.",
  network:
    "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.",
  rateLimited: "تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.",
  requestFailed: "ارسال کد تایید ممکن نشد. لطفاً دوباره تلاش کنید.",
  verifyFailed: "تایید کد انجام نشد. لطفاً دوباره تلاش کنید.",
  restartRequired:
    "تایید شماره فعلی معتبر نیست یا منقضی شده است. لطفاً دوباره از ابتدا شروع کنید",
  changed: "شماره موبایل با موفقیت تغییر کرد",
};

// Steps:
//   currentIdle → currentRequesting → currentCode ⇄ currentVerifying
//     → newPhone → newRequesting → newCode ⇄ newVerifying → success
// newCode → newPhone when the number is edited; any new-number step →
// currentIdle when the server says the proof is gone.
const CURRENT_STEPS = new Set([
  "currentIdle",
  "currentRequesting",
  "currentCode",
  "currentVerifying",
]);
const NEW_STEPS = new Set(["newPhone", "newRequesting", "newCode", "newVerifying"]);

export const initialPhoneChangeState = Object.freeze({
  step: "currentIdle",
  // Step 1: the current-number code.
  currentChallengeId: null,
  currentExpiresAt: null,
  currentResendAt: null,
  currentCode: "",
  // The verified current number (server proof id) and its deadline.
  proofId: null,
  proofExpiresAt: null,
  // Step 2: the new number and its code.
  phoneInput: "",
  // The number the pending new-number code was sent to (resend reuses it).
  requestedPhone: null,
  newChallengeId: null,
  newExpiresAt: null,
  newResendAt: null,
  newCode: "",
  resending: false,
  error: null,
  changedPhone: null,
});

export const isCurrentStep = (state) => CURRENT_STEPS.has(state.step);
export const isNewStep = (state) => NEW_STEPS.has(state.step);

function toAsciiDigits(value) {
  return String(value ?? "")
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
}

function onlyDigits(value) {
  return toAsciiDigits(value).replace(/\D/g, "");
}

const codeValue = (value) => onlyDigits(value).slice(0, PHONE_CHANGE_CODE_LENGTH);

// A UX pre-check only, so an obviously wrong entry never leaves the browser;
// the backend normalizes and decides. Accepts 09…, 9…, 989…, +989…, 00989…
// with spaces, dashes and Persian/Arabic digits.
export function looksLikeIranianMobile(value) {
  const compact = toAsciiDigits(value).replace(/[\s\-()]/g, "");
  return /^(\+98|0098|98|0)?9\d{9}$/.test(compact);
}

// Two numbers are the same phone when their last 10 digits match (989…,
// 09… and +989… forms of one number).
export function isSamePhone(a, b) {
  const first = onlyDigits(a).slice(-10);
  return first.length === 10 && first === onlyDigits(b).slice(-10);
}

// Only the last 4 digits; render with dir="ltr".
export function maskPhoneForDisplay(phone) {
  const digits = onlyDigits(phone);
  return digits.length < 4 ? "" : `${"*".repeat(7)}${digits.slice(-4)}`;
}

export function secondsUntil(timestamp, now) {
  if (!Number.isFinite(timestamp)) return 0;
  return Math.max(0, Math.ceil((timestamp - now) / 1000));
}

// The server's deadline, never later than this browser's own limit (a skewed
// client clock must not stretch it).
function deadlineFrom(serverTime, now, lifetime) {
  const parsed = Date.parse(serverTime);
  const latest = now + lifetime;
  return Number.isFinite(parsed) ? Math.min(parsed, latest) : latest;
}

export function phoneChangeReducer(state, action) {
  switch (action.type) {
    // ---- Step 1: current number ----
    case "currentRequestStarted":
      if (state.step === "currentIdle") {
        return { ...state, step: "currentRequesting", error: null };
      }
      if (state.step === "currentCode" && !state.resending) {
        return { ...state, resending: true, error: null };
      }
      return state;

    // First request or resend: the previous code is dead (the backend
    // invalidated it), so the field starts empty for the new one.
    case "currentRequestSucceeded":
      if (
        state.step !== "currentRequesting" &&
        !(state.step === "currentCode" && state.resending)
      ) {
        return state;
      }
      return {
        ...state,
        step: "currentCode",
        currentChallengeId: action.challengeId,
        currentExpiresAt: deadlineFrom(
          action.expiresAt,
          action.now,
          PHONE_CHANGE_CODE_LIFETIME_MS,
        ),
        currentResendAt: action.now + PHONE_CHANGE_RESEND_COOLDOWN_MS,
        currentCode: "",
        resending: false,
        error: null,
      };

    case "currentRequestFailed":
      if (state.step === "currentRequesting") {
        return { ...state, step: "currentIdle", error: action.message };
      }
      // A failed resend keeps the current code.
      if (state.step === "currentCode" && state.resending) {
        return { ...state, resending: false, error: action.message };
      }
      return state;

    case "currentCodeChanged":
      if (state.step !== "currentCode") return state;
      return { ...state, currentCode: codeValue(action.value), error: null };

    case "currentVerifyStarted":
      if (state.step !== "currentCode" || state.resending) return state;
      return { ...state, step: "currentVerifying", error: null };

    // The code stays, so a typo can be fixed.
    case "currentVerifyFailed":
      if (state.step !== "currentVerifying") return state;
      return { ...state, step: "currentCode", error: action.message };

    // Only a server-confirmed verification opens step 2; the used code is
    // dropped.
    case "currentVerified":
      if (state.step !== "currentVerifying" || !action.proofId) return state;
      return {
        ...state,
        step: "newPhone",
        currentChallengeId: null,
        currentExpiresAt: null,
        currentCode: "",
        proofId: action.proofId,
        proofExpiresAt: deadlineFrom(
          action.proofExpiresAt,
          action.now,
          PHONE_CHANGE_PROOF_LIFETIME_MS,
        ),
        error: null,
      };

    // ---- Step 2: new number ----
    case "phoneInputChanged":
      if (state.step !== "newPhone") return state;
      return { ...state, phoneInput: String(action.value ?? ""), error: null };

    case "newRequestStarted":
      if (state.step === "newPhone") {
        return {
          ...state,
          step: "newRequesting",
          requestedPhone: action.phoneNumber,
          error: null,
        };
      }
      if (state.step === "newCode" && !state.resending) {
        return { ...state, resending: true, error: null };
      }
      return state;

    // First request, resend or another number: the previous new-number code
    // is dead (the backend invalidated it); the proof is not.
    case "newRequestSucceeded":
      if (
        state.step !== "newRequesting" &&
        !(state.step === "newCode" && state.resending)
      ) {
        return state;
      }
      return {
        ...state,
        step: "newCode",
        newChallengeId: action.challengeId,
        newExpiresAt: Math.min(
          deadlineFrom(action.expiresAt, action.now, PHONE_CHANGE_CODE_LIFETIME_MS),
          state.proofExpiresAt ?? Infinity,
        ),
        newResendAt: action.now + PHONE_CHANGE_RESEND_COOLDOWN_MS,
        newCode: "",
        resending: false,
        error: null,
      };

    case "newRequestFailed":
      if (state.step === "newRequesting") {
        return { ...state, step: "newPhone", requestedPhone: null, error: action.message };
      }
      if (state.step === "newCode" && state.resending) {
        return { ...state, resending: false, error: action.message };
      }
      return state;

    // Back to the number field. The sent code is abandoned here; the backend
    // invalidates it when the next code is requested. The resend cooldown
    // stays, as on the server.
    case "editNewPhone":
      if (state.step !== "newCode" || state.resending) return state;
      return {
        ...state,
        step: "newPhone",
        requestedPhone: null,
        newChallengeId: null,
        newExpiresAt: null,
        newCode: "",
        error: null,
      };

    case "newCodeChanged":
      if (state.step !== "newCode") return state;
      return { ...state, newCode: codeValue(action.value), error: null };

    case "newVerifyStarted":
      if (state.step !== "newCode" || state.resending) return state;
      return { ...state, step: "newVerifying", error: null };

    case "newVerifyFailed":
      if (state.step !== "newVerifying") return state;
      return { ...state, step: "newCode", error: action.message };

    case "verifySucceeded":
      if (state.step !== "newVerifying") return state;
      return {
        ...initialPhoneChangeState,
        step: "success",
        changedPhone: action.phoneNumber,
      };

    // The server no longer accepts the proof (expired, spent, replaced or
    // the account changed): back to step 1 with every secret dropped. The
    // step-1 resend cooldown is kept, as on the server.
    case "restartRequired":
      if (!NEW_STEPS.has(state.step)) return state;
      return {
        ...initialPhoneChangeState,
        currentResendAt: state.currentResendAt,
        error: action.message ?? PHONE_CHANGE_MESSAGES.restartRequired,
      };

    case "reset":
      return initialPhoneChangeState;

    default:
      return state;
  }
}

const FIVE_DIGITS = /^\d{5}$/;
const reached = (timestamp, now) => !Number.isFinite(timestamp) || now >= timestamp;

export function isProofExpired(state, now) {
  return NEW_STEPS.has(state.step) && reached(state.proofExpiresAt, now);
}

export function canRequestCurrent(state, now) {
  return state.step === "currentIdle" && reached(state.currentResendAt, now);
}

export function canResendCurrent(state, now) {
  return (
    state.step === "currentCode" &&
    !state.resending &&
    reached(state.currentResendAt, now)
  );
}

export function canVerifyCurrent(state, now) {
  return (
    state.step === "currentCode" &&
    !state.resending &&
    Boolean(state.currentChallengeId) &&
    now < state.currentExpiresAt &&
    FIVE_DIGITS.test(state.currentCode)
  );
}

// `currentPhone` (the profile's number) only spares an obviously useless
// request; the backend refuses the same number anyway.
export function canRequestNew(state, now, currentPhone) {
  return (
    state.step === "newPhone" &&
    Boolean(state.proofId) &&
    !isProofExpired(state, now) &&
    reached(state.newResendAt, now) &&
    looksLikeIranianMobile(state.phoneInput) &&
    !isSamePhone(state.phoneInput, currentPhone)
  );
}

export function canResendNew(state, now) {
  return (
    state.step === "newCode" &&
    !state.resending &&
    Boolean(state.requestedPhone) &&
    !isProofExpired(state, now) &&
    reached(state.newResendAt, now)
  );
}

export function canEditNewPhone(state) {
  return state.step === "newCode" && !state.resending;
}

export function canVerifyNew(state, now) {
  return (
    state.step === "newCode" &&
    !state.resending &&
    Boolean(state.newChallengeId) &&
    !isProofExpired(state, now) &&
    now < state.newExpiresAt &&
    FIVE_DIGITS.test(state.newCode)
  );
}

export function getCurrentVerifyRequest(state) {
  return { challengeId: state.currentChallengeId, code: state.currentCode };
}

export function getNewRequest(state, phoneNumber = state.phoneInput) {
  return { proofId: state.proofId, phoneNumber };
}

export function getNewVerifyRequest(state) {
  return { challengeId: state.newChallengeId, code: state.newCode };
}

const PERSIAN_TEXT = /[؀-ۿ]/;

function persianServerMessage(data) {
  const raw = data?.message;
  const messages = Array.isArray(raw) ? raw : [raw];
  const persian = messages.find(
    (item) => typeof item === "string" && PERSIAN_TEXT.test(item),
  );
  return persian ? persian.trim() : null;
}

// 403 from a new-number endpoint: the proof is gone, start over.
export function isRestartRequired(error) {
  return error?.response?.status === 403;
}

// Requests (both steps): the backend's 400/409 answers are Persian and safe
// (invalid or same number, cooldown, limits, SMS failure, support needed,
// number taken). 503 means the feature is not available; 401 means the
// session ended; 403 means the proof is gone.
export function getPhoneChangeRequestErrorMessage(error) {
  const response = error?.response;
  if (!response) {
    return error?.isAxiosError || error?.request
      ? PHONE_CHANGE_MESSAGES.network
      : PHONE_CHANGE_MESSAGES.requestFailed;
  }
  const { status } = response;
  if (status === 503) return PHONE_CHANGE_MESSAGES.unavailable;
  if (status === 429) return PHONE_CHANGE_MESSAGES.rateLimited;
  if (status === 401) return PHONE_CHANGE_MESSAGES.sessionExpired;
  if (status === 403) return PHONE_CHANGE_MESSAGES.restartRequired;
  if (status >= 400 && status < 500) {
    return persianServerMessage(response.data) || PHONE_CHANGE_MESSAGES.requestFailed;
  }
  return PHONE_CHANGE_MESSAGES.requestFailed;
}

// Verifications (both steps): every 401 is the one generic code message
// (wrong, expired, used, locked); 403 means the proof is gone; 400 (limits)
// and 409 (number taken meanwhile) are shown as sent.
export function getPhoneChangeVerifyErrorMessage(error) {
  const response = error?.response;
  if (!response) {
    return error?.isAxiosError || error?.request
      ? PHONE_CHANGE_MESSAGES.network
      : PHONE_CHANGE_MESSAGES.verifyFailed;
  }
  const { status } = response;
  if (status === 401) return PHONE_CHANGE_MESSAGES.invalidCode;
  if (status === 403) return PHONE_CHANGE_MESSAGES.restartRequired;
  if (status === 429) return PHONE_CHANGE_MESSAGES.rateLimited;
  if (status === 400 || status === 409) {
    return persianServerMessage(response.data) || PHONE_CHANGE_MESSAGES.verifyFailed;
  }
  return PHONE_CHANGE_MESSAGES.verifyFailed;
}

// True once the signed-in user (from /users/me via checkAuth) shows the
// changed number: the dialog can close.
export function isProfileUpToDate(user, changedPhone) {
  return Boolean(changedPhone) && isSamePhone(user?.phoneNumber, changedPhone);
}
