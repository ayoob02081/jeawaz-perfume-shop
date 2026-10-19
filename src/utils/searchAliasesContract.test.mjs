// Admin search aliases (brand and Product forms) and the admin list's legacy
// search mode, which keeps the list identical to Bulk Price targeting.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  SEARCH_ALIASES_MAX_COUNT,
  SEARCH_ALIAS_MAX_LENGTH,
  searchAliasLines,
  searchAliasesPayload,
} from "./searchAliasesContract.mjs";
import { normalizeProductsQuery } from "./productFilterContract.mjs";
import { adminProductsListParams } from "./adminProductsListContract.mjs";
import {
  buildProductFormPayload,
  initialProductFormValues,
} from "../app/(admin)/admin/products/_components/productFormContract.js";
import { supportedBulkFilters } from "../app/(admin)/admin/products/_components/bulkPriceContract.mjs";

const read = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("alias lines are trimmed, collapsed and non-empty; ZWNJ is kept", () => {
  assert.deepEqual(searchAliasLines("  آمواج \r\n\n  امواژ\n Amouage   Love \nنیک‌نام"), [
    "آمواج", "امواژ", "Amouage Love", "نیک‌نام",
  ]);
  assert.deepEqual(searchAliasLines(null), []);
});

test("the payload value is the lines joined by \\n, or null to clear", () => {
  assert.deepEqual(searchAliasesPayload("آمواج\n\nامواژ "), { value: "آمواج\nامواژ", error: null });
  assert.deepEqual(searchAliasesPayload(" \n "), { value: null, error: null });
  assert.deepEqual(searchAliasesPayload(undefined), { value: null, error: null });
});

test("the payload mirrors the backend bounds", () => {
  const lines = (count) => Array.from({ length: count }, (_, i) => `a${i}`).join("\n");
  assert.equal(searchAliasesPayload(lines(SEARCH_ALIASES_MAX_COUNT)).error, null);
  assert.match(searchAliasesPayload(lines(SEARCH_ALIASES_MAX_COUNT + 1)).error, /۲۰|20/);
  assert.equal(searchAliasesPayload("x".repeat(SEARCH_ALIAS_MAX_LENGTH)).error, null);
  assert.ok(searchAliasesPayload("x".repeat(SEARCH_ALIAS_MAX_LENGTH + 1)).error);
});

// --- Product form ------------------------------------------------------------

const validForm = () => ({
  ...initialProductFormValues(),
  enTitle: "Dior Sauvage",
  perTitle: "دیور ساواج",
  description: "x",
  grade: "ORIGINAL",
  genderId: "1",
  brandId: "2",
  stock: 10,
  variants: [{ type: "decant", volume: 10, price: 100000 }],
});

test("the Product form starts from the stored aliases (never from the Product)", () => {
  assert.equal(initialProductFormValues({ id: 1 }, "ساواژ\nSauvage EDP").searchAliases, "ساواژ\nSauvage EDP");
  assert.equal(initialProductFormValues({ id: 1, searchAliases: "leak" }).searchAliases, "");
  assert.equal(initialProductFormValues().searchAliases, "");
});

test("the Product payload sends aliases (or null to clear) when the field is editable", () => {
  const sent = buildProductFormPayload({ ...validForm(), searchAliases: " ساواژ \n\nSauvage EDP" });
  assert.deepEqual(sent.errors, []);
  assert.equal(sent.payload.searchAliases, "ساواژ\nSauvage EDP");

  const cleared = buildProductFormPayload({ ...validForm(), searchAliases: "" });
  assert.equal(cleared.payload.searchAliases, null);
});

test("unreadable stored aliases are left out of the payload, so they are kept", () => {
  const { payload } = buildProductFormPayload(
    { ...validForm(), searchAliases: "" },
    undefined,
    { searchAliasesEditable: false },
  );
  assert.equal("searchAliases" in payload, false);
});

test("too many Product aliases is a field error", () => {
  const many = Array.from({ length: 21 }, (_, i) => `a${i}`).join("\n");
  const { payload, errors } = buildProductFormPayload({ ...validForm(), searchAliases: many });
  assert.equal(payload, null);
  assert.deepEqual(errors.map(({ field }) => field), ["searchAliases"]);
});

// --- Admin list search mode ------------------------------------------------

test("searchMode=legacy is sent only by the admin list, and only with a search", () => {
  assert.equal(normalizeProductsQuery({ search: "دیور", searchMode: "legacy" }).searchMode, "legacy");
  assert.equal("searchMode" in normalizeProductsQuery({ searchMode: "legacy" }), false);
  assert.equal("searchMode" in normalizeProductsQuery({ search: "دیور" }), false);
  assert.equal("searchMode" in normalizeProductsQuery({ search: "دیور", searchMode: "other" }), false);

  const layout = read("../app/(admin)/admin/products/_components/ProductsLayout.jsx");
  assert.match(layout, /useGetAllProducts\(adminProductsListParams\(query\)\)/);
  // The admin list sends the legacy mode with a search, and only then.
  assert.equal(normalizeProductsQuery(adminProductsListParams({ search: "دیور" })).searchMode, "legacy");
  assert.equal("searchMode" in normalizeProductsQuery(adminProductsListParams({})), false);
  assert.equal(normalizeProductsQuery(adminProductsListParams({ search: "دیور" })).availabilityFirst, false);
});

test("Bulk Price targeting never receives the list's search mode", () => {
  assert.deepEqual(
    supportedBulkFilters({ search: "دیور", searchMode: "legacy", availabilityFirst: false }),
    { search: "دیور" },
  );
});

// --- Wiring -------------------------------------------------------------------

test("edit pages wait for the stored aliases and pass an unreadable state", () => {
  const productPage = read("../app/(admin)/admin/products/edit/[id]/page.jsx");
  const brandPage = read("../app/(admin)/admin/categories/brands/edit/[id]/page.jsx");
  for (const [page, hook, form] of [
    [productPage, "useGetProductSearchAliases", "ProductForm"],
    [brandPage, "useGetBrandSearchAliases", "BrandForm"],
  ]) {
    assert.match(page, new RegExp(`const aliases = ${hook}\\(id\\);`));
    assert.match(page, /if \(isLoading \|\| aliases\.isLoading\) return <Loading \/>;/);
    assert.match(page, new RegExp(`<${form}[\\s\\S]*?searchAliases=\\{aliases\\.data\\?\\.searchAliases \\?\\? null\\}[\\s\\S]*?searchAliasesUnavailable=\\{aliases\\.isError\\}`));
  }
});

test("alias reads are never served from a cache", () => {
  for (const [file, hook] of [
    ["../hooks/useProducts.js", "useGetProductSearchAliases"],
    ["../hooks/useCategories.js", "useGetBrandSearchAliases"],
  ]) {
    const source = read(file);
    const body = source.slice(source.indexOf(`export const ${hook}`));
    assert.match(body.slice(0, 400), /gcTime: 0,\s*staleTime: 0,/);
  }
});

test("the brand form sends aliases only when they could be read", () => {
  const form = read("../app/(admin)/admin/categories/_components/BrandForm.jsx");
  assert.match(form, /const aliases = searchAliasesUnavailable\s*\? null\s*: searchAliasesPayload\(data\.searchAliases\);/);
  assert.match(form, /\.\.\.\(aliases \? \{ searchAliases: aliases\.value \} : \{\}\),/);
  assert.match(form, /searchAliases: searchAliases \?\? "",/);
  assert.match(form, /disabled=\{searchAliasesUnavailable\}/);
});
