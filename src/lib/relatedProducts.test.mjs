import test from "node:test";
import assert from "node:assert/strict";
import {
  RELATED_PRODUCTS_LIMIT,
  rankRelatedProducts,
  relatedProductQueries,
  relatedScore,
} from "./relatedProducts.mjs";
import { fetchRelatedProducts } from "./relatedProducts.server.mjs";

const TYPES = {
  gender: "gender", fragranceFamilies: "fragrance_family", seasons: "season",
  temperature: "temperature", characters: "character", occasions: "occasion",
};
const cat = (key, slug, extra = {}) => ({ id: slug, type: TYPES[key], slug, title: slug, isActive: true, ...extra });
// A Product with the response shape: single gender/temperature, other taxonomies as arrays.
function product(id, { brand = null, gender, families = [], seasons = [], temperature, characters = [], occasions = [] } = {}) {
  return {
    id, perTitle: `p${id}`, brand: brand == null ? null : { id: brand },
    categories: {
      gender: gender ? cat("gender", gender) : null,
      fragranceFamilies: families.map((slug) => cat("fragranceFamilies", slug)),
      seasons: seasons.map((slug) => cat("seasons", slug)),
      temperature: temperature ? cat("temperature", temperature) : null,
      characters: characters.map((slug) => cat("characters", slug)),
      occasions: occasions.map((slug) => cat("occasions", slug)),
    },
  };
}
const current = product(1, { brand: 4, gender: "male", families: ["woody", "spicy"], seasons: ["winter"], temperature: "warm", characters: ["sweet"], occasions: ["party"] });
const ids = (list) => list.map((item) => item.id);

/* ---------- candidate queries ---------- */

test("queries: active fragrance families (OR) and the brand, sellable, bounded", () => {
  assert.deepEqual(relatedProductQueries(current), [
    { inStock: true, sort: "newest", page: 1, fragranceFamilies: ["woody", "spicy"], limit: 24 },
    { inStock: true, sort: "newest", page: 1, brandIds: [4], limit: 12 },
  ]);
});

test("queries: gender when there is no active family; nothing without taxonomy or brand", () => {
  const inactive = product(2, { gender: "women", families: ["woody"] });
  inactive.categories.fragranceFamilies[0].isActive = false;
  assert.deepEqual(relatedProductQueries(inactive), [{ inStock: true, sort: "newest", page: 1, gender: "women", limit: 24 }]);
  assert.deepEqual(relatedProductQueries(product(3)), []);
  for (const brand of [0, -1, "x", 1.5]) {
    assert.deepEqual(relatedProductQueries({ ...product(3), brand: { id: brand } }), [], String(brand));
  }
  assert.deepEqual(relatedProductQueries(null), []);
  // Wrong-type or slug-less records are not taxonomy.
  const odd = product(4);
  odd.categories.fragranceFamilies = [{ ...cat("fragranceFamilies", "woody"), type: "season" }, { ...cat("fragranceFamilies", " "), slug: " " }];
  assert.deepEqual(relatedProductQueries(odd), []);
});

/* ---------- relevance ---------- */

test("score: shared active categories and brand, with per-taxonomy caps", () => {
  assert.deepEqual(relatedScore(current, current), { score: 3 * 2 + 2 + 1 + 1 + 1 + 1 + 2, families: 2, sameBrand: true });
  const many = product(9, { families: ["a", "b", "c", "d"] });
  assert.equal(relatedScore(many, many).score, 9, "at most three families count");
  const inactive = product(5, { gender: "male", families: ["woody"] });
  inactive.categories.fragranceFamilies[0].isActive = false;
  assert.deepEqual(relatedScore(current, inactive), { score: 2, families: 0, sameBrand: false });
});

test("a shared brand alone never outweighs stronger fragrance similarity", () => {
  const sameBrandOnly = product(10, { brand: 4, gender: "male" }); // 2 + 2
  const oneFamily = product(11, { brand: 7, gender: "male", families: ["woody"] }); // 3 + 2
  const twoFamilies = product(12, { gender: "male", families: ["woody", "spicy"] }); // 6 + 2
  const brandAndFamily = product(13, { brand: 4, gender: "male", families: ["woody"] }); // 3 + 2 + 2
  assert.deepEqual(ids(rankRelatedProducts(current, [[sameBrandOnly, oneFamily, brandAndFamily, twoFamilies]])), [12, 13, 11, 10]);
});

test("unrelated or weakly related products are not used as filler", () => {
  const candidates = [
    product(20, { brand: 4, gender: "women" }), // brand only: 2
    product(21, { gender: "male", seasons: ["winter"], temperature: "warm" }), // no family/brand
    product(22, { gender: "women", families: ["woody"] }), // family only: 3
    product(23, { gender: "women", families: ["woody"], seasons: ["winter"] }), // 4
    product(24, { gender: "male", families: ["floral"] }), // different family: 2
  ];
  assert.deepEqual(ids(rankRelatedProducts(current, [candidates, [product(25, { gender: "male", families: ["spicy"] })]])), [25, 23]);
});

test("excludes the current product, duplicates and malformed rows; keeps the first occurrence", () => {
  const twin = product(30, { gender: "male", families: ["woody"] });
  const lists = [
    [product(1, { gender: "male", families: ["woody", "spicy"] }), twin, null, { id: "abc" }, { id: 0 }],
    [{ ...twin, perTitle: "duplicate" }, product(31, { brand: 4, gender: "male", families: ["woody"] }), "x"],
    "not a list",
  ];
  const result = rankRelatedProducts(current, lists);
  assert.deepEqual(ids(result), [31, 30]);
  assert.equal(result[1].perTitle, "p30");
  assert.equal(new Set(ids(result)).size, result.length);
});

test("at most eight, at least two; ties keep the API order deterministically", () => {
  const pool = Array.from({ length: 12 }, (_, i) => product(100 + i, { gender: "male", families: ["woody"] }));
  const first = rankRelatedProducts(current, [pool]);
  assert.equal(first.length, RELATED_PRODUCTS_LIMIT);
  assert.deepEqual(ids(first), ids(pool).slice(0, 8));
  assert.deepEqual(ids(rankRelatedProducts(current, [pool])), ids(first), "same inputs, same output");
  assert.deepEqual(rankRelatedProducts(current, [[pool[0]]]), [], "a single match is not a section");
  assert.deepEqual(rankRelatedProducts(current, []), []);
  // More shared families break a score tie before API order.
  const a = product(200, { gender: "male", families: ["woody"], seasons: ["winter"], characters: ["sweet"] }); // 3+2+1+1 = 7
  const b = product(201, { brand: 4, gender: "male", families: ["woody"] }); // 3+2+2 = 7
  const c = product(202, { families: ["woody", "spicy"], temperature: "warm" }); // 6+1 = 7
  assert.deepEqual(ids(rankRelatedProducts(current, [[a, b, c]])), [202, 200, 201]);
});

/* ---------- bounded reads ---------- */

function api(responses) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: new URL(url), options });
    const body = responses[calls.length - 1];
    if (body instanceof Error) throw body;
    return { ok: body !== 500, json: async () => body };
  };
  return { calls, fetchImpl };
}
const page = (rows, limit) => ({ data: rows, meta: { page: 1, limit, total: rows.length, totalPages: Math.ceil(rows.length / limit) } });

test("fetch: two anonymous public reads with the existing list contract, ranked together", async () => {
  const family = [product(40, { gender: "male", families: ["woody"] }), product(1, { gender: "male", families: ["woody"] })];
  const brand = [product(41, { brand: 4, gender: "male", families: ["spicy"] }), product(40, { gender: "male", families: ["woody"] })];
  const { calls, fetchImpl } = api([page(family, 24), page(brand, 12)]);
  const result = await fetchRelatedProducts({ apiUrl: "https://api.example.test", product: current, fetchImpl });
  assert.deepEqual(ids(result), [41, 40]);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map(({ url }) => url.pathname), ["/products", "/products"]);
  const sorted = (params) => [...params].map((pair) => pair.join("=")).sort();
  assert.deepEqual(sorted(calls[0].url.searchParams), [
    "fragranceFamilies=spicy", "fragranceFamilies=woody", "inStock=true", "limit=24", "page=1", "sort=newest",
  ]);
  assert.equal(calls[1].url.searchParams.get("brandIds"), "4");
  assert.equal(calls[1].url.searchParams.get("limit"), "12");
  for (const { options } of calls) {
    assert.equal(options.cache, "no-store");
    assert.equal(options.credentials, "omit");
  }
});

test("fetch: a failed or invalid read only drops its candidates; no reads without a basis", async (t) => {
  t.mock.method(console, "warn", () => {});
  const family = [product(40, { gender: "male", families: ["woody"] }), product(42, { gender: "male", families: ["spicy"] })];
  for (const failure of [500, new Error("network"), { data: "bad" }]) {
    const { fetchImpl } = api([page(family, 24), failure]);
    assert.deepEqual(ids(await fetchRelatedProducts({ apiUrl: "https://api.example.test", product: current, fetchImpl })), [40, 42]);
  }
  const { fetchImpl: failing } = api([500, new Error("network")]);
  assert.deepEqual(await fetchRelatedProducts({ apiUrl: "https://api.example.test", product: current, fetchImpl: failing }), []);
  const { calls, fetchImpl } = api([]);
  assert.deepEqual(await fetchRelatedProducts({ apiUrl: "https://api.example.test", product: product(3), fetchImpl }), []);
  assert.equal(calls.length, 0);
});
