const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianNumbers(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\d/g, (d) => farsiDigits[Number(d)]);
}

export function numberWithCommas(value) {
  if (value === null || value === undefined || value === "") return "";
  const num = String(value).replace(/,/g, "");
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function toPersianNumbersWithComma(value) {
  return toPersianNumbers(numberWithCommas(value));
}

export function toEnglishNumbers(value) {
  if (!value) return "";
  return String(value)
    .replace(/۰/g, "0")
    .replace(/۱/g, "1")
    .replace(/۲/g, "2")
    .replace(/۳/g, "3")
    .replace(/۴/g, "4")
    .replace(/۵/g, "5")
    .replace(/۶/g, "6")
    .replace(/۷/g, "7")
    .replace(/۸/g, "8")
    .replace(/۹/g, "9");
}

export function cleanNumericValue(value) {
  if (value === null || value === undefined) return "";
  return toEnglishNumbers(String(value)).replace(/[^\d]/g, "");
}
