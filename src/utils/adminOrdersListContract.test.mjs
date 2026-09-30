import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ADMIN_ORDERS_EMPTY_MESSAGE,
  ADMIN_ORDERS_FILTERED_EMPTY_MESSAGE,
  ADMIN_ORDERS_PAGE_LIMIT,
  ADMIN_ORDER_STATUSES,
  adminOrderByNumberPath,
  adminOrderDetailHref,
  adminOrderKeys,
  adminOrdersSelectionKey,
  buildAdminOrdersListParams,
  canPrintAllReadyToPrint,
  clearAdminOrderFilters,
  detectDatePreset,
  getAdminOrdersEmptyMessage,
  getDatePresetRange,
  getExactOrderNumber,
  hasActiveOrderFilters,
  hasSearchOrDateFilters,
  isCalendarDate,
  nextAdminOrdersSearch,
  normalizeOrderSearch,
  parseAdminOrdersQuery,
  resolveExactOrderNumber,
  shouldRetryAdminOrdersQuery,
  withCustomDate,
  BUSINESS_TIME_ZONE,
  addCalendarDays,
  getBusinessToday,
} from "./adminOrdersListContract.mjs";
import { parseDateOnly, toDateOnlyString } from "./dateOnly.mjs";
import dateObjectModule from "react-date-object";
import persian from "react-date-object/calendars/persian.js";

const DateObject = dateObjectModule.default ?? dateObjectModule;

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const params = (search) => new URLSearchParams(search);
// A fixed local "now": 2026-09-30 10:00 in the test process's own zone.
const NOW = new Date(Date.UTC(2026, 8, 30, 6, 30)); // 10:00 Tehran, 2026-09-30

/* ================= URL ================= */

test("URL parsing keeps page, raw status, search and a valid date range", () => {
  assert.deepEqual(
    parseAdminOrdersQuery(
      params(
        "page=3&status=PAID&search=%20۲۶۰۹%20&dateFrom=2026-09-01&dateTo=2026-09-30",
      ),
    ),
    {
      page: 3,
      status: "PAID",
      search: "2609",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-30",
    },
  );
});

test("URL parsing drops invalid or empty values instead of sending them", () => {
  assert.deepEqual(parseAdminOrdersQuery(params("")), { page: 1 });
  assert.deepEqual(
    parseAdminOrdersQuery(
      params(
        "page=-2&status=CONFIRMED&search=%20%20&dateFrom=2026-9-1&dateTo=2026-02-30",
      ),
    ),
    { page: 1 },
  );
  assert.deepEqual(parseAdminOrdersQuery(params("page=1.5&status=paid")), {
    page: 1,
  });
  // A reversed range would be a 400; it is not sent at all.
  assert.deepEqual(
    parseAdminOrdersQuery(params("dateFrom=2026-10-01&dateTo=2026-09-30")),
    { page: 1 },
  );
  assert.equal(parseAdminOrdersQuery(null).page, 1);
});

test("only raw backend statuses are accepted; CONFIRMED is customer-only", () => {
  assert.deepEqual(ADMIN_ORDER_STATUSES, [
    "PENDING",
    "PAID",
    "READY_TO_PRINT",
    "PRINTED",
    "SHIPPED",
    "CANCELLED",
    "EXPIRED",
  ]);
  for (const status of ADMIN_ORDER_STATUSES) {
    assert.equal(parseAdminOrdersQuery(params(`status=${status}`)).status, status);
  }
  assert.equal(parseAdminOrdersQuery(params("status=CONFIRMED")).status, undefined);
});

/* ================= API PARAMS / KEY ================= */

test("API params contain only supported, non-empty values", () => {
  assert.deepEqual(buildAdminOrdersListParams({ page: 2 }), {
    page: 2,
    limit: ADMIN_ORDERS_PAGE_LIMIT,
  });
  assert.deepEqual(
    buildAdminOrdersListParams({
      page: 1,
      status: "READY_TO_PRINT",
      search: " علي ",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-30",
      trackingCode: "x",
      paymentStatus: "SUCCESS",
    }),
    {
      page: 1,
      limit: 15,
      status: "READY_TO_PRINT",
      search: "علی",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-30",
    },
  );
  assert.deepEqual(
    buildAdminOrdersListParams({ status: "", search: "", dateFrom: "", dateTo: null }),
    { page: 1, limit: 15 },
  );
});

test("the query key is structured, normalized and under the admin-orders prefix", () => {
  const key = adminOrderKeys.list({
    page: "2",
    status: "PAID",
    search: " ۲۶۰۹ ",
    dateFrom: "2026-09-01",
  });
  assert.deepEqual(key, [
    "admin-orders",
    "list",
    { page: 2, limit: 15, status: "PAID", search: "2609", dateFrom: "2026-09-01" },
  ]);
  assert.deepEqual(adminOrderKeys.list({ page: 1, search: "" }), [
    "admin-orders",
    "list",
    { page: 1, limit: 15 },
  ]);
  // Equivalent inputs share one cache entry.
  assert.deepEqual(
    adminOrderKeys.list({ search: "٢٦٠٩" }),
    adminOrderKeys.list({ search: "2609", page: 1 }),
  );
  assert.deepEqual(adminOrderKeys.all, ["admin-orders"]);
  assert.deepEqual(adminOrderKeys.list().slice(0, 1), adminOrderKeys.all);
});

test("the hook uses the structured key, v5 keepPreviousData and bounded retries", () => {
  const hooks = source("../hooks/useOrders.js");
  const adminHook = hooks.slice(
    hooks.indexOf("export const useGetAdminOrders"),
    hooks.indexOf("export const useGetOrders"),
  );
  assert.match(adminHook, /queryKey: adminOrderKeys\.list\(params\)/);
  assert.match(adminHook, /queryFn: \(\) => getAdminOrdersApi\(params\)/);
  assert.match(adminHook, /placeholderData: keepPreviousData/);
  assert.doesNotMatch(adminHook, /keepPreviousData: true/);
  assert.match(adminHook, /retry: shouldRetryAdminOrdersQuery/);
  // Mutations still invalidate every admin-orders list by prefix.
  assert.match(hooks, /invalidateQueries\(\{ queryKey: \["admin-orders"\] \}\)/);

  assert.equal(shouldRetryAdminOrdersQuery(0, { response: { status: 400 } }), false);
  assert.equal(shouldRetryAdminOrdersQuery(0, { response: { status: 403 } }), false);
  assert.equal(shouldRetryAdminOrdersQuery(1, { response: { status: 500 } }), true);
  assert.equal(shouldRetryAdminOrdersQuery(2, {}), false);
});

/* ================= SEARCH ================= */

test("search normalization: trim, whitespace, Persian/Arabic digits, ی/ک, length", () => {
  assert.equal(normalizeOrderSearch("  ۲۶۰۹۰۰۱۲  "), "26090012");
  assert.equal(normalizeOrderSearch("٠٩١٢١٢٣٤٥٦٧"), "09121234567");
  assert.equal(normalizeOrderSearch("علي   كريمي"), "علی کریمی");
  assert.equal(normalizeOrderSearch("a".repeat(150)).length, 100);
  assert.equal(normalizeOrderSearch(undefined), "");
  assert.equal(normalizeOrderSearch(42), "");
});

test("exact order numbers are 8+ digits after normalization", () => {
  assert.equal(getExactOrderNumber("26090012"), "26090012");
  assert.equal(getExactOrderNumber(" ۲۶۰۹۰۰۱۲ "), "26090012");
  assert.equal(getExactOrderNumber("2609001234"), "2609001234");
  assert.equal(getExactOrderNumber("2609001"), null);
  assert.equal(getExactOrderNumber("2609 0012"), null);
  assert.equal(getExactOrderNumber("JW-26090012"), null);
  assert.equal(getExactOrderNumber("علی"), null);
});

test("quick open: found → protected detail route; 404 → list search; other → error", async () => {
  const calls = [];
  const found = await resolveExactOrderNumber("۲۶۰۹۰۰۱۲", async (orderNumber) => {
    calls.push(orderNumber);
    return { id: 41, orderNumber };
  });
  assert.deepEqual(found, { kind: "open", href: "/admin/orders/41" });
  assert.deepEqual(calls, ["26090012"]);

  const missing = await resolveExactOrderNumber("26090099", async () => {
    throw { response: { status: 404 } };
  });
  assert.deepEqual(missing, { kind: "search" });

  const failure = { response: { status: 500 } };
  const failed = await resolveExactOrderNumber("26090099", async () => {
    throw failure;
  });
  assert.deepEqual(failed, { kind: "error", error: failure });

  let requested = false;
  const notExact = await resolveExactOrderNumber("2609", async () => {
    requested = true;
  });
  assert.deepEqual(notExact, { kind: "search" });
  assert.equal(requested, false);
});

test("the by-number path is encoded and the detail route is protected and numeric", () => {
  assert.equal(adminOrderByNumberPath("26090012"), "/orders/number/26090012");
  assert.equal(adminOrderByNumberPath("a/../b?c"), "/orders/number/a%2F..%2Fb%3Fc");
  assert.equal(adminOrderDetailHref(41), "/admin/orders/41");
  assert.equal(adminOrderDetailHref("41"), "/admin/orders/41");
  for (const id of [undefined, null, 0, -1, 1.5, "41abc", "../x"]) {
    assert.equal(adminOrderDetailHref(id), null);
  }
  assert.match(source("../services/orderServices.js"), /adminOrderByNumberPath\(orderNumber\)/);
});

test("search input: local state, useDebounce 300ms, Enter bypass, immediate clear", () => {
  const filters = source("../app/(admin)/admin/orders/_components/OrdersFilters.jsx");
  assert.match(filters, /useDebounce\(input, 300\)/);
  assert.match(filters, /شماره سفارش، نام یا شماره موبایل/);
  assert.match(filters, /onSubmit=\{handleSubmit\}/);
  assert.match(filters, /if \(!normalizeOrderSearch\(value\)\) commitSearch\(""\)/);
  // The by-number request only happens from Enter, never while typing.
  assert.equal(filters.match(/resolveExactOrderNumber\(/g).length, 1);
  assert.match(filters, /const handleSubmit = async/);
  // Detail navigation is the only push; URL updates go through the layout.
  assert.match(filters, /router\.push\(result\.href\)/);
  assert.doesNotMatch(filters, /router\.replace/);
});

/* ================= URL UPDATES ================= */

test("changing a filter returns to page 1 and keeps the other filters", () => {
  const current = "page=4&status=PAID&dateFrom=2026-09-01&dateTo=2026-09-30";
  assert.equal(
    nextAdminOrdersSearch(current, { search: "2609" }),
    "status=PAID&dateFrom=2026-09-01&dateTo=2026-09-30&search=2609",
  );
  assert.equal(
    nextAdminOrdersSearch("page=2&search=2609&dateFrom=2026-09-01", {
      status: "SHIPPED",
    }),
    "search=2609&dateFrom=2026-09-01&status=SHIPPED",
  );
  assert.equal(
    nextAdminOrdersSearch("page=2&status=PAID&search=2609", {
      dateFrom: "2026-09-01",
      dateTo: "2026-09-07",
    }),
    "status=PAID&search=2609&dateFrom=2026-09-01&dateTo=2026-09-07",
  );
});

test("the all-status card clears status and keeps search/date", () => {
  assert.equal(
    nextAdminOrdersSearch("page=3&status=PAID&search=%D8%B9&dateTo=2026-09-30", {
      status: undefined,
    }),
    "search=%D8%B9&dateTo=2026-09-30",
  );
});

test("paging keeps every filter; page 1 is the default and not written", () => {
  const filtered = "status=PAID&search=2609&dateFrom=2026-09-01";
  assert.equal(nextAdminOrdersSearch(filtered, { page: 3 }), `${filtered}&page=3`);
  assert.equal(nextAdminOrdersSearch(`${filtered}&page=3`, { page: 1 }), filtered);
});

test("re-selecting the same filter value keeps the page", () => {
  assert.equal(
    nextAdminOrdersSearch("status=PAID&page=3", { status: "PAID" }),
    "status=PAID&page=3",
  );
});

test("clearing search commits an empty value and returns to page 1", () => {
  assert.equal(
    nextAdminOrdersSearch("search=2609&status=PAID&page=2", { search: "" }),
    "status=PAID",
  );
});

test("reset clears search, dates, status and page but keeps unrelated params", () => {
  assert.equal(
    clearAdminOrderFilters(
      "page=5&status=PAID&search=2609&dateFrom=2026-09-01&dateTo=2026-09-30&utm=x",
    ),
    "utm=x",
  );
  assert.equal(clearAdminOrderFilters(""), "");
});

test("the layout updates the URL with router.replace, never pushing history per keystroke", () => {
  const layout = source("../app/(admin)/admin/orders/_components/OrdersLayout.jsx");
  assert.match(layout, /router\.replace\(/);
  assert.doesNotMatch(layout, /router\.push\(/);
  assert.match(layout, /nextAdminOrdersSearch\(searchRef\.current, updates\)/);
  assert.match(layout, /clearAdminOrderFilters\(searchRef\.current\)/);
  assert.match(layout, /parseAdminOrdersQuery\(searchParams\)/);
});

/* ================= DATES ================= */

test("calendar dates are exact YYYY-MM-DD days", () => {
  assert.equal(isCalendarDate("2026-09-30"), true);
  assert.equal(isCalendarDate("2024-02-29"), true);
  for (const value of ["2026-9-30", "2025-02-29", "2026-09-30T00:00:00Z", "", null]) {
    assert.equal(isCalendarDate(value), false);
  }
});

test("the business time zone is Asia/Tehran", () => {
  assert.equal(BUSINESS_TIME_ZONE, "Asia/Tehran");
});

test("date presets are inclusive Tehran calendar-day ranges", () => {
  assert.deepEqual(getDatePresetRange("today", NOW), {
    dateFrom: "2026-09-30",
    dateTo: "2026-09-30",
  });
  assert.deepEqual(getDatePresetRange("7d", NOW), {
    dateFrom: "2026-09-24",
    dateTo: "2026-09-30",
  });
  assert.deepEqual(getDatePresetRange("30d", NOW), {
    dateFrom: "2026-09-01",
    dateTo: "2026-09-30",
  });
  // Crosses months and years: 2027-01-02 21:00 UTC is 2027-01-03 00:30 Tehran.
  assert.deepEqual(getDatePresetRange("7d", new Date(Date.UTC(2027, 0, 2, 21, 0))), {
    dateFrom: "2026-12-28",
    dateTo: "2027-01-03",
  });
  // 30 days back across a leap February.
  assert.deepEqual(getDatePresetRange("30d", new Date(Date.UTC(2028, 2, 10, 8, 0))), {
    dateFrom: "2028-02-10",
    dateTo: "2028-03-10",
  });
  assert.deepEqual(getDatePresetRange("all", NOW), {});
  assert.deepEqual(getDatePresetRange("custom", NOW), {});
});

test("'today' is the Tehran day even when the UTC (or browser) day differs", () => {
  // 2026-09-30 20:30 UTC = 2026-10-01 00:00 Tehran = 13:30 on Sep 30 in LA.
  const tehranMidnight = new Date(Date.UTC(2026, 8, 30, 20, 30));
  assert.equal(tehranMidnight.toISOString().slice(0, 10), "2026-09-30");
  assert.equal(getBusinessToday(tehranMidnight), "2026-10-01");
  assert.deepEqual(getDatePresetRange("today", tehranMidnight), {
    dateFrom: "2026-10-01",
    dateTo: "2026-10-01",
  });
  // One second earlier is still Sep 30 in Tehran.
  const lastSecond = new Date(Date.UTC(2026, 8, 30, 20, 29, 59));
  assert.equal(getBusinessToday(lastSecond), "2026-09-30");
  // 01:00 Tehran on Oct 1 is 21:30 UTC on Sep 30.
  assert.equal(getBusinessToday(new Date(Date.UTC(2026, 8, 30, 21, 30))), "2026-10-01");
  assert.equal(getBusinessToday(new Date(Date.UTC(2026, 11, 31, 20, 30))), "2027-01-01");
});

test("preset results do not depend on the process/browser time zone", () => {
  const instants = [
    NOW,
    new Date(Date.UTC(2026, 8, 30, 20, 30)),
    new Date(Date.UTC(2026, 11, 31, 20, 29, 59)),
  ];
  const expected = instants.map((now) => getDatePresetRange("7d", now));
  const original = process.env.TZ;
  try {
    for (const zone of ["UTC", "Asia/Tehran", "America/Los_Angeles", "Europe/Berlin"]) {
      process.env.TZ = zone;
      assert.deepEqual(
        instants.map((now) => getDatePresetRange("7d", now)),
        expected,
        zone,
      );
    }
  } finally {
    process.env.TZ = original;
  }
});

test("calendar-day arithmetic never uses elapsed-hour math", () => {
  assert.equal(addCalendarDays("2026-09-30", -6), "2026-09-24");
  assert.equal(addCalendarDays("2026-03-01", -1), "2026-02-28");
  assert.equal(addCalendarDays("2028-03-01", -1), "2028-02-29");
  assert.equal(addCalendarDays("2026-12-31", 1), "2027-01-01");
});

test("a picked Jalali day is sent as that calendar day, with no UTC shift", () => {
  // 8 Mehr 1405 = 2026-09-30, whatever zone the browser is in.
  const original = process.env.TZ;
  try {
    for (const zone of ["UTC", "Asia/Tehran", "America/Los_Angeles"]) {
      process.env.TZ = zone;
      const picked = new DateObject({ calendar: persian, year: 1405, month: 7, day: 8 });
      assert.equal(toDateOnlyString(picked.toDate()), "2026-09-30", zone);
      // And the URL day shows as the same Jalali day in the picker.
      const shown = new DateObject({ date: parseDateOnly("2026-09-30"), calendar: persian });
      assert.equal(shown.format("YYYY/MM/DD"), "1405/07/08", zone);
    }
  } finally {
    process.env.TZ = original;
  }
});

test("the preset shown is derived from the URL range", () => {
  assert.equal(detectDatePreset({}, NOW), "all");
  assert.equal(detectDatePreset(getDatePresetRange("today", NOW), NOW), "today");
  assert.equal(detectDatePreset(getDatePresetRange("7d", NOW), NOW), "7d");
  assert.equal(detectDatePreset(getDatePresetRange("30d", NOW), NOW), "30d");
  assert.equal(
    detectDatePreset({ dateFrom: "2026-08-01", dateTo: "2026-08-15" }, NOW),
    "custom",
  );
  assert.equal(detectDatePreset({ dateFrom: "2026-08-01" }, NOW), "custom");
});

test("custom dates set one bound; the other follows instead of reversing", () => {
  assert.deepEqual(withCustomDate({}, "dateFrom", "2026-09-01"), {
    dateFrom: "2026-09-01",
    dateTo: undefined,
  });
  assert.deepEqual(
    withCustomDate({ dateFrom: "2026-09-01", dateTo: "2026-09-10" }, "dateTo", "2026-09-20"),
    { dateFrom: "2026-09-01", dateTo: "2026-09-20" },
  );
  assert.deepEqual(
    withCustomDate({ dateFrom: "2026-09-10", dateTo: "2026-09-20" }, "dateFrom", "2026-09-25"),
    { dateFrom: "2026-09-25", dateTo: "2026-09-25" },
  );
  assert.deepEqual(
    withCustomDate({ dateFrom: "2026-09-10", dateTo: "2026-09-20" }, "dateTo", "2026-09-05"),
    { dateFrom: "2026-09-05", dateTo: "2026-09-05" },
  );
  assert.deepEqual(
    withCustomDate({ dateFrom: "2026-09-10", dateTo: "2026-09-20" }, "dateTo", undefined),
    { dateFrom: "2026-09-10", dateTo: undefined },
  );
});

test("the custom picker reuses the existing Jalali picker and date-only helpers", () => {
  const filters = source("../app/(admin)/admin/orders/_components/OrdersFilters.jsx");
  assert.match(filters, /from "react-multi-date-picker"/);
  assert.match(filters, /react-date-object\/calendars\/persian/);
  assert.match(filters, /toDateOnlyString\(date\.toDate\(\)\)/);
  assert.match(filters, /parseDateOnly\(value\)/);
  assert.doesNotMatch(filters, /toISOString/);
});

/* ================= FILTER STATE ================= */

test("active-filter detection covers search, dates and status", () => {
  assert.equal(hasActiveOrderFilters({ page: 3 }), false);
  assert.equal(hasActiveOrderFilters({ search: "  " }), false);
  assert.equal(hasActiveOrderFilters({ search: "2609" }), true);
  assert.equal(hasActiveOrderFilters({ dateTo: "2026-09-30" }), true);
  assert.equal(hasActiveOrderFilters({ status: "PAID" }), true);
  assert.equal(hasActiveOrderFilters({ status: "CONFIRMED" }), false);
  assert.equal(hasSearchOrDateFilters({ status: "PAID" }), false);
  assert.equal(hasSearchOrDateFilters({ status: "PAID", dateFrom: "2026-09-01" }), true);
});

test("empty copy distinguishes an unfiltered list from a filtered one", () => {
  assert.equal(getAdminOrdersEmptyMessage({ page: 1 }), ADMIN_ORDERS_EMPTY_MESSAGE);
  assert.equal(ADMIN_ORDERS_EMPTY_MESSAGE, "در این بخش هیچ سفارشی وجود ندارد");
  for (const query of [{ search: "x" }, { dateFrom: "2026-09-01" }, { status: "PAID" }]) {
    assert.equal(getAdminOrdersEmptyMessage(query), ADMIN_ORDERS_FILTERED_EMPTY_MESSAGE);
  }
});

/* ================= SELECTION / ACTIONS ================= */

test("the selection key changes with page, status, search and dates only", () => {
  const base = { page: 1, status: "PAID", search: "2609", dateFrom: "2026-09-01" };
  const key = adminOrdersSelectionKey(base);
  assert.equal(adminOrdersSelectionKey({ ...base, search: " ۲۶۰۹ " }), key);
  assert.equal(adminOrdersSelectionKey({ ...base, unrelated: "x" }), key);
  for (const change of [
    { page: 2 },
    { status: "PENDING" },
    { status: undefined },
    { search: "26" },
    { dateFrom: "2026-09-02" },
    { dateTo: "2026-09-30" },
  ]) {
    assert.notEqual(adminOrdersSelectionKey({ ...base, ...change }), key, JSON.stringify(change));
  }
});

test("the table clears selection on every query change and locks stale rows", () => {
  const table = source("../app/(admin)/admin/orders/_components/OrdersListTable.jsx");
  const layout = source("../app/(admin)/admin/orders/_components/OrdersLayout.jsx");
  assert.match(table, /\}, \[selectionKey\]\);/);
  assert.match(layout, /selectionKey=\{adminOrdersSelectionKey\(query\)\}/);
  assert.match(layout, /isStale=\{isPlaceholderData\}/);
  assert.match(table, /disabled=\{orderIds\?\.length === 0 \|\| isStale\}/);
  assert.match(table, /const handleUpdateStatus = async \(\) => \{\r?\n\s+if \(isStale\) return;/);
  assert.match(table, /const handleOrderIds = \(data\) => \{\r?\n\s+if \(isStale\) return;/);
  assert.match(table, /isStale \? "opacity-60 pointer-events-none/);
  assert.equal(table.match(/disabled=\{isStale\}/g).length, 2);
});

test("the backend response is authoritative: no client-side status re-filter", () => {
  const table = source("../app/(admin)/admin/orders/_components/OrdersListTable.jsx");
  assert.doesNotMatch(table, /filteredOrders/);
  assert.doesNotMatch(table, /\.filter\(\(o\) => o\.status === status\)/);
});

test("print-all is only offered for the unfiltered READY_TO_PRINT set", () => {
  const ready = { status: "READY_TO_PRINT" };
  assert.equal(canPrintAllReadyToPrint({ query: ready, hasRows: true }), true);
  assert.equal(
    canPrintAllReadyToPrint({ query: { ...ready, search: "2609" }, hasRows: true }),
    false,
  );
  assert.equal(
    canPrintAllReadyToPrint({ query: { ...ready, dateFrom: "2026-09-01" }, hasRows: true }),
    false,
  );
  assert.equal(
    canPrintAllReadyToPrint({ query: { ...ready, dateTo: "2026-09-30" }, hasRows: true }),
    false,
  );
  assert.equal(
    canPrintAllReadyToPrint({ query: ready, hasRows: true, isPlaceholderData: true }),
    false,
  );
  assert.equal(canPrintAllReadyToPrint({ query: ready, hasRows: false }), false);
  assert.equal(canPrintAllReadyToPrint({ query: { status: "PAID" }, hasRows: true }), false);

  const table = source("../app/(admin)/admin/orders/_components/OrdersListTable.jsx");
  assert.match(table, /disabled=\{!canPrintAll\}/);
  assert.match(table, /if \(!canPrintAll\) return;/);
  assert.match(table, /PRINT_ALL_FILTERED_HINT/);
});

test("the Orders error state retries the actual list query", () => {
  const layout = source("../app/(admin)/admin/orders/_components/OrdersLayout.jsx");
  assert.match(layout, /\{error \? \(\r?\n\s+<Error onRetry=\{\(\) => refetch\(\)\} \/>/);
  assert.match(layout, /refetch,\r?\n\s+\} = useGetAdminOrders\(/);
  // The shared Error keeps router.refresh() for every caller without onRetry.
  const error = source("../components/Error.jsx");
  assert.match(error, /function Error\(\{ className, onRetry \}\)/);
  assert.match(error, /onClick=\{\(\) => \(onRetry \? onRetry\(\) : router\.refresh\(\)\)\}/);
});

test("the Orders page renders an error state instead of an empty table", () => {
  const layout = source("../app/(admin)/admin/orders/_components/OrdersLayout.jsx");
  assert.match(layout, /\{error \? \(\r?\n\s+<Error /);
  assert.match(layout, /emptyMessage=\{getAdminOrdersEmptyMessage\(query\)\}/);
});

test("no low-value V1 filters are sent or offered", () => {
  const files = [
    "./adminOrdersListContract.mjs",
    "../app/(admin)/admin/orders/_components/OrdersFilters.jsx",
    "../app/(admin)/admin/orders/_components/OrdersLayout.jsx",
  ].map(source).join("\n");
  for (const term of ["paymentStatus", "gateway", "trackingCode", "minPrice", "maxPrice", "shippingMethod", "totalItems"]) {
    assert.doesNotMatch(files, new RegExp(term), term);
  }
});
