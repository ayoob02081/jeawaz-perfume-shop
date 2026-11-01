import test from "node:test";
import assert from "node:assert/strict";
import { listingSeoMetadata } from "./listingSeo.mjs";
import { buildSitemap, CATEGORY_TYPES, SITE_ORIGIN } from "./seo.mjs";
import { productsQueryFromSearchParams, productListKey } from "../utils/productFilterContract.mjs";

const query = (search = "") => productsQueryFromSearchParams(new URLSearchParams(search));
const category = (type, slug = "fixture", overrides = {}) => ({ type, slug, isActive: true, ...overrides });
const categories = Object.fromEntries(Object.entries(CATEGORY_TYPES).map(([key, type]) => [key, category(type)]));
const product = { id: 105, categories };
const payload = (search = "", data = [product], total = 36) => {
  const q = query(search);
  return { data, meta: { page: q.page, limit: q.limit, total, totalPages: Math.ceil(total / q.limit) } };
};
const classify = (search = "", response = payload(search)) => listingSeoMetadata(query(search), response);
const noindex = { robots: { index: false, follow: true } };
const indexed = (path) => ({ robots: { index: true, follow: true }, alternates: { canonical: SITE_ORIGIN + path } });

for (const search of ["", "page=1", "page=01", "page=abc", "page=0", "page=-1", "page=1.5", "page=9007199254740992", "limit=12", "limit=999", "sort=newest", "sort=bogus", "inStock=false", "discounted=false", "utm_source=test&unknown=value", "campaignId=123", "searchMode=legacy&availabilityFirst=false", "page=1&limit=12&sort=newest&utm_source=x"]) {
  test(`equivalent base URL ${search || "(base)"} has the normalized canonical`, () => {
    assert.deepEqual(classify(search), indexed("/products"));
  });
}
for (const search of ["page=2", "sort=newest&page=02&limit=12&utm_source=x", "page=2&page=3"]) {
  test(`valid page ${search} is never canonicalized to page one`, () => {
    assert.deepEqual(classify(search), indexed("/products?page=2"));
  });
}
for (const [key, type] of Object.entries(CATEGORY_TYPES)) {
  for (const page of [1, 2]) {
    test(`sitemap category ${key}, page ${page}, retains its meaningful filter`, () => {
      const params = new URLSearchParams([[key, "fixture"], ["page", String(page)], ["sort", "newest"], ["limit", "12"], ["utm_source", "x"]]);
      const expected = new URLSearchParams({ [key]: "fixture" });
      if (page > 1) expected.set("page", String(page));
      assert.deepEqual(classify(params.toString()), indexed("/products?" + expected));
    });
  }
  for (const overrides of [{ isActive: false }, { isActive: undefined }, { type: "wrong" }, { slug: "other" }]) {
    test(`unapproved ${key} category ${JSON.stringify(overrides)} cannot claim a canonical landing`, () => {
      assert.deepEqual(classify(key + "=fixture", payload(key + "=fixture", [{ categories: { [key]: category(type, "fixture", overrides) } }])), noindex);
    });
  }
}
for (const search of ["search=rose", "search=rose&sort=newest", "search=rose&sort=oldest", "sort=oldest", "sort=best_selling", "sort=most_discounted", "sort=price_low_to_high", "sort=price_high_to_low", "minPrice=100", "maxPrice=900", "inStock=true", "discounted=true", "type=sealed", "type=decant", "volumes=5", "minVolume=3", "maxVolume=50", "grades=ORIGINAL", "original=false", "concentrations=EAU_DE_PARFUM", "brandIds=1&brandIds=2", "gender=fixture&characters=fixture", "seasons=fixture&seasons=other", "brandIds=1&gender=fixture", "gender=fixture&inStock=true", "limit=24", "limit=24&page=2", "search=rose&sort=oldest&gender=fixture&brandIds=1&volumes=5&page=2"]) {
  test(`excluded state ${search} stays crawlable but is not indexed or falsely canonicalized`, () => {
    assert.deepEqual(classify(search), noindex);
  });
}
for (const search of ["brandIds=20", "brandIds=023&page=2&sort=newest&utm_source=x", "brandIds=23&brandIds=23"]) {
  test(`unapproved single-brand policy remains unchanged: ${search}`, () => assert.deepEqual(classify(search), {}));
}
for (const search of ["", "page=4", "page=999", "search=missing", "brandIds=1", "gender=fixture"]) {
  test(`successful empty/out-of-range state ${search || "base"} is noindex`, () => {
    assert.deepEqual(classify(search, payload(search, [])), noindex);
    assert.deepEqual(classify(search, payload(search, [], 0)), noindex);
  });
}
test("unavailable or malformed snapshots are errors, never synthesized empty successes", () => {
  for (const value of [undefined, null, {}, { data: [] }]) assert.throws(() => listingSeoMetadata(query(), value), /successful catalog snapshot/);
});
test("Unicode category encoding, repeated-value deduplication and query/cache state are preserved", () => {
  const slug = "زنانه & خاص/روز";
  const search = new URLSearchParams([["characters", slug], ["characters", slug], ["page", "2"]]);
  const q = query(search.toString()), data = payload(search.toString(), [{ categories: { characters: [category("character", slug)] } }]);
  const before = JSON.stringify({ q, data, key: productListKey(q) });
  assert.deepEqual(listingSeoMetadata(q, data), indexed("/products?" + new URLSearchParams({ characters: slug, page: "2" })));
  assert.equal(JSON.stringify({ q, data, key: productListKey(q) }), before);
});
test("every category URL emitted by the unchanged sitemap is indexable under the same membership rule", async () => {
  const catalog = { data: [product], meta: { total: 1, page: 1, limit: 100, totalPages: 1 } };
  const entries = await buildSitemap("https://api.example.test", async () => ({ ok: true, json: async () => catalog }));
  const facets = entries.filter(({ url }) => new URL(url).search);
  assert.equal(facets.length, Object.keys(CATEGORY_TYPES).length);
  for (const { url } of facets) {
    const search = new URL(url).searchParams.toString();
    assert.deepEqual(classify(search), { robots: { index: true, follow: true }, alternates: { canonical: url } });
  }
  assert(!entries.some(({ url }) => new URL(url).searchParams.has("brandIds")));
});
