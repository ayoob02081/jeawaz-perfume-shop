import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import * as brandSeo from "./brandSeo.mjs";
import { liveBrands } from "./fixtures/brands.mjs";
import { listingSeoMetadata } from "./listingSeo.mjs";
import { buildSitemap, SITE_ORIGIN, PUBLIC_PATHS } from "./seo.mjs";
import { productsQueryFromSearchParams, productListKey } from "../utils/productFilterContract.mjs";

const query = (search) => productsQueryFromSearchParams(new URLSearchParams(search));
const noindex = { robots: { index: false, follow: true } };
const approved = liveBrands.filter((brand) => brand.productsCount > 0);
const rows = (brand) => [{ id: 105, brand, stock: 0, isAvailable: false }];
const classify = (search, data, total = 36) => {
  const q = query(search);
  return listingSeoMetadata(q, { data, meta: { page: q.page, limit: q.limit, total, totalPages: Math.ceil(total / q.limit) } });
};

test("the explicit approval set includes all 21 verified populated brands, KAYALI 22 and not Creed 20", () => {
  assert.deepEqual(brandSeo.APPROVED_BRAND_IDS, approved.map(({ id }) => id));
  assert(Object.isFrozen(brandSeo.APPROVED_BRAND_IDS));
  assert.equal(liveBrands.find(({ value }) => value === "KAYALI").id, 22);
});
for (const brand of approved) {
  for (const page of [1, 2]) test(brand.value + " page " + page + " uses its real Persian name and canonical despite no stock", () => {
    const search = "brandIds=" + brand.id + "&page=" + page;
    const result = classify(search, rows(brand));
    assert.deepEqual(result.robots, { index: true, follow: true });
    assert.equal(result.alternates.canonical, SITE_ORIGIN + "/products?brandIds=" + brand.id + (page > 1 ? "&page=" + page : ""));
    assert.equal(result.title, "عطر و ادکلن " + brand.title);
    assert.equal(result.description, "مشاهده عطر و ادکلن " + brand.title + " در جیاواز پرفیوم؛ بررسی قیمت، حجم و وضعیت موجودی محصولات.");
    assert(!result.description.includes("اصل"));
  });
}
const kayali = liveBrands.find(({ id }) => id === 22);
for (const search of ["brandIds=022", "brandIds=22&brandIds=022", "brandIds=22&page=01&limit=12&sort=newest&utm_source=x", "brandIds=22&inStock=false&discounted=false"]) {
  test("brand aliases normalize without changing cache/query state: " + search, () => {
    const q = query(search), data = { data: rows(kayali), meta: { totalPages: 3 } };
    const before = JSON.stringify({ q, data, key: productListKey(q) });
    assert.equal(listingSeoMetadata(q, data).alternates.canonical, SITE_ORIGIN + "/products?brandIds=22");
    assert.equal(JSON.stringify({ q, data, key: productListKey(q) }), before);
  });
}
for (const suffix of ["search=rose", "search=rose&sort=newest", "sort=best_selling", "sort=oldest", "sort=price_low_to_high", "minPrice=1", "maxPrice=999999", "inStock=true", "discounted=true", "type=sealed", "volumes=5", "minVolume=3", "maxVolume=50", "grades=ORIGINAL", "original=false", "concentrations=EAU_DE_PARFUM", "limit=24", "brandIds=1", "gender=women", "characters=sweet"]) {
  test("Phase 1 exclusion wins over brand approval: " + suffix, () => assert.deepEqual(classify("brandIds=22&" + suffix, rows(kayali)), noindex));
}
for (const brand of [null, {}, { id: 22 }, { id: 22, title: "" }, { id: 22, title: " " }, { id: 22, title: 123 }, { id: 22, title: "KAYALI" }, { id: 20, title: "کرید" }, { id: 1, title: "امپوریو آرمانی" }, { id: "2e1", title: "کایالی" }, { id: [22], title: "کایالی" }]) {
  test("invalid or unrelated brand cannot provide listing identity: " + JSON.stringify(brand), () => assert.deepEqual(classify("brandIds=22", rows(brand)), noindex));
}
test("every row must confirm the same requested brand; mixed, missing and conflicting identities fail closed", () => {
  for (const other of [null, liveBrands[0], { ...kayali, title: "نام متفاوت" }]) {
    assert.deepEqual(classify("brandIds=22", [...rows(kayali), ...rows(other)]), noindex);
  }
});
test("empty, out-of-range and excluded Creed are never promoted; future brands retain prior policy", () => {
  assert.deepEqual(classify("brandIds=22", [], 0), noindex);
  assert.deepEqual(classify("brandIds=22&page=4", rows(kayali)), noindex);
  assert.deepEqual(classify("brandIds=20", [], 0), noindex);
  assert.deepEqual(classify("brandIds=20", rows(liveBrands.find(({ id }) => id === 20))), {});
  assert.deepEqual(classify("brandIds=23", rows({ id: 23, title: "برند آینده" })), {});
});
for (const id of ["abc", "0", "-1", "0x16", "2e1", "22.0", "9007199254740992"]) {
  test("malformed brand parameter retains base-list normalization: " + id, () => assert.equal(classify("brandIds=" + id, rows(kayali)).alternates.canonical, SITE_ORIGIN + "/products"));
}

test("sitemap reuses two catalog pages, deduplicates all 21 brands and preserves every product/static/category URL", async () => {
  const products = approved.flatMap((brand) => Array.from({ length: brand.productsCount }, () => ({ brand, stock: 0, isAvailable: false })));
  products.forEach((p, i) => Object.assign(p, { id: i + 1, updatedAt: "2026-10-01T00:00:00Z", categories: { gender: { type: "gender", isActive: true, slug: "women" } } }));
  let calls = 0;
  const entries = await buildSitemap("https://api.example.test", async (url, options) => {
    calls++; assert.equal(url.pathname, "/products"); assert.equal(options.cache, "no-store");
    const page = Number(url.searchParams.get("page"));
    return { ok: true, json: async () => ({ data: products.slice((page - 1) * 100, page * 100), meta: { page, limit: 100, total: products.length, totalPages: 2 } }) };
  });
  assert.equal(calls, 2);
  assert.equal(entries.length, PUBLIC_PATHS.length + 123 + 1 + 21);
  const brands = entries.filter(({ url }) => new URL(url).searchParams.has("brandIds"));
  assert.equal(brands.length, 21);
  assert.equal(new Set(brands.map(({ url }) => url)).size, 21);
  for (const { url } of brands) {
    const params = new URL(url).searchParams, id = Number(params.get("brandIds"));
    assert.equal(params.has("page"), false); assert.notEqual(id, 20);
    assert.equal(classify(params.toString(), products.filter((p) => p.brand.id === id)).alternates.canonical, url);
  }
});

test("sitemap omits unapproved, malformed, conflicting and nameless brands, without dropping their products", async () => {
  const brands = [kayali, { ...kayali, title: "نام متفاوت" }, { id: 20, title: "کرید" }, { id: 23, title: "برند آینده" }, { id: 1, title: "" }, null];
  const entries = await buildSitemap("https://api.example.test", async () => ({ ok: true, json: async () => ({ data: brands.map((brand, i) => ({ id: i + 1, brand })), meta: { total: brands.length, page: 1, limit: 100, totalPages: 1 } }) }));
  assert.equal(entries.length, PUBLIC_PATHS.length + brands.length);
});

const require = createRequire(import.meta.url);
const { code } = require("next/dist/build/swc").transformSync(readFileSync(new URL("../components/BrandLandingLink.jsx", import.meta.url), "utf8"), {
  filename: "BrandLandingLink.jsx", module: { type: "commonjs" }, jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } },
});
const exports = {};
new Function("require", "exports", code)((name) => name === "@/lib/brandSeo.mjs" ? brandSeo : require(name), exports);
const BrandLink = exports.default;
for (const brand of approved) test("existing logo yields a crawlable, accessible Next link for " + brand.value, () => {
  const html = renderToStaticMarkup(React.createElement(BrandLink, { brand, className: "md:hidden p-2" }, React.createElement("img", { src: "/logo.webp", alt: brand.value })));
  assert(html.includes('href="/products?brandIds=' + brand.id + '"'));
  assert(html.includes('aria-label="عطر و ادکلن ' + brand.title + '"'));
  assert(html.includes('class="md:hidden p-2 block"'));
  assert.equal((html.match(/<a /g) || []).length, 1);
  assert(!/<button|<input/.test(html));
});
test("unapproved or unnamed logos preserve their wrapper without creating a destination", () => {
  for (const brand of [null, { id: 22 }, { id: 20, title: "کرید" }, { id: 23, title: "برند آینده" }]) {
    const html = renderToStaticMarkup(React.createElement(BrandLink, { brand, className: "p-2" }, "logo"));
    assert.equal(html, '<div class="p-2">logo</div>');
  }
});
test("brand names are escaped by rendered links and remain data in metadata", () => {
  const brand = { ...kayali, title: 'کایالی <script>alert("x")</script> & خاص' };
  const html = renderToStaticMarkup(React.createElement(BrandLink, { brand, className: "p-2" }, "logo"));
  assert(!html.includes("<script>")); assert(html.includes("&lt;script&gt;"));
  assert.equal(classify("brandIds=22", rows(brand)).title, "عطر و ادکلن " + brand.title);
});
