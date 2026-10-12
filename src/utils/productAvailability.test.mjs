import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getMatchingVariant, getProductCardPresentation } from "./priceCalculator.js";
import {
  getDefaultPurchaseVolume,
  getPreferredPurchaseMode,
  isProductAvailable,
  isStaleAvailabilityRejection,
  isVariantPurchasable,
  resolveSelectedVolume,
} from "./productAvailability.mjs";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const card = () => source("../app/(user)/_components/ProductCard.jsx");
const page = () => source("../app/(user)/products/_components/SingleProductPage.jsx");

const v = (id, type, volume, isPurchasable, price = 1_000_000) =>
  ({ id, type, volume, price, ...(isPurchasable === undefined ? {} : { isPurchasable }) });
const detail = (variants, stock = 1_000) => ({ id: 7, stock, variants });

// Product Detail as the page drives it: the initial mode and volume, then the
// customer's actions, through the same helpers and the same rules.
function detailPage(product) {
  const state = { product, mode: getPreferredPurchaseMode(product) };
  state.volume = getDefaultPurchaseVolume(product, state.mode); // useState(initialVolume)
  const selected = () => getMatchingVariant(state.product, state.mode, state.volume);
  return {
    state,
    selected,
    canPurchase: () => isVariantPurchasable(state.product, selected()),
    pickVolume(volume) { state.volume = volume; },
    pickMode(mode) { state.mode = mode; state.volume = getDefaultPurchaseVolume(state.product, mode); },
    // router.refresh(): new Product data, same component state, then the effect.
    refresh(next) {
      state.product = next;
      state.volume = resolveSelectedVolume(next, state.mode, state.volume);
    },
  };
}

test("card: an explicit isAvailable wins over physical stock, both ways", () => {
  const representative = v(1, "decant", 10);
  assert.equal(isProductAvailable({ isAvailable: true, stock: 0 }, representative), true);
  assert.equal(isProductAvailable({ isAvailable: false, stock: 10_000 }, representative), false);
  // false never falls through to the stock rule, even with no representative.
  assert.equal(isProductAvailable({ isAvailable: false, stock: 10_000 }, null), false);
});

test("card: without isAvailable (older backend) the previous stock rule applies", () => {
  const representative = v(1, "decant", 10);
  assert.equal(isProductAvailable({ stock: 10 }, representative), true);
  assert.equal(isProductAvailable({ stock: 9 }, representative), false);
  assert.equal(isProductAvailable({ stock: 500 }, null), false);
  // Only a real boolean counts as the backend's answer.
  for (const isAvailable of [null, "false", 0, 1]) {
    assert.equal(isProductAvailable({ isAvailable, stock: 10 }, representative), true);
    assert.equal(isProductAvailable({ isAvailable, stock: 9 }, representative), false);
  }
});

test("card: availability, price and label use the same backend representative", () => {
  const representative = v(2, "sealed", 100, undefined, 8_000_000);
  const product = { stock: 2, isAvailable: false, representativeVariant: representative,
    variants: [v(1, "decant", 5), representative], campaign: { decant: null, sealed: null } };
  const { representativeVariant, cardPrice, cardLabel } = getProductCardPresentation(product);
  assert.equal(isProductAvailable(product, representativeVariant), false);
  assert.equal(cardPrice.basePrice, 8_000_000); // pricing is untouched by availability
  assert.equal(cardLabel, "پلمپ ۱۰۰ میل");
  assert.match(card(), /const inStock = isProductAvailable\(product, representativeVariant\);/);
  assert.match(card(), /\{representativeVariant && inStock && \(/);
  assert.match(card(), /\{inStock \? \(/);
  assert.match(card(), /ناموجود!/);
  assert.doesNotMatch(card(), /Number\(stock\)|\bstock,/);
});

test("detail: an explicit isPurchasable wins over physical stock, both ways", () => {
  assert.equal(isVariantPurchasable({ stock: 10_000 }, v(1, "decant", 10, false)), false);
  assert.equal(isVariantPurchasable({ stock: 0 }, v(1, "decant", 10, true)), true);
});

test("detail: without isPurchasable (older backend) the previous stock rule applies", () => {
  assert.equal(isVariantPurchasable({ stock: 7 }, v(1, "decant", 5)), true);
  assert.equal(isVariantPurchasable({ stock: 7 }, v(2, "decant", 10)), false);
  assert.equal(isVariantPurchasable({ stock: 7 }, null), false);
  assert.equal(isVariantPurchasable({ stock: 7 }, v(3, "decant", 5, null)), true);
});

test("default: a purchasable decant is chosen, at its smallest purchasable volume", () => {
  const page = detailPage(detail([v(1, "sealed", 50, true), v(2, "decant", 10, true), v(3, "decant", 5, true)]));
  assert.deepEqual([page.state.mode, page.state.volume], ["decant", 5]);
  assert.equal(page.canPurchase(), true);
});

test("default: every decant unavailable but a sealed one available selects sealed", () => {
  const page = detailPage(detail([
    v(1, "decant", 5, false), v(2, "decant", 10, false), v(3, "sealed", 50, false), v(4, "sealed", 100, true),
  ]));
  assert.deepEqual([page.state.mode, page.state.volume], ["sealed", 100]);
  assert.equal(page.canPurchase(), true);
});

test("default: of several decants only the purchasable one is selected", () => {
  const page = detailPage(detail([v(1, "decant", 3, false), v(2, "decant", 5, false), v(3, "decant", 10, true)]));
  assert.deepEqual([page.state.mode, page.state.volume], ["decant", 10]);
});

test("default: nothing purchasable keeps a display selection and cannot be bought", () => {
  const page = detailPage(detail([v(1, "sealed", 50, false), v(2, "decant", 10, false), v(3, "decant", 5, false)]));
  assert.deepEqual([page.state.mode, page.state.volume], ["decant", 5]);
  assert.equal(page.canPurchase(), false);
});

test("default with an older backend: the stock rule picks the volume, smallest when all fit", () => {
  assert.deepEqual(
    (({ state }) => [state.mode, state.volume])(detailPage(detail([v(1, "decant", 10), v(2, "decant", 5)], 1_000))),
    ["decant", 5],
  );
  const short = detailPage(detail([v(1, "decant", 10), v(2, "sealed", 50), v(3, "decant", 30)], 20));
  assert.deepEqual([short.state.mode, short.state.volume], ["decant", 10]);
});

test("switching purchase modes picks an available volume of the new mode when there is one", () => {
  const page = detailPage(detail([
    v(1, "decant", 5, true), v(2, "sealed", 50, false), v(3, "sealed", 100, true), v(4, "sealed", 200, false),
  ]));
  page.pickMode("sealed");
  assert.deepEqual([page.state.mode, page.state.volume, page.canPurchase()], ["sealed", 100, true]);
  page.pickMode("decant");
  assert.deepEqual([page.state.volume, page.canPurchase()], [5, true]);
  const none = detailPage(detail([v(1, "decant", 5, true), v(2, "sealed", 50, false), v(3, "sealed", 100, false)]));
  none.pickMode("sealed");
  assert.deepEqual([none.state.volume, none.canPurchase()], [50, false]); // shown, not buyable
});

test("a valid manual selection survives refreshed availability", () => {
  const before = detail([v(1, "decant", 5, true), v(2, "decant", 10, true), v(3, "decant", 30, true)]);
  const page = detailPage(before);
  page.pickVolume(30);
  // 5 ml sold out: the first purchasable volume moves, the customer's choice stays.
  page.refresh(detail([v(1, "decant", 5, false), v(2, "decant", 10, true), v(3, "decant", 30, true)]));
  assert.deepEqual([page.state.volume, page.canPurchase()], [30, true]);
  // The chosen volume itself sold out: it stays selected, shown as unavailable.
  page.refresh(detail([v(1, "decant", 5, false), v(2, "decant", 10, true), v(3, "decant", 30, false)]));
  assert.deepEqual([page.state.volume, page.canPurchase()], [30, false]);
  // A volume the mode no longer offers falls back to its default.
  page.refresh(detail([v(1, "decant", 5, false), v(2, "decant", 10, true)]));
  assert.deepEqual([page.state.volume, page.canPurchase()], [10, true]);
});

test("empty, missing or invalid Variants are handled without a selection", () => {
  for (const product of [{}, { variants: [] }, { variants: null }, null, undefined]) {
    assert.equal(getPreferredPurchaseMode(product), null);
    assert.equal(getDefaultPurchaseVolume(product, null), 0);
    assert.equal(resolveSelectedVolume(product, null, 0), 0);
  }
  // Rows the page never offers (no price, no volume) cannot make a mode preferable.
  const invalid = detail([v(1, "decant", 5, true, 0), v(2, "decant", 0, true), v(3, "sealed", 50, false)]);
  assert.equal(getPreferredPurchaseMode(invalid), "sealed");
  const page = detailPage(detail([]));
  assert.deepEqual([page.state.mode, page.state.volume, page.canPurchase()], [null, 0, false]);
});

test("only the Cart's stale stock, price or Variant rejection marks availability stale", () => {
  // The backend's error body (HttpExceptionFilter).
  const rejection = (status, message) => ({
    response: { status, data: { success: false, statusCode: status, message, error: "Bad Request" } },
  });
  for (const message of [
    "موجودی کافی نیست",
    "قیمت گونه decant/10 برای محصول 7 قابل فروش نیست",
    "گونه decant/10 برای محصول 7 یافت نشد",
  ]) {
    assert.equal(isStaleAvailabilityRejection(rejection(400, message)), true, message);
  }
  // A ValidationPipe failure (a list of messages) is a request problem, not
  // stale Product data: no refresh.
  assert.equal(isStaleAvailabilityRejection(rejection(400, ["quantity must be a positive number"])), false);
  assert.equal(isStaleAvailabilityRejection(rejection(400, "")), false);
  assert.equal(isStaleAvailabilityRejection({ response: { status: 400 } }), false);
  for (const error of [rejection(404, "Not Found"), rejection(401, "Unauthorized"),
    rejection(500, "Internal server error"), { message: "Network Error" }, undefined, null]) {
    assert.equal(isStaleAvailabilityRejection(error), false);
  }
});

test("Product Detail wires every purchase control to the same availability", () => {
  const detailPage = page();
  assert.match(detailPage, /const preferredMode = getPreferredPurchaseMode\(product\);/);
  assert.match(detailPage, /const defaultVolume = getDefaultPurchaseVolume\(product, activeMode\);/);
  assert.match(detailPage, /const \[initialVolume\] = useState\(defaultVolume\);/);
  assert.match(detailPage, /useQuantityHandler\(product, initialVolume, activeMode, undefined, \{/);
  assert.match(detailPage, /const canPurchase = isVariantPurchasable\(product, selectedVariant\);/);
  assert.match(detailPage, /const isDisabled = !isVariantPurchasable\(product, variant\);/);
  assert.match(detailPage, /setSelectedVolume\(getDefaultPurchaseVolume\(product, type\)\);/);
  assert.match(detailPage,
    /const volume = resolveSelectedVolume\(product, activeMode, selectedVolume\);\s*if \(volume !== Number\(selectedVolume\)\) setSelectedVolume\(volume\);/);
  // Price and Add to Cart only for a purchasable selection; the messages are kept.
  assert.match(detailPage, /\{canPurchase \? \(\s*<PriceSection/);
  assert.match(detailPage, /\{selectedVariant \? "ناموجود!" : "گزینه‌ای برای خرید موجود نیست"\}/);
  assert.match(detailPage, /\{canPurchase && \(\s*<button\s+ref=\{addButtonRef\}/);
  // "+" on an existing line follows the same answer; "-" is always available.
  assert.match(detailPage, /<CardEvents[\s\S]*?addDisabled=\{!canPurchase\}/);
  assert.doesNotMatch(detailPage, /product\.stock|Number\(product\?\.stock\)/);
});

test("CardEvents disables only '+', and only when asked", () => {
  const events = source("../components/CardEvents.jsx");
  assert.match(events, /addDisabled = false,/);
  assert.match(events, /onClick=\{AddToCartHandler\}\s*disabled=\{addDisabled\}/);
  assert.equal(events.match(/disabled=/g)?.length, 1);
  assert.match(events, /onClick=\{RemoveFromCartHandler\}\s*className=/);
});

test("a rejected cart change rolls back, stays visible, and refreshes only Product Detail", () => {
  const detailPage = page();
  // One refresh, only from a rejected request of the customer: never on render or in an effect.
  assert.equal(detailPage.match(/router\.refresh\(\)/g)?.length, 1);
  assert.match(detailPage,
    /onRejected: \(error\) => \{\s*if \(isStaleAvailabilityRejection\(error\)\) router\.refresh\(\);\s*\},/);
  const handler = source("../hooks/useQuantityHandler.js");
  assert.match(handler, /\{ onAdded, onRejected \} = \{\},/);
  assert.equal(handler.match(/onRejected\?\.\(error\)/g)?.length, 1);
  // The rejection stays visible: useCart still toasts every API error.
  const cartHook = source("../hooks/useCart.js");
  assert.equal(cartHook.match(/onError: \(error\) => showApiError\(error\)/g)?.length, 5);
  assert.doesNotMatch(cartHook, /router\.|onRejected/);
});
