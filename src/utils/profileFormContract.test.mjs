import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import dateObjectModule from "react-date-object";
import persian from "react-date-object/calendars/persian.js";
import {
  NATIONAL_CODE_INVALID_MESSAGE,
  PERSIAN_NAME_PATTERN,
  buildProfileUpdatePayload,
  formatFullName,
  getSafeApiErrorMessage,
  isPersianName,
  profileFormValuesFromUser,
  validateOptionalNationalCode,
  validateUsername,
} from "./profileFormContract.mjs";
import {
  normalizeDateOnly,
  parseDateOnly,
  toDateOnlyString,
} from "./dateOnly.mjs";

// The picker's date library (CommonJS), exactly as PersianDateRHForm uses it.
const DateObject = dateObjectModule.default ?? dateObjectModule;

// Birthday cases are about Iranian users: evaluate them in Tehran time.
process.env.TZ = "Asia/Tehran";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const editProfileSource = read(
  "../app/(profile)/profile/_components/EditProfileForm.jsx",
);
const completeUserDataSource = read("../components/CompleteUserData.jsx");
const profileInfoSource = read(
  "../app/(profile)/profile/_components/ProfileInfo.jsx",
);
const useUsersSource = read("../hooks/useUsers.js");
const datePickerSource = read("../ui/PersianDateRHForm.jsx");

const VALID_NATIONAL_CODE = "0012345679";

const formData = {
  firstName: "رضا",
  lastName: "کریمی",
  nationalCode: VALID_NATIONAL_CODE,
  birthday: "2002-04-24",
  email: "reza@example.com",
  username: "reza_k",
};

// --- national code ----------------------------------------------------------

test("an empty national code is valid (the field is optional)", () => {
  for (const value of [undefined, null, ""]) {
    assert.equal(validateOptionalNationalCode(value), true, String(value));
  }
});

test("a non-empty national code must pass the checksum", () => {
  assert.equal(validateOptionalNationalCode(VALID_NATIONAL_CODE), true);
  assert.equal(validateOptionalNationalCode("۰۰۱۲۳۴۵۶۷۹"), true);
  for (const value of ["0012345678", "1111111111", "12345", "00123456790"]) {
    assert.equal(
      validateOptionalNationalCode(value),
      NATIONAL_CODE_INVALID_MESSAGE,
      value,
    );
  }
});

test("the edit form wires the optional national-code validator", () => {
  assert.match(editProfileSource, /validate: validateOptionalNationalCode/);
  assert.doesNotMatch(
    editProfileSource,
    /validate: \(value\) => isValidNationalCode\(value\)/,
  );
});

// --- Persian names ----------------------------------------------------------

test("Persian names are accepted, including combining marks, ZWNJ and Arabic letter forms", () => {
  for (const name of [
    "رضا",
    "علی اکبر",
    "پرستو",
    "ژاله",
    "گلاره",
    "چنگیز",
    "محمد‌رضا", // ZWNJ (نیم‌فاصله) is accepted
    "مُحَمَّد",
    "علاء",
    "كريم",
    "زهرهٔ",
  ]) {
    assert.equal(isPersianName(name), true, name);
  }
});

test("Latin letters are rejected", () => {
  for (const name of ["Reza", "رضا Karimi", "Émile", "رضاa"]) {
    assert.equal(isPersianName(name), false, name);
  }
});

test("English, Persian and Arabic-Indic digits are rejected", () => {
  for (const name of ["رضا2", "رضا۲", "رضا٢", "۱۲۳", "123"]) {
    assert.equal(isPersianName(name), false, name);
  }
});

test("names without a letter, with punctuation or with other whitespace are rejected", () => {
  for (const name of [
    "",
    "  ",
    "‌",
    " ‌ ",
    "رضا!",
    "رضا،",
    "رضا-کریمی",
    "رضا\nکریمی",
    "رضا\tکریمی",
    null,
    undefined,
  ]) {
    assert.equal(isPersianName(name), false, JSON.stringify(name));
  }
});

test("Complete Profile and Edit Profile share one name rule", () => {
  assert.equal(PERSIAN_NAME_PATTERN.global, false, "stateless for RHF .test()");
  for (const source of [editProfileSource, completeUserDataSource]) {
    assert.equal(source.match(/value: PERSIAN_NAME_PATTERN/g)?.length, 2);
    assert.doesNotMatch(source, /\\p\{Script=Arabic\}|\[آ-ی/);
  }
});

// --- phone number -----------------------------------------------------------

test("phoneNumber is never part of the Edit Profile payload or form values", () => {
  const payload = buildProfileUpdatePayload({
    ...formData,
    phoneNumber: "09121234567",
  });
  assert.equal("phoneNumber" in payload, false);
  assert.equal(
    "phoneNumber" in
      profileFormValuesFromUser({ phoneNumber: "989121234567", firstName: "رضا" }),
    false,
  );
});

test("the phone number is rendered read-only from the user, not registered in the form", () => {
  assert.match(editProfileSource, /readOnly: true/);
  assert.match(editProfileSource, /value=\{normalizeIranPhone\(phoneNumber\)\}/);
  assert.match(editProfileSource, /aria-readonly="true"/);
  assert.match(editProfileSource, /buildProfileUpdatePayload\(data\)/);
  assert.doesNotMatch(editProfileSource, /phoneNumber: data\.phoneNumber/);
});

// --- username ---------------------------------------------------------------

test("username is optional for an account without one", () => {
  for (const value of [undefined, null, ""]) {
    assert.equal(validateUsername(value, null), true, String(value));
    assert.equal(validateUsername(value, undefined), true, String(value));
  }
  assert.equal(
    "username" in buildProfileUpdatePayload({ ...formData, username: "" }),
    false,
  );
});

test("an entered username keeps the existing rules", () => {
  assert.equal(validateUsername("reza_k", null), true);
  assert.equal(validateUsername("Reza_2024", "old"), true);
  assert.equal(typeof validateUsername("ab", null), "string");
  assert.equal(typeof validateUsername("a".repeat(31), null), "string");
  assert.equal(typeof validateUsername("رضا", null), "string");
  assert.equal(typeof validateUsername("reza k", null), "string");
});

test("an existing username cannot be cleared by accident", () => {
  assert.equal(typeof validateUsername("", "reza_k"), "string");
  assert.equal(typeof validateUsername(undefined, "reza_k"), "string");
  assert.match(editProfileSource, /isRequired: !!username/);
  assert.match(
    editProfileSource,
    /validate: \(value\) => validateUsername\(value, username\)/,
  );
});

// --- payload ----------------------------------------------------------------

test("the payload carries only UpdateProfileDto fields and omits empty optionals", () => {
  assert.deepEqual(buildProfileUpdatePayload(formData), formData);
  assert.deepEqual(
    buildProfileUpdatePayload({
      firstName: "رضا",
      lastName: "کریمی",
      nationalCode: undefined,
      birthday: undefined,
      email: "",
      username: undefined,
    }),
    { firstName: "رضا", lastName: "کریمی" },
  );
});

test("form values hydrate from the authenticated user", () => {
  assert.deepEqual(
    profileFormValuesFromUser({
      id: 3,
      firstName: "رضا",
      lastName: null,
      phoneNumber: "989121234567",
      nationalCode: null,
      birthday: "2002-04-24",
      email: null,
      username: "reza_k",
      role: "user",
    }),
    {
      firstName: "رضا",
      lastName: "",
      nationalCode: undefined,
      birthday: "2002-04-24",
      email: undefined,
      username: "reza_k",
    },
  );
});

// --- birthday ---------------------------------------------------------------

test("a birthday picked just after Tehran midnight stays the selected day", () => {
  // 1381/02/04 (Jalali) = 2002-04-24, picked at 00:15 local time.
  const picked = new DateObject({
    calendar: persian,
    year: 1381,
    month: 2,
    day: 4,
    hour: 0,
    minute: 15,
  }).toDate();

  assert.equal(toDateOnlyString(picked), "2002-04-24");
  // The previous toISOString() conversion moved it to the day before.
  assert.equal(picked.toISOString().slice(0, 10), "2002-04-23");

  for (const [hour, minute] of [
    [0, 0],
    [3, 29],
    [12, 0],
    [23, 59],
  ]) {
    assert.equal(
      toDateOnlyString(new Date(2002, 3, 24, hour, minute)),
      "2002-04-24",
      `${hour}:${minute}`,
    );
  }
});

test("stored YYYY-MM-DD birthdays load as the same local day and round-trip", () => {
  const loaded = parseDateOnly("2002-04-24");
  assert.equal(loaded.getFullYear(), 2002);
  assert.equal(loaded.getMonth(), 3);
  assert.equal(loaded.getDate(), 24);
  assert.equal(toDateOnlyString(loaded), "2002-04-24");

  const jalali = new DateObject({ date: loaded, calendar: persian });
  assert.deepEqual([jalali.year, jalali.month.number, jalali.day], [1381, 2, 4]);
});

test("the birthday request value is date-only, null when cleared, omitted when unset", () => {
  assert.equal(normalizeDateOnly("2002-04-24"), "2002-04-24");
  assert.equal(normalizeDateOnly("2002-04-23T20:45:00.000Z"), "2002-04-24");
  assert.equal(normalizeDateOnly(null), null);
  assert.equal(normalizeDateOnly(undefined), undefined);
  assert.equal(normalizeDateOnly(""), undefined);
  assert.equal(normalizeDateOnly("not a date"), undefined);
  assert.equal(parseDateOnly(null), null);
  assert.equal(parseDateOnly("garbage"), null);

  assert.equal(
    buildProfileUpdatePayload({ ...formData, birthday: null }).birthday,
    null,
  );
  assert.equal(
    "birthday" in buildProfileUpdatePayload({ ...formData, birthday: undefined }),
    false,
  );
});

test("the profile birthday picker emits date-only values; other pickers keep ISO", () => {
  assert.match(editProfileSource, /valueFormat="date"/);
  assert.match(datePickerSource, /valueFormat = "iso"/);
  assert.match(
    datePickerSource,
    /isDateOnly \? toDateOnlyString\(jsDate\) : jsDate\.toISOString\(\)/,
  );
});

// --- display ----------------------------------------------------------------

test("missing names never display as \"null null\"", () => {
  assert.equal(formatFullName(null, null), "-");
  assert.equal(formatFullName(undefined, undefined), "-");
  assert.equal(formatFullName("  ", ""), "-");
  assert.equal(formatFullName("رضا", null), "رضا");
  assert.equal(formatFullName(null, "کریمی"), "کریمی");
  assert.equal(formatFullName("رضا", "کریمی"), "رضا کریمی");
  assert.match(profileInfoSource, /formatFullName\(firstName, lastName\)/);
  assert.doesNotMatch(profileInfoSource, /firstName \+ " " \+ lastName/);
});

// --- mutation lifecycle -----------------------------------------------------

test("the profile mutation is awaited through mutateAsync and uses its pending state", () => {
  assert.match(useUsersSource, /updateUser: mutateAsync/);
  assert.match(useUsersSource, /mutationFn: updateUser/);
  assert.match(editProfileSource, /await updateUser\(buildProfileUpdatePayload\(data\)\)/);
  assert.match(editProfileSource, /const isPending = isSubmitting \|\| isUpdating;/);
  assert.match(editProfileSource, /disabled=\{isPending\}/);
});

test("only Persian 4xx API messages reach the user", () => {
  const fallback = "خطا";
  const apiError = (status, message) => ({ response: { status, data: { message } } });

  assert.equal(
    getSafeApiErrorMessage(apiError(409, "این نام کاربری قبلاً استفاده شده است"), fallback),
    "این نام کاربری قبلاً استفاده شده است",
  );
  assert.equal(getSafeApiErrorMessage(apiError(500, "خطای داخلی"), fallback), fallback);
  assert.equal(getSafeApiErrorMessage(apiError(500, "Internal server error"), fallback), fallback);
  assert.equal(
    getSafeApiErrorMessage(apiError(400, ["property x should not exist"]), fallback),
    fallback,
  );
  assert.equal(
    getSafeApiErrorMessage(apiError(400, "birthday must be a valid ISO 8601 date string"), fallback),
    fallback,
  );
  assert.equal(getSafeApiErrorMessage(new Error("Network Error"), fallback), fallback);
  assert.equal(getSafeApiErrorMessage(undefined, fallback), fallback);
});
