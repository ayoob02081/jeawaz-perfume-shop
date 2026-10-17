import { CATEGORY_TYPES, SITE_ORIGIN } from "./seo.mjs";
import { normalizeProductsQuery, PRODUCT_LIST_DEFAULT_LIMIT } from "../utils/productFilterContract.mjs";
import { APPROVED_BRAND_IDS, brandLandingFromProducts } from "./brandSeo.mjs";

const excluded = () => ({ robots: { index: false, follow: true } });
const values = (value) => value == null ? [] : Array.isArray(value) ? value : [value];

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
  if (categories.length) {
    const { key, type, slug } = categories[0];
    const representedInSitemap = payload.data.some((product) =>
      values(product.categories?.[key]).some((category) => category?.isActive === true &&
        category.type === type && category.slug?.trim() === slug));
    if (!representedInSitemap) return excluded();
    params.set(key, slug);
  }
  if (normalized.page > 1) params.set("page", String(normalized.page));
  const search = params.toString();
  return {
    robots: { index: true, follow: true },
    alternates: { canonical: SITE_ORIGIN + "/products" + (search ? "?" + search : "") },
  };
}
