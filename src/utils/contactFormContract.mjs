// Contact Us form contract. The backend (POST /contact-messages) is
// authoritative: it trims, normalizes the phone number, validates, throttles
// and decides whether to store. The browser mirrors its limits for early
// feedback, submits exactly four string fields, and never puts form data in a
// URL.

export const CONTACT_MESSAGES_PATH = "/contact-messages";

export const CONTACT_NAME_MIN = 2;
export const CONTACT_NAME_MAX = 100;
export const CONTACT_MESSAGE_MIN = 10;
export const CONTACT_MESSAGE_MAX = 2000;

export const CONTACT_SUCCESS_MESSAGE = "پیام شما با موفقیت ثبت شد";
export const CONTACT_INVALID_MESSAGE =
  "اطلاعات وارد شده معتبر نیست. لطفاً فیلدها را بررسی کنید";
export const CONTACT_RATE_LIMIT_MESSAGE =
  "تعداد پیام‌های ارسالی زیاد است. لطفاً چند دقیقه دیگر دوباره تلاش کنید";
export const CONTACT_NETWORK_MESSAGE =
  "ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت را بررسی و دوباره تلاش کنید";
export const CONTACT_FAILURE_MESSAGE =
  "ارسال پیام انجام نشد. لطفاً دوباره تلاش کنید";

// `website` is a honeypot: hidden from people, normally empty.
export const contactFormDefaultValues = Object.freeze({
  fullName: "",
  phoneNumber: "",
  message: "",
  website: "",
});

const asText = (value) =>
  value === undefined || value === null ? "" : String(value);

// Same rules as the backend DTO: C0/C1 controls and bidi overrides/isolates
// are rejected in names; ZWNJ and LRM/RLM marks are allowed.
const NAME_FORBIDDEN = /[\u0000-\u001F\u007F-\u009F‪-‮⁦-⁩]/;
const PHONE_SEPARATORS = /[\s\-()​-‏‪-‮⁦-⁩﻿]/g;

const toAsciiDigits = (value) =>
  value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));

const normalizeMessageText = (value) =>
  asText(value).replace(/\u0000/g, "").replace(/\r\n?/g, "\n").trim();

// Mirrors the backend normalizer (09…, 9…, 98…, +98…, 0098…, spaces and
// Persian/Arabic digits); returns 989XXXXXXXXX or null.
export function normalizeContactPhone(value) {
  let phone = toAsciiDigits(asText(value)).replace(PHONE_SEPARATORS, "");
  if (phone.startsWith("+")) {
    phone = phone.slice(1);
    if (!phone.startsWith("98")) return null;
  } else if (phone.startsWith("0098")) {
    phone = phone.slice(2);
  }
  if (/^09\d{9}$/.test(phone)) phone = `98${phone.slice(1)}`;
  else if (/^9\d{9}$/.test(phone)) phone = `98${phone}`;
  return /^989\d{9}$/.test(phone) ? phone : null;
}

export const contactFormRules = {
  fullName: {
    required: "نام و نام خانوادگی الزامی است",
    validate: (value) => {
      const name = asText(value).trim();
      if (!name) return "نام و نام خانوادگی الزامی است";
      if (name.length < CONTACT_NAME_MIN || name.length > CONTACT_NAME_MAX) {
        return `نام و نام خانوادگی باید بین ${CONTACT_NAME_MIN} تا ${CONTACT_NAME_MAX} کاراکتر باشد`;
      }
      if (NAME_FORBIDDEN.test(name)) {
        return "نام و نام خانوادگی شامل کاراکتر نامعتبر است";
      }
      return true;
    },
  },
  phoneNumber: {
    required: "شماره موبایل الزامی است",
    validate: (value) =>
      normalizeContactPhone(value) !== null || "شماره موبایل معتبر نیست",
  },
  message: {
    required: "متن پیام الزامی است",
    validate: (value) => {
      const text = normalizeMessageText(value);
      if (!text) return "متن پیام الزامی است";
      if (text.length < CONTACT_MESSAGE_MIN || text.length > CONTACT_MESSAGE_MAX) {
        return `متن پیام باید بین ${CONTACT_MESSAGE_MIN} تا ${CONTACT_MESSAGE_MAX} کاراکتر باشد`;
      }
      return true;
    },
  },
};

// Exactly the four backend fields, always strings. Normalization stays on the
// backend; the phone is sent as typed (the field already holds ASCII digits).
export function buildContactMessagePayload(values = {}) {
  return {
    fullName: asText(values.fullName).trim(),
    phoneNumber: asText(values.phoneNumber).trim(),
    message: asText(values.message).trim(),
    website: asText(values.website),
  };
}

// `client` is the shared credentialed Axios instance (services/httpClient).
export const postContactMessage = (client, payload) =>
  client.post(CONTACT_MESSAGES_PATH, payload).then(({ data }) => data);

export function getContactSuccessMessage(data) {
  return typeof data?.message === "string" && data.message.trim()
    ? data.message
    : CONTACT_SUCCESS_MESSAGE;
}

const PERSIAN_TEXT = /[؀-ۿ]/;

// User-facing Persian text only; raw errors and English/internal backend
// messages (e.g. "property x should not exist") are never shown.
export function getContactErrorMessage(error) {
  const response = error?.response;
  if (!response) return CONTACT_NETWORK_MESSAGE;
  if (response.status === 429) return CONTACT_RATE_LIMIT_MESSAGE;
  if (response.status === 400) {
    const raw = response.data?.message;
    const messages = Array.isArray(raw) ? raw : [raw];
    const persian = messages.find(
      (item) => typeof item === "string" && PERSIAN_TEXT.test(item),
    );
    return persian || CONTACT_INVALID_MESSAGE;
  }
  return CONTACT_FAILURE_MESSAGE;
}

// Returns one submit function that ignores calls while a previous submission
// is in flight. `send` is the mutation (its callbacks own the toasts); a
// failure is contained here so the entered values stay in the form.
export function createContactSubmitter({ send, reset }) {
  let pending = false;
  return async function submitContactForm(values) {
    if (pending) return { ok: false, skipped: true };
    pending = true;
    try {
      await send(buildContactMessagePayload(values));
    } catch {
      return { ok: false };
    } finally {
      pending = false;
    }
    reset?.({ ...contactFormDefaultValues });
    return { ok: true };
  };
}
