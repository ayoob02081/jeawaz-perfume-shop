import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Module, { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryObserver, keepPreviousData } from "@tanstack/react-query";
import * as pagination from "./productPagination.mjs";
import { productListKey, productsQueryFromSearchParams } from "./productFilterContract.mjs";
import { catalogInitialQueryOptions, prepareCatalogSnapshot, commitCatalogSnapshot } from "../lib/storefrontCatalog.mjs";
import { toPersianNumbers } from "./toPersianNumbers.js";
const { productPageHref, productPaginationState } = pagination;
const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const filename = fileURLToPath(new URL("../app/(user)/products/_components/ProductPagination.jsx", import.meta.url));
const links = [];
const mod = new Module(filename);
mod.filename = filename;
mod.require = (name) => {
  if (name === "@/utils/productPagination.mjs") return pagination;
  if (name === "@/utils/toPersianNumbers") return { toPersianNumbers };
  if (name === "next/link") return (props) => {
    links.push(props);
    const NextLink = require("next/link");
    return React.createElement(NextLink.default ?? NextLink, props);
  };
  return require(name);
};
mod._compile(transformSync(readFileSync(filename, "utf8"), {
  filename, jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } },
  module: { type: "commonjs" },
}).code, filename);
const Pagination = mod.exports.default;
const render = (props = {}) => {
  links.length = 0;
  return renderToStaticMarkup(React.createElement(Pagination, { page: 1, totalPages: 3, search: "", ...props }));
};
const hrefs = (html) => [...html.matchAll(/<a\b[^>]*href="([^"]*)"/g)].map((m) => m[1].replaceAll("&amp;", "&"));

test("page links preserve Unicode, repeated filters, search, price, size and explicit sorting", () => {
  const original = new URLSearchParams("search=عود+%26+oud&brandIds=2&brandIds=1&seasons=summer&seasons=winter&gender=زنانه%2Fخاص&minPrice=100&maxPrice=9000&limit=24&sort=oldest&page=2&page=8");
  const before = original.toString();
  const href = productPageHref(original, 3);
  const params = new URL(href, "https://jeawaz.com").searchParams;
  assert.equal(params.get("page"), "3");
  original.delete("page"); params.delete("page");
  assert.deepEqual([...params], [...original]);
  assert.equal(new URLSearchParams(before).getAll("page").length, 2);
  assert.deepEqual(productListKey(productsQueryFromSearchParams(new URLSearchParams(href.split("?")[1])))[2],
    { ...productsQueryFromSearchParams(new URLSearchParams(before)), page: 3 });
});

test("first page omits every page parameter and leaves the caller's URL untouched", () => {
  const params = new URLSearchParams("gender=female&page=2&page=3");
  assert.equal(productPageHref(params, 1), "/products?gender=female");
  assert.deepEqual(params.getAll("page"), ["2", "3"]);
  assert.equal(productPageHref("page=2", 1), "/products");
  for (const value of [0, -1, "abc", "1.5", Infinity]) assert.equal(productPageHref("", value), "/products");
});

test("pagination never inserts a default search sort and preserves every explicit sort", () => {
  assert.equal(new URL(productPageHref("search=oud", 2), "https://jeawaz.com").searchParams.has("sort"), false);
  for (const sort of ["newest", "oldest", "price_low_to_high", "price_high_to_low", "most_discounted", "best_selling"]) {
    const href = productPageHref(new URLSearchParams({ search: "oud", sort }), 2);
    assert.equal(productsQueryFromSearchParams(new URL(href, "https://jeawaz.com").searchParams).sort, sort);
  }
});

test("the bounded page window keeps first/last and adjacent pages with noninteractive ellipses", () => {
  assert.deepEqual(productPaginationState(1, 10), { items: [1, 2, 3, "dots-end", 10], previous: null, next: 2 });
  assert.deepEqual(productPaginationState(6, 12).items, [1, "dots-start", 4, 5, 6, 7, 8, "dots-end", 12]);
  assert.deepEqual(productPaginationState(10, 10), { items: [1, "dots-start", 8, 9, 10], previous: 9, next: null });
  assert(productPaginationState(1, Number.MAX_SAFE_INTEGER).items.length <= 9);
});

test("empty/single pages hide the pager; valid out-of-range requests have only in-range recovery links", () => {
  for (const total of [0, -1, null, Infinity, 1.5]) assert.deepEqual(productPaginationState(1, total).items, []);
  assert.deepEqual(productPaginationState(1, 1).items, []);
  assert.deepEqual(productPaginationState(999, 3), { items: [1, 2, 3], previous: 3, next: null });
  assert.deepEqual(productPaginationState(999, 1), { items: [1], previous: 1, next: null });
  assert.equal(render({ totalPages: 0 }), "");
  assert.equal(render({ totalPages: 1 }), "");
});

test("actual Next Link SSR renders first/middle/last page hrefs and an accessible current page", () => {
  for (const page of [1, 2, 3]) {
    const html = render({ page });
    assert.match(html, /<nav aria-label="صفحه‌بندی محصولات"/);
    assert.match(html, /aria-current="page"/);
    assert(!html.includes("<button"));
    const destinations = hrefs(html);
    for (const other of [1, 2, 3].filter((n) => n !== page)) assert(destinations.includes(productPageHref("", other)));
    assert(!destinations.includes(productPageHref("", page)));
    assert(!destinations.some((href) => href.includes("page=1")));
    for (const link of links) { assert.equal(link.replace, true); assert.equal(link.scroll, false); assert.equal(link.prefetch, undefined); }
  }
});

test("boundary arrows and ellipses have no fake href and no nested interactive markup", () => {
  const html = render({ totalPages: 12 });
  assert.match(html, /<span aria-disabled="true"/);
  assert.match(html, /aria-hidden="true">\.\.\.<\/span>/);
  assert(!hrefs(html).some((href) => href === "#" || href.includes("page=0") || href.includes("dots")));
  assert(!/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<(a|button)\b/.test(html));
  const recovered = render({ page: 999, totalPages: 3 });
  assert(!recovered.includes('aria-current="page"'));
  assert(hrefs(recovered).every((href) => Number(new URL(href, "https://jeawaz.com").searchParams.get("page") || 1) <= 3));
});

test("loading links retain real hrefs but prevent navigation; normal links retain browser click behavior", () => {
  render({ isLoading: true });
  let prevented = 0;
  for (const link of links) {
    assert.equal(link["aria-disabled"], true); assert.equal(link.tabIndex, -1);
    link.onClick({ preventDefault: () => prevented++ });
    link.onNavigate({ preventDefault: () => prevented++ });
  }
  assert.equal(prevented, links.length * 2);
  render();
  const calls = [];
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: { scrollTo: (options) => calls.push(options) } });
  try {
    links[0].onClick({ ctrlKey: true, preventDefault: () => { throw new Error("modified click intercepted"); } });
    links[0].onNavigate({ preventDefault: () => { throw new Error("normal navigation blocked"); } });
    assert.deepEqual(calls, [{ top: 0, behavior: "smooth" }]);
  } finally { if (oldWindow) Object.defineProperty(globalThis, "window", oldWindow); else delete globalThis.window; }
});

test("URL-driven Back/Forward renders preserve filters and reflect each current page without local pager state", () => {
  for (const page of [1, 2, 3, 2, 1]) {
    const url = new URL(productPageHref("gender=female&sort=oldest&limit=2", page), "https://jeawaz.com");
    const query = productsQueryFromSearchParams(url.searchParams);
    const html = render({ page: query.page, search: url.searchParams.toString() });
    assert.match(html, new RegExp('aria-current="page"[^>]*><span[^>]*>' + toPersianNumbers(page) + '</span></span>'));
    assert(html.includes(toPersianNumbers(page)));
    for (const href of hrefs(html)) { const params = new URL(href, url).searchParams; assert.equal(params.get("gender"), "female"); assert.equal(params.get("sort"), "oldest"); assert.equal(params.get("limit"), "2"); }
  }
});

test("page href, SSR snapshot and observer share one exact key through navigation and return", async () => {
  const client = new QueryClient();
  let requests = 0;
  const base = { placeholderData: keepPreviousData, queryFn: async () => { requests++; throw Error("unexpected duplicate fetch"); } };
  let observer, stop;
  try {
    for (const page of [1, 2, 3, 2, 1]) {
      const params = new URL(productPageHref("gender=female&sort=oldest&limit=2", page), "https://jeawaz.com").searchParams;
      const query = productsQueryFromSearchParams(params), key = productListKey(query);
      const data = { data: [{ id: 105 + page }], meta: { page, limit: 2, total: 6, totalPages: 3 } };
      const snapshot = { query, data, updatedAt: Date.now() + page };
      const initial = catalogInitialQueryOptions(query, snapshot);
      const adoption = prepareCatalogSnapshot(client, key, initial);
      const options = { ...base, queryKey: key, ...initial };
      if (!observer) { observer = new QueryObserver(client, options); stop = observer.subscribe(() => {}); }
      else observer.setOptions(options);
      await commitCatalogSnapshot(client, key, initial, adoption);
      assert.deepEqual(observer.getCurrentResult().data, data);
      assert.equal(observer.getCurrentResult().isPlaceholderData, false);
      assert.equal(observer.getCurrentResult().isFetching, false);
    }
    assert.equal(requests, 0);
  } finally { stop?.(); client.clear(); }
});


test("compact pagination bounds large catalogs without changing arrow destinations", () => {
  for (const total of [5, 10, 100, 1000, 100000, Number.MAX_SAFE_INTEGER]) {
    for (const page of [1, 2, 3, Math.floor(total / 2), total - 1, total, Number.MAX_SAFE_INTEGER]) {
      const compact = productPaginationState(page, total, true);
      const desktop = productPaginationState(page, total);
      assert(compact.items.length <= 7);
      const numbers = compact.items.filter((item) => typeof item === "number");
      assert(numbers.length <= 5);
      assert(numbers.includes(1));
      assert(numbers.includes(total));
      assert(numbers.includes(Math.min(page, total)));
      assert(numbers.every((item) => item >= 1 && item <= total));
      assert.equal(compact.previous, desktop.previous);
      assert.equal(compact.next, desktop.next);
    }
  }
  assert.deepEqual(productPaginationState(500, 1000, true).items, [1, "dots-start", 499, 500, 501, "dots-end", 1000]);
  for (const total of [2, 3, 4]) for (let page = 1; page <= total; page++) {
    assert.deepEqual(productPaginationState(page, total, true).items, Array.from({ length: total }, (_, i) => i + 1));
  }
});

test("responsive SSR has one current item, real filtered links and CSS-only compact visibility", () => {
  for (const totalPages of [3, 4, 1000, Number.MAX_SAFE_INTEGER]) {
    for (const page of [1, 3, Math.floor(totalPages / 2), totalPages]) {
      const search = "search=oud&brandIds=1&brandIds=2&sort=oldest&limit=24";
      const html = render({ page, totalPages, search });
      assert.equal((html.match(/aria-current="page"/g) || []).length, 1);
      assert.match(html, /justify-between gap-2 flex-row-reverse sm:w-auto sm:justify-center/);
      assert.match(html, /flex-1 flex-wrap.*sm:flex-none sm:flex-nowrap/);
      assert.match(html, /aria-current="page"[^>]*class="[^"]*pages--btn shrink-0[^"]*"/);
      assert(!/aria-current="page"[^>]*class="[^"]*hidden/.test(html));
      assert(!/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<(a|button)\b/.test(html));
      for (const href of hrefs(html)) {
        const params = new URL(href, "https://jeawaz.com").searchParams;
        assert.deepEqual(params.getAll("brandIds"), ["1", "2"]);
        assert.equal(params.get("search"), "oud");
        assert.equal(params.get("sort"), "oldest");
        assert.equal(params.get("limit"), "24");
      }
      for (const link of links) assert.match(link.className, link.rel ? /size-10 shrink-0.*sm:size-5/ : /pages--btn shrink-0/);
    }
  }
  const middle = render({ page: 500, totalPages: 1000 });
  assert.equal((middle.match(/hidden min-\[375px\]:flex/g) || []).length, 2);
  const nearBoundary = render({ page: 4, totalPages: 1000 });
  assert.match(nearBoundary, /min-\[375px\]:hidden/);
});

test("large page labels remain fully accessible while their visible text is width-bounded", () => {
  const page = Number.MAX_SAFE_INTEGER;
  const html = render({ page, totalPages: page });
  assert(html.includes('aria-label="صفحه ' + toPersianNumbers(page) + '"'));
  assert.match(html, /class="max-w-full truncate px-1 text-inherit"/);
  render({ page: 500, totalPages: 1000, isLoading: true });
  for (const link of links) {
    assert.equal(link["aria-disabled"], true);
    assert.equal(link.tabIndex, -1);
    let prevented = 0;
    link.onClick({ preventDefault: () => prevented++ });
    link.onNavigate({ preventDefault: () => prevented++ });
    assert.equal(prevented, 2);
  }
});


test("one, five, ten, twenty and one hundred pages retain bounded nearby navigation", () => {
  for (const total of [1, 5, 10, 20, 100]) for (const page of new Set([1, Math.ceil(total / 2), total])) {
    const compact = productPaginationState(page, total, true);
    const desktop = productPaginationState(page, total);
    if (total === 1) { assert.equal(render({ page, totalPages: total }), ""); continue; }
    assert(compact.items.length <= 7);
    assert(desktop.items.length <= 9);
    const numbers = compact.items.filter((item) => typeof item === "number");
    for (const expected of [1, total, page, Math.max(1, page - 1), Math.min(total, page + 1)]) assert(numbers.includes(expected));
    assert(numbers.every((item) => desktop.items.includes(item)));
    assert.equal(compact.previous, page > 1 ? page - 1 : null);
    assert.equal(compact.next, page < total ? page + 1 : null);
    const html = render({ page, totalPages: total, search: "gender=female&sort=oldest" });
    assert.match(html, /<nav[^>]*><(?:a|span)[\s\S]*?<\/(?:a|span)><div class="flex min-w-0 flex-1 flex-wrap/);
    assert.match(html, /<\/div><(?:a|span)/);
    assert(!html.includes("<button"));
  }
});
