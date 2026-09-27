// Calendar-date helpers for DATE columns (e.g. users.birthday). A birthday is
// a day, not an instant: it travels as "YYYY-MM-DD" built from the LOCAL
// calendar fields of the picked date, so no UTC conversion can move it to the
// previous day (Date#toISOString of a date picked before 03:30 Tehran time is
// the day before). Stored "YYYY-MM-DD" values are parsed as local days too.

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value, length = 2) => String(value).padStart(length, "0");

const isValidDate = (date) =>
  date instanceof Date && !Number.isNaN(date.getTime());

export function toDateOnlyString(date) {
  if (!isValidDate(date)) return null;

  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
}

export function parseDateOnly(value) {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return isValidDate(value) ? value : null;

  const match = DATE_ONLY.exec(String(value));
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);

  return isValidDate(date) ? date : null;
}

// Request value for a date-only field: undefined = leave unchanged,
// null = cleared, otherwise "YYYY-MM-DD".
export function normalizeDateOnly(value) {
  if (value === undefined || value === "") return undefined;
  if (value === null) return null;
  if (typeof value === "string" && DATE_ONLY.test(value)) return value;

  return toDateOnlyString(parseDateOnly(value)) ?? undefined;
}
