// Admin-only payment warnings. Each attempt in the admin order response
// (GET /orders/admin, /orders/admin/:id, /orders/number/:n) carries
// `reconciliationState` next to `status`. The two are independent: an attempt
// that needs reconciliation or manual review usually keeps status INIT or
// FAILED and has no refId, although the gateway may already have taken the
// money. So the warning reads every attempt, never only the newest one: a
// newer INIT attempt must not hide an older unresolved one.
// The customer response has no reconciliationState and never gets here.

export const PAYMENT_ATTENTION = Object.freeze({
  RECONCILIATION_REQUIRED: Object.freeze({
    state: "RECONCILIATION_REQUIRED",
    label: "نیازمند تطبیق پرداخت",
    description:
      "نتیجه این پرداخت به‌صورت خودکار قطعی نشد و باید با گزارش درگاه تطبیق داده شود.",
  }),
  MANUAL_REVIEW: Object.freeze({
    state: "MANUAL_REVIEW",
    label: "نیازمند بررسی دستی پرداخت",
    description: "این پرداخت برای بررسی دستی مدیر علامت‌گذاری شده است.",
  }),
});

export const PAYMENT_ATTENTION_NOTICE =
  "وضعیت پرداخت این سفارش قطعی نیست و نیاز به بررسی دارد. ممکن است مبلغ از حساب مشتری کسر شده باشد؛ تا روشن شدن نتیجه در پنل درگاه، آن را موفق یا ناموفق در نظر نگیرید.";

export const PAYMENT_ATTENTION_CANCEL_WARNING =
  "پرداخت این سفارش نیاز به بررسی دارد و ممکن است مبلغ از حساب مشتری کسر شده باشد. لغو سفارش هیچ مبلغی را بازنمی‌گرداند؛ پیش از لغو، نتیجه پرداخت را در پنل درگاه بررسی کنید.";

// Fixed display order, independent of attempt order.
const ATTENTION_ORDER = ["RECONCILIATION_REQUIRED", "MANUAL_REVIEW"];

// null when no attempt needs attention (including no attempts at all).
// Otherwise the distinct states, in a fixed order, and the affected attempts,
// oldest first (id ASC, as the admin API lists them).
export function getAdminPaymentAttention(payments) {
  if (!Array.isArray(payments)) return null;

  const attempts = payments
    .filter((payment) => Object.hasOwn(PAYMENT_ATTENTION, payment?.reconciliationState ?? ""))
    .sort((left, right) => (left.id ?? 0) - (right.id ?? 0));
  if (attempts.length === 0) return null;

  const present = new Set(attempts.map((payment) => payment.reconciliationState));
  const states = ATTENTION_ORDER.filter((state) => present.has(state)).map(
    (state) => PAYMENT_ATTENTION[state],
  );

  return { states, attempts };
}

// For pages that render both contracts (SingleOrderPage): only the admin
// response is read; the customer response never produces a warning.
export function getOrderPaymentAttention(order, { admin = false } = {}) {
  return admin ? getAdminPaymentAttention(order?.payments) : null;
}

// Heading of the cancel warning; orderNumbers are already formatted.
export function getPaymentAttentionCancelHeading(orderNumbers) {
  const list = orderNumbers.join("، ");
  return orderNumbers.length > 1
    ? `هشدار: سفارش‌های ${list} پرداخت بررسی‌نشده دارند.`
    : `هشدار: سفارش ${list} پرداخت بررسی‌نشده دارد.`;
}

// Orders among `ids` whose payment needs attention, for the cancel
// confirmation. `orders` are the rows currently shown; ids not among them are
// ignored (selection is cleared whenever the rows change).
export function getOrdersNeedingPaymentAttention(orders, ids) {
  if (!Array.isArray(orders) || !Array.isArray(ids) || ids.length === 0) return [];
  const wanted = new Set(ids.map(Number));
  return orders.filter(
    (order) => wanted.has(Number(order?.id)) && getAdminPaymentAttention(order?.payments),
  );
}
