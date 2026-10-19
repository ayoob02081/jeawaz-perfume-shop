// Admin Products list contract. The URL is the single source of truth for
// the list query: `page`, `limit`, `search`, `brandId`, `grade`, `gender` and
// repeated `fragranceFamilies`. Refresh, direct links, Back/Forward and the
// return from the edit page all restore the table from it. The backend
// (`GET /products`) owns filtering and pagination; its `meta` numbers rows.

import { PRODUCT_GRADES } from "./productGrade.mjs";

export const ADMIN_PRODUCTS_DEFAULT_LIMIT = 12;
// Page sizes accepted from the URL (the backend allows at most 100).
export const ADMIN_PRODUCTS_LIMITS = Object.freeze([12, 24, 48, 96]);
export const ADMIN_PRODUCT_SEARCH_MAX = 100;

// URL keys that narrow the list: changing any of them returns to page 1.
export const ADMIN_PRODUCT_FILTER_KEYS = Object.freeze([
  "search",
  "brandId",
  "grade",
  "gender",
  "fragranceFamilies",
]);

// Every key this list owns in the URL; any other parameter is preserved.
const LIST_KEYS = [...ADMIN_PRODUCT_FILTER_KEYS, "page", "limit"];

const SLUG = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/i;
const MAX_FAMILIES = 50;

const positiveInteger = (value) => {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value >= 1 ? value : null;
  }
  if (typeof value !== "string" || !/^\d{1,15}$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 1 ? number : null;
};

export function normalizeAdminProductSearch(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, ADMIN_PRODUCT_SEARCH_MAX).trim();
}

const slugOrUndefined = (value) =>
  typeof value === "string" && SLUG.test(value) ? value : undefined;

// Valid, unique, sorted: one canonical URL and query key per selection.
export const normalizeFamilySlugs = (values = []) =>
  [...new Set((Array.isArray(values) ? values : [values]).filter((value) => slugOrUndefined(value)))]
    .sort()
    .slice(0, MAX_FAMILIES);

const normalizeLimit = (value) => {
  const limit = positiveInteger(value);
  return ADMIN_PRODUCTS_LIMITS.includes(limit) ? limit : ADMIN_PRODUCTS_DEFAULT_LIMIT;
};

// Any query-like input → the canonical list query. Invalid values fall back
// to defaults (page 1, default limit) or are dropped (filters).
export function normalizeAdminProductsQuery(input = {}) {
  const search = normalizeAdminProductSearch(input.search);
  const brandId = positiveInteger(input.brandId);
  const grade = PRODUCT_GRADES.includes(input.grade) ? input.grade : undefined;
  const gender = slugOrUndefined(input.gender);
  const fragranceFamilies = normalizeFamilySlugs(input.fragranceFamilies);
  return {
    page: positiveInteger(input.page) ?? 1,
    limit: normalizeLimit(input.limit),
    ...(search ? { search } : {}),
    ...(brandId ? { brandId } : {}),
    ...(grade ? { grade } : {}),
    ...(gender ? { gender } : {}),
    ...(fragranceFamilies.length ? { fragranceFamilies } : {}),
  };
}

// URL (URLSearchParams or ReadonlyURLSearchParams) → canonical list query.
export function parseAdminProductsQuery(searchParams) {
  const get = (key) => searchParams?.get?.(key) ?? undefined;
  return normalizeAdminProductsQuery({
    page: get("page"),
    limit: get("limit"),
    search: get("search"),
    brandId: get("brandId"),
    grade: get("grade"),
    gender: get("gender"),
    fragranceFamilies: searchParams?.getAll?.("fragranceFamilies") ?? [],
  });
}

// The filters in the shape Bulk Price targeting and GET /products share.
export function adminProductsApiFilters(query = {}) {
  const normalized = normalizeAdminProductsQuery(query);
  return {
    ...(normalized.search ? { search: normalized.search } : {}),
    ...(normalized.brandId ? { brandIds: [normalized.brandId] } : {}),
    ...(normalized.grade ? { grades: [normalized.grade] } : {}),
    ...(normalized.gender ? { gender: normalized.gender } : {}),
    ...(normalized.fragranceFamilies ? { fragranceFamilies: normalized.fragranceFamilies } : {}),
  };
}

// The complete GET /products query for the list.
export function adminProductsListParams(query = {}) {
  const normalized = normalizeAdminProductsQuery(query);
  return {
    ...adminProductsApiFilters(normalized),
    page: normalized.page,
    limit: normalized.limit,
    availabilityFirst: false,
    // The search Bulk Price targeting uses: the list shows exactly the
    // Products a bulk change over these filters would cover.
    searchMode: "legacy",
  };
}

/* ================= FORM DRAFT ================= */

export const EMPTY_ADMIN_PRODUCT_DRAFT = Object.freeze({
  search: "",
  brandId: "",
  grade: "",
  gender: "",
  fragranceFamilies: [],
});

// Applied query → editable form values.
export function draftFromAdminProductsQuery(query = {}) {
  const normalized = normalizeAdminProductsQuery(query);
  return {
    search: normalized.search ?? "",
    brandId: normalized.brandId ? String(normalized.brandId) : "",
    grade: normalized.grade ?? "",
    gender: normalized.gender ?? "",
    fragranceFamilies: normalized.fragranceFamilies ?? [],
  };
}

// Form values → URL filter updates (an empty value removes its key).
export function filterUpdatesFromDraft(draft = {}) {
  const normalized = normalizeAdminProductsQuery(draft);
  return Object.fromEntries(
    ADMIN_PRODUCT_FILTER_KEYS.map((key) => [key, normalized[key]]),
  );
}

// A stable identity of the applied filters (remounts a form draft when the
// URL changes underneath it, e.g. Back/Forward).
export const adminProductFiltersKey = (query = {}) =>
  JSON.stringify(adminProductsApiFilters(query));

// Applied filter groups (search, brand, grade, gender, families: at most 5).
export const countActiveAdminProductFilters = (query = {}) =>
  Object.keys(adminProductsApiFilters(query)).length;

/* ================= URL UPDATES ================= */

const isEmpty = (value) =>
  value === undefined ||
  value === null ||
  value === "" ||
  (Array.isArray(value) && value.length === 0);

const sameValue = (left, right) => JSON.stringify(left) === JSON.stringify(right);

// The next URL query string. Filter or page-size changes return to page 1;
// paging keeps every filter. Defaults (page 1, default limit) are not
// written; unrelated parameters are preserved; the result is canonical.
export function nextAdminProductsSearch(currentSearch, updates = {}) {
  const params = new URLSearchParams(currentSearch);
  const current = parseAdminProductsQuery(params);

  Object.entries(updates).forEach(([key, value]) => {
    if (!LIST_KEYS.includes(key)) return;
    params.delete(key);
    if (!isEmpty(value)) {
      (Array.isArray(value) ? value : [value]).forEach((item) => params.append(key, String(item)));
    }
  });

  const next = parseAdminProductsQuery(params);
  // Compared after normalization: a whitespace-only search edit is no change.
  const narrowed = [...ADMIN_PRODUCT_FILTER_KEYS, "limit"].some(
    (key) => key in updates && !sameValue(current[key], next[key]),
  );
  const page = "page" in updates ? next.page : narrowed ? 1 : next.page;
  const canonical = new URLSearchParams();
  [...params.keys()].forEach((key) => {
    if (!LIST_KEYS.includes(key) && !canonical.has(key)) {
      params.getAll(key).forEach((value) => canonical.append(key, value));
    }
  });
  if (next.search) canonical.set("search", next.search);
  if (next.brandId) canonical.set("brandId", String(next.brandId));
  if (next.grade) canonical.set("grade", next.grade);
  if (next.gender) canonical.set("gender", next.gender);
  (next.fragranceFamilies ?? []).forEach((slug) => canonical.append("fragranceFamilies", slug));
  if (next.limit !== ADMIN_PRODUCTS_DEFAULT_LIMIT) canonical.set("limit", String(next.limit));
  if (page !== 1) canonical.set("page", String(page));
  return canonical.toString();
}

// Clears every filter and the page; the page size and unrelated parameters
// are kept.
export const clearAdminProductFilters = (currentSearch) =>
  nextAdminProductsSearch(currentSearch, {
    ...Object.fromEntries(ADMIN_PRODUCT_FILTER_KEYS.map((key) => [key, undefined])),
    page: undefined,
  });

// The canonical form of the current URL, or null when it already is canonical
// (invalid or default values are rewritten once, with replace).
export function canonicalAdminProductsSearch(currentSearch) {
  const next = nextAdminProductsSearch(currentSearch, {});
  return next === new URLSearchParams(currentSearch).toString() ? null : next;
}

/* ================= CREATE / COPY RETURN ================= */

// Create and copy links carry the list they were opened from in `returnTo`,
// as its list query only (never a path or origin), so a successful save
// returns to that filtered page. Editing returns through history instead.
export const ADMIN_PRODUCTS_RETURN_PARAM = "returnTo";
const RETURN_QUERY_MAX = 2000;

// The canonical list query to return to, or "" for the plain list. Anything
// malformed, oversized or non-string is the plain list.
export function adminProductsReturnQuery(value) {
  if (typeof value !== "string" || !value || value.length > RETURN_QUERY_MAX) return "";
  const params = new URLSearchParams(value);
  params.delete(ADMIN_PRODUCTS_RETURN_PARAM);
  params.delete("copyFrom");
  return nextAdminProductsSearch(params.toString(), {});
}

// Always the admin Products list.
export const adminProductsReturnHref = (returnQuery) => {
  const query = adminProductsReturnQuery(returnQuery);
  return query ? `/admin/products?${query}` : "/admin/products";
};

// The create page (blank, or copying Product `copyFrom`) opened from the
// list whose query is `listSearch`.
export function adminProductCreateHref(listSearch, copyFrom) {
  const params = new URLSearchParams();
  const sourceId = positiveInteger(copyFrom);
  if (sourceId) params.set("copyFrom", String(sourceId));
  const returnQuery = adminProductsReturnQuery(listSearch);
  if (returnQuery) params.set(ADMIN_PRODUCTS_RETURN_PARAM, returnQuery);
  const query = params.toString();
  return query ? `/admin/products/add?${query}` : "/admin/products/add";
}

/* ================= ROWS AND PAGES ================= */

// Global, descending row number of a row on a page, from the backend total:
// total 123, limit 10 → page 1 shows 123..114, page 13 shows 3..1. Display
// only; never a Product id. Null when the numbers are not trustworthy.
export function adminProductRowNumber({ total, page, limit, index }) {
  const values = [total, page, limit, index].map(Number);
  if (!values.every(Number.isSafeInteger)) return null;
  const [count, pageNumber, pageSize, rowIndex] = values;
  if (count < 0 || pageNumber < 1 || pageSize < 1 || rowIndex < 0) return null;
  const number = count - (pageNumber - 1) * pageSize - rowIndex;
  return number >= 1 ? number : null;
}

// Row numbers for the rows a response actually contains (its own meta, so a
// placeholder page keeps numbers that match its rows).
export const adminProductRowNumbers = (response) => {
  const rows = response?.data ?? [];
  const meta = response?.meta ?? {};
  return rows.map((_, index) =>
    adminProductRowNumber({ total: meta.total, page: meta.page, limit: meta.limit, index }),
  );
};

// The page to move to when the requested page is past the last one (after a
// deletion, or a stale link); null when the page is valid or unknown.
export function correctedAdminProductsPage({ page, totalPages }) {
  const current = positiveInteger(page);
  const last = Number(totalPages);
  if (!current || !Number.isSafeInteger(last) || last < 0) return null;
  const target = Math.max(last, 1);
  return current > target ? target : null;
}
