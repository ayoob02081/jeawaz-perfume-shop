import { SITE_NAME } from "./seo.mjs";
import { CONCENTRATION_LABELS } from "../utils/productConcentration.mjs";
import { gradeLabel, productGrade } from "../utils/productGrade.mjs";

// Product page <title>: the Persian name first, then only real, non-repeated
// attributes, and the store name last. Nothing is invented: a missing or
// unknown field is left out.
export const PRODUCT_TITLE_MAX_LENGTH = 70;
const SUFFIX = ` | ${SITE_NAME}`;

const clean = (value) => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

// Comparable words: case, diacritics, ZWNJ, Arabic/Persian letter variants and
// punctuation do not make a term "new".
function words(value) {
  return ` ${clean(value).normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/ي/g, "ی").replace(/ك/g, "ک")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim()} `;
}
const mentions = (haystack, terms) => terms.some((term) => haystack.includes(words(term)));

// Any strength already in the name means another one is never added
// (no duplicate, no contradiction). Whole words only: «پارفومز د مارلی» and
// "Parfums de Marly" are a house name, not a concentration.
const CONCENTRATION_TERMS = [
  ...Object.values(CONCENTRATION_LABELS).filter((label) => label !== CONCENTRATION_LABELS.OTHER),
  "ادوپرفیوم", "ادو پارفوم", "ادوپارفوم", "او دو پرفیوم", "او د پرفیوم", "ادوتویلت", "ادو توالت",
  "او دو تویلت", "ادوکلن", "او دو کلن", "پرفیوم", "اکستریت", "اکسترکت", "تویلت", "کلن",
  "eau de parfum", "eau de toilette", "eau de cologne", "edp", "edt", "edc", "parfum",
  "extrait", "perfume oil", "body mist", "cologne", "toilette",
];
const SUPER_MASTER_TERMS = ["سوپر مستر", "سوپرمستر", "super master", "سفارش اروپا"];

export function productSeoTitle(product) {
  const persian = clean(product?.perTitle);
  const latin = clean(product?.enTitle);
  const lead = persian || latin;
  if (!lead) return null;

  const named = words(`${persian} ${latin}`);
  const concentration = product?.concentration !== "OTHER"
    ? clean(CONCENTRATION_LABELS[product?.concentration]) : "";
  // Super master is stated, as in the visible badge and the Product JSON-LD
  // name; ORIGINAL keeps the plain name.
  const grade = productGrade(product) === "SUPER_MASTER" &&
    !mentions(named, SUPER_MASTER_TERMS) ? gradeLabel("SUPER_MASTER") : "";

  const fits = (value) => value.length + SUFFIX.length <= PRODUCT_TITLE_MAX_LENGTH;
  let title = lead;
  // The name and grade are never dropped; optional parts only while they fit.
  if (concentration && !mentions(named, CONCENTRATION_TERMS) && fits(`${title} ${concentration} ${grade}`.trim())) {
    title += ` ${concentration}`;
  }
  if (grade) title += ` ${grade}`;
  const english = persian && /[a-z]/i.test(latin) && !words(persian).includes(words(latin))
    ? ` (${latin})` : "";
  if (english && fits(title + english)) title += english;
  return title + SUFFIX;
}
