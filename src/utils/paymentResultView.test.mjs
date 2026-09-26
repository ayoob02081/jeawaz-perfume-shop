import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolvePaymentResult } from "./paymentFlowContract.mjs";
import {
  PAYMENT_RESULT_VIEWS,
  canShowOrderDetails,
  getPaymentResultActions,
  getPaymentResultView,
} from "./paymentResultView.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const page = read("../app/(user)/payment/result/_components/PaymentResult.jsx");
const cartItems = read("../app/(user)/cart/_components/CartItemsLayout.jsx");

const SUCCESS_WORDING = /موفقیت|موفق شد|پرداخت شد|success-badge/;
const viewText = (view) => [view.icon, ...view.title, view.body, view.amountLabel].join(" ");

// Resolves the view exactly as the page does, from a backend Order status.
const pageFor = (order, { error = null, hint = null } = {}) => {
  const { state, canRetry } = resolvePaymentResult({ order, error, hint });
  return {
    state,
    view: getPaymentResultView(state),
    actions: getPaymentResultActions({ state, canRetry, order }),
    details: canShowOrderDetails({ order, error }),
  };
};

test("1: a paid Order renders the success variant with its items", () => {
  for (const status of ["PAID", "READY_TO_PRINT", "PRINTED", "SHIPPED"]) {
    const { state, view, actions } = pageFor({ id: 7, status });
    assert.equal(state, "success");
    assert.equal(view, PAYMENT_RESULT_VIEWS.success);
    assert.equal(view.icon, "/images/success-badge-icon.svg");
    assert.deepEqual(view.title, ["خرید شما با", "موفقیت", "انجام شد"]);
    assert.equal(view.amountLabel, "مبلغ پرداختی");
    assert.equal(view.dateField, "paid");
    assert.equal(view.showItems, true);
    assert.deepEqual(actions, { retry: false, checkAgain: false, orderLink: null });
  }
});

test("2: failed Orders never render success wording, icon or items", () => {
  for (const [order, hint] of [
    [{ id: 7, status: "CANCELLED" }, "success"],
    [{ id: 7, status: "EXPIRED" }, "success"],
    [{ id: 7, status: "PENDING" }, "failed"],
  ]) {
    const { state, view } = pageFor(order, { hint });
    assert.equal(state, "failed");
    assert.doesNotMatch(viewText(view), SUCCESS_WORDING);
    assert.equal(view.showItems, false);
    assert.equal(view.dateField, "created");
  }
});

test("3: a pending Order never renders success wording, even with a forged hint", () => {
  const { state, view } = pageFor({ id: 7, status: "PENDING" }, { hint: "success" });
  assert.equal(state, "pending");
  assert.doesNotMatch(viewText(view), SUCCESS_WORDING);
  assert.equal(view.showItems, false);
});

test("4: unknown/error never renders success wording or order details", () => {
  const cases = [
    [null, {}],
    [{ id: 7, status: "PAID" }, { error: new Error("401") }],
    [{ id: 7, status: "SOMETHING_NEW" }, { hint: "success" }],
  ];
  for (const [order, options] of cases) {
    const { state, view, actions, details } = pageFor(order, options);
    assert.equal(state, "unknown");
    assert.doesNotMatch(viewText(view), SUCCESS_WORDING);
    assert.equal(view.showItems, false);
    assert.equal(actions.retry, false);
    assert.equal(actions.checkAgain, false);
    assert.deepEqual(actions.orderLink, { href: "/profile/orders", label: "سفارش‌های من" });
    if (options.error || !order) assert.equal(details, false);
  }
  assert.equal(getPaymentResultView("anything-else"), PAYMENT_RESULT_VIEWS.unknown);
});

test("only the success view uses success wording or iconography", () => {
  for (const [state, view] of Object.entries(PAYMENT_RESULT_VIEWS)) {
    if (state === "success") continue;
    assert.doesNotMatch(viewText(view), SUCCESS_WORDING, state);
  }
});

test("6: retry is offered only for a retryable failed payment", () => {
  assert.equal(pageFor({ id: 7, status: "PENDING" }, { hint: "failed" }).actions.retry, true);
  assert.equal(pageFor({ id: 7, status: "CANCELLED" }).actions.retry, false);
  assert.equal(pageFor({ id: 7, status: "EXPIRED" }).actions.retry, false);
  assert.equal(pageFor({ id: 7, status: "PENDING" }).actions.retry, false);
  assert.equal(pageFor({ id: 7, status: "PAID" }).actions.retry, false);
  assert.match(page, /\{actions\.retry && \(\s*<PayOrderButton order=\{order\}/);
  assert.equal((page.match(/<PayOrderButton/g) ?? []).length, 1);
});

test("7: pending offers 'check again', wired to the existing refetch", () => {
  assert.equal(pageFor({ id: 7, status: "PENDING" }).actions.checkAgain, true);
  assert.equal(pageFor({ id: 7, status: "PENDING" }, { hint: "failed" }).actions.checkAgain, false);
  const button = page.slice(page.indexOf("{actions.checkAgain && ("));
  assert.match(button, /onClick=\{\(\) => refetch\(\)\}/);
  assert.match(button, /disabled=\{isFetching\}/);
});

test("non-success states link to the loaded Order, falling back to the order list", () => {
  assert.deepEqual(pageFor({ id: 7, status: "PENDING" }).actions.orderLink,
    { href: "/profile/orders/7", label: "مشاهده سفارش" });
  assert.deepEqual(pageFor({ id: 7, status: "CANCELLED" }).actions.orderLink,
    { href: "/profile/orders/7", label: "مشاهده سفارش" });
});

test("5: the page loads the real orderId and derives state only from the backend Order", () => {
  assert.match(page, /useGetOrderById\(orderId\)/);
  assert.doesNotMatch(page, /useGetOrderById\(\s*\d/);
  assert.match(page, /getPaymentResultView\(state\)/);
  assert.match(page, /getPaymentResultActions\(\{ state, canRetry, order \}\)/);
  assert.match(page, /canShowOrderDetails\(\{ order, error \}\)/);
});

test("8: no hard-coded order data, debug output, dead code or inactive invoice button", () => {
  assert.doesNotMatch(page, /console\./);
  assert.doesNotMatch(page, /^\s*\/\/\s*[<{]|^\s*\/\/\s*(function|const|return)\b/m);
  assert.doesNotMatch(page, /123456789|اردیبهشت|ولیعصر|کاوه|ابوذر/);
  assert.doesNotMatch(page, /دریافت فاکتور/);
  assert.doesNotMatch(page, /router\.back|GoBack/);
  assert.match(page, /href="\/"/);
});

test("paid date is used only for success; other states show the Order creation date", () => {
  for (const state of ["failed", "pending", "unknown"]) {
    assert.equal(PAYMENT_RESULT_VIEWS[state].dateField, "created");
  }
  assert.match(page, /formatDate = \(value\) => \(value \? toLocalDateString\(value\) : "—"\)/);
});

test("success cards show the purchase-time Order item variant on mobile and desktop", () => {
  assert.doesNotMatch(cartItems, /volume=\{\d/);
  const start = cartItems.indexOf("function SuccessedOrderCard");
  const desk = cartItems.indexOf("function DeskSuccessedCartItem");
  const success = cartItems.slice(start, cartItems.indexOf("\nfunction ", desk + 1));
  assert.equal((success.match(/volume=\{volume\}/g) ?? []).length, 2);
  assert.equal((success.match(/type=\{variantType\}/g) ?? []).length, 2);
});
