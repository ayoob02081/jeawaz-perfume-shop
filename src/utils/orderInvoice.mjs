// Customer invoice for one Order, rendered from the authorized customer
// response of GET /orders/:id (OrderMapper.toResponse). Printing is a
// browser-only action: it never changes Order state. READY_TO_PRINT/PRINTED
// belong to the admin fulfilment workflow, not to this invoice.

import { getVariantLabel } from "./priceCalculator.js";
import { normalizePhone } from "./toPersianNumbers.js";

// Order statuses reached only after a verified payment. GET /orders/:id returns
// the raw backend OrderStatus (the same set PaymentResult treats as paid);
// "CONFIRMED" is only the customer orders-list group/filter, never a status.
export const PRINTABLE_ORDER_STATUSES = Object.freeze([
  "PAID",
  "READY_TO_PRINT",
  "PRINTED",
  "SHIPPED",
]);

export function canPrintInvoice(status) {
  return PRINTABLE_ORDER_STATUSES.includes(status);
}

export function getInvoiceHref(orderId) {
  return `/profile/orders/${orderId}/invoice`;
}

// Same carriers as the cart shipping options, without their delivery times.
const SHIPPING_METHOD_LABELS = {
  post: "پست پیشتاز",
  tipax: "تیپاکس",
  chapar: "چاپار",
  barbari: "باربری و ترمینال",
};

const GATEWAY_LABELS = { zarinpal: "زرین‌پال" };

const text = (value) => {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
};

const amount = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

function buildItemRow(item) {
  const perTitle = text(item?.perTitle);
  const enTitle = text(item?.enTitle);
  const volume = amount(item?.volume);

  return {
    id: item?.id ?? null,
    title: perTitle ?? enTitle,
    subtitle: perTitle && enTitle !== perTitle ? enTitle : null,
    // Purchase-time snapshot of the bought Variant.
    variantLabel:
      volume > 0 ? getVariantLabel({ type: item?.variantType, volume }) : null,
    quantity: amount(item?.quantity),
    // Unit price after product/campaign discount, before any coupon.
    unitPrice: amount(item?.price),
    lineTotal: amount(item?.lineTotal),
  };
}

// Backend Order pricing: subtotal is the sum of the (already product/campaign
// discounted) line totals, the coupon applies to it, and
// grandTotal = subtotal - couponDiscount + shippingCost. pricing.itemsTotal is
// the gross total before product discounts (subtotal + productDiscount); the
// rows start from subtotal instead so they match the line totals. The rows
// below add up to grandTotal.
function buildTotals(pricing) {
  const productDiscount = amount(pricing?.productDiscount);
  const couponDiscount = amount(pricing?.couponDiscount);

  return [
    { key: "subtotal", label: "جمع کالاها", amount: amount(pricing?.subtotal) },
    productDiscount > 0 && {
      key: "productDiscount",
      label: "تخفیف محصولات (اعمال‌شده در قیمت‌ها)",
      amount: productDiscount,
    },
    couponDiscount > 0 && {
      key: "couponDiscount",
      label: "تخفیف کد تخفیف",
      amount: couponDiscount,
    },
    {
      key: "shippingCost",
      label: "هزینه بسته بندی و ارسال",
      amount: amount(pricing?.shippingCost),
    },
  ].filter(Boolean);
}

// Buyer lines are shown only when they add something to the receiver lines.
function buildCustomer(order) {
  const name =
    [text(order.customer?.firstName), text(order.customer?.lastName)]
      .filter(Boolean)
      .join(" ") || null;
  const phone = text(order.customer?.phone);
  const sameAsReceiver =
    name === text(order.shipping?.receiver) &&
    normalizePhone(phone) === normalizePhone(order.shipping?.phone);

  return (name || phone) && !sameAsReceiver ? { name, phone } : null;
}

export function buildInvoiceView(order) {
  if (!order) return null;

  const printable = canPrintInvoice(order.status);
  const method = text(order.shipping?.method);
  const gateway = text(order.payment?.gateway);

  return {
    id: order.id ?? null,
    orderNumber: text(order.orderNumber),
    orderDate: order.orderDate ?? order.dates?.created ?? null,
    printable,
    customer: buildCustomer(order),
    shipping: {
      receiver: text(order.shipping?.receiver),
      phone: text(order.shipping?.phone),
      address: text(order.shipping?.address),
      postalCode: text(order.shipping?.postalCode),
      methodLabel: method ? (SHIPPING_METHOD_LABELS[method] ?? method) : null,
    },
    items: (Array.isArray(order.items) ? order.items : []).map(buildItemRow),
    totals: buildTotals(order.pricing),
    grandTotal: amount(order.pricing?.grandTotal),
    payment: {
      // The Order status is the verified payment result; payment.status only
      // describes the latest listed attempt, so it just qualifies the gateway.
      statusLabel: printable ? "پرداخت شده" : null,
      gatewayLabel:
        order.payment?.status === "SUCCESS" && gateway
          ? (GATEWAY_LABELS[gateway] ?? gateway)
          : null,
      paidAt: order.payment?.paidAt ?? order.dates?.paid ?? null,
    },
    trackingCode: text(order.trackingCode),
  };
}

// Resolves once web fonts are loaded so the print snapshot uses Vazirmatn;
// browsers without the Font Loading API (or a failed load) print immediately.
export async function waitForDocumentFonts(doc = globalThis.document) {
  try {
    await doc?.fonts?.ready;
  } catch {
    // Printing with fallback fonts is better than not printing.
  }
}
