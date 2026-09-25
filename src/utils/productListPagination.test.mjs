import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  normalizeProductListLimit, normalizeProductListPage, normalizeProductsQuery,
  PRODUCT_LIST_DEFAULT_LIMIT, PRODUCT_LIST_MAX_LIMIT, productListKey,
} from "./productFilterContract.mjs";

test("valid limits 1..100 are used as-is", () => {
  assert.equal(PRODUCT_LIST_DEFAULT_LIMIT, 12);
  assert.equal(PRODUCT_LIST_MAX_LIMIT, 100);
  for (const [raw, expected] of [["1", 1], ["100", 100], ["24", 24], [1, 1], [100, 100]]) {
    assert.equal(normalizeProductListLimit(raw), expected);
  }
});

test("hostile, malformed, fractional, zero, negative and >100 limits fall back to 12", () => {
  for (const raw of ["1000000000", "101", 1e9, "999999999999999999999", "0", "-1", "1.5", 1.5,
    "abc", "", null, undefined, "12abc", " 12", "1e2", Number.NaN, Infinity]) {
    assert.equal(normalizeProductListLimit(raw), 12, `limit ${String(raw)}`);
  }
});

test("page normalizes to a positive integer or 1", () => {
  assert.equal(normalizeProductListPage("1"), 1);
  assert.equal(normalizeProductListPage("7"), 7);
  for (const raw of ["0", "-1", "1.5", "abc", "", null, undefined, "999999999999999999999"]) {
    assert.equal(normalizeProductListPage(raw), 1, `page ${String(raw)}`);
  }
});

test("a hostile URL yields one bounded query for request, key, skeletons and prefetch", () => {
  const params = new URLSearchParams("?limit=1000000000&page=1.5&sort=newest");
  const filters = normalizeProductsQuery({ page: params.get("page"), limit: params.get("limit") });
  assert.equal(filters.page, 1);
  assert.equal(filters.limit, 12);
  assert.equal(Array.from({ length: filters.limit }).length, 12);
  assert.deepEqual(productListKey(filters), ["products", "list", filters]);
  assert.deepEqual(normalizeProductsQuery(filters), filters, "normalization is idempotent");
  const nextPage = normalizeProductsQuery({ ...filters, page: filters.page + 1 });
  assert.equal(nextPage.page, 2);
  assert.equal(nextPage.limit, 12);
  assert.deepEqual(productListKey(nextPage)[2], { ...filters, page: 2 });
});

test("storefront layout derives page, limit and skeletons only from the normalized query", () => {
  const layout = readFileSync(new URL("../app/(user)/products/_components/ProductsLayout.jsx",
    import.meta.url), "utf8");
  assert.match(layout, /return normalizeProductsQuery\(\{/);
  assert.match(layout, /const \{ page \} = filters;/);
  assert.match(layout, /const skeletonCount = filters\.limit;/);
  assert.doesNotMatch(layout, /Number\(searchParams\.get\("(limit|page)"\)\)/);
});
