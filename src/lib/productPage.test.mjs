import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as seo from "./seo.mjs";
import * as jsonLd from "./productJsonLd.mjs";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const source = readFileSync(new URL("../app/(user)/products/[id]/page.jsx", import.meta.url), "utf8");
// Execute the real page and metadata functions, with only their I/O/boundaries replaced.
const { code } = transformSync(source, {
  filename: "page.jsx",
  jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } },
  module: { type: "commonjs" },
});
const missing = new Error("NEXT_HTTP_ERROR_FALLBACK;404");
const product = {
  id: 105, perTitle: "Fixture product", description: "Fixture description", grade: "ORIGINAL",
  brand: { title: "Fixture brand" }, images: ["https://images.example.test/product.jpg"],
  variants: [{ id: 1, type: "decant", volume: 5, price: 100_000, isPurchasable: true }],
};

function loadPage(get) {
  const exports = {};
  const dependencies = {
    // Request memoization and actual HTTP statuses are covered by the production-server check.
    react: { cache: (fn) => fn },
    "../_components/SingleProductPage": () => null,
    "next/navigation": { notFound: () => { throw missing; } },
    "@/services/httpServer": { get },
    "@/lib/seo.mjs": seo,
    "@/lib/productJsonLd.mjs": jsonLd,
  };
  new Function("require", "exports", "process", code)(
    (name) => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name),
    exports, { env: { NEXT_PUBLIC_API_URL: "https://api.example.test" } },
  );
  return exports;
}
const params = (id) => ({ params: Promise.resolve({ id }) });

for (const id of ["abc", "1.5", "105.0", "0x69", "1e3", "0", "000", "-1", "+1", " 105", "105 ", "9007199254740992", "9007199254740993", "9".repeat(400), "", "../105"]) {
  test(`invalid ID ${id.length > 30 ? "oversized" : JSON.stringify(id)} is not found in page and metadata without API access`, async () => {
    let calls = 0;
    const page = loadPage(async () => { calls++; throw new Error("API must not be called"); });
    assert.deepEqual(await page.generateMetadata(params(id)), { title: "محصولی یافت نشد" });
    await assert.rejects(page.default(params(id)), (error) => error === missing);
    assert.equal(calls, 0);
  });
}

for (const id of ["105", "00105"]) {
  test(`valid ID ${id} preserves API path, metadata, canonical and the default Product Offer`, async () => {
    const calls = [];
    const page = loadPage(async (...args) => { calls.push(args); return { data: product }; });
    const metadata = await page.generateMetadata(params(id));
    const element = await page.default(params(id));
    assert.deepEqual(metadata, {
      title: product.perTitle, description: product.description,
      alternates: { canonical: "https://jeawaz.com/products/105" },
    });
    assert.equal(calls.length, 2);
    for (const [url, options] of calls) {
      assert.equal(url, `/products/${id}`);
      assert.equal(options.headers["Cache-Control"], "no-store");
    }
    const scripts = element.props.children.filter((child) => child?.type === "script");
    assert.equal(scripts.length, 1);
    const schema = JSON.parse(scripts[0].props.dangerouslySetInnerHTML.__html);
    assert.equal(schema["@type"], "Product");
    assert.equal(schema.url, metadata.alternates.canonical);
    assert.equal(schema.offers.price, 1_000_000);
    assert.equal(schema.offers.availability, "https://schema.org/InStock");
  });
}

test("an API 404 remains not found for both page and metadata", async () => {
  const page = loadPage(async () => { throw { response: { status: 404 } }; });
  assert.deepEqual(await page.generateMetadata(params("999999999")), { title: "محصولی یافت نشد" });
  await assert.rejects(page.default(params("999999999")), (error) => error === missing);
});

for (const status of [400, 500, 503, undefined]) {
  test(`genuine upstream ${status ?? "network"} failure is preserved for page and metadata`, async () => {
    const failure = Object.assign(new Error("Upstream failure"), status ? { response: { status } } : {});
    const page = loadPage(async () => { throw failure; });
    await assert.rejects(page.generateMetadata(params("105")), (error) => error === failure);
    await assert.rejects(page.default(params("105")), (error) => error === failure);
  });
}
