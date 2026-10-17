import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as catalog from "./storefrontCatalog.mjs";
import * as filters from "../utils/productFilterContract.mjs";
import * as seo from "./listingSeo.mjs";
import { fetchCatalogSnapshot } from "./storefrontCatalog.server.mjs";

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
    "@/lib/storefrontCatalog.mjs": catalog,
    "@/utils/productFilterContract.mjs": filters,
    "@/lib/listingSeo.mjs": seo,
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
  const snapshot = element.props.children.props.initialSnapshot;
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

test("a successful empty response retains the existing client snapshot with noindex metadata", async () => {
  const empty = { data: [], meta: { page: 999, limit: 12, total: 36, totalPages: 3 } };
  const page = route(async () => ({ ok: true, json: async () => empty }));
  const metadata = await page.generateMetadata(props({ page: "999" }));
  const element = await page.default(props({ page: "999" }));
  assert.deepEqual(element.props.children.props.initialSnapshot.data, empty);
  assert.deepEqual(metadata.robots, { index: false, follow: true });
  assert.equal(metadata.alternates, undefined);
  assert.equal(page.calls.length, 1);
});
