// Admin Orders list contract. The backend (`GET /orders/admin`, ADMIN only)
// owns filtering, pagination and `statusCounts`; the UI keeps the list query
// in the URL (`page`, `status`, `search`, `dateFrom`, `dateTo`), sends only
// those parameters, and never re-filters the returned rows.

export const ADMIN_ORDERS_PAGE_LIMIT = 15;
export const ADMIN_ORDER_SEARCH_MAX = 100;

// Raw backend Order statuses. CONFIRMED is a customer display grouping only.
export const ADMIN_ORDER_STATUSES = Object.freeze([
  "PENDING",
  "PAID",
  "READY_TO_PRINT",
  "PRINTED",
  "SHIPPED",
  "CANCELLED",
  "EXPIRED",
]);

export const isAdminOrderStatus = (value) =>
  ADMIN_ORDER_STATUSES.includes(value);

// URL keys that narrow the list; changing any of them returns to page 1.
export const ADMIN_ORDER_FILTER_KEYS = Object.freeze([
  "status",
  "search",
  "dateFrom",
  "dateTo",
]);

/* ================= SEARCH ================= */

const PERSIAN_ZERO = 0x06f0;
const ARABIC_INDIC_ZERO = 0x0660;

// Same normalisation as the backend DTO: digits to ASCII, Arabic yeh/kaf to
// Persian, whitespace collapsed and trimmed, bounded length.
export function normalizeOrderSearch(value) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - PERSIAN_ZERO))
    .replace(/[٠-٩]/g, (digit) =>
      String(digit.charCodeAt(0) - ARABIC_INDIC_ZERO),
    )
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, ADMIN_ORDER_SEARCH_MAX)
    .trim();
}

const EXACT_ORDER_NUMBER = /^\d{8,}$/;

// An input that is a whole order number (YYMM + 4+ digit sequence), or null.
export function getExactOrderNumber(value) {
  const normalized = normalizeOrderSearch(value);
  return EXACT_ORDER_NUMBER.test(normalized) ? normalized : null;
}

/* ================= DATES ================= */

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

// An existing Gregorian day written exactly as YYYY-MM-DD (the API format).
export function isCalendarDate(value) {
  if (typeof value !== "string") return false;
  const match = CALENDAR_DATE.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// A valid range or none: a reversed range is dropped rather than sent (400).
function normalizeDateRange(dateFrom, dateTo) {
  const from = isCalendarDate(dateFrom) ? dateFrom : undefined;
  const to = isCalendarDate(dateTo) ? dateTo : undefined;
  if (from && to && from > to) return {};
  return { ...(from ? { dateFrom: from } : {}), ...(to ? { dateTo: to } : {}) };
}

export const ORDER_DATE_PRESETS = Object.freeze([
  { value: "all", label: "همه" },
  { value: "today", label: "امروز" },
  { value: "7d", label: "۷ روز اخیر" },
  { value: "30d", label: "۳۰ روز اخیر" },
  { value: "custom", label: "دلخواه" },
]);

const PRESET_DAYS = { today: 1, "7d": 7, "30d": 30 };

// Filter days are Asia/Tehran calendar days (the backend converts them to UTC
// bounds), whatever time zone the admin's browser is in.
export const BUSINESS_TIME_ZONE = "Asia/Tehran";

const businessDateFormat = new Intl.DateTimeFormat("en-US-u-nu-latn", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const pad = (value, length = 2) => String(value).padStart(length, "0");

// The Tehran calendar day of an instant, as YYYY-MM-DD.
export function getBusinessToday(now = new Date()) {
  const parts = Object.fromEntries(
    businessDateFormat.formatToParts(now).map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

// Calendar-day arithmetic on YYYY-MM-DD (UTC fields only, no local zone).
export function addCalendarDays(day, days) {
  const [year, month, dayOfMonth] = day.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, dayOfMonth + days));
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}`;
}

// Inclusive Tehran-day ranges ending today in Tehran.
export function getDatePresetRange(preset, now = new Date()) {
  const days = PRESET_DAYS[preset];
  if (!days) return {};
  const today = getBusinessToday(now);
  return { dateFrom: addCalendarDays(today, 1 - days), dateTo: today };
}

// Which preset the URL range is, "all" without dates, otherwise "custom".
export function detectDatePreset({ dateFrom, dateTo } = {}, now = new Date()) {
  if (!dateFrom && !dateTo) return "all";
  const match = Object.keys(PRESET_DAYS).find((preset) => {
    const range = getDatePresetRange(preset, now);
    return range.dateFrom === dateFrom && range.dateTo === dateTo;
  });
  return match ?? "custom";
}

// One custom bound changed; the other follows it rather than leaving a
// reversed range.
export function withCustomDate({ dateFrom, dateTo } = {}, key, value) {
  const next = { dateFrom, dateTo, [key]: isCalendarDate(value) ? value : undefined };
  if (next.dateFrom && next.dateTo && next.dateFrom > next.dateTo) {
    if (key === "dateFrom") next.dateTo = next.dateFrom;
    else next.dateFrom = next.dateTo;
  }
  return next;
}

/* ================= QUERY ================= */

const positiveInteger = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? number : null;
};

// URL → one normalized list query (invalid page → 1, unknown values dropped).
export function parseAdminOrdersQuery(searchParams) {
  const get = (key) => searchParams?.get?.(key) ?? undefined;
  const status = get("status");
  const search = normalizeOrderSearch(get("search"));
  return {
    page: positiveInteger(get("page")) ?? 1,
    ...(isAdminOrderStatus(status) ? { status } : {}),
    ...(search ? { search } : {}),
    ...normalizeDateRange(get("dateFrom"), get("dateTo")),
  };
}

// Only backend-supported parameters; empty values are omitted.
export function buildAdminOrdersListParams({
  page,
  limit = ADMIN_ORDERS_PAGE_LIMIT,
  status,
  search,
  dateFrom,
  dateTo,
} = {}) {
  const normalizedSearch = normalizeOrderSearch(search);
  return {
    page: positiveInteger(page) ?? 1,
    limit: positiveInteger(limit) ?? ADMIN_ORDERS_PAGE_LIMIT,
    ...(isAdminOrderStatus(status) ? { status } : {}),
    ...(normalizedSearch ? { search: normalizedSearch } : {}),
    ...normalizeDateRange(dateFrom, dateTo),
  };
}

// Every list shares the ["admin-orders"] prefix that mutations invalidate.
export const adminOrderKeys = Object.freeze({
  all: ["admin-orders"],
  lists: () => ["admin-orders", "list"],
  list: (query = {}) => [
    "admin-orders",
    "list",
    buildAdminOrdersListParams(query),
  ],
});

export const hasSearchOrDateFilters = (query = {}) => {
  const params = buildAdminOrdersListParams(query);
  return Boolean(params.search || params.dateFrom || params.dateTo);
};

export const hasActiveOrderFilters = (query = {}) =>
  hasSearchOrDateFilters(query) ||
  isAdminOrderStatus(buildAdminOrdersListParams(query).status);

/* ================= URL UPDATES ================= */

const isEmpty = (value) => value === undefined || value === null || value === "";

// The next URL query string: changing a filter drops `page` (page 1), paging
// keeps every filter, page 1 is the default and is not written.
export function nextAdminOrdersSearch(currentSearch, updates = {}) {
  const params = new URLSearchParams(currentSearch);
  let filterChanged = false;

  Object.entries(updates).forEach(([key, value]) => {
    const next = isEmpty(value) ? null : String(value);
    if (ADMIN_ORDER_FILTER_KEYS.includes(key) && params.get(key) !== next) {
      filterChanged = true;
    }
    if (next === null) params.delete(key);
    else params.set(key, next);
  });

  if (filterChanged || positiveInteger(params.get("page")) === 1) {
    params.delete("page");
  }
  return params.toString();
}

// Clears every list filter and the page; unrelated parameters are kept.
export const clearAdminOrderFilters = (currentSearch) =>
  nextAdminOrdersSearch(
    currentSearch,
    Object.fromEntries(
      [...ADMIN_ORDER_FILTER_KEYS, "page"].map((key) => [key, undefined]),
    ),
  );

/* ================= SELECTION / ACTIONS ================= */

// Selected rows belong to exactly one list query; any change to it clears
// the selection.
export const adminOrdersSelectionKey = (query = {}) =>
  JSON.stringify(buildAdminOrdersListParams(query));

export const PRINT_ALL_FILTERED_HINT =
  "«چاپ همه» همه سفارش‌های آماده چاپ را خروجی می‌گیرد؛ برای استفاده، جستجو و فیلتر تاریخ را پاک کنید.";

// "Print all" exports every READY_TO_PRINT order, so it is only offered when
// the table shows exactly that set.
export const canPrintAllReadyToPrint = ({
  query = {},
  hasRows = false,
  isPlaceholderData = false,
} = {}) =>
  query.status === "READY_TO_PRINT" &&
  hasRows &&
  !isPlaceholderData &&
  !hasSearchOrDateFilters(query);

export const ADMIN_ORDERS_EMPTY_MESSAGE = "در این بخش هیچ سفارشی وجود ندارد";
export const ADMIN_ORDERS_FILTERED_EMPTY_MESSAGE =
  "سفارشی با این مشخصات یافت نشد";

export const getAdminOrdersEmptyMessage = (query = {}) =>
  hasActiveOrderFilters(query)
    ? ADMIN_ORDERS_FILTERED_EMPTY_MESSAGE
    : ADMIN_ORDERS_EMPTY_MESSAGE;

/* ================= ORDER-NUMBER QUICK OPEN ================= */

export const adminOrderByNumberPath = (orderNumber) =>
  `/orders/number/${encodeURIComponent(orderNumber)}`;

// The protected admin detail route for a numeric order id, or null.
export const adminOrderDetailHref = (id) => {
  const orderId = positiveInteger(id);
  return orderId ? `/admin/orders/${encodeURIComponent(orderId)}` : null;
};

// Enter on an exact order number: open it, fall back to the list search on
// 404, report any other failure. `fetchByNumber` is the ADMIN-only API call.
export async function resolveExactOrderNumber(value, fetchByNumber) {
  const orderNumber = getExactOrderNumber(value);
  if (!orderNumber) return { kind: "search" };
  try {
    const order = await fetchByNumber(orderNumber);
    const href = adminOrderDetailHref(order?.id);
    return href ? { kind: "open", href } : { kind: "search" };
  } catch (error) {
    if (error?.response?.status === 404) return { kind: "search" };
    return { kind: "error", error };
  }
}

// 4xx answers are final; only network/5xx failures are retried (twice).
export const shouldRetryAdminOrdersQuery = (failureCount, error) => {
  const status = error?.response?.status;
  if (status && status < 500) return false;
  return failureCount < 2;
};
