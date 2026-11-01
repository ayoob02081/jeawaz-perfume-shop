import test from "node:test";
import assert from "node:assert/strict";
import {
  ADMIN_PRODUCTS_DEFAULT_LIMIT,
  ADMIN_PRODUCTS_LIMITS,
  ADMIN_PRODUCTS_RETURN_PARAM,
  adminProductCreateHref,
  adminProductsReturnHref,
  adminProductsReturnQuery,
  adminProductRowNumber,
  adminProductRowNumbers,
  adminProductsApiFilters,
  adminProductsListParams,
  adminProductFiltersKey,
  canonicalAdminProductsSearch,
  clearAdminProductFilters,
  correctedAdminProductsPage,
  countActiveAdminProductFilters,
  draftFromAdminProductsQuery,
  EMPTY_ADMIN_PRODUCT_DRAFT,
  filterUpdatesFromDraft,
  nextAdminProductsSearch,
  parseAdminProductsQuery,
} from "./adminProductsListContract.mjs";
import { productListKey } from "./productFilterContract.mjs";
import { COPY_FROM_PARAM } from "../app/(admin)/admin/products/_components/productCloneContract.mjs";

const parse = (search) => parseAdminProductsQuery(new URLSearchParams(search));
const numbers = (total, page, limit, rows) =>
  Array.from({ length: rows }, (_, index) => adminProductRowNumber({ total, page, limit, index }));

/* ================= ROW NUMBERING ================= */

test("123 products, 10 per page: descending global numbers on first, middle and last pages", () => {
  assert.deepEqual(numbers(123, 1, 10, 10), [123, 122, 121, 120, 119, 118, 117, 116, 115, 114]);
  assert.deepEqual(numbers(123, 2, 10, 10), [113, 112, 111, 110, 109, 108, 107, 106, 105, 104]);
  assert.deepEqual(numbers(123, 7, 10, 10), [63, 62, 61, 60, 59, 58, 57, 56, 55, 54]);
  // 123 is not divisible by 10: the last page has 3 rows, numbered 3..1.
  assert.deepEqual(numbers(123, 13, 10, 3), [3, 2, 1]);
});

test("the default page size of 12 and an exactly divisible total", () => {
  assert.deepEqual(numbers(24, 1, 12, 12)[0], 24);
  assert.deepEqual(numbers(24, 2, 12, 12), [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  assert.deepEqual(numbers(1, 1, 12, 1), [1]);
});

test("row numbers come from the response's own meta (filtered totals, placeholder pages)", () => {
  // A filtered result of 15: page 2 of 12 shows 3 rows, 3..1, whatever their ids.
  const response = {
    data: [{ id: 901 }, { id: 17 }, { id: 4 }],
    meta: { total: 15, page: 2, limit: 12, totalPages: 2 },
  };
  assert.deepEqual(adminProductRowNumbers(response), [3, 2, 1]);
  assert.deepEqual(adminProductRowNumbers(undefined), []);
  assert.deepEqual(adminProductRowNumbers({ data: [{ id: 1 }] }), [null]);
});

test("untrustworthy numbers are never displayed", () => {
  for (const input of [
    { total: "x", page: 1, limit: 10, index: 0 },
    { total: 10, page: 0, limit: 10, index: 0 },
    { total: 10, page: 1, limit: 0, index: 0 },
    { total: 10, page: 1, limit: 10, index: -1 },
    { total: 10, page: 1.5, limit: 10, index: 0 },
    // Rows past the total (a stale page) would number 0 or below.
    { total: 5, page: 2, limit: 10, index: 0 },
  ]) {
    assert.equal(adminProductRowNumber(input), null, JSON.stringify(input));
  }
});

/* ================= URL → QUERY ================= */

test("an empty URL is page 1 with the default page size and no filters", () => {
  assert.deepEqual(parse(""), { page: 1, limit: ADMIN_PRODUCTS_DEFAULT_LIMIT });
});

test("page, page size, search and every filter are restored from the URL", () => {
  assert.deepEqual(
    parse("page=4&limit=24&search=%20dior%20%20sauvage%20&brandId=7&grade=ORIGINAL&gender=men&fragranceFamilies=woody&fragranceFamilies=citrus"),
    {
      page: 4,
      limit: 24,
      search: "dior sauvage",
      brandId: 7,
      grade: "ORIGINAL",
      gender: "men",
      fragranceFamilies: ["citrus", "woody"],
    },
  );
});

test("invalid parameters fall back to supported defaults or are dropped", () => {
  assert.deepEqual(
    parse("page=-2&limit=7&brandId=abc&grade=FAKE&gender=%3Cscript%3E&fragranceFamilies=&fragranceFamilies=bad%20slug&search=%20%20"),
    { page: 1, limit: ADMIN_PRODUCTS_DEFAULT_LIMIT },
  );
  for (const page of ["0", "1.5", "1e3", "abc", "", "99999999999999999999"]) {
    assert.equal(parse(`page=${page}`).page, 1, page);
  }
  assert.equal(parse("limit=1000").limit, ADMIN_PRODUCTS_DEFAULT_LIMIT);
  assert.equal(parse(`search=${"a".repeat(150)}`).search.length, 100);
});

test("the API query keeps the list's existing backend contract", () => {
  assert.deepEqual(adminProductsListParams(parse("page=3&search=x&brandId=7&grade=SUPER_MASTER")), {
    search: "x",
    brandIds: [7],
    grades: ["SUPER_MASTER"],
    page: 3,
    limit: 12,
    availabilityFirst: false,
    searchMode: "legacy",
  });
  // Bulk Price targets exactly the listed filters.
  assert.deepEqual(adminProductsApiFilters(parse("gender=women&fragranceFamilies=floral")), {
    gender: "women",
    fragranceFamilies: ["floral"],
  });
});

test("the same filters in any URL order share one React Query cache key", () => {
  const a = productListKey(adminProductsListParams(parse("fragranceFamilies=woody&fragranceFamilies=citrus&brandId=7")));
  const b = productListKey(adminProductsListParams(parse("brandId=7&fragranceFamilies=citrus&fragranceFamilies=woody")));
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, productListKey(adminProductsListParams(parse("brandId=7&page=2"))));
});

/* ================= URL UPDATES ================= */

test("changing pages keeps every active filter and the page size", () => {
  const current = "search=dior&brandId=7&fragranceFamilies=woody&limit=24";
  assert.equal(
    nextAdminProductsSearch(current, { page: 5 }),
    "search=dior&brandId=7&fragranceFamilies=woody&limit=24&page=5",
  );
  // Page 1 is the default and is not written.
  assert.equal(nextAdminProductsSearch(`${current}&page=5`, { page: 1 }), current);
});

test("changing search or a filter returns to page 1; an unchanged apply keeps the page", () => {
  assert.equal(nextAdminProductsSearch("search=dior&page=4", { search: "chanel" }), "search=chanel");
  assert.equal(nextAdminProductsSearch("page=4", { grade: "ORIGINAL" }), "grade=ORIGINAL");
  assert.equal(nextAdminProductsSearch("page=4&limit=24", { limit: 48 }), "limit=48");
  // Applying the same filters (whitespace-only edits included) is no change.
  assert.equal(
    nextAdminProductsSearch("search=dior&page=4", filterUpdatesFromDraft({ ...EMPTY_ADMIN_PRODUCT_DRAFT, search: "  dior " })),
    "search=dior&page=4",
  );
});

test("unrelated query parameters are preserved", () => {
  assert.equal(
    nextAdminProductsSearch("utm=x&page=2", { search: "a" }),
    "utm=x&search=a",
  );
  assert.equal(clearAdminProductFilters("utm=x&search=a&page=3&limit=48"), "utm=x&limit=48");
});

test("clearing filters drops every filter and the page, keeping the page size", () => {
  assert.equal(
    clearAdminProductFilters("search=a&brandId=7&grade=ORIGINAL&gender=men&fragranceFamilies=woody&page=9&limit=24"),
    "limit=24",
  );
  assert.equal(clearAdminProductFilters(""), "");
});

test("invalid links are rewritten once to their canonical form; canonical links are left alone", () => {
  assert.equal(canonicalAdminProductsSearch("page=abc&limit=7&grade=FAKE&search=dior"), "search=dior");
  assert.equal(canonicalAdminProductsSearch("page=1&limit=12"), "");
  for (const search of ["", "search=dior&page=2", "brandId=7&fragranceFamilies=citrus&fragranceFamilies=woody&limit=24&page=3"]) {
    assert.equal(canonicalAdminProductsSearch(search), null, search);
  }
  // Idempotent: a rewrite never triggers a second one (no navigation loop).
  const rewritten = canonicalAdminProductsSearch("fragranceFamilies=woody&fragranceFamilies=citrus&fragranceFamilies=woody&page=02");
  assert.equal(rewritten, "fragranceFamilies=citrus&fragranceFamilies=woody&page=2");
  assert.equal(canonicalAdminProductsSearch(rewritten), null);
});

/* ================= DRAFT ================= */

test("the form draft round-trips through the URL", () => {
  const query = parse("search=dior&brandId=7&grade=ORIGINAL&gender=men&fragranceFamilies=woody&page=3");
  const draft = draftFromAdminProductsQuery(query);
  assert.deepEqual(draft, {
    search: "dior",
    brandId: "7",
    grade: "ORIGINAL",
    gender: "men",
    fragranceFamilies: ["woody"],
  });
  assert.equal(nextAdminProductsSearch("page=3", filterUpdatesFromDraft(draft)),
    "search=dior&brandId=7&grade=ORIGINAL&gender=men&fragranceFamilies=woody");
  assert.deepEqual(draftFromAdminProductsQuery(parse("")), { ...EMPTY_ADMIN_PRODUCT_DRAFT });
  // An emptied draft removes every filter.
  assert.equal(nextAdminProductsSearch("search=dior&brandId=7", filterUpdatesFromDraft(EMPTY_ADMIN_PRODUCT_DRAFT)), "");
});

test("the active filter count and the applied-filters key ignore paging", () => {
  assert.equal(countActiveAdminProductFilters(parse("")), 0);
  assert.equal(countActiveAdminProductFilters(parse("page=3&limit=24")), 0);
  assert.equal(countActiveAdminProductFilters(parse("search=a&brandId=7&grade=ORIGINAL&gender=men&fragranceFamilies=woody&fragranceFamilies=citrus")), 5);
  assert.equal(adminProductFiltersKey(parse("search=a&page=2")), adminProductFiltersKey(parse("search=a&page=9")));
  assert.notEqual(adminProductFiltersKey(parse("search=a")), adminProductFiltersKey(parse("search=b")));
});

/* ================= PAGE CORRECTION ================= */

test("a page past the end moves to the last existing page; valid pages stay", () => {
  // Deleting the only product on page 5 of 5 leaves 4 pages.
  assert.equal(correctedAdminProductsPage({ page: 5, totalPages: 4 }), 4);
  // Everything matching the filters deleted, or a stale deep link.
  assert.equal(correctedAdminProductsPage({ page: 3, totalPages: 0 }), 1);
  assert.equal(correctedAdminProductsPage({ page: 99, totalPages: 11 }), 11);
  assert.equal(correctedAdminProductsPage({ page: 1, totalPages: 0 }), null);
  assert.equal(correctedAdminProductsPage({ page: 4, totalPages: 4 }), null);
  assert.equal(correctedAdminProductsPage({ page: 2, totalPages: undefined }), null);
  // The correction keeps the filters.
  assert.equal(nextAdminProductsSearch("search=dior&page=5", { page: 4 }), "search=dior&page=4");
});

test("page size: each allowed size, back to page 1, filters and other parameters kept", () => {
  for (const limit of ADMIN_PRODUCTS_LIMITS) {
    // Always from another size, so the change is real.
    const from = limit === 96 ? "" : "&limit=96";
    const current = `search=dior&brandId=2&fragranceFamilies=woody&tab=x${from}&page=5`;
    const next = new URLSearchParams(nextAdminProductsSearch(current, { limit }));
    assert.equal(next.get("page"), null, `${limit}: page 1 is not written`);
    assert.equal(next.get("limit"), limit === ADMIN_PRODUCTS_DEFAULT_LIMIT ? null : String(limit));
    assert.equal(next.get("search"), "dior");
    assert.equal(next.get("brandId"), "2");
    assert.deepEqual(next.getAll("fragranceFamilies"), ["woody"]);
    assert.equal(next.get("tab"), "x", "unrelated parameters are preserved");
    assert.equal(parseAdminProductsQuery(next).limit, limit, "the URL restores the size");
  }
  // The same size is no change: the page stays.
  assert.equal(nextAdminProductsSearch("limit=48&page=3", { limit: 48 }), "limit=48&page=3");
  // Sizes the list does not offer fall back to the default.
  assert.equal(parseAdminProductsQuery(new URLSearchParams("limit=7")).limit, ADMIN_PRODUCTS_DEFAULT_LIMIT);
  assert.deepEqual([...ADMIN_PRODUCTS_LIMITS], [12, 24, 48, 96]);
});

test("create/copy links carry the originating list query and return to it", () => {
  assert.equal(adminProductCreateHref(""), "/admin/products/add");
  assert.equal(adminProductCreateHref("", 9), "/admin/products/add?copyFrom=9");
  const list = "brandId=2&limit=48&page=3";
  const blank = adminProductCreateHref(list);
  const copy = adminProductCreateHref(list, 41);
  assert.equal(blank, `/admin/products/add?returnTo=${encodeURIComponent(list)}`);
  assert.equal(copy, `/admin/products/add?copyFrom=41&returnTo=${encodeURIComponent(list)}`);
  // The add page reads `returnTo` and goes back to exactly that list.
  for (const href of [blank, copy]) {
    const returnTo = new URL(href, "http://x").searchParams.get(ADMIN_PRODUCTS_RETURN_PARAM);
    assert.equal(adminProductsReturnHref(returnTo), `/admin/products?${list}`);
  }
  // Same as copyFrom's own contract.
  assert.equal(COPY_FROM_PARAM, "copyFrom");
  // A non-canonical list is canonicalised once; a default list returns plain.
  assert.equal(adminProductsReturnQuery("page=1&limit=12&search=%20dior%20"), "search=dior");
  assert.equal(adminProductCreateHref("page=1"), "/admin/products/add");
  // Invalid copy sources are dropped, the return is kept.
  assert.equal(adminProductCreateHref("page=2", "abc"), "/admin/products/add?returnTo=page%3D2");
  assert.equal(adminProductCreateHref("page=2", 0), "/admin/products/add?returnTo=page%3D2");
});

test("the return is always the admin Products list, never another path or origin", () => {
  for (const value of [
    undefined, null, 42, {}, "", "?", "/", "//evil.com", "https://evil.com/admin/products",
    "/admin/users", "javascript:alert(1)", "%2F%2Fevil.com", "x".repeat(2001),
  ]) {
    assert.match(adminProductsReturnHref(value), /^\/admin\/products(\?|$)/, String(value).slice(0, 40));
    assert.doesNotMatch(adminProductsReturnHref(value), /^\/admin\/products\/|^\/\/|:\/\//);
  }
  assert.equal(adminProductsReturnHref("x".repeat(2001)), "/admin/products");
  assert.equal(adminProductsReturnHref(undefined), "/admin/products");
  // Nested create parameters never ride along back to the list.
  assert.equal(adminProductsReturnQuery("page=2&copyFrom=5&returnTo=page%3D9"), "page=2");
});
