import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  canPayOrder,
  checkoutAndPay,
  parsePaymentResultQuery,
  resolvePaymentResult,
  startOrderPayment,
} from "./paymentFlowContract.mjs";

const GATEWAY_URL = "https://payment.zarinpal.com/pg/StartPay/A0001";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("checkout creates the Order, then starts payment, then redirects to the backend URL", async () => {
  const calls = [];
  const result = await checkoutAndPay({
    createOrder: async () => { calls.push("order"); return { id: 42 }; },
    createPayment: async (id) => { calls.push(`payment:${id}`); return { authority: "A0001", paymentUrl: GATEWAY_URL }; },
    redirect: (url) => calls.push(`redirect:${url}`),
  });

  assert.deepEqual(result, { stage: "redirected", orderId: 42 });
  assert.deepEqual(calls, ["order", "payment:42", `redirect:${GATEWAY_URL}`]);
});

test("payment initiation failure after Order creation keeps that Order and never creates another", async () => {
  let ordersCreated = 0;
  const failure = Object.assign(new Error("boom"), { response: { data: { message: "خطا در اتصال به زرین پال" } } });
  const redirects = [];
  const result = await checkoutAndPay({
    createOrder: async () => { ordersCreated += 1; return { id: 42 }; },
    createPayment: async () => { throw failure; },
    redirect: (url) => redirects.push(url),
  });

  assert.equal(result.stage, "payment-failed");
  assert.equal(result.orderId, 42);
  assert.equal(result.error, failure);
  assert.equal(ordersCreated, 1);
  assert.deepEqual(redirects, []);
});

test("Order creation failure never starts payment", async () => {
  let paymentCalls = 0;
  const result = await checkoutAndPay({
    createOrder: async () => { throw new Error("cart changed"); },
    createPayment: async () => { paymentCalls += 1; },
    redirect: () => assert.fail("must not redirect"),
  });
  assert.equal(result.stage, "order-failed");
  assert.equal(paymentCalls, 0);
});

test("only a backend-issued https payment URL is followed", async () => {
  for (const paymentUrl of ["javascript:alert(1)", "http://payment.zarinpal.com/x", "", undefined]) {
    const redirects = [];
    const result = await startOrderPayment({
      orderId: 1, createPayment: async () => ({ paymentUrl }), redirect: (u) => redirects.push(u),
    });
    assert.equal(result.ok, false, String(paymentUrl));
    assert.deepEqual(redirects, []);
  }
});

test("pay/retry is offered only for PENDING Orders", () => {
  assert.equal(canPayOrder({ status: "PENDING" }), true);
  for (const status of ["PAID", "READY_TO_PRINT", "PRINTED", "SHIPPED", "CANCELLED", "EXPIRED", undefined]) {
    assert.equal(canPayOrder({ status }), false, String(status));
  }
  assert.equal(canPayOrder(null), false);
});

test("result query accepts only a positive integer orderId and a known status hint", () => {
  const q = (s) => parsePaymentResultQuery(new URLSearchParams(s));
  assert.deepEqual(q("orderId=12&status=success"), { orderId: 12, hint: "success" });
  assert.deepEqual(q("orderId=0&status=paid"), { orderId: null, hint: null });
  assert.deepEqual(q("orderId=1.5&status="), { orderId: null, hint: null });
  assert.deepEqual(q("orderId=abc"), { orderId: null, hint: null });
  assert.deepEqual(q(""), { orderId: null, hint: null });
});

test("PAID Order is success even with a forged failed hint", () => {
  for (const status of ["PAID", "READY_TO_PRINT", "PRINTED", "SHIPPED"]) {
    assert.deepEqual(resolvePaymentResult({ order: { status }, hint: "failed" }), { state: "success", canRetry: false });
  }
});

test("PENDING Order never becomes success from a forged success hint", () => {
  assert.deepEqual(resolvePaymentResult({ order: { status: "PENDING" }, hint: "success" }), { state: "pending", canRetry: true });
  assert.deepEqual(resolvePaymentResult({ order: { status: "PENDING" }, hint: "pending" }), { state: "pending", canRetry: true });
  assert.deepEqual(resolvePaymentResult({ order: { status: "PENDING" }, hint: "failed" }), { state: "failed", canRetry: true });
});

test("CANCELLED/EXPIRED Order is failed even with a forged success hint", () => {
  for (const status of ["CANCELLED", "EXPIRED"]) {
    assert.deepEqual(resolvePaymentResult({ order: { status }, hint: "success" }), { state: "failed", canRetry: false });
  }
});

test("missing Order, API failure, or inconsistent state is unknown, never success", () => {
  assert.equal(resolvePaymentResult({ order: null, hint: "success" }).state, "unknown");
  assert.equal(resolvePaymentResult({ order: undefined }).state, "unknown");
  assert.equal(resolvePaymentResult({ order: { status: "PAID" }, error: new Error("401") }).state, "unknown");
  assert.equal(resolvePaymentResult({ order: { status: "SOMETHING_NEW" }, hint: "success" }).state, "unknown");
  assert.equal(resolvePaymentResult({ order: {}, hint: "success" }).state, "unknown");
});

test("result page derives state from the loaded Order and never from the hint alone", () => {
  const page = read("../app/(user)/payment/result/_components/PaymentResult.jsx");
  assert.match(page, /useGetOrderById\(orderId\)/);
  assert.match(page, /resolvePaymentResult\(\{\s*order: orderId \? order : null,\s*error,\s*hint,\s*\}\)/);
  assert.doesNotMatch(page, /hint === "success"/);
  assert.doesNotMatch(page, /verify|Authority|zarinpal/i);
});

test("checkout and pay action use backend payment URLs only", () => {
  const cart = read("../app/(user)/cart/_components/CartLayout.jsx");
  const payButton = read("../app/(profile)/profile/orders/_components/PayOrderButton.jsx");
  const service = read("../services/paymentServices.js");
  assert.match(cart, /checkoutAndPay\(\{/);
  assert.match(cart, /if \(isCheckingOut\) return;/);
  assert.match(payButton, /canPayOrder\(order\)/);
  assert.match(service, /\.post\(`\/payments\/\$\{encodeURIComponent\(orderId\)\}`\)/);
  for (const source of [cart, payButton, service]) {
    assert.doesNotMatch(source, /pg\/StartPay|zarinpal\.com/i);
  }
  // The client sends only the Order id; the backend owns the amount.
  const code = (source) => source.replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(code(service), /amount/i);
  assert.doesNotMatch(code(payButton), /amount/i);
});
