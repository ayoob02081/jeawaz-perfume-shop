// In-app notification text, split into plain text and trusted order links.
// The backend embeds the customer's order page in order notifications
// (NotificationTemplateService.orderUrl) as its own line:
// https://jeawaz.com/profile/orders/{orderId}. Only that exact production
// origin and numeric path become a link; anything else — other hosts,
// lookalikes, other paths, queries, fragments, a trailing slash or any
// character glued to either end — stays plain text. Ownership and roles are
// still enforced by the proxy and the backend order routes.

import { adminOrderDetailHref } from "./adminOrdersListContract.mjs";

export const TRUSTED_NOTIFICATION_ORIGIN = "https://jeawaz.com";

// Where the link leads for each reader. The id is the numeric Order id the
// backend puts in the URL (Order.id), which is also what the admin detail
// route loads (GET /orders/admin/:id). Any other audience gets no links.
const ORDER_HREFS = Object.freeze({
  customer: (orderId) => `/profile/orders/${orderId}`,
  admin: (orderId) => adminOrderDetailHref(orderId),
});

// Visible link text where it differs from the URL in the message: an admin
// is not taken to the customer URL, so the label names the real destination.
export const ADMIN_ORDER_LINK_LABEL = "مشاهده سفارش در پنل ادمین";
const ORDER_LINK_LABELS = Object.freeze({ admin: ADMIN_ORDER_LINK_LABEL });

// A whole whitespace-delimited token. The leading boundary is captured
// instead of using a lookbehind (Safari 15.4 has none).
const ORDER_LINK =
  /(^|\s)(https:\/\/jeawaz\.com\/profile\/orders\/([1-9]\d*))(?=\s|$)/g;

// [{ type: "text", text } | { type: "orderLink", text, label, href, orderId }]
// `text` is always the original URL: concatenating every segment's text gives
// back the original message. `label` is what the link shows.
export function parseNotificationMessage(message, { audience } = {}) {
  if (typeof message !== "string" || !message) return [];

  const toHref = Object.hasOwn(ORDER_HREFS, audience) ? ORDER_HREFS[audience] : null;
  if (!toHref) return [{ type: "text", text: message }];
  const label = Object.hasOwn(ORDER_LINK_LABELS, audience) ? ORDER_LINK_LABELS[audience] : null;

  const segments = [];
  let cursor = 0;

  for (const match of message.matchAll(ORDER_LINK)) {
    const orderId = Number(match[3]);
    const href = Number.isSafeInteger(orderId) ? toHref(orderId) : null;
    if (!href) continue;

    const start = match.index + match[1].length;
    if (start > cursor) {
      segments.push({ type: "text", text: message.slice(cursor, start) });
    }
    segments.push({ type: "orderLink", text: match[2], label: label ?? match[2], href, orderId });
    cursor = start + match[2].length;
  }

  if (cursor < message.length) {
    segments.push({ type: "text", text: message.slice(cursor) });
  }

  return segments;
}
