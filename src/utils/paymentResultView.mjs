// Presentation of /payment/result. Every state is a variant of the same page;
// the state itself always comes from resolvePaymentResult (backend Order), and
// only "success" may use success wording or iconography.

export const PAYMENT_RESULT_VIEWS = {
  success: {
    icon: "/images/success-badge-icon.svg",
    accent: "text-success",
    title: ["خرید شما با", "موفقیت", "انجام شد"],
    body: "جهت دریافت جزئیات بیشتر، لطفاً به صفحه سفارشات در پروفایل خود مراجعه کنید",
    amountLabel: "مبلغ پرداختی",
    dateLabel: "تاریخ تراکنش",
    dateField: "paid",
    showItems: true,
  },
  failed: {
    icon: "/images/canceled-icon.svg",
    accent: "text-error",
    title: ["پرداخت شما", "ناموفق", "بود"],
    body: "پرداخت تأیید نشد. اگر مبلغی از حساب شما کسر شده باشد، طبق قوانین درگاه به حساب شما بازگردانده می‌شود.",
    amountLabel: "مبلغ سفارش",
    dateLabel: "تاریخ ثبت سفارش",
    dateField: "created",
    showItems: false,
  },
  pending: {
    icon: "/images/processing-icon.svg",
    accent: "text-blue",
    title: ["پرداخت شما", "در حال بررسی", "است"],
    body: "تأیید پرداخت هنوز کامل نشده است. این بررسی به‌صورت خودکار ادامه پیدا می‌کند؛ چند لحظه بعد وضعیت را دوباره بررسی کنید.",
    amountLabel: "مبلغ سفارش",
    dateLabel: "تاریخ ثبت سفارش",
    dateField: "created",
    showItems: false,
  },
  unknown: {
    icon: null,
    accent: "text-stroke-600",
    title: ["وضعیت پرداخت", "مشخص", "نیست"],
    body: "نتیجه پرداخت قابل نمایش نیست. وضعیت سفارش را از بخش سفارش‌های من بررسی کنید.",
    amountLabel: "مبلغ سفارش",
    dateLabel: "تاریخ ثبت سفارش",
    dateField: "created",
    showItems: false,
  },
};

export const getPaymentResultView = (state) =>
  PAYMENT_RESULT_VIEWS[state] ?? PAYMENT_RESULT_VIEWS.unknown;

// Actions per state: retry only for a retryable failed payment, "check again"
// only while pending, and an order link for every non-success state.
export function getPaymentResultActions({ state, canRetry, order }) {
  const hasOrderLink = Boolean(order?.id) && state !== "unknown";

  return {
    retry: state === "failed" && canRetry === true,
    checkAgain: state === "pending",
    orderLink:
      state === "success"
        ? null
        : hasOrderLink
          ? { href: `/profile/orders/${order.id}`, label: "مشاهده سفارش" }
          : { href: "/profile/orders", label: "سفارش‌های من" },
  };
}

// Order details are shown only for an Order the backend actually returned.
export const canShowOrderDetails = ({ order, error }) => Boolean(order) && !error;
