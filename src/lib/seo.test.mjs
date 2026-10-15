import test from "node:test";
import assert from "node:assert/strict";
import { buildSitemap, productUrl, robotsMetadata, PUBLIC_PATHS, SITE_ORIGIN } from "./seo.mjs";

function fixture(count = 1, transform = (value) => value) {
  const calls = [];
  const products = Array.from({ length: count }, (_, index) => ({
    id: index + 1, stock: 0, updatedAt: "2026-10-01T12:00:00.000Z",
    categories: {
      gender: { type: "gender", slug: "زنانه & مردانه", isActive: true, updatedAt: "2026-09-20T00:00:00Z" },
      fragranceFamilies: [{ type: "fragrance_family", slug: "floral", isActive: true }],
      seasons: [{ type: "season", slug: "hidden", isActive: false }],
    },
  }));
  return {
    calls, products,
    fetch: async (url, options) => {
      calls.push({ url: new URL(url), options });
      const page = Number(url.searchParams.get("page"));
      return { ok: true, json: async () => transform({ data: products.slice((page - 1) * 100, page * 100),
        meta: { total: count, page, limit: 100, totalPages: Math.ceil(count / 100) } }) };
    },
  };
}

test("all public product pages are paginated, including out-of-stock products", async () => {
  const api = fixture(205);
  const result = await buildSitemap("http://127.0.0.1:3321", api.fetch);
  assert.equal(api.calls.length, 3);
  assert.equal(result.filter(({ url }) => /\/products\/\d+$/.test(url)).length, 205);
  assert(result.some(({ url }) => url === `${SITE_ORIGIN}/products/205`));
  assert.equal(result.length, PUBLIC_PATHS.length + 205 + 2);
  for (const { url, options } of api.calls) {
    assert.equal(url.pathname, "/products");
    assert.equal(url.searchParams.get("sort"), "oldest");
    assert.equal(url.searchParams.get("availabilityFirst"), "false");
    assert.equal(url.searchParams.get("limit"), "100");
    assert.equal(url.searchParams.has("published"), false);
    assert.equal(options.headers.Cookie, undefined);
    assert.equal(options.cache, "no-store");
    assert(options.signal instanceof AbortSignal);
  }
});

test("only real static paths, public product IDs and active populated category filters appear", async () => {
  const api = fixture();
  const result = await buildSitemap("https://api.example.test/base/", api.fetch);
  assert.equal(api.calls[0].url.pathname, "/base/products");
  assert.deepEqual(result.slice(0, PUBLIC_PATHS.length).map(({ url }) => new URL(url).pathname), PUBLIC_PATHS);
  const categories = result.filter(({ url }) => new URL(url).search);
  assert.equal(categories.length, 2);
  assert.equal(new URL(categories[0].url).pathname, "/products");
  assert(categories.some(({ url }) => new URL(url).searchParams.get("gender") === "زنانه & مردانه"));
  assert(result.every(({ url }) => new URL(url).origin === SITE_ORIGIN));
  assert(!result.some(({ url }) => /hidden|\/categories\/|\/auth|\/profile|\/admin|\/cart|\/payment/.test(url)));
});

test("sitemap timestamps come from valid API fields, not generation time", async () => {
  const api = fixture(2);
  api.products[0].updatedAt = "invalid";
  api.products[0].createdAt = "2026-08-01T00:00:00Z";
  api.products[1].updatedAt = null;
  const result = await buildSitemap("https://api.example.test", api.fetch);
  assert.equal(result.find(({ url }) => url === productUrl(1)).lastModified, "2026-08-01T00:00:00.000Z");
  assert.equal(result.find(({ url }) => url === productUrl(2)).lastModified, undefined);
  assert.equal(result[0].lastModified, undefined);
  assert.equal(result.find(({ url }) => new URL(url).searchParams.has("gender")).lastModified, "2026-09-20T00:00:00.000Z");
});

test("a real empty public catalog returns static pages only", async () => {
  assert.equal((await buildSitemap("https://api.example.test", fixture(0).fetch)).length, PUBLIC_PATHS.length);
});

test("upstream failure never becomes a cached static-only success", async () => {
  await assert.rejects(buildSitemap("https://api.example.test", async () => ({ ok: false, status: 503 })), /503/);
  await assert.rejects(buildSitemap("https://api.example.test", async () => { throw new Error("offline"); }), /offline/);
});

test("malformed or incomplete pagination fails rather than silently dropping pages", async () => {
  for (const transform of [
    (p) => ({ ...p, meta: { ...p.meta, totalPages: 999 } }),
    (p) => ({ ...p, data: [] }),
    (p) => ({ ...p, meta: { ...p.meta, limit: 12 } }),
  ]) await assert.rejects(buildSitemap("https://api.example.test", fixture(101, transform).fetch), /pagination/);
});

test("catalog changes or repeated IDs across pages fail generation for retry", async () => {
  const changing = fixture(101, (p) => p.meta.page === 2 ? { ...p, meta: { ...p.meta, total: 102 }, data: [...p.data, { id: 102 }] } : p);
  await assert.rejects(buildSitemap("https://api.example.test", changing.fetch), /changed/);
  const duplicate = fixture(101);
  duplicate.products[100].id = 1;
  await assert.rejects(buildSitemap("https://api.example.test", duplicate.fetch), /repeated/);
});

test("large catalogs stop explicitly instead of emitting an invalid oversized sitemap", async () => {
  const api = fixture(1, (p) => ({ ...p, data: Array.from({ length: 100 }, (_, i) => ({ id: i + 1 })),
    meta: { total: 50_000, totalPages: 500, limit: 100, page: 1 } }));
  await assert.rejects(buildSitemap("https://api.example.test", api.fetch), /split sitemaps/);
});

test("invalid product IDs cannot inject nonexistent or external product URLs", () => {
  for (const value of [0, -1, 1.5, "missing", "../admin", "https://evil.test", Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => productUrl(value), /Invalid public product ID/);
  }
  assert.equal(productUrl("007"), `${SITE_ORIGIN}/products/7`);
});

test("invalid API URL configuration is rejected without forwarding credentials", async () => {
  for (const api of [undefined, "relative", "file:///secret", "https://user:secret@api.test", "https://api.test?secret=x"]) {
    await assert.rejects(buildSitemap(api, async () => { throw new Error("Must not fetch"); }));
  }
});

test("robots allows public rendering and points to the exact production sitemap", () => {
  const robots = robotsMetadata();
  assert.equal(robots.sitemap, "https://jeawaz.com/sitemap.xml");
  assert.equal(robots.rules.allow, "/");
  assert.deepEqual(robots.rules.disallow, ["/admin", "/profile", "/auth", "/cart", "/payment"]);
  assert(!robots.rules.disallow.includes("/_next"));
});
