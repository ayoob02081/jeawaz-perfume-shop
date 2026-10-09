import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import app from "../services/httpClient.js";
import {
  buildQueryFromFilters, emptyFilters, filtersReducer, getFiltersFromSearchParams,
  initialFilters, mergeVolumeOptions, normalizeProductsQuery, productListKey,
} from "./productFilterContract.mjs";

const fresh = () => structuredClone(initialFilters);
const act = (state, type, key, value) => filtersReducer(state, { type, key, value });

test("single type stays draft until Apply, can replace and clear", () => {
  let state = fresh();
  assert.equal(state.draft.type, null);
  state = act(state, "SET_ITEM", "type", "decant");
  assert.equal(state.applied.type, null);
  state = act(state, "SET_ITEM", "type", "sealed");
  state = act(state, "APPLY_FILTERS");
  assert.equal(state.applied.type, "sealed");
  state = act(state, "RESET_ONE_APPLY", "type");
  assert.equal(state.draft.type, null);
  assert.equal(state.applied.type, null);
});

test("draft cancel, individual resets, all reset and hydration", () => {
  let state = act(fresh(), "SET_ITEMS", "volumes", 100);
  state = act(state, "SET_ITEM", "priceRange", [0, 5000000]);
  state = act(state, "RESET_DRAFT");
  assert.deepEqual(state.draft, emptyFilters);
  const hydrated = getFiltersFromSearchParams(new URLSearchParams(
    "type=sealed&volumes=100&minVolume=50&minPrice=5000000&page=4"));
  state = filtersReducer(state, { type: "HYDRATE_FROM_URL", payload: hydrated });
  assert.deepEqual(state.draft, state.applied);
  state = act(state, "RESET_ONE_APPLY", "volumes");
  assert.deepEqual(state.applied.volumes, []);
  assert.equal(state.applied.minVolume, null);
  assert.equal(state.applied.type, "sealed");
  state = act(state, "RESET_ONE_APPLY", "priceRange");
  assert.deepEqual(state.applied.priceRange, [null, null]);
  state = act(state, "RESET_ALL_APPLY");
  assert.deepEqual(state.applied, emptyFilters);
});

test("URL hydration, canonical repeated volumes, price and Product filters", () => {
  const direct = new URLSearchParams(
    "type=sealed&volumes=100&volumes=50&volumes=100&minPrice=0&maxPrice=10000000&brandIds=4&fragranceFamilies=floral&page=4&search=rose");
  const filters = getFiltersFromSearchParams(direct);
  assert.equal(filters.type, "sealed");
  assert.deepEqual(filters.volumes, [50, 100]);
  assert.deepEqual(filters.priceRange, [null, 10000000]);
  const url = new URLSearchParams(buildQueryFromFilters(filters, direct));
  assert.deepEqual(url.getAll("volumes"), ["50", "100"]);
  assert.equal(url.get("type"), "sealed");
  assert.equal(url.get("minPrice"), null);
  assert.equal(url.get("maxPrice"), "10000000");
  assert.equal(url.get("search"), "rose");
  assert.equal(url.get("page"), null);
  assert.equal(url.get("fragranceFamilies"), "floral");
  assert.equal(url.get("brandIds"), "4");
  assert.equal(url.get("types"), null);
});

test("invalid type and invalid volumes never enter controlled filter state", () => {
  const parsed = getFiltersFromSearchParams(new URLSearchParams(
    "type=SEALED&type=decant&volumes=0&volumes=-5&volumes=50&volumes=50"));
  assert.equal(parsed.type, null);
  assert.deepEqual(parsed.volumes, [50]);
});

test("price-only and volume-range direct URLs hydrate and serialize without page", () => {
  const direct = new URLSearchParams(
    "minVolume=50&maxVolume=100&minPrice=5000000&maxPrice=10000000&page=7");
  const filters = getFiltersFromSearchParams(direct);
  assert.deepEqual(filters.priceRange, [5000000, 10000000]);
  assert.equal(filters.minVolume, 50);
  assert.equal(filters.maxVolume, 100);
  const serialized = new URLSearchParams(buildQueryFromFilters(filters, direct));
  assert.equal(serialized.get("minVolume"), "50");
  assert.equal(serialized.get("maxVolume"), "100");
  assert.equal(serialized.get("minPrice"), "5000000");
  assert.equal(serialized.get("maxPrice"), "10000000");
  assert.equal(serialized.get("page"), null);
});

test("reset-all cleans owned filters (including discounted) and page while retaining unrelated search", () => {
  const previous = new URLSearchParams(
    "search=rose&discounted=true&limit=24&brandIds=1&type=sealed&volumes=100&page=5");
  const reset = new URLSearchParams(buildQueryFromFilters(emptyFilters, previous));
  assert.equal(reset.get("search"), "rose");
  assert.equal(reset.get("discounted"), null);
  assert.equal(reset.get("limit"), "24");
  assert.equal(reset.get("brandIds"), null);
  assert.equal(reset.get("type"), null);
  assert.equal(reset.get("volumes"), null);
  assert.equal(reset.get("page"), null);
});

test("back/forward URL hydration restores draft and applied without Apply", () => {
  const urls = ["", "type=sealed", "type=sealed&volumes=100"];
  let state = fresh();
  for (const index of [0, 1, 2, 1, 2]) {
    state = filtersReducer(state, { type: "HYDRATE_FROM_URL",
      payload: getFiltersFromSearchParams(new URLSearchParams(urls[index])) });
    assert.deepEqual(state.draft, state.applied);
    assert.equal(state.applied.type, index ? "sealed" : null);
    assert.deepEqual(state.applied.volumes, index === 2 ? [100] : []);
  }
});

test("normal Product keys and next-page prefetch keys normalize equivalent inputs", () => {
  const a = productListKey({ type: "sealed", volumes: [100, 50, 100],
    minPrice: 0, page: 1, brandIds: [4, 2], discounted: true });
  const b = productListKey({ type: "sealed", volumes: [50, 100],
    page: 1, brandIds: [2, 4], discounted: "true" });
  assert.deepEqual(a, b);
  const next = productListKey({ ...a[2], page: 2 });
  assert.deepEqual(next[2], { ...a[2], page: 2 });
  assert.equal(productListKey({ sort: "best_selling" })[2].sort, "best_selling");
  // `grades` only (canonical order); a legacy `original` input is translated and
  // never reaches the request, since the backend rejects the two together.
  assert.deepEqual(productListKey({ grades: ["SUPER_MASTER", "ORIGINAL", "NOPE"] })[2].grades,
    ["ORIGINAL", "SUPER_MASTER"]);
  assert.deepEqual(productListKey({ original: false })[2].grades, ["SUPER_MASTER"]);
  assert.deepEqual(productListKey({ original: "true" })[2].grades, ["ORIGINAL"]);
  assert.equal("original" in productListKey({ original: true })[2], false);
  assert.equal("grades" in productListKey({})[2], false);
  assert.deepEqual(productListKey({ grades: ["SUPER_MASTER"], original: true })[2].grades,
    ["SUPER_MASTER"]);
  assert.equal(productListKey({})[2].type, undefined);
  assert.equal(normalizeProductsQuery({ maxVolume: "100" }).maxVolume, 100);
});

test("selected URL volume remains visible when options are loading, empty or failed", () => {
  assert.deepEqual(mergeVolumeOptions(undefined, [100]), [100]);
  assert.deepEqual(mergeVolumeOptions([], [100]), [100]);
  assert.deepEqual(mergeVolumeOptions([50, 5, 50], [100]), [5, 50, 100]);
});

test("actual Axios serializer sends repeated volume and other array parameters", () => {
  const url = app.getUri({ url: "/products", params: normalizeProductsQuery({
    volumes: [100, 50], brandIds: [4, 2], fragranceFamilies: ["floral", "woody"],
    type: "sealed", minPrice: 5000000,
  }) });
  const params = new URL(url, "http://localhost").searchParams;
  assert.deepEqual(params.getAll("volumes"), ["50", "100"]);
  assert.deepEqual(params.getAll("brandIds"), ["2", "4"]);
  assert.deepEqual(params.getAll("fragranceFamilies"), ["floral", "woody"]);
  assert.equal(params.get("type"), "sealed");
  assert.equal(params.get("minPrice"), "5000000");
  assert.equal(params.get("types"), null);
  assert.equal(params.has("volumes[]"), false);
});

test("storefront prefetch uses the normal key factory and options use the backend route", () => {
  const layout = readFileSync(new URL("../app/(user)/products/_components/ProductsLayout.jsx",
    import.meta.url), "utf8");
  const service = readFileSync(new URL("../services/productServices.js", import.meta.url), "utf8");
  assert.match(layout, /queryKey: productKeys\.list\(nextPageFilters\)/);
  assert.match(service, /getProductVolumeOptionsApi[\s\S]*?\/products\/filter-options\/volumes/);
});

test("only an explicit admin opt-out reaches the API; storefront keys keep their shape", () => {
  for (const value of [undefined, true, "false", 0, null]) {
    assert.equal("availabilityFirst" in normalizeProductsQuery({ availabilityFirst: value }), false);
  }
  assert.deepEqual(productListKey({ sort: "newest" }), productListKey({}));
  const admin = normalizeProductsQuery({ availabilityFirst: false, page: 1, limit: 12 });
  assert.equal(admin.availabilityFirst, false);
  const params = new URL(app.getUri({ url: "/products", params: admin }), "http://localhost")
    .searchParams;
  assert.equal(params.get("availabilityFirst"), "false");
  const adminLayout = readFileSync(new URL(
    "../app/(admin)/admin/products/_components/ProductsLayout.jsx", import.meta.url), "utf8");
  assert.match(adminLayout, /useGetAllProducts\(\{[\s\S]*?availabilityFirst: false,[\s\S]*?\}\)/);
});
