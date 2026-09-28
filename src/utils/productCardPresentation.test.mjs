import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  calculateProductPrice, getProductCardPresentation, getVariantLabel,
} from "./priceCalculator.js";

const decant = { id: 1, type: "decant", volume: 5, price: 500_000 };
const sealed = { id: 2, type: "sealed", volume: 100, price: 8_000_000 };
const product = (representativeVariant, campaign = { decant: null, sealed: null }, offValue = 0) => ({
  id: 7, variants: [decant, sealed], representativeVariant, campaign, offValue, stock: 200,
});
const campaign = (discountPercent) => ({ discountPercent });

test("filtered sealed representative overrides historical local decant preference", () => {
  const { representativeVariant, cardPrice } = getProductCardPresentation(product(sealed));
  assert.deepEqual(representativeVariant, sealed);
  assert.equal(representativeVariant.volume, 100);
  assert.equal(representativeVariant.type, "sealed");
  assert.deepEqual(cardPrice, { basePrice: 8_000_000, finalPrice: 8_000_000, offValue: 0 });
});

test("representative price remains authoritative even if full Variant context differs", () => {
  const representative = { ...sealed, price: 9_000_000 };
  const result = getProductCardPresentation(product(representative));
  assert.equal(result.cardPrice.basePrice, 9_000_000);
  assert.equal(result.representativeVariant.volume, 100);
});

test("unfiltered decant and sealed-only list representatives retain existing presentation", () => {
  assert.equal(getProductCardPresentation(product(decant)).cardPrice.basePrice, 500_000);
  const sealedOnly = { ...product(sealed), variants: [sealed] };
  assert.equal(getProductCardPresentation(sealedOnly).representativeVariant.volume, 100);
});

test("explicit null and absent field never fabricate a representative from full variants", () => {
  const explicit = getProductCardPresentation(product(null));
  const missing = getProductCardPresentation({ ...product(sealed), representativeVariant: undefined });
  for (const result of [explicit, missing]) {
    assert.equal(result.representativeVariant, null);
    assert.deepEqual(result.cardPrice, { basePrice: 0, finalPrice: 0, offValue: 0 });
  }
  assert.equal(getProductCardPresentation({ ...product(null), variants: [] }).representativeVariant, null);
});

test("campaign scope follows decant representative only", () => {
  const p = product(decant, { decant: campaign(20), sealed: campaign(50) }, 10);
  assert.deepEqual(getProductCardPresentation(p).cardPrice,
    { basePrice: 500_000, finalPrice: 400_000, offValue: 20 });
  const wrongScope = product(decant, { decant: null, sealed: campaign(50) }, 0);
  assert.deepEqual(getProductCardPresentation(wrongScope).cardPrice,
    { basePrice: 500_000, finalPrice: 500_000, offValue: 0 });
});

test("campaign scope follows sealed representative only", () => {
  const p = product(sealed, { decant: campaign(50), sealed: campaign(25) }, 10);
  assert.deepEqual(getProductCardPresentation(p).cardPrice,
    { basePrice: 8_000_000, finalPrice: 6_000_000, offValue: 25 });
  const wrongScope = product(sealed, { decant: campaign(50), sealed: null }, 0);
  assert.deepEqual(getProductCardPresentation(wrongScope).cardPrice,
    { basePrice: 8_000_000, finalPrice: 8_000_000, offValue: 0 });
});

test("Product discount is fallback when no campaign applies", () => {
  const p = product(sealed, { decant: campaign(80), sealed: null }, 10);
  assert.deepEqual(getProductCardPresentation(p).cardPrice,
    { basePrice: 8_000_000, finalPrice: 7_200_000, offValue: 10 });
});

test("Product detail still resolves its independently selected Variant", () => {
  const p = product(sealed, { decant: campaign(20), sealed: campaign(25) });
  assert.deepEqual(calculateProductPrice(p, "decant", 5),
    { basePrice: 500_000, finalPrice: 400_000, offValue: 20 });
  assert.deepEqual(calculateProductPrice(p, "sealed", 100),
    { basePrice: 8_000_000, finalPrice: 6_000_000, offValue: 25 });
});

test("PriceSection receives the same representative base, final price and badge inputs", () => {
  const card = readFileSync(new URL("../app/(user)/_components/ProductCard.jsx", import.meta.url), "utf8");
  assert.match(card, /\{ representativeVariant, cardPrice, cardLabel \} =\s*getProductCardPresentation\(product\)/);
  assert.match(card, /representativeVariant\.volume/);
  assert.match(card, /\{cardLabel\}/);
  assert.match(card, /basePrice=\{cardPrice\.basePrice\}/);
  assert.match(card, /unitPrice=\{cardPrice\.finalPrice\}/);
  assert.match(card, /offValue=\{cardPrice\.offValue\}/);
  assert.doesNotMatch(card, /getRepresentativeVariant|product\.variants\.sort|variants\.(find|filter)\(/);
});

test("the card brand is upper-cased null-safely and non-original shows «سوپر مستر»", () => {
  const card = readFileSync(new URL("../app/(user)/_components/ProductCard.jsx", import.meta.url), "utf8");
  assert.match(card, /\{productBrand\?\.value\?\.toUpperCase\(\)\}/);
  assert.doesNotMatch(card, /\(productBrand\?\.value\)\.toUpperCase\(\)/);
  // Same expression as the card, for a Product with and without a brand.
  const brandText = (productBrand) => productBrand?.value?.toUpperCase();
  assert.equal(brandText({ value: "dior" }), "DIOR");
  for (const missing of [null, undefined, {}, { value: null }]) {
    assert.doesNotThrow(() => brandText(missing));
    assert.equal(brandText(missing), undefined);
  }
  assert.match(card, /original === true \? \([\s\S]*?\) : \([\s\S]*?سوپر مستر/);
});

test("the card icon is a button on cards but a plain element inside the header link", () => {
  const card = readFileSync(new URL("../app/(user)/_components/ProductCard.jsx", import.meta.url), "utf8");
  const header = readFileSync(new URL("../components/HeaderLayout.jsx", import.meta.url), "utf8");
  const icon = card.slice(card.indexOf("export function CardIconResponsive"));

  assert.match(icon, /as: Wrapper = "button",/);
  assert.match(icon, /<Wrapper\s+\{\.\.\.\(Wrapper === "button" && \{ type: "button" \}\)\}/);
  assert.match(icon, /<\/Wrapper>/);
  assert.doesNotMatch(icon, /<button\b/);
  // A falsy condition must not leak a literal "false" class.
  assert.doesNotMatch(card, /\$\{![\w.]+ && "/);

  // Every header use sits inside a <Link>, so none may render a <button>.
  const uses = header.match(/<CardIconResponsive\b[^>]*\/>/g) ?? [];
  assert.ok(uses.length > 0);
  for (const use of uses) assert.match(use, /\bas="div"/);
});

test("card price and card label always describe the same backend representative Variant", () => {
  const decant10 = { id: 11, type: "decant", volume: 10, price: 1_850_000 };
  const sealed50 = { id: 12, type: "sealed", volume: 50, price: 36_000_000 };
  // Full Variants deliberately include cheaper/other rows; only representativeVariant counts.
  const withOthers = (representativeVariant) => ({
    ...product(representativeVariant), variants: [decant, sealed, decant10, sealed50],
  });
  const decantCard = getProductCardPresentation(withOthers(decant10));
  assert.equal(decantCard.cardPrice.basePrice, 1_850_000);
  assert.equal(decantCard.cardLabel, "دکانت ۱۰ میل");
  const sealedCard = getProductCardPresentation(withOthers(sealed50));
  assert.equal(sealedCard.cardPrice.basePrice, 36_000_000);
  assert.equal(sealedCard.cardLabel, "پلمپ ۵۰ میل");
  assert.equal(getProductCardPresentation(withOthers({ ...sealed, volume: 102 })).cardLabel, "پلمپ ۱۰۲ میل");
  const none = getProductCardPresentation({ ...withOthers(null) });
  assert.equal(none.representativeVariant, null);
  assert.equal(none.cardLabel, null);
});

test("variant label is compact, Persian-digit and rejects unknown types", () => {
  assert.equal(getVariantLabel({ type: "decant", volume: 5 }), "دکانت ۵ میل");
  assert.equal(getVariantLabel({ type: "sealed", volume: 100 }), "پلمپ ۱۰۰ میل");
  assert.equal(getVariantLabel({ type: "other", volume: 5 }), null);
  assert.equal(getVariantLabel(null), null);
});

test("ProductCard shows the exact representative price without the 'از' prefix", () => {
  const card = readFileSync(new URL("../app/(user)/_components/ProductCard.jsx", import.meta.url), "utf8");
  const priceSection = readFileSync(new URL("../components/PriceSection.jsx", import.meta.url), "utf8");
  // PriceSection prints "از" only for the productCard option; the card no longer passes it.
  assert.match(priceSection, /\{productCard && \(/);
  assert.doesNotMatch(card, /\bproductCard\b/);
  assert.doesNotMatch(card, />\s*از\s*</);
  // Price line first, then the one-line type/volume label.
  assert.ok(card.indexOf("<PriceSection") < card.indexOf("{cardLabel}"));
  // Call-for-price fallback is unchanged and still reachable.
  assert.match(priceSection, /if \(!hasPrice\)/);
  assert.match(priceSection, /تماس بگیرید/);
});

test("Product list keeps server price order without client-side resorting", () => {
  const layout = readFileSync(new URL("../app/(user)/products/_components/ProductsLayout.jsx",
    import.meta.url), "utf8");
  assert.match(layout, /products\.map\(\(product\) =>/);
  assert.doesNotMatch(layout, /products\.sort\(/);
  const backendOrdered = [product(decant), product(sealed)];
  assert.deepEqual(backendOrdered.map((item) => getProductCardPresentation(item).cardPrice.basePrice),
    [500_000, 8_000_000]);
  assert.deepEqual([...backendOrdered].reverse().map((item) =>
    getProductCardPresentation(item).cardPrice.basePrice), [8_000_000, 500_000]);
  const filteredBySealedVolume = [product(sealed), product({ ...sealed, id: 3, price: 9_000_000 })];
  assert.deepEqual(filteredBySealedVolume.map((item) =>
    getProductCardPresentation(item).cardPrice.basePrice), [8_000_000, 9_000_000]);
});

test("all ProductCard consumers use Product-list queries with representativeVariant", () => {
  for (const path of [
    "../app/(user)/_components/PopularProducts.jsx",
    "../app/(user)/_components/RecentProducts.jsx",
    "../app/(user)/_components/CampaignsProducts.jsx",
    "../app/(user)/products/_components/ProductsLayout.jsx",
  ]) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.match(source, /useGetAllProducts/);
    assert.match(source, /<ProductCard/);
  }
});
