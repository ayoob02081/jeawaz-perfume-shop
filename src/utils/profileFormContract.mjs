// Edit Profile contract (PATCH /users/me, UpdateProfileDto). The backend
// accepts firstName, lastName, nationalCode, username, email and birthday as
// optional fields; the global ValidationPipe rejects unknown keys.
//
// phoneNumber is identity data — the OTP login key, stored canonically as
// 989XXXXXXXXX — so this form shows it read-only and never sends it.

import { isValidNationalCode } from "./toPersianNumbers.js";
import { normalizeDateOnly } from "./dateOnly.mjs";

// Persian personal names: Arabic-script letters (ی/ي, ک/ك, ء, ۀ, ئ …),
// combining marks (harakat, hamza above …), the normal space and ZWNJ
// (U+200C, نیم‌فاصله as in «محمد‌رضا»), with at least one letter. Digits in any
// script, Latin letters, punctuation and other whitespace are rejected.
export const PERSIAN_NAME_PATTERN =
  /^(?=[^]*\p{L})(?:(?=\p{L})\p{Script=Arabic}|\p{M}|[ ‌])+$/u;

export function isPersianName(value) {
  return typeof value === "string" && PERSIAN_NAME_PATTERN.test(value);
}

export const NATIONAL_CODE_INVALID_MESSAGE = "کد ملی معتبر نیست";

// nationalCode is optional: empty is valid, anything entered must be a valid
// Iranian national code.
export function validateOptionalNationalCode(value) {
  return !value || isValidNationalCode(value) || NATIONAL_CODE_INVALID_MESSAGE;
}

const isEmpty = (value) =>
  value === undefined || value === null || value === "";

// username is optional for an account that has none. The form never clears
// an existing username (no clearing semantics are defined for the profile
// API), so emptying a saved one is a validation error, not a silent no-op.
export function validateUsername(value, existingUsername) {
  if (isEmpty(value)) {
    return existingUsername ? "نام کاربری ثبت‌شده را نمی‌توان حذف کرد" : true;
  }

  const username = String(value);

  if (username.length < 3) return "نام کاربری باید حداقل ۳ کاراکتر باشد";
  if (username.length > 30) {
    return "نام کاربری نمی‌تواند بیشتر از ۳۰ کاراکتر باشد";
  }

  return (
    /^[a-zA-Z0-9_]+$/.test(username) ||
    "نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد و _ باشد"
  );
}

export function profileFormValuesFromUser(user) {
  return {
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    nationalCode: user?.nationalCode || undefined,
    birthday: user?.birthday || undefined,
    email: user?.email || undefined,
    username: user?.username || undefined,
  };
}

// Empty optional fields are omitted (= unchanged); a cleared birthday is sent
// as null, which the backend stores as NULL.
export function buildProfileUpdatePayload(data) {
  const payload = {
    firstName: data.firstName,
    lastName: data.lastName,
    nationalCode: data.nationalCode || undefined,
    birthday: normalizeDateOnly(data.birthday),
    email: data.email || undefined,
    username: data.username || undefined,
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
}

export function formatFullName(firstName, lastName) {
  return (
    [firstName, lastName]
      .map((part) => (typeof part === "string" ? part.trim() : ""))
      .filter(Boolean)
      .join(" ") || "-"
  );
}

const PERSIAN_TEXT = /\p{Script=Arabic}/u;

// Only a Persian, client-error (4xx) backend message is shown to the user;
// 5xx responses, network failures and English validator output fall back.
export function getSafeApiErrorMessage(error, fallback) {
  const status = error?.response?.status;
  const message = error?.response?.data?.message;

  return status >= 400 &&
    status < 500 &&
    typeof message === "string" &&
    PERSIAN_TEXT.test(message)
    ? message
    : fallback;
}
