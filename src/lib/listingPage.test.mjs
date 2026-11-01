import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as catalog from "./storefrontCatalog.mjs";
import * as filters from "../utils/productFilterContract.mjs";
import * as seo from "./listingSeo.mjs";
import * as siteSeo from "./seo.mjs";
import { fetchCatalogSnapshot } from "./storefrontCatalog.server.mjs";

const missing = new Error("NEXT_HTTP_ERROR_FALLBACK;404");
const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const { code } = transformSync(readFileSync(new URL("../app/(user)/products/page.jsx", import.meta.url), "utf8"), {
  filename: "page.jsx", module: { type: "commonjs" },
  jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } },
});
// Execute the real route. This models one request's memo store; actual React
// request scoping and request counts are additionally verified on Next production.
function route(fetchImpl) {
  const calls = [], exports = {};
  const dependencies = {
    react: { Suspense: Symbol("Suspense"), cache: (fn) => {
      const memo = new Map();
      return (key) => { if (!memo.has(key)) memo.set(key, fn(key)); return memo.get(key); };
    } },
    "./_components/ProductsLayout": () => null,
    "next/navigation": { notFound: () => { throw missing; } },
    "@/lib/storefrontCatalog.mjs": catalog,
    "@/utils/productFilterContract.mjs": filters,
    "@/lib/listingSeo.mjs": seo,
    "@/lib/seo.mjs": siteSeo,
    "@/lib/storefrontCatalog.server.mjs": { fetchCatalogSnapshot: (options) => {
      calls.push(options);
      return fetchCatalogSnapshot({ ...options, fetchImpl });
    } },
  };
  new Function("require", "exports", "process", code)(
    (name) => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name),
    exports, { env: { NEXT_PUBLIC_API_URL: "https://api.example.test" } },
  );
  return { ...exports, calls };
}
const props = (params = {}) => ({ searchParams: Promise.resolve(params) });
// The route renders [sr-only h1, Suspense > ProductsLayout].
const layoutOf = (element) => element.props.children.find((child) => child?.props?.children?.props?.initialSnapshot).props.children;
const response = (url) => {
  const q = new URL(url).searchParams, page = Number(q.get("page")), limit = Number(q.get("limit"));
  return { ok: true, json: async () => ({ data: [{ id: 105, perTitle: "Fixture", representativeVariant: { price: 100_000 } }],
    meta: { page, limit, total: 36, totalPages: Math.ceil(36 / limit) } }) };
};

test("metadata and rendering share one normalized request despite different params promises and aliases", async () => {
  const page = route(response);
  const [metadata, element] = await Promise.all([
    page.generateMetadata(props({ page: "02", sort: "newest", utm_source: "x" })),
    page.default(props({ page: "2", limit: "12" })),
  ]);
  assert.equal(page.calls.length, 1);
  assert.equal(page.calls[0].throwOnError, true);
  assert.equal(metadata.alternates.canonical, "https://jeawaz.com/products?page=2");
  const snapshot = layoutOf(element).props.initialSnapshot;
  assert.deepEqual(snapshot.query, filters.productsQueryFromSearchParams(new URLSearchParams("page=2")));
  assert.equal(snapshot.data.data[0].representativeVariant.price, 100_000);
});

test("search relevance and explicit newest remain separate requests/keys while both are noindex", async () => {
  const page = route(response);
  const relevant = await page.generateMetadata(props({ search: "rose" }));
  const newest = await page.generateMetadata(props({ search: "rose", sort: "newest" }));
  assert.equal(page.calls.length, 2);
  assert.equal(page.calls[0].query.sort, undefined);
  assert.equal(page.calls[1].query.sort, "newest");
  assert.deepEqual(relevant.robots, { index: false, follow: true });
  assert.deepEqual(newest.robots, relevant.robots);
  assert.equal(relevant.alternates, undefined);
});

test("metadata and rendering propagate upstream failure without a fabricated empty snapshot", async () => {
  const page = route(async () => ({ ok: false, status: 503 }));
  const results = await Promise.allSettled([page.generateMetadata(props()), page.default(props())]);
  assert.equal(page.calls.length, 1);
  assert(results.every(({ status, reason }) => status === "rejected" && reason.message === "Public API request failed"));
});

test("an empty first page retains the existing client snapshot and noindex metadata", async () => {
  const empty = { data: [], meta: { page: 1, limit: 12, total: 0, totalPages: 0 } };
  const page = route(async () => ({ ok: true, json: async () => empty }));
  const metadata = await page.generateMetadata(props({ page: "1" }));
  const element = await page.default(props({ page: "1" }));
  assert.deepEqual(layoutOf(element).props.initialSnapshot.data, empty);
  assert.deepEqual(metadata.robots, { index: false, follow: true });
  assert.equal(metadata.alternates, undefined);
  assert.equal(page.calls.length, 1);
});

test("approved brand metadata and rendering use one snapshot without changing filters or product data", async () => {
  const brand = { id: 22, title: "کایالی" };
  const page = route(async (url) => { const result = await response(url).json(); result.data[0].brand = brand; return { ok: true, json: async () => result }; });
  const before = { brandIds: ["022", "22"], page: "02", limit: "12", sort: "newest", utm_source: "x" };
  const [metadata, element] = await Promise.all([page.generateMetadata(props(before)), page.default(props({ brandIds: "22", page: "2" }))]);
  assert.equal(page.calls.length, 1);
  assert.deepEqual(page.calls[0].query.brandIds, [22]);
  assert.equal(metadata.title, "عطر و ادکلن کایالی");
  assert.equal(metadata.alternates.canonical, "https://jeawaz.com/products?brandIds=22&page=2");
  assert.deepEqual(metadata.robots, { index: true, follow: true });
  // The brand landing's share preview uses its own title and canonical.
  assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
  assert.equal(metadata.openGraph.title, "جیاواز پرفیوم | عطر و ادکلن کایالی");
  assert.equal(metadata.openGraph.images, undefined);
  assert.equal(layoutOf(element).props.initialSnapshot.data.data[0].brand, brand);
});

// A successful public response establishes totalPages before either route entry
// point can choose metadata or render. Synchronize callers, not timers.
const catalogWithTotal = (total) => async (url) => {
  const q = new URL(url).searchParams, page = Number(q.get("page")), limit = Number(q.get("limit"));
  const data = Array.from({ length: Math.min(limit, Math.max(0, total - (page - 1) * limit)) }, (_, i) => ({
    id: i + 105, brand: { id: 22, title: "کایالی" }, categories: { gender: { slug: "women", type: "gender", isActive: true } },
  }));
  return { ok: true, json: async () => ({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }) };
};
for (const [params, total] of [
  [{ page: "4" }, 36], [{ page: "999" }, 36],
  [{ brandIds: "22", page: "3" }, 18], [{ gender: "women", page: "3" }, 24],
  [{ brandIds: "22", gender: "women", page: "3" }, 18],
  [{ search: "filtered", page: "2" }, 6], [{ volumes: "5", page: "2" }, 6],
  [{ limit: "24", page: "3" }, 36], [{ page: "2" }, 0], [{ page: "999" }, 0],
]) {
  test("metadata and rendering both reject out-of-range pagination: " + JSON.stringify(params) + " total=" + total, async () => {
    const page = route(catalogWithTotal(total));
    const results = await Promise.allSettled([page.generateMetadata(props(params)), page.default(props({ ...params }))]);
    assert(results.every(({ status, reason }) => status === "rejected" && reason === missing));
    assert.equal(page.calls.length, 1);
    assert.equal(page.calls[0].query.page, Number(params.page));
  });
}
for (const [params, total, canonical] of [
  [{ page: "3" }, 36, "https://jeawaz.com/products?page=3"],
  [{ brandIds: "22", page: "2" }, 18, "https://jeawaz.com/products?brandIds=22&page=2"],
  [{ gender: "women", page: "2" }, 24, "https://jeawaz.com/products?gender=women&page=2"],
  [{ search: "filtered" }, 6, undefined], [{ volumes: "5" }, 6, undefined],
  [{ limit: "24", page: "2" }, 36, undefined],
]) {
  test("last valid page keeps its snapshot and SEO policy: " + JSON.stringify(params), async () => {
    const page = route(catalogWithTotal(total));
    const [metadata, element] = await Promise.all([page.generateMetadata(props(params)), page.default(props({ ...params }))]);
    assert.equal(metadata.alternates?.canonical, canonical);
    assert.deepEqual(metadata.robots, { index: Boolean(canonical), follow: true });
    assert(layoutOf(element).props.initialSnapshot.data.data.length > 0);
    assert.equal(page.calls.length, 1);
  });
}
for (const params of [{}, { page: "1" }, { page: "0" }, { page: "-1" }, { page: "abc" }, { page: "1.5" }, { page: "9007199254740992" }, { brandIds: "20" }, { search: "empty" }]) {
  test("empty first page and existing malformed-page normalization stay successful: " + JSON.stringify(params), async () => {
    const page = route(catalogWithTotal(0));
    const [metadata, element] = await Promise.all([page.generateMetadata(props(params)), page.default(props({ ...params }))]);
    assert.deepEqual(metadata.robots, { index: false, follow: true });
    assert.equal(metadata.alternates, undefined);
    assert.equal(layoutOf(element).props.initialSnapshot.query.page, 1);
    assert.equal(page.calls.length, 1);
  });
}
for (const [name, fetchImpl] of [
  ["upstream 400", async () => ({ ok: false, status: 400 })],
  ["upstream 500", async () => ({ ok: false, status: 500 })],
  ["upstream 503", async () => ({ ok: false, status: 503 })],
  ["network failure", async () => { throw new Error("offline fixture"); }],
  ["missing response", async () => ({ ok: true, json: async () => ({}) })],
  ["missing totals", async () => ({ ok: true, json: async () => ({ data: [], meta: { page: 999, limit: 12 } }) })],
  ["invalid totals", async () => ({ ok: true, json: async () => ({ data: [], meta: { page: 999, limit: 12, total: 36, totalPages: 0 } }) })],
]) {
  test(name + " is never mistaken for a nonexistent pagination page", async () => {
    const page = route(fetchImpl);
    const results = await Promise.allSettled([page.generateMetadata(props({ page: "999" })), page.default(props({ page: "999" }))]);
    assert(results.every(({ status, reason }) => status === "rejected" && reason !== missing));
    assert.equal(page.calls.length, 1);
  });
}
