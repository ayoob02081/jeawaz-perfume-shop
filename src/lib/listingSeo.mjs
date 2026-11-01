import { CATEGORY_TYPES, SITE_NAME, SITE_ORIGIN } from "./seo.mjs";
import { normalizeProductsQuery, PRODUCT_LIST_DEFAULT_LIMIT } from "../utils/productFilterContract.mjs";
import { APPROVED_BRAND_IDS, brandLandingFromProducts } from "./brandSeo.mjs";

const excluded = () => ({ robots: { index: false, follow: true } });
const values = (value) => value == null ? [] : Array.isArray(value) ? value : [value];
const clean = (value) => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const PERSIAN = /[ء-غف-يٱ-ۓ]/u;

// How each taxonomy reads in a heading; a title that already carries the
// qualifier («فصل بهار») is not given it twice.
const CATEGORY_PHRASES = {
  gender: [""],
  fragrance_family: ["با رایحه"],
  season: ["مناسب فصل", "فصل"],
  temperature: ["با طبع", "طبع"],
  character: ["با شخصیت", "شخصیت"],
  occasion: ["مناسب", "مناسب"],
};
const DESCRIPTION_MAX = 120;

// The landing heading for one category name (also the anchor text of links to
// that landing); null without a Persian name or a known taxonomy.
export function categoryLandingHeading(type, name) {
  const title = clean(name);
  if (!PERSIAN.test(title) || !CATEGORY_PHRASES[type]) return null;
  const [qualifier, existing = qualifier] = CATEGORY_PHRASES[type];
  const named = qualifier && !title.startsWith(existing) ? `${qualifier} ${title}` : title;
  return "عطر و ادکلن " + named;
}

// Title/description from the snapshot's own category record. Every matching
// row must name it the same way; a missing or non-Persian name is not invented.
function categoryLanding(type, matches) {
  const titles = new Set(matches.map((category) => clean(category.title)));
  const heading = titles.size === 1 ? categoryLandingHeading(type, [...titles][0]) : null;
  if (!heading) return null;
  const descriptions = new Set(matches.map((category) => clean(category.description).replace(/[.،؛!؟]+$/u, "")));
  const [summary] = descriptions;
  const intro = descriptions.size === 1 && summary && summary.length <= DESCRIPTION_MAX ? summary + ". " : "";
  return {
    title: heading,
    description: intro + "مشاهده " + heading + " در " + SITE_NAME + "؛ بررسی قیمت، حجم و وضعیت موجودی محصولات.",
  };
}

// Input uses the storefront's existing URL/query contract. The successful public
// snapshot proves population and active taxonomy membership without extra reads.
export function listingSeoMetadata(query, payload) {
  const normalized = normalizeProductsQuery(query);
  if (!Array.isArray(payload?.data) || !payload.meta) {
    throw new Error("Listing SEO requires a successful catalog snapshot");
  }
  if (!payload.data.length || normalized.page > payload.meta.totalPages) return excluded();

  const variantOrPrice = ["minPrice", "maxPrice", "inStock", "discounted", "type",
    "minVolume", "maxVolume", "campaignId"].some((key) => normalized[key] !== undefined) ||
    ["volumes", "grades", "concentrations"].some((key) => normalized[key]?.length);
  if (normalized.search || normalized.sort !== "newest" || variantOrPrice ||
    normalized.limit !== PRODUCT_LIST_DEFAULT_LIMIT) return excluded();

  const categories = Object.entries(CATEGORY_TYPES).flatMap(([key, type]) =>
    values(normalized[key]).map((slug) => ({ key, type, slug })));
  const brands = normalized.brandIds?.length ?? 0;
  if (brands === 1 && !categories.length) {
    const id = normalized.brandIds[0];
    // Future/unapproved brands retain Phase 1 behavior.
    if (!APPROVED_BRAND_IDS.includes(id)) return {};
    const brand = brandLandingFromProducts(id, payload.data);
    if (!brand) return excluded();
    const params = new URLSearchParams({ brandIds: String(id) });
    if (normalized.page > 1) params.set("page", String(normalized.page));
    return {
      title: "عطر و ادکلن " + brand.title,
      description: "مشاهده عطر و ادکلن " + brand.title + " در جیاواز پرفیوم؛ بررسی قیمت، حجم و وضعیت موجودی محصولات.",
      robots: { index: true, follow: true },
      alternates: { canonical: SITE_ORIGIN + "/products?" + params },
    };
  }
  if (brands || categories.length > 1) return excluded();

  const params = new URLSearchParams();
  let landing = null;
  if (categories.length) {
    const { key, type, slug } = categories[0];
    const matches = payload.data.flatMap((product) =>
      values(product.categories?.[key]).filter((category) => category?.isActive === true &&
        category.type === type && category.slug?.trim() === slug));
    if (!matches.length) return excluded();
    params.set(key, slug);
    landing = categoryLanding(type, matches);
  }
  if (normalized.page > 1) params.set("page", String(normalized.page));
  const search = params.toString();
  return {
    // Without a usable category name the page keeps the generic listing text.
    ...(landing ?? {}),
    robots: { index: true, follow: true },
    alternates: { canonical: SITE_ORIGIN + "/products" + (search ? "?" + search : "") },
  };
}
