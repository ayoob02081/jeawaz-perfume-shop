import { CATEGORY_TYPES, isValidProductId } from "./seo.mjs";

// «عطرهایی که شاید بپسندی»: a few public, sellable catalog Products that share
// real, active taxonomy (and optionally the brand) with the current Product.
// Two bounded list reads supply the candidates; the ranking below is pure and
// deterministic. Nothing is random and no similarity is inferred from text.
export const RELATED_PRODUCTS_LIMIT = 8;
export const RELATED_PRODUCTS_MIN = 2;
const TAXONOMY_POOL = 24;
const BRAND_POOL = 12;

// Points per shared active category (capped per taxonomy) and for the brand.
// A shared brand alone (2) never outranks one shared fragrance family plus the
// same gender (5); without a shared family or brand nothing qualifies.
export const RELATED_WEIGHTS = Object.freeze({
  fragranceFamilies: 3, gender: 2, temperature: 1, seasons: 1, characters: 1, occasions: 1,
});
const CAPS = { fragranceFamilies: 3, seasons: 2, characters: 2, occasions: 2 };
export const RELATED_BRAND_WEIGHT = 2;
export const RELATED_MIN_SCORE = 4;

const values = (value) => value == null ? [] : Array.isArray(value) ? value : [value];

// The Product's active categories of one taxonomy, as slugs.
function slugs(product, key) {
  const type = CATEGORY_TYPES[key];
  return [...new Set(values(product?.categories?.[key])
    .filter((category) => category?.isActive === true && category.type === type &&
      typeof category.slug === "string" && category.slug.trim())
    .map((category) => category.slug.trim()))];
}
function brandId(product) {
  const id = Number(product?.brand?.id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// The existing GET /products contract: OR within one taxonomy, `inStock` is
// the backend's own sellable rule (as the homepage rows use it).
export function relatedProductQueries(product) {
  const queries = [];
  const families = slugs(product, "fragranceFamilies");
  const [gender] = slugs(product, "gender");
  const base = { inStock: true, sort: "newest", page: 1 };
  if (families.length) queries.push({ ...base, fragranceFamilies: families, limit: TAXONOMY_POOL });
  else if (gender) queries.push({ ...base, gender, limit: TAXONOMY_POOL });
  const brand = brandId(product);
  if (brand) queries.push({ ...base, brandIds: [brand], limit: BRAND_POOL });
  return queries;
}

export function relatedScore(product, candidate) {
  let score = 0;
  let families = 0;
  for (const [key, weight] of Object.entries(RELATED_WEIGHTS)) {
    const mine = new Set(slugs(product, key));
    const shared = slugs(candidate, key).filter((slug) => mine.has(slug)).length;
    if (key === "fragranceFamilies") families = shared;
    score += weight * Math.min(shared, CAPS[key] ?? 1);
  }
  const sameBrand = brandId(product) !== null && brandId(product) === brandId(candidate);
  return { score: score + (sameBrand ? RELATED_BRAND_WEIGHT : 0), families, sameBrand };
}

// Highest score first; ties by shared families, then the API's own order
// (sellable-first, newest), so the same inputs always give the same list.
export function rankRelatedProducts(product, candidateLists, limit = RELATED_PRODUCTS_LIMIT) {
  const seen = new Set([Number(product?.id)]);
  const ranked = [];
  for (const list of values(candidateLists)) {
    for (const candidate of Array.isArray(list) ? list : []) {
      const id = Number(candidate?.id);
      if (!isValidProductId(candidate?.id) || seen.has(id)) continue;
      seen.add(id);
      const { score, families, sameBrand } = relatedScore(product, candidate);
      if (score >= RELATED_MIN_SCORE && (families > 0 || sameBrand)) {
        ranked.push({ candidate, score, families, order: ranked.length });
      }
    }
  }
  ranked.sort((a, b) => b.score - a.score || b.families - a.families || a.order - b.order);
  const result = ranked.slice(0, limit).map(({ candidate }) => candidate);
  return result.length >= RELATED_PRODUCTS_MIN ? result : [];
}
