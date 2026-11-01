import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getOrderPaymentDisplay,
  selectRepresentativePayment,
} from "./orderPaymentDisplay.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const singleOrderPage = read("../components/SingleOrderPage.jsx");
const adminOrderPage = read("../app/(admin)/admin/orders/[id]/page.jsx");
const adminPurchasePage = read("../app/(admin)/admin/users/[id]/purchases/[purchaseId]/page.jsx");
const customerOrderPage = read("../app/(profile)/profile/orders/[id]/page.jsx");

const PAID_AT = "2026-09-20T10:05:00.000Z";

// Shape of GET /orders/admin/:id (backend OrderMapper.toAdminResponse):
// every attempt under `payments`, oldest first (id ASC).
const attempt = (id, status, gateway = `gateway-${id}`) => ({
  id,
  status,
  gateway,
  authority: `A-${id}`,
  amount: 250_000,
  refId: status === "SUCCESS" ? `REF-${id}` : null,
  transId: status === "SUCCESS" ? `REF-${id}` : null,
  cardPan: null,
  fee: 0,
  paidAt: status === "SUCCESS" ? PAID_AT : null,
});
const adminOrder = (status, payments, paidAt = null) => ({ id: 80, status, paidAt, payments });

// Shape of GET /orders/:id (backend OrderMapper.toResponse).
const customerOrder = (status, payment, paid = null) => ({
  id: 41,
  status,
  payment: { status: null, gateway: null, paidAt: paid, ...payment },
  dates: { created: "2026-09-20T10:00:00.000Z", paid },
});

const admin = (order) => getOrderPaymentDisplay(order, { admin: true });
const customer = (order) => getOrderPaymentDisplay(order);

test("the representative attempt: SUCCESS only for a paid Order, otherwise the newest", () => {
  for (const empty of [undefined, null, [], {}, "x"]) {
    assert.equal(selectRepresentativePayment(empty), null);
    assert.equal(selectRepresentativePayment(empty, { paid: true }), null);
  }
  const success = attempt(9, "SUCCESS");
  assert.equal(selectRepresentativePayment([attempt(7, "FAILED"), success, attempt(12, "FAILED")], { paid: true }), success);
  // Paid without a SUCCESS attempt: no attempt took the payment.
  assert.equal(selectRepresentativePayment([attempt(7, "FAILED"), attempt(9, "INIT")], { paid: true }), null);
  const newest = attempt(12, "INIT");
  assert.equal(selectRepresentativePayment([attempt(7, "FAILED"), attempt(9, "FAILED"), newest]), newest);
  const only = attempt(7, "FAILED");
  assert.equal(selectRepresentativePayment([only]), only);
});

test("1. paid Order with a SUCCESS attempt shows that attempt's gateway", () => {
  assert.deepEqual(admin(adminOrder("PAID", [attempt(7, "SUCCESS", "zarinpal")], PAID_AT)), {
    state: "success",
    paidAt: PAID_AT,
    gateway: "zarinpal",
  });
  for (const status of ["READY_TO_PRINT", "PRINTED", "SHIPPED"]) {
    assert.equal(admin(adminOrder(status, [attempt(7, "SUCCESS")], PAID_AT)).gateway, "gateway-7", status);
  }
});

test("2. Order marked paid by an admin shows no gateway from a FAILED/INIT attempt", () => {
  assert.deepEqual(admin(adminOrder("PAID", [attempt(7, "FAILED")], PAID_AT)), {
    state: "success",
    paidAt: PAID_AT,
    gateway: null,
  });
  assert.deepEqual(admin(adminOrder("PAID", [attempt(7, "FAILED"), attempt(9, "INIT")], PAID_AT)), {
    state: "success",
    paidAt: PAID_AT,
    gateway: null,
  });
});

test("3. pending Order with an INIT attempt shows its gateway but is not paid", () => {
  assert.deepEqual(admin(adminOrder("PENDING", [attempt(7, "INIT", "zarinpal")])), {
    state: "pending",
    paidAt: null,
    gateway: "zarinpal",
  });
  // FAILED is not final: a PENDING Order with only FAILED attempts is pending,
  // and its newest attempt (last, id ASC) describes the gateway.
  assert.deepEqual(admin(adminOrder("PENDING", [attempt(7, "FAILED"), attempt(9, "FAILED")])), {
    state: "pending",
    paidAt: null,
    gateway: "gateway-9",
  });
});

test("4. older SUCCESS with a newer FAILED attempt shows the SUCCESS gateway", () => {
  assert.deepEqual(admin(adminOrder("PAID", [attempt(7, "SUCCESS"), attempt(9, "FAILED")], PAID_AT)), {
    state: "success",
    paidAt: PAID_AT,
    gateway: "gateway-7",
  });
});

test("5. an Order without Payment rows renders from the Order alone", () => {
  assert.deepEqual(admin(adminOrder("PENDING", [])), { state: "pending", paidAt: null, gateway: null });
  assert.deepEqual(admin(adminOrder("PENDING", undefined)), { state: "pending", paidAt: null, gateway: null });
  assert.deepEqual(admin(adminOrder("PAID", [], PAID_AT)), { state: "success", paidAt: PAID_AT, gateway: null });
});

test("closed Orders keep the payment-result semantics", () => {
  // Unpaid: failed, and the newest attempt describes the gateway.
  for (const status of ["CANCELLED", "EXPIRED"]) {
    assert.deepEqual(admin(adminOrder(status, [attempt(7, "FAILED"), attempt(9, "INIT")])), {
      state: "failed",
      paidAt: null,
      gateway: "gateway-9",
    }, status);
  }
  // Paid, then cancelled by an admin: the payment itself succeeded.
  assert.deepEqual(admin(adminOrder("CANCELLED", [attempt(7, "SUCCESS"), attempt(9, "FAILED")], PAID_AT)), {
    state: "success",
    paidAt: PAID_AT,
    gateway: "gateway-7",
  });
});

test("admin data is read only through `payments` and the Order's paidAt", () => {
  const order = { ...adminOrder("PENDING", [attempt(7, "INIT")]), payment: { gateway: "stale", paidAt: PAID_AT } };
  assert.deepEqual(admin(order), { state: "pending", paidAt: null, gateway: "gateway-7" });
});

test("customer: the `payment` object follows the same gateway rule", () => {
  assert.deepEqual(customer(customerOrder("PAID", { status: "SUCCESS", gateway: "zarinpal" }, PAID_AT)), {
    state: "success",
    paidAt: PAID_AT,
    gateway: "zarinpal",
  });
  // A pending attempt is not a successful payment.
  assert.deepEqual(customer(customerOrder("PENDING", { status: "INIT", gateway: "zarinpal" })), {
    state: "pending",
    paidAt: null,
    gateway: "zarinpal",
  });
  // A listed FAILED attempt neither overrides a paid Order nor names its gateway.
  assert.deepEqual(customer(customerOrder("PAID", { status: "FAILED", gateway: "zarinpal" }, PAID_AT)), {
    state: "success",
    paidAt: PAID_AT,
    gateway: null,
  });
  assert.equal(customer(customerOrder("EXPIRED", { status: "INIT" })).state, "failed");
  assert.equal(customer({ ...customerOrder("PENDING", {}), payments: [attempt(7, "SUCCESS")] }).gateway, null);
});

test("a missing Order renders as unknown without throwing", () => {
  for (const order of [undefined, null, {}]) {
    assert.deepEqual(admin(order), { state: "unknown", paidAt: null, gateway: null });
    assert.deepEqual(customer(order), { state: "unknown", paidAt: null, gateway: null });
  }
});

test("SingleOrderPage derives payment display from the contract the route passes", () => {
  assert.match(singleOrderPage, /getOrderPaymentDisplay\(order, \{ admin \}\)/);
  // No direct reads of either backend payment contract, and no paid state
  // from a Payment row.
  assert.doesNotMatch(singleOrderPage, /order\??\.payments?\b|payments\??\.?\[/);
  assert.doesNotMatch(singleOrderPage, /^\s*payment,$/m);
  assert.doesNotMatch(singleOrderPage, /payment\??\.status/);
  for (const state of ["success", "failed", "pending"]) {
    assert.match(singleOrderPage, new RegExp(`payment\\.state === "${state}"`));
  }

  // Admin routes load the admin contract and say so; the customer route does not.
  for (const page of [adminOrderPage, adminPurchasePage]) {
    assert.match(page, /useGetAdminOrderById/);
    assert.match(page, /<SingleOrderPage[^>]*\badmin(=\{true\})?\s*\/>/);
  }
  assert.match(customerOrderPage, /useGetOrderById\(/);
  assert.doesNotMatch(customerOrderPage, /useGetAdminOrderById|<SingleOrderPage[^>]*\badmin\b/);
});
