import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as seo from "./seo.mjs";
import * as jsonLd from "./productJsonLd.mjs";
import * as productSeo from "./productSeo.mjs";

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
const { Suspense } = require("react");
// Its own reads are covered by relatedProducts tests and the production server.
function RelatedProducts() { return null; }
function SingleProductPage() { return null; }
const product = {
  id: 105, perTitle: "Fixture product", description: "Fixture description", grade: "ORIGINAL",
  brand: { title: "Fixture brand" }, images: ["https://images.example.test/product.jpg"],
  variants: [{ id: 1, type: "decant", volume: 5, price: 100_000, isPurchasable: true }],
};

function loadPage(get) {
  const exports = {};
  const dependencies = {
    // Request memoization and actual HTTP statuses are covered by the production-server check.
    react: { cache: (fn) => fn, Suspense },
    "../_components/SingleProductPage": SingleProductPage,
    "../_components/RelatedProducts": RelatedProducts,
    "next/navigation": { notFound: () => { throw missing; } },
    "@/services/httpServer": { get },
    "@/lib/seo.mjs": seo,
    "@/lib/productJsonLd.mjs": jsonLd,
    "@/lib/productSeo.mjs": productSeo,
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
      // A complete title, store name last; the root template is not applied.
      title: { absolute: "Fixture product | جیاواز پرفیوم" }, description: product.description,
      alternates: { canonical: "https://jeawaz.com/products/105" },
      // Share previews: the real name/description, canonical and JSON-LD image.
      openGraph: {
        type: "website", siteName: "جیاواز پرفیوم", locale: "fa_IR",
        title: "Fixture product | جیاواز پرفیوم", url: "https://jeawaz.com/products/105",
        description: product.description, images: [{ url: "https://images.example.test/product.jpg" }],
      },
      twitter: {
        card: "summary_large_image", title: "Fixture product | جیاواز پرفیوم",
        description: product.description, images: ["https://images.example.test/product.jpg"],
      },
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
    // Related products: after the product content, inside their own Suspense
    // boundary (no fallback), given the same Product snapshot.
    const children = element.props.children.filter(Boolean);
    const boundary = children.at(-1);
    assert.equal(boundary.type, Suspense);
    assert.equal(boundary.props.fallback, null);
    assert.equal(boundary.props.children.type, RelatedProducts);
    assert.equal(boundary.props.children.props.product, product);
    assert.equal(children.at(-2).type, SingleProductPage);
  });
}

for (const [name, overrides, title] of [
  ["complete attributes", { perTitle: "دیور ساواج", enTitle: "Dior Sauvage", concentration: "EAU_DE_PARFUM" },
    "دیور ساواج ادو پرفیوم (Dior Sauvage) | جیاواز پرفیوم"],
  ["SUPER_MASTER grade", { perTitle: "دیور ساواج", enTitle: "Dior Sauvage", concentration: "EAU_DE_PARFUM", grade: "SUPER_MASTER" },
    "دیور ساواج ادو پرفیوم سوپر مستر (Dior Sauvage) | جیاواز پرفیوم"],
  ["partial attributes", { perTitle: "دیور ساواج", enTitle: null, concentration: null, description: undefined },
    "دیور ساواج | جیاواز پرفیوم"],
]) {
  test(`product metadata with ${name}: one title for the document and share previews`, async () => {
    const value = { ...product, ...overrides };
    const metadata = await loadPage(async () => ({ data: value })).generateMetadata(params("105"));
    assert.deepEqual(metadata.title, { absolute: title });
    assert.equal(metadata.openGraph.title, title);
    assert.equal(metadata.twitter.title, title);
    assert.equal(metadata.description, value.description);
    assert.equal(metadata.openGraph.description, value.description);
    assert.equal(metadata.alternates.canonical, "https://jeawaz.com/products/105");
    assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
  });
}

test("product metadata without any name keeps the previous fallback title", async () => {
  const value = { ...product, perTitle: "", enTitle: "" };
  const metadata = await loadPage(async () => ({ data: value })).generateMetadata(params("105"));
  assert.equal(metadata.title, "");
  assert.equal(metadata.openGraph.title, "جیاواز پرفیوم");
});

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
