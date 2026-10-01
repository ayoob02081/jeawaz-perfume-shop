// Phone-number change flow for the profile: enter the new number → enter the
// two codes → changed. The backend is authoritative: POST
// /auth/phone-change/request creates a challenge and sends one code to the
// current number and one to the new number; POST /auth/phone-change/verify
// checks both and moves the account. This module only keeps the dialog
// consistent.
//
// Everything lives in React memory: nothing (challenge id, numbers, codes) is
// ever written to localStorage, sessionStorage, cookies or the URL. A reload
// simply starts over. It shares no state with the login OTP flow.

export const PHONE_CHANGE_CODE_LENGTH = 5;
// Backend: a challenge lives 90 seconds; a new one can be requested after 60.
export const PHONE_CHANGE_CODE_LIFETIME_MS = 90_000;
export const PHONE_CHANGE_RESEND_COOLDOWN_MS = 60_000;

export const PHONE_CHANGE_MESSAGES = {
  invalidPhone: "شماره موبایل معتبر نیست",
  invalidCode: "کد نامعتبر یا منقضی است",
  unavailable: "تغییر شماره موبایل در حال حاضر در دسترس نیست.",
  sessionExpired: "برای ادامه، دوباره وارد حساب کاربری شوید.",
  network:
    "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.",
  rateLimited: "تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.",
  requestFailed: "ارسال کد تایید ممکن نشد. لطفاً دوباره تلاش کنید.",
  verifyFailed: "تغییر شماره موبایل انجام نشد. لطفاً دوباره تلاش کنید.",
  changed: "شماره موبایل با موفقیت تغییر کرد",
};

export const initialPhoneChangeState = Object.freeze({
  // enterPhone → requesting → verifyCodes ⇄ verifying → success
  step: "enterPhone",
  phoneInput: "",
  // The number the current challenge was requested for (resend reuses it).
  requestedPhone: null,
  challengeId: null,
  expiresAt: null,
  resendAt: null,
  currentPhoneCode: "",
  newPhoneCode: "",
  resending: false,
  error: null,
  changedPhone: null,
});

const CODE_FIELDS = new Set(["currentPhoneCode", "newPhoneCode"]);

function toAsciiDigits(value) {
  return String(value ?? "")
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
}

function onlyDigits(value) {
  return toAsciiDigits(value).replace(/\D/g, "");
}

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

// The server's expiry, never later than this browser's own 90 seconds (a
// skewed client clock must not stretch it).
function expiryFrom(expiresAt, now) {
  const parsed = Date.parse(expiresAt);
  const latest = now + PHONE_CHANGE_CODE_LIFETIME_MS;
  return Number.isFinite(parsed) ? Math.min(parsed, latest) : latest;
}

export function phoneChangeReducer(state, action) {
  switch (action.type) {
    case "phoneInputChanged":
      if (state.step !== "enterPhone") return state;
      return { ...state, phoneInput: String(action.value ?? ""), error: null };

    case "requestStarted":
      if (state.step === "enterPhone") {
        return {
          ...state,
          step: "requesting",
          requestedPhone: action.phoneNumber,
          error: null,
        };
      }
      if (state.step === "verifyCodes" && !state.resending) {
        return { ...state, resending: true, error: null };
      }
      return state;

    // First request or resend: the previous challenge is dead (the backend
    // invalidated it), so both codes start empty for the new one.
    case "requestSucceeded":
      if (state.step !== "requesting" && !state.resending) return state;
      return {
        ...state,
        step: "verifyCodes",
        challengeId: action.challengeId,
        expiresAt: expiryFrom(action.expiresAt, action.now),
        resendAt: action.now + PHONE_CHANGE_RESEND_COOLDOWN_MS,
        currentPhoneCode: "",
        newPhoneCode: "",
        resending: false,
        error: null,
      };

    case "requestFailed":
      if (state.step === "requesting") {
        return {
          ...state,
          step: "enterPhone",
          requestedPhone: null,
          error: action.message,
        };
      }
      // A failed resend keeps the current challenge and codes.
      if (state.resending) {
        return { ...state, resending: false, error: action.message };
      }
      return state;

    case "codeChanged":
      if (state.step !== "verifyCodes" || !CODE_FIELDS.has(action.field)) {
        return state;
      }
      return {
        ...state,
        [action.field]: onlyDigits(action.value).slice(0, PHONE_CHANGE_CODE_LENGTH),
        error: null,
      };

    case "verifyStarted":
      if (state.step !== "verifyCodes") return state;
      return { ...state, step: "verifying", error: null };

    // The codes stay, so a typo can be fixed; the answer never says which
    // code was wrong.
    case "verifyFailed":
      if (state.step !== "verifying") return state;
      return { ...state, step: "verifyCodes", error: action.message };

    case "verifySucceeded":
      if (state.step !== "verifying") return state;
      return {
        ...initialPhoneChangeState,
        step: "success",
        changedPhone: action.phoneNumber,
      };

    case "reset":
      return initialPhoneChangeState;

    default:
      return state;
  }
}

export function canRequest(state) {
  return state.step === "enterPhone" && looksLikeIranianMobile(state.phoneInput);
}

export function canResend(state, now) {
  return (
    state.step === "verifyCodes" &&
    !state.resending &&
    Boolean(state.requestedPhone) &&
    now >= state.resendAt
  );
}

const FIVE_DIGITS = /^\d{5}$/;

export function canVerify(state, now) {
  return (
    state.step === "verifyCodes" &&
    !state.resending &&
    Boolean(state.challengeId) &&
    now < state.expiresAt &&
    FIVE_DIGITS.test(state.currentPhoneCode) &&
    FIVE_DIGITS.test(state.newPhoneCode)
  );
}

export function getVerifyRequest(state) {
  return {
    challengeId: state.challengeId,
    currentPhoneCode: state.currentPhoneCode,
    newPhoneCode: state.newPhoneCode,
  };
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

// Request: the backend's 400/409 answers are Persian and safe (invalid or same
// number, cooldown, limits, SMS failure, support needed, number taken). 503
// means the feature is not available yet; 401 means the session ended.
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
  if (status >= 400 && status < 500) {
    return persianServerMessage(response.data) || PHONE_CHANGE_MESSAGES.requestFailed;
  }
  return PHONE_CHANGE_MESSAGES.requestFailed;
}

// Verify: every 401 is the one generic code message (wrong, expired, used,
// locked); 400 (limits) and 409 (number taken meanwhile) are shown as sent.
export function getPhoneChangeVerifyErrorMessage(error) {
  const response = error?.response;
  if (!response) {
    return error?.isAxiosError || error?.request
      ? PHONE_CHANGE_MESSAGES.network
      : PHONE_CHANGE_MESSAGES.verifyFailed;
  }
  const { status } = response;
  if (status === 401) return PHONE_CHANGE_MESSAGES.invalidCode;
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
