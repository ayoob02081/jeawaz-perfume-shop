import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Module, { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { headerSuggestionQuery, headerSearchSurface, productSearchNavigation } from "./headerSearch.mjs";
const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
function load(relative, mocks = {}) {
  const filename = fileURLToPath(new URL(relative, import.meta.url));
  const mod = new Module(filename); mod.filename = filename;
  mod.require = (name) => Object.hasOwn(mocks, name) ? mocks[name] : name.startsWith("@/") ? {} : require(name);
  mod._compile(transformSync(readFileSync(filename, "utf8"), { filename,
    jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } }, module: { type: "commonjs" } }).code, filename);
  return mod.exports;
}
const Search = load("../components/SearchSection.jsx", {
  react: { ...React, useId: () => "search-results", useRef: () => ({ current: false }) },
  "@/hooks/useOutsideClick": () => ({ current: null }),
}).default;
const find = (node, type) => {
  if (!node || typeof node !== "object") return null;
  if (node.type === type) return node;
  for (const child of React.Children.toArray(node.props?.children)) { const result = find(child, type); if (result) return result; }
  return null;
};
const defaults = { value: "rose", onChange: () => {}, onSubmit: () => {}, active: true,
  renderResult: (item) => React.createElement("a", { href: `/products/${item.id}` }, item.perTitle) };

test("only an active three-character fully debounced term can request suggestions", () => {
  for (const [raw, debounced, active] of [["rose", "rose", false], ["ro", "ro", true], ["ros", "ro", true], ["", "rose", true]]) {
    const query = headerSuggestionQuery(raw, debounced, active);
    assert.equal(query.search, ""); assert.equal(query.enabled, false);
  }
  assert.deepEqual(headerSuggestionQuery(" rose ", "rose", true), { search: "rose", enabled: true, waiting: false });
  assert.equal(headerSuggestionQuery("rose", "ros", true).waiting, true);
});

test("mobile overlay stops exactly at 480px; the single inline input owns 481-1023px", () => {
  for (const width of [320, 375, 390, 430, 480]) assert.equal(headerSearchSurface(width), "spotlight");
  assert.equal(headerSearchSurface(481), "tablet"); assert.equal(headerSearchSurface(639), "tablet");
  assert.equal(headerSearchSurface(1023), "tablet"); assert.equal(headerSearchSurface(640), "tablet"); assert.equal(headerSearchSurface(1024), "desktop");
});

test("focus and typing open an initially empty search without waiting for a second focus", () => {
  const activations = []; const tree = Search({ ...defaults, active: false, results: [], onActiveChange: (active) => activations.push(active) });
  find(tree, "input").props.onFocus(); find(tree, "input").props.onChange({ target: { value: "rose" } });
  assert.deepEqual(activations, [true, true]);
  const html = renderToStaticMarkup(Search({ ...defaults, results: [{ id: 105, perTitle: "Rose" }] }));
  assert.match(html, /href="\/products\/105"/); assert.doesNotMatch(html, /aria-expanded=/);
});

test("loading, empty, network error and 429 are distinct; stale data is not displayed while fetching", () => {
  const rows = [{ id: 105, perTitle: "stale" }];
  const loading = renderToStaticMarkup(Search({ ...defaults, results: rows, isFetching: true }));
  assert.match(loading, /aria-busy="true"/); assert(!loading.includes("/products/105"));
  const empty = renderToStaticMarkup(Search(defaults));
  const error = renderToStaticMarkup(Search({ ...defaults, isError: true }));
  const rateLimit = renderToStaticMarkup(Search({ ...defaults, isError: true, errorStatus: 429 }));
  assert.notEqual(empty, error); assert.notEqual(error, rateLimit);
  assert.match(rateLimit, /تعداد جستجوها زیاد است/); assert.match(error, /پیشنهادها دریافت نشد/);
});

test("search closes on Escape or focus leaving the inline surface, while overlay focus stays modal", () => {
  const events = []; let prevented = 0;
  const tree = Search({ ...defaults, onActiveChange: (open) => events.push(open) });
  find(tree, "input").props.onKeyDown({ key: "Escape", preventDefault: () => prevented++ });
  tree.props.onBlur({ currentTarget: { contains: () => false }, relatedTarget: null });
  tree.props.onBlur({ currentTarget: { contains: () => true }, relatedTarget: {} });
  assert.deepEqual(events, [false, false]); assert.equal(prevented, 1);
  const overlay = Search({ ...defaults, inline: true, onActiveChange: (open) => events.push(open) });
  overlay.props.onBlur({ currentTarget: { contains: () => false }, relatedTarget: null });
  find(overlay, "input").props.onKeyDown({ key: "Escape" });
  assert.equal(events.length, 2);
});

test("composition cannot submit a partial query; normal submit retains the existing handler", () => {
  let submissions = 0, prevented = 0;
  const tree = Search({ ...defaults, onSubmit: () => submissions++ }); const input = find(tree, "input"); const form = find(tree, "form");
  input.props.onCompositionStart(); form.props.onSubmit({ preventDefault: () => prevented++ });
  assert.equal(submissions, 0); assert.equal(prevented, 1);
  input.props.onCompositionEnd(); form.props.onSubmit({}); assert.equal(submissions, 1);
});

test("suggestion service preserves the plain array contract and forwards AbortSignal without serializing it", async () => {
  const calls = [], result = [{ id: 105, perTitle: "Rose", enTitle: null, image: null }], controller = new AbortController();
  const api = load("../services/productServices.js", { "./httpClient": { get: (url, options) => { calls.push({ url, options }); return Promise.resolve({ data: result }); } } });
  assert.deepEqual(await api.getProductSuggestionsApi({ search: "rose", limit: 5 }, { signal: controller.signal }), result);
  assert.equal(calls[0].url, "/products/search/suggestions"); assert.equal(calls[0].options.signal, controller.signal);
  assert.deepEqual(calls[0].options.params, { search: "rose", limit: 5 });
});

test("existing suggestion hook uses one keyed query and forwards its own request signal", async () => {
  let options, request;
  const hooks = load("../hooks/useProducts.js", { "@tanstack/react-query": { useQuery: (value) => { options = value; return value; } },
    "@/services/productServices": { getProductSuggestionsApi: (params, config) => { request = { params, config }; } } });
  hooks.useGetProductSuggestions({ search: " rose ", enabled: true });
  assert.deepEqual(options.queryKey, ["products", "suggestions", "rose", 5]); assert.equal(options.enabled, true);
  const controller = new AbortController(); await options.queryFn({ signal: controller.signal });
  assert.equal(request.config.signal, controller.signal); assert.deepEqual(request.params, { search: "rose", limit: 5 });
  hooks.useGetProductSuggestions({ search: "rose", enabled: false }); assert.equal(options.enabled, false);
});

test("real QueryObserver detaches and aborts older requests on typing/close, including populated caches", async () => {
  for (const cached of [false, true]) {
    const client = new QueryClient(); const key = (search) => ["products", "suggestions", search, 5];
    if (cached) client.setQueryData(key("rose"), [{ id: 1 }], { updatedAt: 1 });
    let signal, finish;
    const observer = new QueryObserver(client, { queryKey: key("rose"), retry: false, queryFn: ({ signal: ownSignal }) => {
      signal = ownSignal; return new Promise((resolve) => { finish = resolve; });
    } }); const stop = observer.subscribe(() => {});
    try {
      observer.setOptions({ queryKey: key(""), enabled: false, queryFn: () => { throw Error("disabled query fetched"); } });
      assert.equal(signal.aborted, true);
      const newer = [{ id: 2 }]; client.setQueryData(key("oud"), newer);
      observer.setOptions({ queryKey: key("oud"), enabled: true, staleTime: Infinity, queryFn: () => { throw Error("cache refetched"); } });
      finish([{ id: 99 }]); await Promise.resolve(); await Promise.resolve();
      assert.deepEqual(observer.getCurrentResult().data, newer);
      assert.deepEqual(client.getQueryData(key("rose")), cached ? [{ id: 1 }] : undefined);
    } finally { stop(); client.clear(); }
  }
});

test("restored previews preserve submitted filters, sort, page reset and URL encoding", () => {
  const { href, replace } = productSearchNavigation(" عطر & oud ", new URLSearchParams("brandIds=1&brandIds=2&sort=oldest&page=9"), "/products");
  const params = new URL(href, "https://jeawaz.com").searchParams;
  assert.deepEqual(params.getAll("brandIds"), ["1", "2"]); assert.equal(params.get("sort"), "oldest");
  assert.equal(params.get("page"), "1"); assert.equal(params.get("limit"), "12"); assert.equal(replace, true);
});


test("the mobile CSS breakpoint includes exactly 480px, matching the controller", () => {
  const header = readFileSync(new URL("../components/HeaderLayout.jsx", import.meta.url), "utf8");
  const outer = readFileSync(new URL("../app/Header.jsx", import.meta.url), "utf8");
  assert(header.includes("[@media(max-width:480px)]:hidden"));
  assert(outer.includes("max-sm:mb-22"));
  assert(!header.includes("max-[480px]") && !header.includes("max-[30rem]"));
  assert.match(header, /prefetch=\{false\}\s+onNavigate=/);
});

test("the actual shared suggestion renderer uses the card badge without inferring legacy Original", async () => {
  const grades = await import("./productGrade.mjs");
  const Image = ({ src, alt }) => React.createElement("img", { src, alt });
  const Badge = load("../components/ProductGradeBadge.jsx", {
    "@/components/AppImage": Image, "@/utils/productGrade.mjs": grades,
  }).default;
  const header = readFileSync(new URL("../components/HeaderLayout.jsx", import.meta.url), "utf8");
  // Execute the actual shared row JSX without mounting unrelated header/auth hooks.
  const start = header.indexOf("  const renderResult = ");
  const end = header.indexOf("  const searchProps = ", start);
  assert(start > 0 && end > start);
  const source = `const Link = require("link"); const AppImage = require("image");
    const ProductGradeBadge = require("badge"); const closeSearch = () => {};
    ${header.slice(start, end)} module.exports = renderResult;`;
  const mod = new Module(import.meta.filename);
  const Link = ({ children, onNavigate, prefetch, ...props }) => React.createElement("a", props, children);
  const mocks = { link: Link, image: Image, badge: Badge };
  mod.require = (name) => Object.hasOwn(mocks, name) ? mocks[name] : require(name);
  mod._compile(transformSync(source, { jsc: { parser: { syntax: "ecmascript", jsx: true },
    transform: { react: { runtime: "automatic" } } }, module: { type: "commonjs" } }).code, import.meta.filename);
  const render = (item) => renderToStaticMarkup(mod.exports({ id: 105, perTitle: "Rose", image: "/rose.jpg", ...item }, () => {}));
  const original = render({ grade: "ORIGINAL" });
  assert.match(original, /bg-original\.svg/);
  assert.match(original, /href="\/products\/105"/);
  const superMaster = render({ grade: "SUPER_MASTER" });
  assert(superMaster.includes(grades.GRADE_LABELS.SUPER_MASTER));
  assert.match(superMaster, /border-stroke-200 bg-stroke-200/);
  for (const grade of [undefined, null, "UNKNOWN"]) {
    const html = render({ grade, original: true });
    assert(!html.includes("bg-original.svg"));
    assert(!html.includes(grades.GRADE_LABELS.SUPER_MASTER));
    assert.match(html, /href="\/products\/105"/);
  }
  let dismissed = 0;
  const row = mod.exports({ id: 105, grade: "ORIGINAL" }, () => dismissed++);
  assert.equal(row.props.prefetch, false);
  row.props.onNavigate(); assert.equal(dismissed, 1);
});

test("search remains a labelled searchbox with linked result region and polite status, not an incomplete combobox", () => {
  for (const inline of [false, true]) {
    const html = renderToStaticMarkup(Search({ ...defaults, inline, results: [{ id: 105, perTitle: "Rose" }] }));
    const input = html.match(/<input[^>]*>/)[0];
    assert.match(html, /<form role="search" aria-label="جستجوی محصولات"/);
    assert.match(input, /type="search"/);
    assert.doesNotMatch(input, /aria-expanded|role="combobox"|aria-activedescendant/);
    assert.match(input, /aria-controls="search-results"/);
    assert.match(input, /aria-describedby="search-results-status"/);
    assert.match(html, /id="search-results" role="region" aria-label="پیشنهادهای جستجو"/);
    assert.match(html, /id="search-results-status" role="status" aria-live="polite"/);
    assert.match(html, /<li><a href="\/products\/105">Rose<\/a><\/li>/);
    const closed = renderToStaticMarkup(Search({ ...defaults, inline, active: false }));
    assert.doesNotMatch(closed, /aria-expanded|aria-controls|aria-describedby|role="region"/);
  }
});

test("search Escape dismissal retains the mobile dialog's ownership and existing form navigation", () => {
  let closes = 0;
  let prevented = 0;
  for (const inline of [false, true]) {
    const tree = Search({ ...defaults, inline, onActiveChange: (active) => { if (!active) closes++; } });
    find(tree, "input").props.onKeyDown({ key: "Escape", preventDefault: () => prevented++ });
  }
  assert.equal(closes, 1);
  assert.equal(prevented, 1);
});
