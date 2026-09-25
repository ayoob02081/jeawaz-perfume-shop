// Admin Contact Messages contract. The backend owns authorization (ADMIN),
// status transitions, `readAt` and `statusCounts`. The UI reads the list and
// detail, changes status only through explicit PATCH calls, and never deletes.

export const ADMIN_CONTACT_MESSAGES_PATH = "/admin/contact-messages";

export const CONTACT_MESSAGE_STATUSES = Object.freeze(["NEW", "READ", "ARCHIVED"]);

// Same page size convention as the admin Orders list.
export const ADMIN_CONTACT_PAGE_LIMIT = 15;

// `value: undefined` is the ALL filter: it sends no `status` parameter.
export const contactMessageStatusConfig = Object.freeze([
  { id: 1, value: undefined, countKey: "ALL", title: "همه", color: "bg-primary/15", textColor: "text-primary" },
  { id: 2, value: "NEW", countKey: "NEW", title: "جدید", color: "bg-blue/15", textColor: "text-blue" },
  { id: 3, value: "READ", countKey: "READ", title: "خوانده شده", color: "bg-green/10", textColor: "text-green" },
  { id: 4, value: "ARCHIVED", countKey: "ARCHIVED", title: "بایگانی", color: "bg-stroke-200", textColor: "text-stroke-600" },
]);

const STATUS_BADGES = {
  NEW: { label: "جدید", className: "bg-blue/10 text-blue border-blue" },
  READ: { label: "خوانده شده", className: "bg-success/5 text-success border-success" },
  ARCHIVED: { label: "بایگانی", className: "bg-stroke-100 text-stroke-600 border-stroke-400" },
};

export const isContactMessageStatus = (value) =>
  CONTACT_MESSAGE_STATUSES.includes(value);

export const getContactStatusBadge = (status) =>
  STATUS_BADGES[status] || { label: "نامشخص", className: "bg-orange/10 text-orange border-orange" };

// URL → one normalized list query (invalid page → 1, unknown status → ALL).
export function parseAdminContactQuery(searchParams) {
  const rawPage = Number(searchParams?.get?.("page"));
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;
  const rawStatus = searchParams?.get?.("status");
  return { page, status: isContactMessageStatus(rawStatus) ? rawStatus : undefined };
}

// Only backend-supported parameters; ALL omits `status`.
export function buildAdminContactListParams({ page = 1, limit = ADMIN_CONTACT_PAGE_LIMIT, status } = {}) {
  const params = { page, limit };
  if (isContactMessageStatus(status)) params.status = status;
  return params;
}

// Stable, structured keys: every list shares ["admin-contact-messages", "list"],
// every detail ["admin-contact-messages", "detail", id].
export const adminContactMessageKeys = Object.freeze({
  all: ["admin-contact-messages"],
  lists: () => ["admin-contact-messages", "list"],
  list: (query = {}) => {
    const { page, limit, status } = buildAdminContactListParams(query);
    return ["admin-contact-messages", "list", { page, limit, status: status ?? "ALL" }];
  },
  details: () => ["admin-contact-messages", "detail"],
  detail: (id) => ["admin-contact-messages", "detail", String(id)],
});

// `client` is the shared credentialed Axios instance.
export const fetchAdminContactMessages = (client, query) =>
  client
    .get(ADMIN_CONTACT_MESSAGES_PATH, { params: buildAdminContactListParams(query) })
    .then(({ data }) => data);

export const fetchAdminContactMessage = (client, id) =>
  client
    .get(`${ADMIN_CONTACT_MESSAGES_PATH}/${encodeURIComponent(id)}`)
    .then(({ data }) => data);

export const patchAdminContactMessageStatus = (client, { id, status }) =>
  client
    .patch(`${ADMIN_CONTACT_MESSAGES_PATH}/${encodeURIComponent(id)}/status`, { status })
    .then(({ data }) => data);

export const shouldChangeContactStatus = (currentStatus, nextStatus) =>
  isContactMessageStatus(nextStatus) && currentStatus !== nextStatus;

// One status change at a time; the same status never reaches the backend.
export function createContactStatusChanger({ send }) {
  let pending = false;
  return async function changeContactStatus(message, nextStatus) {
    if (!message?.id || !shouldChangeContactStatus(message.status, nextStatus)) {
      return { ok: false, skipped: true };
    }
    if (pending) return { ok: false, skipped: true };
    pending = true;
    try {
      const updated = await send({ id: message.id, status: nextStatus });
      return { ok: true, updated };
    } catch {
      return { ok: false };
    } finally {
      pending = false;
    }
  };
}

// After a PATCH: the detail cache takes the server's row, and every list is
// refetched so rows, the active filter's membership and statusCounts all come
// from the backend again.
export function applyContactStatusChange(queryClient, updated) {
  if (updated?.id !== undefined) {
    queryClient.setQueryData(adminContactMessageKeys.detail(updated.id), updated);
  }
  return queryClient.invalidateQueries({ queryKey: adminContactMessageKeys.lists() });
}

export const getAdminContactTotalPages = (data) => {
  const totalPages = Number(data?.meta?.totalPages);
  return Number.isInteger(totalPages) && totalPages > 0 ? totalPages : 0;
};

export const getContactStatusCount = (data, countKey) => {
  const count = Number(data?.statusCounts?.[countKey]);
  return Number.isFinite(count) && count > 0 ? count : 0;
};

// 4xx answers are final; only network/5xx failures are retried (twice).
export const shouldRetryAdminContactQuery = (failureCount, error) => {
  const status = error?.response?.status;
  if (status && status < 500) return false;
  return failureCount < 2;
};

export const isContactMessageNotFound = (error) => error?.response?.status === 404;

// Fixed Persian text; raw/English backend errors are never shown.
export function getAdminContactErrorMessage(error, fallback = "خطا در انجام عملیات") {
  const response = error?.response;
  if (!response) return "ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید";
  switch (response.status) {
    case 401:
      return "نشست شما به پایان رسیده است. لطفاً دوباره وارد شوید";
    case 403:
      return "شما دسترسی لازم را ندارید";
    case 404:
      return "پیام مورد نظر یافت نشد";
    case 400:
      return "درخواست نامعتبر است";
    default:
      return fallback;
  }
}

export const formatContactDateTime = (value) =>
  value ? new Date(value).toLocaleString("fa-IR") : "—";

export function getContactMessagePreview(message, maxLength = 60) {
  const text = String(message ?? "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}

export const getContactRowNumber = (page, limit, index) =>
  (Math.max(1, Number(page) || 1) - 1) * limit + index + 1;
