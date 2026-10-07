import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getOrderItemType } from "./orderItemDisplay.mjs";
import { adminStatusConfig } from "../constants/orderStatus.js";

const singleOrderPage = readFileSync(new URL("../components/SingleOrderPage.jsx", import.meta.url), "utf8");

// items[] of GET /orders/admin/:id (backend OrderMapper.toAdminResponse).
const adminItem = (mode) => ({ id: 1, productId: 5, perTitle: "عطر", enTitle: "Perfume", quantity: 1, mode, volume: 10, unitPrice: 450_000, lineTotal: 450_000 });
// items[] of GET /orders/:id (backend OrderMapper.toResponse).
const customerItem = (variantType) => ({ id: 1, productId: 5, perTitle: "عطر", enTitle: "Perfume", quantity: 1, variantType, volume: 10, price: 450_000, lineTotal: 450_000 });

test("admin items read `mode`", () => {
  assert.equal(getOrderItemType(adminItem("decant"), { admin: true }), "decant");
  assert.equal(getOrderItemType(adminItem("sealed"), { admin: true }), "sealed");
});

test("customer items read `variantType`", () => {
  assert.equal(getOrderItemType(customerItem("decant")), "decant");
  assert.equal(getOrderItemType(customerItem("sealed")), "sealed");
});

test("each contract ignores the other contract's key", () => {
  assert.equal(getOrderItemType({ variantType: "decant" }, { admin: true }), null);
  assert.equal(getOrderItemType({ mode: "decant" }), null);
});

test("legacy items without a snapshot and missing items have no type", () => {
  // The admin mapper omits a missing purchaseMode; the customer mapper sends null.
  assert.equal(getOrderItemType(adminItem(undefined), { admin: true }), null);
  assert.equal(getOrderItemType(customerItem(null)), null);
  for (const item of [undefined, null]) {
    assert.equal(getOrderItemType(item, { admin: true }), null);
    assert.equal(getOrderItemType(item), null);
  }
});

test("SingleOrderPage labels items through the contract the route passes", () => {
  assert.match(singleOrderPage, /getOrderItemType\(item, \{ admin \}\) === "decant"\s*\?\s*"دکانت"\s*:\s*"نسخه پلمپ"/);
  assert.doesNotMatch(singleOrderPage, /item\??\.(mode|variantType)\b/);
});

test("SingleOrderPage does not log order data", () => {
  assert.doesNotMatch(singleOrderPage, /console\./);
});

test("SingleOrderPage renders the admin status icon only when the status is known", () => {
  for (const status of ["PENDING", "PAID", "READY_TO_PRINT", "PRINTED", "SHIPPED", "CANCELLED", "EXPIRED"]) {
    assert.ok(adminStatusConfig.find((s) => s.value === status)?.icon, status);
  }
  assert.equal(adminStatusConfig.find((s) => s.value === "SOMETHING_NEW"), undefined);
  assert.match(singleOrderPage, /\{Icon && <Icon className="size-6" \/>\}/);
});
