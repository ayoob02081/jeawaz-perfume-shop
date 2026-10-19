// Opt-in rendered-HTML regression for SEO F1–F7: start an isolated `next start`
// built against a synthetic loopback API (with `/__test/identity` answering
// `synthetic: true`), then set SEO_HTTP_ORIGIN and SEO_HTTP_API. Never a live
// site. SEO_HTTP_PRODUCT_ID (default 41) must be a product in that fixture.
import test from "node:test";
import assert from "node:assert/strict";

const origin = process.env.SEO_HTTP_ORIGIN;
const api = process.env.SEO_HTTP_API;
const productId = process.env.SEO_HTTP_PRODUCT_ID || "41";
const SITE = "https://jeawaz.com";
const BOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'");
const all = (html, re) => [...html.matchAll(re)].map((m) => decode(m[1]));
async function page(path) {
  const res = await fetch(origin + path, { headers: { "user-agent": BOT }, redirect: "manual" });
  const html = await res.text();
  return {
    status: res.status,
    canonicals: all(html, /<link rel="canonical" href="([^"]+)"/g),
    robots: all(html, /<meta name="robots" content="([^"]+)"/g),
    ogUrls: all(html, /<meta property="og:url" content="([^"]+)"/g),
    ogImages: all(html, /<meta property="og:image" content="([^"]+)"/g),
    ogTitles: all(html, /<meta property="og:title" content="([^"]+)"/g),
    twitterCards: all(html, /<meta name="twitter:card" content="([^"]+)"/g),
    h1: all(html, /<h1[^>]*>([\s\S]*?)<\/h1>/g),
    jsonLd: (html.match(/<script type="application\/ld\+json"/g) ?? []).length,
  };
}
// Next renders the root URL without its trailing slash.
const url = (path) => path === "/" ? SITE : SITE + path;

test("rendered SEO metadata, robots and status codes", { skip: !(origin && api), timeout: 120000 }, async (t) => {
  for (const address of [origin, api]) {
    assert(["127.0.0.1", "localhost"].includes(new URL(address).hostname), "Synthetic loopback targets only");
  }
  assert.equal((await (await fetch(api + "/__test/identity")).json()).synthetic, true);

  await t.test("public pages: one self-canonical equal to og:url, indexable, one h1", async () => {
    for (const path of ["/", "/page/about-us", "/page/contact-us", "/page/terms"]) {
      const p = await page(path);
      assert.equal(p.status, 200, path);
      assert.deepEqual(p.canonicals, [url(path)], path);
      assert.deepEqual(p.ogUrls, p.canonicals, path);
      assert.deepEqual(p.robots, [], path);
      assert.equal(p.h1.length, 1, path);
      assert.deepEqual(p.ogImages, [], "no invented image " + path);
      assert.deepEqual(p.twitterCards, ["summary"], path);
    }
  });

  await t.test("listing: indexable pages self-canonical with preview; variants noindex without one", async () => {
    for (const path of ["/products", "/products?page=2"]) {
      const p = await page(path);
      assert.equal(p.status, 200, path);
      assert.deepEqual(p.canonicals, [SITE + path], path);
      assert.deepEqual(p.ogUrls, p.canonicals, path);
      assert.deepEqual(p.robots, ["index, follow"], path);
      assert.deepEqual(p.h1, ["محصولات"], path);
    }
    for (const path of ["/products?search=x", "/products?sort=oldest", "/products?limit=24", "/products?page=2&utm_source=x&search=Product"]) {
      const p = await page(path);
      assert.equal(p.status, 200, path);
      assert.deepEqual(p.canonicals, [], path);
      assert.deepEqual(p.ogUrls, [], path);
      assert.deepEqual(p.robots, ["noindex, follow"], path);
    }
    assert.equal((await page("/products?page=999")).status, 404);
  });

  await t.test("product: one canonical, og:url, h1 and Product JSON-LD", async () => {
    const p = await page(`/products/${productId}`);
    assert.equal(p.status, 200);
    assert.deepEqual(p.canonicals, [`${SITE}/products/${productId}`]);
    assert.deepEqual(p.ogUrls, p.canonicals);
    assert.equal(p.h1.length, 1);
    assert.equal(p.jsonLd, 1);
    assert.ok(p.ogImages.length <= 1);
    assert.deepEqual(p.twitterCards, [p.ogImages.length ? "summary_large_image" : "summary"]);
    for (const path of ["/products/abc", "/products/0", "/products/999999999"]) {
      const missing = await page(path);
      assert.equal(missing.status, 404, path);
      assert.deepEqual(missing.canonicals, [], path);
      assert.deepEqual(missing.ogUrls, [], path);
      assert.equal(missing.jsonLd, 0, path);
    }
  });

  await t.test("utility, private and payment pages: noindex, no canonical or preview", async () => {
    for (const [path, robots] of [
      ["/cart", "noindex, follow"], ["/auth/login", "noindex, follow"],
      ["/admin/products", "noindex, nofollow"], ["/profile/orders", "noindex, nofollow"],
      ["/payment/result", "noindex, nofollow"],
    ]) {
      const p = await page(path);
      // The fixture signs every request in; a guest would be redirected by proxy.js.
      assert.equal(p.status, 200, path);
      assert.deepEqual(p.robots, [robots], path);
      assert.deepEqual(p.canonicals, [], path);
      assert.deepEqual(p.ogUrls, [], path);
    }
  });

  await t.test("robots.txt lets crawlers reach the cart/login noindex; sitemap stays public", async () => {
    const robots = await (await fetch(origin + "/robots.txt")).text();
    assert.match(robots, /^Allow: \/$/m);
    assert.deepEqual(robots.match(/^Disallow: .*$/gm), ["Disallow: /admin", "Disallow: /profile", "Disallow: /payment"]);
    assert.match(robots, /^Sitemap: https:\/\/jeawaz\.com\/sitemap\.xml$/m);
    const sitemap = await (await fetch(origin + "/sitemap.xml")).text();
    const locs = all(sitemap, /<loc>([^<]+)<\/loc>/g);
    assert.ok(locs.includes(SITE) || locs.includes(SITE + "/"));
    assert.ok(locs.includes(`${SITE}/products/${productId}`));
    assert.ok(!locs.some((loc) => /\/(cart|auth|admin|profile|payment)(\/|$)/.test(new URL(loc).pathname)));
  });
});
