// Notifications contract. Two separate backend contracts:
//   - the customer inbox, GET /notifications: the signed-in user's own
//     recipient rows (`id` is the recipient row id), optionally of one type;
//   - admin management, GET /admin/notifications: Notification entities
//     (`id` is the notification id) with recipient/delivery stats.
// The backend owns targeting, recipients, read state and delivery.

import { toUserSnapshot } from "./entityPickerContract.mjs";
import { toPersianNumbers } from "./toPersianNumbers.js";

export const ADMIN_NOTIFICATIONS_PATH = "/admin/notifs/ALL";
// Same page size convention as the other admin lists.
export const ADMIN_NOTIFICATION_PAGE_LIMIT = 15;
export const USER_NOTIFICATION_PAGE_LIMIT = 10;

// Mirrors the backend DTO limits.
export const ADMIN_NOTIFICATION_SEARCH_MAX = 100;
export const NOTIFICATION_TITLE_MIN = 2;
export const NOTIFICATION_TITLE_MAX = 150;
export const NOTIFICATION_MESSAGE_MIN = 2;
export const NOTIFICATION_MESSAGE_MAX = 1000;

export const NOTIFICATION_TYPES = Object.freeze([
  "ORDER",
  "SYSTEM",
  "DISCOUNT",
  "CAMPAIGN",
  "CUSTOM",
]);
export const NOTIFICATION_CHANNELS = Object.freeze(["IN_APP", "SMS", "BOTH"]);
export const NOTIFICATION_TARGET_VALUES = Object.freeze(["USER", "ROLE", "ALL"]);

const TYPE_LABELS = Object.freeze({
  ORDER: "سفارش",
  SYSTEM: "اعلان سیستمی",
  DISCOUNT: "تخفیف",
  CAMPAIGN: "کمپین",
  CUSTOM: "شخصی",
});
const CHANNEL_LABELS = Object.freeze({
  IN_APP: "سایت",
  SMS: "پیامک",
  BOTH: "سایت و پیامک",
});
const TARGET_LABELS = Object.freeze({
  USER: "کاربر انتخاب شده",
  ROLE: "نقش مربوطه",
  ALL: "همه کاربران",
});

export const isNotificationType = (value) => NOTIFICATION_TYPES.includes(value);
export const isNotificationChannel = (value) =>
  NOTIFICATION_CHANNELS.includes(value);
export const isNotificationTarget = (value) =>
  NOTIFICATION_TARGET_VALUES.includes(value);

export const notificationTypeLabel = (value) => TYPE_LABELS[value] ?? "نامشخص";
export const notificationChannelLabel = (value) =>
  CHANNEL_LABELS[value] ?? "نامشخص";
export const notificationTargetLabel = (value) =>
  TARGET_LABELS[value] ?? "نامشخص";

export const sendsSms = (channel) => channel === "SMS" || channel === "BOTH";

// A route segment (`/…/notifs/<type>`) as a type filter: ALL or anything
// unknown is no filter.
export const toNotificationTypeFilter = (value) =>
  isNotificationType(value) ? value : undefined;

export const formatNotificationDateTime = (value) =>
  value ? new Date(value).toLocaleString("fa-IR") : "—";

/* ================= CUSTOMER INBOX ================= */

// Query params for GET /notifications; ALL sends no `type`.
export function buildMyNotificationsParams({
  page = 1,
  limit = USER_NOTIFICATION_PAGE_LIMIT,
  type,
} = {}) {
  const params = { page, limit };
  const filter = toNotificationTypeFilter(type);
  if (filter) params.type = filter;
  return params;
}

/* ================= ADMIN LIST ================= */

export const normalizeNotificationSearch = (value) =>
  typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, ADMIN_NOTIFICATION_SEARCH_MAX)
    : "";

// Route type + URL search params → one normalized list query (invalid page
// → 1, unknown filters dropped).
export function parseAdminNotificationQuery(routeType, searchParams) {
  const rawPage = Number(searchParams?.get?.("page"));
  const channel = searchParams?.get?.("channel");
  const target = searchParams?.get?.("target");
  return {
    page: Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1,
    type: toNotificationTypeFilter(routeType),
    channel: isNotificationChannel(channel) ? channel : undefined,
    target: isNotificationTarget(target) ? target : undefined,
    search: normalizeNotificationSearch(searchParams?.get?.("search")) || undefined,
  };
}

// Only parameters GET /admin/notifications applies.
export function buildAdminNotificationListParams({
  page = 1,
  limit = ADMIN_NOTIFICATION_PAGE_LIMIT,
  type,
  channel,
  target,
  search,
} = {}) {
  const params = { page, limit };
  if (isNotificationType(type)) params.type = type;
  if (isNotificationChannel(channel)) params.channel = channel;
  if (isNotificationTarget(target)) params.target = target;
  const text = normalizeNotificationSearch(search);
  if (text) params.search = text;
  return params;
}

export const hasActiveNotificationFilters = (query = {}) =>
  Boolean(query.channel || query.target || query.search);

export const getAdminNotificationTotalPages = (data) => {
  const totalPages = Number(data?.meta?.totalPages);
  return Number.isInteger(totalPages) && totalPages > 0 ? totalPages : 0;
};

export const getNotificationRowNumber = (page, limit, index) =>
  (Math.max(1, Number(page) || 1) - 1) * limit + index + 1;

// The row's management stats as display numbers; SMS stats only for SMS/BOTH.
export function notificationStatsSummary(notification) {
  const stats = notification?.stats ?? {};
  const count = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
  return {
    recipients: count(stats.totalRecipients),
    read: count(stats.readCount),
    readPercentage: count(stats.readPercentage),
    sms: sendsSms(notification?.channel)
      ? { success: count(stats.smsSuccess), failed: count(stats.smsFailed) }
      : null,
  };
}

/* ================= RECIPIENTS ================= */

export const recipientDisplayName = (user) =>
  toUserSnapshot(user)?.fullName || "اسمی ثبت نشده";

// smsSent is the outcome; smsError is stored only for a failed attempt. A
// recipient without either was not reached yet (or delivery stopped).
export function recipientSmsStatus(recipient, channel) {
  if (channel && !sendsSms(channel)) return { kind: "none", label: "—" };
  if (recipient?.smsSent) {
    return { kind: "sent", label: "فرستاده شده", sentAt: recipient.smsSentAt ?? null };
  }
  if (recipient?.smsError) {
    return { kind: "failed", label: "ناموفق", error: recipient.smsError };
  }
  return { kind: "pending", label: "فرستاده نشده" };
}

/* ================= SEND FORM ================= */

// POST /admin/notifications answers once the notification and its
// recipients are stored; realtime and SMS delivery run afterwards, best
// effort. A success therefore means "created", never "delivered".
export const notificationCreatedMessage = (channel) =>
  sendsSms(channel)
    ? "اعلان ثبت شد؛ وضعیت پیامک‌ها را در جزئیات اعلان ببینید"
    : "اعلان ثبت شد";

// Same rules and wording as the backend DTO, after trimming.
export function validateNotificationText(value, { label, min, max }) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return `${label} الزامی است`;
  if (text.length < min || text.length > max) {
    return `${label} باید بین ${min} تا ${max} کاراکتر باشد`;
  }
  return true;
}

// A send to every user, or any send that includes SMS, is confirmed first.
// The text states the current targeting as it is: ALL is every account.
export function getNotificationSendConfirmation({ target, channel, recipientCount = 0 } = {}) {
  const toAll = target === "ALL";
  const sms = sendsSms(channel);
  if (!toAll && !sms) return null;

  return {
    title: toAll && sms
      ? "ارسال پیامک به همه کاربران"
      : toAll
        ? "ارسال اعلان به همه کاربران"
        : "ارسال پیامک",
    audience: toAll
      ? "همه حساب‌های کاربری سایت، از جمله مدیران و کاربران مسدود"
      : `${toPersianNumbers(recipientCount)} کاربر منتخب`,
    channel: notificationChannelLabel(channel),
    smsWarning: sms
      ? "برای هر گیرنده یک پیامک واقعی ارسال می‌شود؛ پیامک هزینه دارد و پس از ارسال قابل لغو نیست."
      : null,
    emphasize: toAll && sms,
  };
}
