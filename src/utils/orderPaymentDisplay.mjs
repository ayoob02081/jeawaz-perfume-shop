// Payment section of SingleOrderPage. The admin and customer order responses
// carry different payment contracts, and the page knows which one it has:
//   admin    GET /orders/admin/:id  payments: Payment[] (oldest first, id ASC)
//                                   and the Order's top-level paidAt
//   customer GET /orders/:id        payment: { status, gateway, paidAt }
//                                   and the Order's dates.paid
// Whether the Order is paid always comes from the Order, never from a Payment
// row: an admin can mark an Order paid without any Payment, and a FAILED
// attempt is not final (it can still be verified and finalized later).

import { resolvePaymentResult } from "./paymentFlowContract.mjs";

// The one attempt whose gateway the page shows. A paid Order shows only its
// SUCCESS attempt, never a FAILED/INIT one as though it took the payment; an
// admin may have marked the Order paid without any, so there may be none. An
// unpaid Order shows its newest attempt; the admin API lists attempts oldest
// first, so that is the last one.
export function selectRepresentativePayment(payments, { paid = false } = {}) {
  if (!Array.isArray(payments) || payments.length === 0) return null;
  if (paid) return payments.find((payment) => payment?.status === "SUCCESS") ?? null;
  return payments.at(-1);
}

// state is one of PAYMENT_RESULT_STATES ("success" | "failed" | "pending" |
// "unknown"). A recorded Order paidAt means the payment succeeded even if the
// Order was cancelled afterwards; otherwise the Order status decides.
export function getOrderPaymentDisplay(order, { admin = false } = {}) {
  const paidAt = (admin ? order?.paidAt : order?.dates?.paid) ?? null;
  const state = paidAt ? "success" : resolvePaymentResult({ order }).state;
  // The customer response lists one attempt, so it goes through the same rule.
  const attempts = admin ? order?.payments : order?.payment ? [order.payment] : [];
  const payment = selectRepresentativePayment(attempts, { paid: state === "success" });

  return { state, paidAt, gateway: payment?.gateway ?? null };
}
