// Header search: the box shows the URL's effective search after navigation
// (no stale term), keeps unsubmitted typing otherwise, adds no request, and a
// search started outside /products can be undone with Back.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { productSearchNavigation, syncHeaderSearch } from "./headerSearch.mjs";

const header = readFileSync(new URL("../components/HeaderLayout.jsx", import.meta.url), "utf8");

// The header's state across renders: each render passes the current URL search.
function headerBox(initialUrlSearch) {
  let state = { value: initialUrlSearch, urlSearch: initialUrlSearch };
  let renders = 0;
  return {
    render(urlSearch) {
      const next = syncHeaderSearch(state, urlSearch);
      if (next !== state) renders += 1;
      state = next;
      return state.value;
    },
    type(value) { state = { ...state, value }; },
    get value() { return state.value; },
    get syncRenders() { return renders; },
  };
}

test("navigating to a URL without that search clears the stale term", () => {
  const box = headerBox("dior");
  assert.equal(box.render("dior"), "dior");
  // A category link: /products?gender=men (no search).
  assert.equal(box.render(""), "");
});

test("Back/Forward between searches shows each URL's search", () => {
  const box = headerBox("dior");
  assert.equal(box.render("chanel"), "chanel");
  assert.equal(box.render("dior"), "dior");
  assert.equal(box.render(""), "");
  assert.equal(box.render("chanel"), "chanel");
});

test("unsubmitted typing survives renders and navigation that keep the URL search", () => {
  const box = headerBox("");
  box.type("ros");
  assert.equal(box.render(""), "ros");
  // e.g. Home → /products?sort=newest: still no URL search.
  assert.equal(box.render(""), "ros");
  assert.equal(box.syncRenders, 0, "no extra state update while the URL search is unchanged");

  const onResults = headerBox("dior");
  onResults.type("dior homme");
  assert.equal(onResults.render("dior"), "dior homme");
});

test("submitting replaces the typed text with the submitted, trimmed search", () => {
  const box = headerBox("");
  box.type("  rose  ");
  const { href } = productSearchNavigation(box.value, new URLSearchParams(""), "/");
  const submitted = new URL(href, "http://localhost").searchParams.get("search");
  assert.equal(box.render(submitted), "rose");
});

test("from another page the search is a new history entry; on /products it refines in place", () => {
  assert.deepEqual(productSearchNavigation("dior", new URLSearchParams(""), "/"),
    { href: "/products?search=dior&page=1&limit=12", replace: false });
  assert.equal(productSearchNavigation("dior", new URLSearchParams(""), "/products/12").replace,
    false);
  const refine = productSearchNavigation("rose",
    new URLSearchParams("brandIds=3&sort=oldest&search=dior&page=4"), "/products");
  assert.equal(refine.replace, true);
  assert.equal(refine.href, "/products?brandIds=3&sort=oldest&search=rose&page=1&limit=12");
});

test("an empty search removes it; values are encoded", () => {
  assert.equal(
    productSearchNavigation("   ", new URLSearchParams("search=dior&brandIds=3"), "/products").href,
    "/products?brandIds=3&page=1&limit=12");
  const href = productSearchNavigation("a&b %", new URLSearchParams(""), "/").href;
  assert.equal(href, "/products?search=a%26b+%25&page=1&limit=12");
  const persian = productSearchNavigation("عطر مردانه", new URLSearchParams(""), "/").href;
  assert.equal(new URL(persian, "http://localhost").searchParams.get("search"), "عطر مردانه");
});

test("HeaderLayout follows the URL search during render, with one shared suggestion controller", () => {
  assert.match(header, /const urlSearch = searchParams\.get\("search"\) \|\| "";/);
  assert.match(header, /const syncedSearch = syncHeaderSearch\(search, urlSearch\);/);
  assert.match(header, /if \(syncedSearch !== search\) setSearch\(syncedSearch\);/);
  assert.doesNotMatch(header, /useEffect\([\s\S]{0,300}?setSearch/);
  assert.equal((header.match(/useGetProductSuggestions\(suggestionQuery\)/g) || []).length, 1);
  assert.match(header,
    /productSearchNavigation\(\s*searchValue,\s*searchParams,\s*pathname,\s*\);\s*closeSearch\("navigation"\);\s*if \(replace\) router\.replace\(href\);\s*else router\.push\(href\);/);
});
