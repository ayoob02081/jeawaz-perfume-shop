// OTP entry contract for the login verification step. The backend is
// authoritative (POST /auth/verify-otp checks the code and marks it used
// atomically); the browser only collects exactly OTP_LENGTH ASCII digits.
//
// The OTP value is positional: character i belongs to slot i. An empty slot
// inside the value is a space and trailing empty slots are trimmed, so a code
// typed left to right looks exactly like before ("", "2", "24", …, "24516")
// and clearing or filling a later slot never shifts the other digits. Only a
// value matching /^\d{OTP_LENGTH}$/ is complete and may be verified.

import { cleanNumericValue } from "./toPersianNumbers.js";

export const OTP_LENGTH = 5;

const EMPTY_SLOT = " ";

// Persian (U+06F0–U+06F9) and Arabic-Indic (U+0660–U+0669) digits → ASCII,
// other characters kept. The shared cleaner covers Persian digits only.
const toAsciiOtpDigits = (value) =>
  String(value)
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));

export function normalizeOtpDigits(value) {
  if (value === null || value === undefined) return "";
  return cleanNumericValue(toAsciiOtpDigits(value));
}

export function getOtpSlots(value, length = OTP_LENGTH) {
  const text = typeof value === "string" ? value : "";
  return Array.from({ length }, (_, i) =>
    /^\d$/.test(text[i] ?? "") ? text[i] : "",
  );
}

const slotsToValue = (slots) =>
  slots.map((digit) => digit || EMPTY_SLOT).join("").trimEnd();

export function isCompleteOtp(value, length = OTP_LENGTH) {
  return typeof value === "string" && new RegExp(`^\\d{${length}}$`).test(value);
}

// First empty slot; slot 0 when all are empty, the last slot when all are full.
export function firstEmptyOtpIndex(value, length = OTP_LENGTH) {
  const index = getOtpSlots(value, length).indexOf("");
  return index === -1 ? length - 1 : index;
}

// The slot still shows its previous digit, so typing or autofilling into a
// filled slot reports that digit plus the inserted text. `caret` is the
// input's selectionEnd after the change: when it is not at the end the text
// was inserted before the old digit. A value of exactly `length` digits is
// taken as a whole-field replacement (autofill), never stripped.
function insertedText(raw, previousDigit, caret, length) {
  const chars = Array.from(String(raw ?? ""));
  if (!previousDigit || chars.length < 2) return chars.join("");
  if (normalizeOtpDigits(chars.join("")).length === length) return chars.join("");

  const insertedAtStart = typeof caret === "number" && caret < chars.length;
  const boundary = insertedAtStart ? chars[chars.length - 1] : chars[0];
  if (normalizeOtpDigits(boundary) !== previousDigit) return chars.join("");

  return (insertedAtStart ? chars.slice(0, -1) : chars.slice(1)).join("");
}

// Change event on slot `index`. One digit replaces that slot; a full code
// (autofill, keyboard suggestion) fills every slot from 0; a shorter run of
// digits fills from `index` onwards. Returns the next value and the slot to
// focus.
export function applyOtpInput(value, index, raw, { caret, length = OTP_LENGTH } = {}) {
  const slots = getOtpSlots(value, length);
  const digits = normalizeOtpDigits(
    insertedText(raw, slots[index], caret, length),
  );

  if (!digits) {
    slots[index] = "";
    return { value: slotsToValue(slots), focusIndex: index };
  }

  if (digits.length >= length) {
    return { value: digits.slice(0, length), focusIndex: length - 1 };
  }

  const written = Array.from(digits).slice(0, length - index);
  written.forEach((digit, offset) => {
    slots[index + offset] = digit;
  });

  return {
    value: slotsToValue(slots),
    focusIndex: Math.min(index + written.length, length - 1),
  };
}

// Backspace keeps the previous behaviour: an empty slot moves focus back one
// slot; the current slot is cleared in place.
export function applyOtpBackspace(value, index, length = OTP_LENGTH) {
  const slots = getOtpSlots(value, length);
  const focusIndex = !slots[index] && index > 0 ? index - 1 : index;
  slots[index] = "";
  return { value: slotsToValue(slots), focusIndex };
}

// Paste keeps the previous behaviour: the pasted digits replace the whole
// value from slot 0.
export function applyOtpPaste(raw, length = OTP_LENGTH) {
  return normalizeOtpDigits(raw).slice(0, length);
}

// ---------------------------------------------------------------------------
// WebOTP (progressive enhancement; Chrome on Android). The SMS text carries the
// origin binding, so nothing here names a domain.
// ---------------------------------------------------------------------------

export function isWebOtpSupported(win = globalThis.window) {
  return Boolean(
    win &&
      "OTPCredential" in win &&
      typeof win.navigator?.credentials?.get === "function",
  );
}

// Accepts only a complete OTP; anything else (missing, short, long, mixed
// text such as "24516x") is ignored rather than cleaned into a code.
export function normalizeWebOtpCode(code, length = OTP_LENGTH) {
  if (typeof code !== "string") return null;
  const ascii = toAsciiOtpDigits(code.trim());
  return isCompleteOtp(ascii, length) ? ascii : null;
}

// Resolves with a complete code, or null when WebOTP is unsupported, denied,
// aborted, timed out or returns anything unusable. Never rejects.
export async function requestWebOtp({ signal, length = OTP_LENGTH, win = globalThis.window } = {}) {
  if (!isWebOtpSupported(win)) return null;
  try {
    const credential = await win.navigator.credentials.get({
      otp: { transport: ["sms"] },
      signal,
    });
    if (signal?.aborted) return null;
    return normalizeWebOtpCode(credential?.code, length);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Verification guard: one verification at a time. A success keeps it closed
// (navigation follows); a failure reopens it so the user can re-enter the code.
// ---------------------------------------------------------------------------

export function createOtpVerificationGuard() {
  let state = "idle"; // idle | pending | done
  return {
    get state() {
      return state;
    },
    async run(task) {
      if (state !== "idle") return { ok: false, skipped: true };
      state = "pending";
      try {
        await task();
      } catch (error) {
        state = "idle";
        return { ok: false, error };
      }
      state = "done";
      return { ok: true };
    },
  };
}
