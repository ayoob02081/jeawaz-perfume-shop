// Cart change detection around an in-place login (checkout/auth Phase 2B):
// the backend merge can add the account's lines, merge duplicates, clamp or
// skip guest lines and reprice, so the cart before and after a login is
// compared on what the shopper pays for, never on object identity.

import assert from "node:assert/strict";
import test from "node:test";
import { cartSnapshot, cartSnapshotsDiffer } from "./cartSnapshot.mjs";

const line = (productId, quantity, { mode = "sealed", volume = 100, unitPrice = 100_000 } = {}) => ({
  id: productId * 10 + quantity,
  product: { id: productId, enTitle: `p${productId}`, variants: [] },
  mode,
  volume,
  quantity,
  unitPrice,
  basePrice: unitPrice,
  lineTotal: unitPrice * quantity,
});

const cart = (items, overrides = {}) => {
  const itemsTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  return {
    id: 1,
    currency: "IRT",
    items,
    itemsTotal,
    shippingMethod: "tipax",
    shippingCost: 0,
    payableTotal: itemsTotal,
    totalProducts: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPriceBeforeDiscount: itemsTotal,
    discountAmount: 0,
    coupon: null,
    ...overrides,
  };
};

const differ = (before, after) =>
  cartSnapshotsDiffer(cartSnapshot(before), cartSnapshot(after));

test("the same cart is unchanged", () => {
  assert.equal(differ(cart([line(1, 2), line(2, 1)]), cart([line(1, 2), line(2, 1)])), false);
});

test("the same lines in another order, with other ids and metadata, are unchanged", () => {
  const before = cart([line(1, 2), line(2, 1)]);
  const after = cart(
    [
      { ...line(2, 1), id: 900, product: { id: 2, enTitle: "renamed" } },
      { ...line(1, 2), id: 901 },
    ],
    { id: 77, guestId: "x" },
  );
  assert.equal(differ(before, after), false);
});

test("a clamped guest quantity is a change", () => {
  assert.equal(differ(cart([line(1, 2)]), cart([line(1, 1)])), true);
});

test("an account line added by the merge is a change", () => {
  assert.equal(differ(cart([line(1, 2)]), cart([line(1, 2), line(3, 1)])), true);
});

test("a duplicate merged into an account line (A×2 + A×1 → A×3) is a change", () => {
  assert.equal(differ(cart([line(1, 2)]), cart([line(1, 3)])), true);
});

test("a skipped (unavailable) guest line is a change", () => {
  assert.equal(differ(cart([line(1, 2), line(2, 1)]), cart([line(1, 2)])), true);
});

test("a price change is a change", () => {
  assert.equal(
    differ(cart([line(1, 2)]), cart([line(1, 2, { unitPrice: 120_000 })])),
    true,
  );
});

test("a discount, coupon or total change is a change", () => {
  const base = cart([line(1, 2)]);
  for (const overrides of [
    { discountAmount: 5_000 },
    { coupon: { id: 3, code: "SAVE", discount: 10_000 } },
    { payableTotal: base.payableTotal - 10_000 },
    { itemsTotal: base.itemsTotal + 1 },
  ]) {
    assert.equal(differ(base, { ...base, ...overrides }), true, JSON.stringify(overrides));
  }
});

test("mode and volume are part of the line identity", () => {
  const sealed = cart([line(1, 1)]);
  assert.equal(differ(sealed, cart([line(1, 1, { mode: "decant" })])), true);
  assert.equal(differ(sealed, cart([line(1, 1, { volume: 50 })])), true);
});

test("a different carrier or shipping cost alone is not a cart change (chosen on step 2)", () => {
  const before = cart([line(1, 2)]);
  const after = {
    ...before,
    shippingMethod: "post",
    shippingCost: 150_000,
    payableTotal: before.payableTotal + 150_000,
  };
  assert.equal(differ(before, after), false);
});

test("a missing side is a change; two missing sides are not", () => {
  assert.equal(cartSnapshotsDiffer(cartSnapshot(cart([line(1, 1)])), null), true);
  assert.equal(cartSnapshotsDiffer(null, cartSnapshot(cart([line(1, 1)]))), true);
  assert.equal(cartSnapshotsDiffer(null, null), false);
});

test("numeric strings from the API compare equal to numbers", () => {
  const before = cart([line(1, 2)]);
  const after = {
    ...before,
    items: before.items.map((item) => ({
      ...item,
      unitPrice: String(item.unitPrice),
      lineTotal: String(item.lineTotal),
    })),
    payableTotal: String(before.payableTotal),
  };
  assert.equal(differ(before, after), false);
});
