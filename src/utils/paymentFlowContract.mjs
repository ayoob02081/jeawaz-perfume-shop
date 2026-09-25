// Payment flow contract. The backend is authoritative: it computes the amount,
// talks to Zarinpal, verifies payments, and owns Order state. The browser only
// redirects to the backend-issued payment URL and displays Order state.

export const PAYMENT_RESULT_STATES = ["success", "failed", "pending", "unknown"];

// Order statuses that mean the payment was finalized by the backend.
const PAID_ORDER_STATUSES = ["PAID", "READY_TO_PRINT", "PRINTED", "SHIPPED"];
const CLOSED_ORDER_STATUSES = ["CANCELLED", "EXPIRED"];

// UX eligibility only; the backend still rejects non-payable Orders.
export const canPayOrder = (order) => order?.status === "PENDING";

export function isSafePaymentUrl(value) {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

// Starts (or resumes) payment for an existing Order and hands the browser to
// the backend-issued gateway URL. Never builds gateway URLs or amounts.
export async function startOrderPayment({ orderId, createPayment, redirect }) {
  let result;
  try {
    result = await createPayment(orderId);
  } catch (error) {
    return { ok: false, error };
  }
  if (!isSafePaymentUrl(result?.paymentUrl)) {
    return { ok: false, error: new Error("Invalid payment URL") };
  }
  redirect(result.paymentUrl);
  return { ok: true };
}

// Checkout: create the Order, then start payment. A payment failure after the
// Order exists reports that Order so the user can retry from it; no second
// Order is created.
export async function checkoutAndPay({ createOrder, createPayment, redirect }) {
  let order;
  try {
    order = await createOrder();
  } catch (error) {
    return { stage: "order-failed", error };
  }

  const orderId = order?.id;
  if (!orderId) return { stage: "payment-failed", orderId: null, error: new Error("Missing order id") };

  const payment = await startOrderPayment({ orderId, createPayment, redirect });
  return payment.ok
    ? { stage: "redirected", orderId }
    : { stage: "payment-failed", orderId, error: payment.error };
}

// /payment/result query: `orderId` is a positive integer, `status` is only a
// presentation hint and never proof of payment.
export function parsePaymentResultQuery(searchParams) {
  const rawId = searchParams?.get?.("orderId") ?? "";
  const orderId = /^\d+$/.test(rawId) && Number.isSafeInteger(Number(rawId)) && Number(rawId) > 0
    ? Number(rawId)
    : null;
  const rawStatus = searchParams?.get?.("status");
  const hint = PAYMENT_RESULT_STATES.includes(rawStatus) ? rawStatus : null;
  return { orderId, hint };
}

// Authoritative result: derived from the Order loaded from the backend. The
// hint can only soften a PENDING Order into a retryable "failed" presentation;
// it can never produce success.
export function resolvePaymentResult({ order, error, hint } = {}) {
  if (error || !order || typeof order.status !== "string") {
    return { state: "unknown", canRetry: false };
  }
  if (PAID_ORDER_STATUSES.includes(order.status)) {
    return { state: "success", canRetry: false };
  }
  if (CLOSED_ORDER_STATUSES.includes(order.status)) {
    return { state: "failed", canRetry: false };
  }
  if (order.status === "PENDING") {
    return hint === "failed"
      ? { state: "failed", canRetry: true }
      : { state: "pending", canRetry: true };
  }
  return { state: "unknown", canRetry: false };
}
