// Storefront URL/query values the backend's QueryProductsDto rejects with 400
// (unknown sort, out-of-range price/volume, inverted ranges, malformed
// numbers) never reach GET /products; valid values pass unchanged.

import assert from "node:assert/strict";
import test from "node:test";
import app from "../services/httpClient.js";
import {
  PRODUCT_PRICE_MAX,
  PRODUCT_SORTS,
  PRODUCT_VOLUME_MAX,
  buildQueryFromFilters,
  emptyFilters,
  getFiltersFromSearchParams,
  normalizeProductsQuery,
} from "./productFilterContract.mjs";

const params = (query) => new URLSearchParams(query);

// The storefront request for a /products URL, as ProductsLayout builds it.
const requestFor = (url) => {
  const search = params(url);
  const applied = getFiltersFromSearchParams(search);
  return normalizeProductsQuery({
    ...applied,
    search: search.get("search") || undefined,
    minPrice: applied.priceRange[0],
    maxPrice: applied.priceRange[1],
    sort: applied.sort || "newest",
    page: search.get("page"),
    limit: search.get("limit"),
  });
};

// The backend DTO rules this contract mirrors.
const acceptedByBackend = (query) => {
  const inRange = (value, min, max) => value === undefined ||
    (Number.isSafeInteger(value) && value >= min && value <= max);
  return PRODUCT_SORTS.includes(query.sort) &&
    inRange(query.minPrice, 0, PRODUCT_PRICE_MAX) &&
    inRange(query.maxPrice, 1, PRODUCT_PRICE_MAX) &&
    inRange(query.minVolume, 1, PRODUCT_VOLUME_MAX) &&
    inRange(query.maxVolume, 1, PRODUCT_VOLUME_MAX) &&
    (query.volumes ?? []).every((volume) => inRange(volume, 1, PRODUCT_VOLUME_MAX)) &&
    (query.minPrice === undefined || query.maxPrice === undefined ||
      query.minPrice <= query.maxPrice) &&
    (query.minVolume === undefined || query.maxVolume === undefined ||
      query.minVolume <= query.maxVolume);
};

test("the bounds and sorts mirror the backend DTO", () => {
  assert.equal(PRODUCT_PRICE_MAX, 2_147_483_647);
  assert.equal(PRODUCT_VOLUME_MAX, 4_294_967_295);
  assert.deepEqual(PRODUCT_SORTS, ["newest", "oldest", "best_selling", "most_discounted",
    "price_low_to_high", "price_high_to_low"]);
});

test("every supported sort is kept; unknown sorts fall back to the default", () => {
  for (const sort of PRODUCT_SORTS) {
    assert.equal(requestFor(`sort=${sort}`).sort, sort);
    assert.equal(getFiltersFromSearchParams(params(`sort=${sort}`)).sort, sort);
    assert.equal(params(buildQueryFromFilters({ ...emptyFilters, sort }, params(""))).get("sort"),
      sort);
  }
  for (const sort of ["price", "PRICE_LOW_TO_HIGH", "newest%20", "cheapest", "", "__proto__"]) {
    assert.equal(requestFor(`sort=${sort}`).sort, "newest", sort);
    assert.equal(getFiltersFromSearchParams(params(`sort=${sort}`)).sort, "", sort);
  }
  assert.equal(normalizeProductsQuery({ sort: "toString" }).sort, "newest");
});

test("prices: the bound is kept, beyond it or malformed is dropped", () => {
  const max = String(PRODUCT_PRICE_MAX);
  const above = String(PRODUCT_PRICE_MAX + 1);
  assert.equal(requestFor(`maxPrice=${max}`).maxPrice, PRODUCT_PRICE_MAX);
  assert.equal(requestFor(`minPrice=${max}`).minPrice, PRODUCT_PRICE_MAX);
  assert.equal(requestFor("minPrice=1&maxPrice=1").maxPrice, 1);
  for (const value of [above, "3000000000", "99999999999999999999", "abc", "1.5", "-1",
    "1e3", " 5", "0x10", ""]) {
    const query = requestFor(`minPrice=${encodeURIComponent(value)}&maxPrice=${encodeURIComponent(value)}`);
    assert.equal(query.minPrice, undefined, value);
    assert.equal(query.maxPrice, undefined, value);
  }
  // A zero minimum stays the existing no-op.
  assert.equal(requestFor("minPrice=0&maxPrice=700000").minPrice, undefined);
  assert.equal(requestFor("minPrice=0&maxPrice=700000").maxPrice, 700000);
  // One bad bound does not discard the valid one.
  const mixed = requestFor(`minPrice=500000&maxPrice=${above}`);
  assert.deepEqual([mixed.minPrice, mixed.maxPrice], [500000, undefined]);
});

test("volumes: the bound is kept, beyond it or malformed is dropped value by value", () => {
  const max = String(PRODUCT_VOLUME_MAX);
  const above = String(PRODUCT_VOLUME_MAX + 1);
  assert.equal(requestFor(`maxVolume=${max}`).maxVolume, PRODUCT_VOLUME_MAX);
  assert.equal(requestFor(`maxVolume=${above}`).maxVolume, undefined);
  assert.equal(requestFor(`minVolume=${above}`).minVolume, undefined);
  assert.equal(requestFor("minVolume=0").minVolume, undefined);
  assert.deepEqual(requestFor(`volumes=100&volumes=${above}&volumes=abc&volumes=5`).volumes,
    [5, 100]);
  assert.deepEqual(requestFor(`volumes=${max}`).volumes, [PRODUCT_VOLUME_MAX]);
});

test("an inverted range is not applied; equal and one-sided ranges are", () => {
  for (const [url, expected] of [
    ["minPrice=500000&maxPrice=100000", [undefined, undefined]],
    ["minPrice=500000&maxPrice=500000", [500000, 500000]],
    ["minPrice=500000", [500000, undefined]],
    ["maxPrice=100000", [undefined, 100000]],
  ]) {
    const query = requestFor(url);
    assert.deepEqual([query.minPrice, query.maxPrice], expected, url);
  }
  for (const [url, expected] of [
    ["minVolume=101&maxVolume=100", [undefined, undefined]],
    ["minVolume=100&maxVolume=100", [100, 100]],
  ]) {
    const query = requestFor(url);
    assert.deepEqual([query.minVolume, query.maxVolume], expected, url);
  }
  // The controls see what is applied: no badge for an ignored inverted price.
  assert.deepEqual(getFiltersFromSearchParams(params("minPrice=9&maxPrice=1")).priceRange,
    [null, null]);
  assert.deepEqual(normalizeProductsQuery({ minPrice: 9, maxPrice: 1 }).minPrice, undefined);
});

test("the next URL write never carries an invalid value", () => {
  const url = params(buildQueryFromFilters({
    ...emptyFilters,
    priceRange: [PRODUCT_PRICE_MAX + 1, null],
    minVolume: 200,
    maxVolume: 100,
    volumes: [100, PRODUCT_VOLUME_MAX + 1],
    sort: "cheapest",
  }, params("minPrice=1&maxPrice=0&sort=price&search=rose")));
  assert.equal(url.get("minPrice"), null);
  assert.equal(url.get("maxPrice"), null);
  assert.equal(url.get("minVolume"), null);
  assert.equal(url.get("maxVolume"), null);
  assert.deepEqual(url.getAll("volumes"), ["100"]);
  assert.equal(url.get("sort"), null);
  assert.equal(url.get("search"), "rose");
});

test("a hostile URL produces a request the backend accepts, valid values unchanged", () => {
  const hostile = [
    "sort=price", "minPrice=abc", `maxPrice=${PRODUCT_PRICE_MAX + 1}`,
    "minVolume=9&maxVolume=3", "volumes=0&volumes=-5", "page=abc&limit=9999",
  ].join("&");
  const query = requestFor(hostile);
  assert.ok(acceptedByBackend(query), JSON.stringify(query));

  const valid = "brandIds=4&type=sealed&volumes=50&volumes=100&minVolume=50&maxVolume=100"
    + "&minPrice=100000&maxPrice=900000&inStock=true&sort=price_low_to_high&search=rose&page=2";
  const kept = requestFor(valid);
  assert.ok(acceptedByBackend(kept));
  assert.deepEqual(
    [kept.brandIds, kept.type, kept.volumes, kept.minVolume, kept.maxVolume, kept.minPrice,
      kept.maxPrice, kept.inStock, kept.sort, kept.search, kept.page],
    [[4], "sealed", [50, 100], 50, 100, 100000, 900000, true, "price_low_to_high", "rose", 2]);
  assert.deepEqual(normalizeProductsQuery(kept), kept, "normalization is idempotent");

  const sent = new URL(app.getUri({ url: "/products", params: query }), "http://localhost")
    .searchParams;
  for (const key of ["minPrice", "maxPrice", "minVolume", "maxVolume", "volumes"]) {
    assert.equal(sent.has(key), false, key);
  }
  assert.equal(sent.get("sort"), "newest");
});
