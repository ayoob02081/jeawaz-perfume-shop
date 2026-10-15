import test from "node:test";
import assert from "node:assert/strict";
import { buildProductJsonLd, serializeProductJsonLd } from "./productJsonLd.mjs";
import { getDefaultPurchaseVolume, getPreferredPurchaseMode } from "../utils/productAvailability.mjs";
import { calculateProductPrice, getMatchingVariant, getVariantLabel } from "../utils/priceCalculator.js";

const variant = (id, type, volume, price = 125_999, isPurchasable = true) =>
  ({ id, type, volume, price, isPurchasable });
const product = (overrides = {}) => ({
  id: 7, perTitle: "عطر نمونه", description: "توضیح واقعی محصول", grade: "ORIGINAL",
  brand: { title: "برند نمونه", value: "example" }, stock: 1_000,
  images: ["/uploads/perfume.jpg", "https://cdn.example.test/perfume.webp"],
  offValue: 0, variants: [variant(71, "decant", 5), variant(72, "decant", 10), variant(73, "sealed", 100)],
  ...overrides,
});
const build = (value) => buildProductJsonLd(value, "https://api.example.test");

test("default offer matches the actual detail selection, not a 10 ml card representative or cheapest price", () => {
  const value = product({ variants: [variant(73, "sealed", 100, 10_000), variant(72, "decant", 10, 20_000), variant(71, "decant", 5)] });
  const mode = getPreferredPurchaseMode(value);
  const volume = getDefaultPurchaseVolume(value, mode);
  const selected = getMatchingVariant(value, mode, volume);
  const result = build(value);
  assert.equal(mode, "decant");
  assert.equal(volume, 5);
  assert(result.name.includes(getVariantLabel(selected)));
  assert.equal(result.size, "5 ml");
  assert.equal(result.offers.price, calculateProductPrice(value, mode, volume).finalPrice * 10);
  assert.equal(result.offers.price, 1_250_000);
  assert.equal(result.offers.name, getVariantLabel(selected));
  assert(!Array.isArray(result.offers));
  assert.equal(result.url, "https://jeawaz.com/products/7");
  assert.equal(result.offers.url, result.url);
});

test("unavailable decants select the UI's smallest purchasable sealed variant", () => {
  const result = build(product({ variants: [variant(1, "decant", 5, 10_000, false), variant(3, "sealed", 100), variant(2, "sealed", 50)] }));
  assert.equal(result.size, "50 ml");
  assert(result.name.includes("پلمپ"));
  assert.equal(result.offers.availability, "https://schema.org/InStock");
});

test("reserved smaller volumes are skipped using authoritative availability, not physical stock", () => {
  const result = build(product({ variants: [variant(1, "decant", 3, 10_000, false), variant(2, "decant", 5)] }));
  assert.equal(result.size, "5 ml");
  assert(result.offers);
});

test("campaign takes precedence over product discount and uses both existing rounding steps", () => {
  const value = product({ offValue: 50, campaign: { decant: { discountPercent: 17 } } });
  assert.equal(build(value).offers.price, 1_030_000); // 125999 ->125000 ->103750 ->103000 IRT.
  assert.equal(build(product({ offValue: 17 })).offers.price, 1_030_000);
  assert.equal(build(product({ offValue: 50, campaign: { sealed: { discountPercent: 17 } } })).offers.price, 620_000);
  const sealed = product({ variants: [variant(2, "sealed", 50)], offValue: 50, campaign: { sealed: { discountPercent: 17 } } });
  assert.equal(build(sealed).offers.price, 1_030_000);
});

test("IRR uses exact integer x10, no locale formatting or extra rounding", () => {
  const result = build(product({ variants: [variant(1, "decant", 5, 2_147_483_647)] }));
  assert.equal(result.offers.price, 21_474_830_000);
  assert.equal(result.offers.priceCurrency, "IRR");
  assert.equal(typeof result.offers.price, "number");
});

test("rejects invalid raw prices, zero discounted prices and unsafe conversions without another offer", () => {
  for (const price of [0, -1, 999, 125_999.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1, 900_719_925_475_000]) {
    assert.equal(build(product({ variants: [variant(1, "decant", 5, price)] })).offers, undefined, String(price));
  }
  assert.equal(build(product({ offValue: 100 })).offers, undefined);
  assert.equal(build(product({ variants: [variant(1, "decant", 5, 1_000)], offValue: 1 })).offers, undefined);
  assert.equal(build(product({ variants: [variant(1, "decant", 5, 900_719_925_474_000)] })).offers.price, 9_007_199_254_740_000);
});

test("only explicit boolean true may produce InStock; absent/false/string availability cannot", () => {
  for (const isPurchasable of [false, undefined, null, "true", 1]) {
    const value = product({ variants: [variant(1, "decant", 5, 125_000, isPurchasable)] });
    // The fixture's default argument is true; explicitly remove the field too.
    value.variants[0].isPurchasable = isPurchasable;
    assert.equal(build(value).offers, undefined);
  }
  assert(build(product({ stock: 0 })).offers); // Explicit backend true wins over physical stock.
});

test("does not silently switch away from a legacy-stock UI default to advertise a different authoritative offer", () => {
  const value = product({ variants: [variant(1, "decant", 5), variant(2, "decant", 10)] });
  delete value.variants[0].isPurchasable;
  assert.equal(build(value).size, "5 ml");
  assert.equal(build(value).offers, undefined);
});

test("no variants or invalid volumes retain factual identity without fabricated availability", () => {
  for (const variants of [[], null, [variant(1, "decant", 0)], [variant(1, "decant", 1.5)], [variant(1, "unknown", 5)]]) {
    const result = build(product({ variants }));
    assert.equal(result.offers, undefined);
    assert.equal(result.size, undefined);
  }
});

test("canonical numeric route and identity are required; missing optional fields are omitted", () => {
  for (const value of [null, {}, product({ id: "../admin" }), product({ id: 0 }), product({ perTitle: " " })]) assert.equal(build(value), null);
  const result = build(product({ id: "007", description: null, brand: null, images: null }));
  assert.equal(result.url, "https://jeawaz.com/products/7");
  assert.equal(result.description, undefined);
  assert.equal(result.brand, undefined);
  assert.equal(result.image, undefined);
});

test("resolves genuine image paths consistently, deduplicates and omits invalid sources", () => {
  const value = product({ images: ["/uploads/a.jpg", "/images/actual.jpg", "https://cdn.example.test/a.jpg", "https://cdn.example.test/a.jpg", "", null, "undefined", "null", "javascript:alert(1)", "data:image/png,x", "https://user:secret@example.test/a.jpg", "not-an-image-path"] });
  assert.deepEqual(build(value).image, ["https://api.example.test/uploads/a.jpg", "https://jeawaz.com/images/actual.jpg", "https://cdn.example.test/a.jpg"]);
  assert.equal(buildProductJsonLd(product({ images: ["/uploads/a.jpg"] }), undefined).image, undefined);
});

test("SUPER_MASTER preserves visible grade without an authenticity or manufacturer assertion", () => {
  const result = build(product({ grade: "SUPER_MASTER" }));
  assert(result.name.includes("سوپر مستر"));
  assert.equal(result.additionalProperty[0].value, "سوپر مستر");
  assert.equal(result.brand, undefined);
  assert.equal(result.offers.itemCondition, undefined);
  assert(build(product()).brand.name);
  assert.equal(build(product({ grade: "unknown", original: undefined })).brand, undefined);
});

test("never fabricates reviews, ratings, identifiers, validity dates, shipping or policies", () => {
  const result = build(product());
  for (const key of ["review", "aggregateRating", "sku", "gtin", "mpn", "isVariantOf", "hasVariant"]) assert.equal(result[key], undefined);
  for (const key of ["shippingDetails", "hasMerchantReturnPolicy", "priceValidUntil", "seller"]) assert.equal(result.offers[key], undefined);
  assert.equal(result["@type"], "Product");
  assert.equal(result.offers["@type"], "Offer");
});

test("script serialization escapes HTML-sensitive text and preserves exact JSON values", () => {
  const value = build(product({ perTitle: '</script><script>alert("x")</script>&\u2028\u2029', description: "<b>actual</b> & text" }));
  const serialized = serializeProductJsonLd(value);
  assert(!/[<>&\u2028\u2029]/.test(serialized));
  assert(serialized.includes("\\u003c/script\\u003e"));
  assert.deepEqual(JSON.parse(serialized), value);
});
