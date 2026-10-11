// CategorySidebar filter state: price presets stay selected through Apply,
// reload and URL hydration; clearing every filter can be applied; the
// "all <gender> perfumes" link is never `gender=undefined` and is encoded.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  SIDEBAR_PRICE_RANGES,
  buildQueryFromFilters,
  canApplySidebarFilters,
  emptyFilters,
  filtersReducer,
  genderProductsHref,
  getFiltersFromSearchParams,
  initialFilters,
  isPriceRangeSelected,
} from "./productFilterContract.mjs";

const sidebar = readFileSync(
  new URL("../app/(user)/_components/CategorySidebar.jsx", import.meta.url), "utf8");

const params = (query) => new URLSearchParams(query);
const act = (state, type, key, value) => filtersReducer(state, { type, key, value });
const hydrate = (url) => filtersReducer(structuredClone(initialFilters),
  { type: "HYDRATE_FROM_URL", payload: getFiltersFromSearchParams(params(url)) });
const selected = (priceRange) =>
  SIDEBAR_PRICE_RANGES.filter((range) => isPriceRangeSelected(priceRange, range))
    .map((range) => range.value);

test("each preset stays the one selected preset after Apply, reload and hydration", () => {
  for (const range of SIDEBAR_PRICE_RANGES) {
    // Select in the sidebar (draft), then Apply writes the URL.
    let state = act(structuredClone(initialFilters), "SET_ITEM", "priceRange",
      [range.minPrice, range.maxPrice]);
    assert.deepEqual(selected(state.draft.priceRange), [range.value], `${range.value} draft`);
    const url = buildQueryFromFilters(state.draft, params(""));

    // The URL change (or a reload of it) hydrates draft and applied.
    state = hydrate(url);
    assert.deepEqual(selected(state.draft.priceRange), [range.value], `${range.value} hydrated`);
    assert.deepEqual(selected(state.applied.priceRange), [range.value], `${range.value} applied`);

    // Cancel restores the applied draft: still selected.
    state = filtersReducer(state, { type: "RESET_DRAFT" });
    assert.deepEqual(selected(state.draft.priceRange), [range.value], `${range.value} reopened`);
  }
});

test("presets filter exactly as before: same URL parameters", () => {
  const urlFor = (value) => {
    const range = SIDEBAR_PRICE_RANGES.find((item) => item.value === value);
    return buildQueryFromFilters({ ...emptyFilters, priceRange: [range.minPrice, range.maxPrice] },
      params(""));
  };
  assert.equal(urlFor("until-one-million"), "maxPrice=999999");
  assert.equal(urlFor("until-three-million"), "maxPrice=3000000");
  assert.equal(urlFor("until-five-million"), "maxPrice=5000000");
  assert.equal(urlFor("over-five-million"), "minPrice=5000001");
});

test("a zero minimum still matches its preset; other ranges match none", () => {
  assert.deepEqual(selected([0, 3000000]), ["until-three-million"]);
  assert.deepEqual(selected([null, null]), []);
  assert.deepEqual(selected([100000, 3000000]), []);
  assert.deepEqual(selected(undefined), []);
});

test("clearing every filter in the sidebar can be applied", () => {
  let state = hydrate("brandIds=3&inStock=true&sort=oldest&search=rose&page=4");
  assert.equal(canApplySidebarFilters(state), true);
  state = act(state, "SET_ITEMS", "brandIds", 3);
  state = act(state, "SET_ITEM", "inStock", false);
  assert.equal(canApplySidebarFilters(state), true, "the applied filters can be cleared");

  const url = params(buildQueryFromFilters(state.draft, params(
    "brandIds=3&inStock=true&sort=oldest&search=rose&page=4")));
  assert.equal(url.get("brandIds"), null);
  assert.equal(url.get("inStock"), null);
  assert.equal(url.get("page"), null);
  assert.equal(url.get("sort"), "oldest", "sort is not a sidebar filter and is kept");
  assert.equal(url.get("search"), "rose");

  // Nothing selected and nothing applied: still nothing to apply.
  assert.equal(canApplySidebarFilters(structuredClone(initialFilters)), false);
  assert.equal(canApplySidebarFilters(hydrate("sort=oldest")), false);
  assert.equal(canApplySidebarFilters({}), false);
  // A draft-only selection is applicable as before.
  assert.equal(canApplySidebarFilters(act(structuredClone(initialFilters), "SET_ITEM",
    "priceRange", [null, 999999])), true);
});

test("the gender link carries only an encoded, defined gender", () => {
  assert.equal(genderProductsHref("men"), "/products?gender=men");
  assert.equal(genderProductsHref("a&b c"), "/products?gender=a%26b+c");
  const persian = "مردانه";
  const href = genderProductsHref(persian);
  assert.doesNotMatch(href, /مردانه/, "non-ASCII is percent-encoded");
  assert.equal(new URL(href, "http://localhost").searchParams.get("gender"), persian);
  for (const missing of [undefined, null, ""]) {
    assert.equal(genderProductsHref(missing), "/products");
  }
});

test("the sidebar uses the shared presets, selection, apply rule and gender link", () => {
  assert.match(sidebar, /SIDEBAR_PRICE_RANGES\.map\(\(price\) => \{/);
  assert.match(sidebar, /isPriceRangeSelected\(\s*state\.draft\.priceRange,\s*price,\s*\)/);
  assert.doesNotMatch(sidebar, /const priceRanges = \[/);
  assert.match(sidebar, /const canApply = canApplySidebarFilters\(state\);/);
  assert.match(sidebar, /disabled=\{!canApply\}/);
  assert.match(sidebar, /\{activeGender && \(/);
  assert.match(sidebar, /router\.replace\(genderProductsHref\(activeGender\.slug\)\);/);
  assert.doesNotMatch(sidebar, /gender=\$\{/);
});
