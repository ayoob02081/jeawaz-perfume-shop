// Buyer name at checkout. A user without a name is no longer stopped by a
// profile dialog after login; checkout asks for the buyer's (account
// owner's) first and last name instead and sends them with POST /orders as
// customerFirstName/customerLastName. The backend saves them to the account
// only when it still has no name, inside the order transaction.
//
// The buyer is never the receiver by definition: receiverName may be anyone.
// For an order the buyer receives, the receiver fields default to the buyer's
// name and account phone, but only fields that are empty or still hold the
// previous default are filled: a typed or saved-address receiver is never
// overwritten.

import { PERSIAN_NAME_PATTERN } from "./profileFormContract.mjs";

export const BUYER_FIRST_NAME = "buyerFirstName";
export const BUYER_LAST_NAME = "buyerLastName";

const text = (value) => (typeof value === "string" ? value.trim() : "");

// The backend validates the trimmed buyer name: 2–50 Persian characters.
export const isValidBuyerNamePart = (value) => {
  const part = text(value);
  return part.length >= 2 && part.length <= 50 && PERSIAN_NAME_PATTERN.test(part);
};

// The name parts the account already has, as buyer field values. The backend
// keeps them and fills only the missing part, so they are shown read-only
// instead of being typed again. A part the backend would reject as a buyer
// name is left out (the field stays editable; the account keeps its value).
export function knownBuyerNameParts(user) {
  const known = {};
  if (isValidBuyerNamePart(user?.firstName)) known[BUYER_FIRST_NAME] = text(user.firstName);
  if (isValidBuyerNamePart(user?.lastName)) known[BUYER_LAST_NAME] = text(user.lastName);
  return known;
}

// A complete name: both first and last name present.
export function hasAccountName(user) {
  return Boolean(text(user?.firstName) && text(user?.lastName));
}

export function needsBuyerName({ isAuthenticated, user }) {
  return Boolean(isAuthenticated && user && !hasAccountName(user));
}

export function buyerFullName(firstName, lastName) {
  return [text(firstName), text(lastName)].filter(Boolean).join(" ");
}

// The account phone as the receiver phone field expects it (09XXXXXXXXX).
// Accounts store the canonical 989XXXXXXXXX.
export function accountPhoneForForm(phoneNumber) {
  const digits = text(phoneNumber).replace(/^\+/, "");
  if (/^989\d{9}$/.test(digits)) return `0${digits.slice(2)}`;
  if (/^09\d{9}$/.test(digits)) return digits;
  return "";
}

// Receiver defaults for an order the buyer receives. `current` and `applied`
// are { fullName, phoneNumber }: the form's values and the defaults applied
// last (null when none, e.g. right after a saved address filled the form).
// Returns only the fields to set.
export function receiverDefaultsToApply({ current, applied, desired }) {
  const changes = {};
  for (const field of ["fullName", "phoneNumber"]) {
    const value = current?.[field] ?? "";
    const wanted = desired?.[field] ?? "";
    const untouched = value === "" || (applied && value === applied[field]);
    if (untouched && wanted !== value) changes[field] = wanted;
  }
  return changes;
}

// Switching to "someone else receives it": clear only the defaults this form
// filled in, never typed or saved-address values.
export function receiverDefaultsToClear({ current, applied }) {
  const changes = {};
  if (!applied) return changes;
  for (const field of ["fullName", "phoneNumber"]) {
    const value = current?.[field] ?? "";
    if (value !== "" && value === applied[field]) changes[field] = "";
  }
  return changes;
}

// The buyer fields belong to POST /orders only, never to POST /addresses.
export function withoutBuyerFields(form) {
  const {
    [BUYER_FIRST_NAME]: _first,
    [BUYER_LAST_NAME]: _last,
    ...rest
  } = form;
  return rest;
}

// The POST /orders buyer name, or null when it is not asked for.
export function buyerNamePayload(form, required) {
  if (!required) return null;
  return {
    customerFirstName: text(form?.[BUYER_FIRST_NAME]),
    customerLastName: text(form?.[BUYER_LAST_NAME]),
  };
}
