import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import Module, { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  getAdminPaymentAttention,
  getOrderPaymentAttention,
  getOrdersNeedingPaymentAttention,
  getPaymentAttentionCancelHeading,
  PAYMENT_ATTENTION,
  PAYMENT_ATTENTION_CANCEL_WARNING,
  PAYMENT_ATTENTION_NOTICE,
} from "./adminPaymentAttention.mjs";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const SRC = new URL("../", import.meta.url);

// Compiles src modules (JSX and ESM) to CommonJS. "@/x" and relative imports
// resolve inside src; `mocks` replace modules by request name everywhere.
function loader(mocks = {}) {
  const cache = new Map();
  const resolve = (request, parent) => {
    const base = request.startsWith("@/")
      ? fileURLToPath(new URL(request.slice(2), SRC))
      : fileURLToPath(new URL(request, pathToFileURL(parent)));
    for (const candidate of [base, `${base}.js`, `${base}.jsx`, `${base}.mjs`]) {
      if (/\.(m?js|jsx)$/.test(candidate) && existsSync(candidate)) {
        return candidate;
      }
    }
    throw new Error(`cannot resolve ${request} from ${parent}`);
  };
  const load = (filename) => {
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = new Module(filename);
    mod.filename = filename;
    cache.set(filename, mod);
    mod.require = (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith("@/") || name.startsWith(".")) return load(resolve(name, filename));
      return require(name);
    };
    const { code } = transformSync(readFileSync(filename, "utf8"), {
      filename,
      jsc: {
        parser: { syntax: "ecmascript", jsx: true },
        transform: { react: { runtime: "automatic" } },
      },
      module: { type: "commonjs" },
    });
    mod._compile(code, filename);
    return mod.exports;
  };
  return (relative) => load(fileURLToPath(new URL(relative, SRC)));
}

const h = React.createElement;
const passthrough = (tag) => ({ children, className }) => h(tag, { className }, children);
const Table = Object.assign(passthrough("table"), {
  Header: passthrough("thead"),
  body: passthrough("tbody"),
  Row: passthrough("tr"),
});
const uiMocks = {
  "next/link": { __esModule: true, default: ({ href, children, className }) => h("a", { href, className }, children) },
  "@/components/AppImage": { __esModule: true, default: () => null },
  "@/components/Loading": { __esModule: true, default: () => h("p", null, "loading") },
  "@/components/PriceSection": { __esModule: true, default: () => null },
  "@/ui/GoBack": { __esModule: true, default: () => null },
  "@/ui/Table": { __esModule: true, default: Table },
  "@/ui/CheckBox": { __esModule: true, default: ({ children }) => h("label", null, children) },
  "@/ui/ConfirmModal": {
    __esModule: true,
    default: ({ children }) => h("dialog", { "data-confirm-modal": "" }, children),
  },
};

// Shape of the admin order responses (backend OrderMapper.toAdminResponse).
const attempt = (id, status, reconciliationState = "IDLE", extra = {}) => ({
  id,
  status,
  reconciliationState,
  gateway: "zarinpal",
  authority: `A0000000000000000000000000000000${id}`,
  amount: 1_250_000,
  refId: status === "SUCCESS" ? `REF-${id}` : null,
  transId: status === "SUCCESS" ? `REF-${id}` : null,
  cardPan: null,
  fee: 0,
  paidAt: status === "SUCCESS" ? "2026-09-20T10:05:00.000Z" : null,
  ...extra,
});
const adminOrder = (id, status, payments, paidAt = null) => ({
  id,
  orderNumber: `260800${id}`,
  status,
  orderDate: "2026-09-20T10:00:00.000Z",
  paidAt,
  payments,
  items: [],
  pricing: { grandTotal: 1_250_000, subtotal: 1_250_000, shippingCost: 0 },
  shipping: { receiver: "گیرنده", phone: "09120000000", address: "تهران", postalCode: "1234567890" },
  customer: { id: 3, phone: "09120000000" },
});

const REQUIRED = PAYMENT_ATTENTION.RECONCILIATION_REQUIRED;
const MANUAL = PAYMENT_ATTENTION.MANUAL_REVIEW;

/* ================= helper ================= */

test("no warning for orders with no attempts, normal pending, in-flight or completed payments", () => {
  for (const payments of [
    undefined,
    null,
    [],
    [attempt(1, "INIT")],
    [attempt(1, "FAILED"), attempt(2, "INIT")],
    [attempt(1, "INIT", "VERIFYING")],
    [attempt(1, "INIT", "RETRY_PENDING")],
    [attempt(1, "INIT", "EXTERNAL_SUCCESS_PENDING_FINALIZATION")],
    [attempt(1, "FAILED"), attempt(2, "SUCCESS", "COMPLETED")],
    [attempt(1, "INIT", "SOMETHING_NEW")],
    // Customer-shaped attempts carry no reconciliationState at all.
    [{ status: "INIT", gateway: "zarinpal", paidAt: null }],
  ]) {
    assert.equal(getAdminPaymentAttention(payments), null, JSON.stringify(payments));
  }
});

test("RECONCILIATION_REQUIRED and MANUAL_REVIEW are flagged although status stays INIT without a refId", () => {
  for (const [state, expected] of [["RECONCILIATION_REQUIRED", REQUIRED], ["MANUAL_REVIEW", MANUAL]]) {
    const unresolved = attempt(4, "INIT", state);
    assert.equal(unresolved.refId, null);
    assert.deepEqual(getAdminPaymentAttention([unresolved]), {
      states: [expected],
      attempts: [unresolved],
    });
  }
  assert.notEqual(REQUIRED.label, MANUAL.label);
});

test("a newer INIT attempt never hides an older unresolved one; every unresolved attempt is listed oldest first", () => {
  const older = attempt(3, "FAILED", "RECONCILIATION_REQUIRED");
  const review = attempt(5, "INIT", "MANUAL_REVIEW");
  const newest = attempt(9, "INIT");
  const attention = getAdminPaymentAttention([newest, review, older]);

  assert.deepEqual(attention.attempts.map(({ id }) => id), [3, 5]);
  assert.deepEqual(attention.states, [REQUIRED, MANUAL]);
  // Fixed state order whatever the attempt order.
  assert.deepEqual(
    getAdminPaymentAttention([attempt(1, "INIT", "MANUAL_REVIEW"), attempt(2, "INIT", "RECONCILIATION_REQUIRED")]).states,
    [REQUIRED, MANUAL],
  );
});

test("an unresolved attempt on a paid Order is still flagged", () => {
  const attention = getAdminPaymentAttention([
    attempt(1, "SUCCESS", "COMPLETED"),
    attempt(2, "INIT", "RECONCILIATION_REQUIRED"),
  ]);
  assert.deepEqual(attention.attempts.map(({ id }) => id), [2]);
});

test("only the admin contract produces a warning on shared pages", () => {
  const order = adminOrder(5, "PENDING", [attempt(5, "INIT", "RECONCILIATION_REQUIRED")]);
  assert.deepEqual(getOrderPaymentAttention(order, { admin: true }).states, [REQUIRED]);
  assert.equal(getOrderPaymentAttention(order, { admin: false }), null);
  assert.equal(getOrderPaymentAttention(order), null);
  assert.equal(getOrderPaymentAttention(undefined, { admin: true }), null);
});

test("cancel targets are the visible selected orders with an unresolved payment", () => {
  const orders = [
    adminOrder(1, "PENDING", [attempt(1, "INIT", "RECONCILIATION_REQUIRED")]),
    adminOrder(2, "PENDING", [attempt(2, "INIT")]),
    adminOrder(3, "PENDING", [attempt(3, "FAILED", "MANUAL_REVIEW"), attempt(4, "INIT")]),
    adminOrder(4, "PENDING", []),
  ];
  assert.deepEqual(getOrdersNeedingPaymentAttention(orders, [1]).map(({ id }) => id), [1]);
  assert.deepEqual(getOrdersNeedingPaymentAttention(orders, [2, 4]), []);
  assert.deepEqual(getOrdersNeedingPaymentAttention(orders, [4, 3, 2, 1]).map(({ id }) => id), [1, 3]);
  assert.deepEqual(getOrdersNeedingPaymentAttention(orders, ["3"]).map(({ id }) => id), [3]);
  assert.deepEqual(getOrdersNeedingPaymentAttention(orders, [99]), []);
  assert.deepEqual(getOrdersNeedingPaymentAttention(orders, []), []);
  assert.deepEqual(getOrdersNeedingPaymentAttention(undefined, [1]), []);
});

test("Persian warning copy says the result is unknown and money may already be captured", () => {
  assert.equal(REQUIRED.label, "نیازمند تطبیق پرداخت");
  assert.equal(MANUAL.label, "نیازمند بررسی دستی پرداخت");
  assert.match(PAYMENT_ATTENTION_NOTICE, /ممکن است مبلغ از حساب مشتری کسر شده باشد/);
  assert.match(PAYMENT_ATTENTION_NOTICE, /موفق یا ناموفق در نظر نگیرید/);
  assert.match(PAYMENT_ATTENTION_CANCEL_WARNING, /ممکن است مبلغ از حساب مشتری کسر شده باشد/);
  assert.match(PAYMENT_ATTENTION_CANCEL_WARNING, /لغو سفارش هیچ مبلغی را بازنمی‌گرداند/);
  assert.equal(getPaymentAttentionCancelHeading(["۱۲"]), "هشدار: سفارش ۱۲ پرداخت بررسی‌نشده دارد.");
  assert.equal(
    getPaymentAttentionCancelHeading(["۱۲", "۱۳"]),
    "هشدار: سفارش‌های ۱۲، ۱۳ پرداخت بررسی‌نشده دارند.",
  );
});

/* ================= order details ================= */

const SingleOrderPage = loader(uiMocks)("components/SingleOrderPage.jsx").default;
const renderDetails = (order, admin = true) =>
  renderToStaticMarkup(h(SingleOrderPage, { order, isOrderLoading: false, admin }));

test("details: RECONCILIATION_REQUIRED on a pending order shows the warning and an unknown, not pending, result", () => {
  const html = renderDetails(
    adminOrder(7, "PENDING", [attempt(7, "INIT", "RECONCILIATION_REQUIRED"), attempt(8, "INIT")]),
  );
  assert.match(html, /data-payment-attention-panel/);
  assert.match(html, new RegExp(REQUIRED.label));
  assert.match(html, /نامشخص؛ نیازمند بررسی/);
  assert.doesNotMatch(html, /در انتظار پرداخت/);
  assert.doesNotMatch(html, />ناموفق</);
  assert.doesNotMatch(html, />موفق</);
  // Reference information of the unresolved attempt only.
  assert.match(html, /A00000000000000000000000000000007/);
  assert.doesNotMatch(html, /A00000000000000000000000000000008/);
  assert.match(html, /dir="ltr"/);
});

test("details: MANUAL_REVIEW on a cancelled order is never shown as failed", () => {
  const html = renderDetails(adminOrder(9, "CANCELLED", [attempt(9, "FAILED", "MANUAL_REVIEW")]));
  assert.match(html, new RegExp(MANUAL.label));
  assert.match(html, /نامشخص؛ نیازمند بررسی/);
  assert.doesNotMatch(html, />ناموفق</);
});

test("details: a paid order stays paid and still flags an unresolved second attempt", () => {
  const html = renderDetails(
    adminOrder(
      10,
      "PAID",
      [attempt(10, "SUCCESS", "COMPLETED"), attempt(11, "INIT", "RECONCILIATION_REQUIRED")],
      "2026-09-20T10:05:00.000Z",
    ),
  );
  assert.match(html, />موفق</);
  assert.match(html, /data-payment-attention-panel/);
  assert.doesNotMatch(html, /نامشخص؛ نیازمند بررسی/);
});

test("details: normal completed, pending and payment-less orders are unchanged", () => {
  const paid = renderDetails(
    adminOrder(12, "PAID", [attempt(12, "SUCCESS", "COMPLETED")], "2026-09-20T10:05:00.000Z"),
  );
  assert.match(paid, />موفق</);
  const pending = renderDetails(adminOrder(13, "PENDING", [attempt(13, "INIT")]));
  assert.match(pending, /در انتظار پرداخت/);
  const none = renderDetails(adminOrder(14, "PENDING", []));
  assert.match(none, /در انتظار پرداخت/);
  for (const html of [paid, pending, none]) {
    assert.doesNotMatch(html, /data-payment-attention|نامشخص؛ نیازمند بررسی/);
  }
});

test("details: the customer view never renders the admin warning", () => {
  const customer = {
    ...adminOrder(15, "PENDING", undefined),
    // Even if a payments array leaked into a customer object, admin=false ignores it.
    payments: [attempt(15, "INIT", "RECONCILIATION_REQUIRED")],
    payment: { status: "INIT", gateway: "zarinpal", paidAt: null },
    dates: { created: "2026-09-20T10:00:00.000Z", paid: null },
  };
  const html = renderDetails(customer, false);
  assert.doesNotMatch(html, /data-payment-attention|نیازمند|نامشخص/);
  assert.match(html, /در انتظار پرداخت/);
});

/* ================= orders list ================= */

// OrdersListTable keeps its modal/selection in useState; seed it in call order
// (statusModalOpen, orderIds, orderId, nextStatus) to render the open modal.
function renderList(props, state = [false, [], [], undefined]) {
  let call = 0;
  const reactMock = {
    ...React,
    useState: () => [state[call++], () => {}],
    useEffect: () => {},
  };
  const hookMocks = {
    "@/hooks/useOrders": {
      useUpdateOrderStatus: () => ({ updateOrderStatus: () => {}, isPending: false }),
      useBulkUpdateStatus: () => ({ bulkUpdateStatus: () => {}, isPending: false }),
      useExportOrders: () => ({ exportOrders: () => {}, isPending: false }),
    },
  };
  const OrdersListTable = loader({ ...uiMocks, ...hookMocks, react: reactMock })(
    "app/(admin)/admin/orders/_components/OrdersListTable.jsx",
  ).default;
  return renderToStaticMarkup(
    h(OrdersListTable, { isLoading: false, selectionKey: "k", emptyMessage: "خالی", ...props }),
  );
}

const listRows = () => [
  adminOrder(21, "PENDING", [attempt(21, "INIT", "RECONCILIATION_REQUIRED"), attempt(22, "INIT")]),
  adminOrder(23, "PENDING", [attempt(23, "INIT")]),
  adminOrder(24, "PENDING", [attempt(24, "FAILED", "MANUAL_REVIEW")]),
  adminOrder(25, "PENDING", []),
];
const count = (html, pattern) => html.match(new RegExp(pattern, "g"))?.length ?? 0;

test("list: only affected orders get a distinct badge, in both the mobile and desktop tables", () => {
  const html = renderList({ orders: listRows(), status: "PENDING" });
  // Two tables (mobile + desktop), one badge per affected order in each.
  assert.equal(count(html, 'data-payment-attention="RECONCILIATION_REQUIRED"'), 2);
  assert.equal(count(html, 'data-payment-attention="MANUAL_REVIEW"'), 2);
  assert.equal(count(html, "data-payment-attention="), 4);
  assert.equal(count(html, REQUIRED.label), 2);
  assert.equal(count(html, MANUAL.label), 2);
  // Existing per-row actions stay for every row, affected or not: view link
  // plus the PAID/CANCELLED buttons, in both tables.
  for (const id of [21, 23, 24, 25]) {
    assert.equal(count(html, `href="/admin/orders/${id}"`), 2);
  }
  assert.doesNotMatch(html, /data-confirm-modal/);
});

test("list: normal rows render without any payment warning", () => {
  const html = renderList({
    orders: [
      adminOrder(31, "PAID", [attempt(31, "SUCCESS", "COMPLETED")], "2026-09-20T10:05:00.000Z"),
      adminOrder(32, "PENDING", [attempt(32, "INIT", "VERIFYING")]),
      adminOrder(33, "PENDING", []),
    ],
    status: undefined,
  });
  assert.doesNotMatch(html, /data-payment-attention|نیازمند/);
});

test("list: refreshed rows drive the badge (resolved state removes it)", () => {
  const before = renderList({ orders: [adminOrder(41, "PENDING", [attempt(41, "INIT", "RECONCILIATION_REQUIRED")])] });
  const after = renderList({ orders: [adminOrder(41, "PAID", [attempt(41, "SUCCESS", "COMPLETED")], "2026-09-20T10:05:00.000Z")] });
  assert.match(before, /data-payment-attention/);
  assert.doesNotMatch(after, /data-payment-attention/);
});

const CANCEL = { value: "CANCELLED", title: "لغو شده", textColor: "text-red" };
const PAID = { value: "PAID", title: "پرداخت شده", textColor: "text-green" };

test("cancel confirmation warns for a single unresolved order", () => {
  const html = renderList({ orders: listRows(), status: "PENDING" }, [true, [], [21], CANCEL]);
  assert.match(html, /data-confirm-modal/);
  assert.match(html, /role="alert"/);
  assert.match(html, /هشدار: سفارش ۲۶۰۸۰۰۲۱ پرداخت بررسی‌نشده دارد\./);
  assert.match(html, /لغو سفارش هیچ مبلغی را بازنمی‌گرداند/);
});

test("bulk cancel confirmation lists every selected unresolved order", () => {
  const html = renderList({ orders: listRows(), status: "PENDING" }, [true, [25, 24, 23, 21], [], CANCEL]);
  assert.match(html, /هشدار: سفارش‌های ۲۶۰۸۰۰۲۱، ۲۶۰۸۰۰۲۴ پرداخت بررسی‌نشده دارند\./);
});

test("no cancel warning for normal orders or for non-cancel transitions", () => {
  for (const state of [
    [true, [], [23], CANCEL],
    [true, [23, 25], [], CANCEL],
    [true, [], [21], PAID],
    [true, [21, 24], [], PAID],
  ]) {
    const html = renderList({ orders: listRows(), status: "PENDING" }, state);
    assert.match(html, /data-confirm-modal/);
    assert.doesNotMatch(html, /role="alert"|بررسی‌نشده/, JSON.stringify(state));
  }
});

/* ================= React Query wiring ================= */

test("status changes still invalidate the admin list and detail queries the warnings are derived from", () => {
  const invalidated = [];
  const mutations = [];
  const queries = [];
  const hooks = loader({
    "@/services/orderServices": {},
    "@tanstack/react-query": {
      keepPreviousData: Symbol("keepPreviousData"),
      useQuery: (options) => queries.push(options),
      useMutation: (options) => (mutations.push(options), { mutate: () => {}, mutateAsync: () => {}, isPending: false }),
      useQueryClient: () => ({ invalidateQueries: ({ queryKey }) => invalidated.push(queryKey) }),
    },
    "react-hot-toast": { __esModule: true, default: { success: () => {}, error: () => {} } },
  })("hooks/useOrders.js");

  hooks.useGetAdminOrders({ status: "PENDING", page: 1 });
  hooks.useGetAdminOrderById("21");
  assert.equal(queries[0].queryKey[0], "admin-orders");
  assert.deepEqual(queries[1].queryKey, ["admin-order", "21"]);

  hooks.useUpdateOrderStatus();
  mutations.at(-1).onSuccess(undefined, { id: 21, status: "CANCELLED" });
  // The list mutation passes the numeric row id; the detail page's route param
  // is the string "21". Both must name the same detail entry.
  assert.deepEqual(invalidated.slice(0, 2), [["admin-orders"], ["admin-order", "21"]]);

  invalidated.length = 0;
  hooks.useConfirmPayment();
  mutations.at(-1).onSuccess(undefined, 21);
  assert.deepEqual(invalidated.slice(0, 3), [["admin-orders"], ["order", 21], ["admin-order", "21"]]);

  invalidated.length = 0;
  hooks.useBulkUpdateStatus();
  mutations.at(-1).onSuccess(undefined, { ids: [21, 24], status: "CANCELLED" });
  assert.deepEqual(invalidated, [["admin-orders"]]);
});

test("a status change refetches the displayed admin order (string route id) and its warning clears", async () => {
  const { QueryClient, QueryObserver } = require("@tanstack/react-query");
  const queryClient = new QueryClient();
  const mutations = [];
  const queries = [];
  const fetchedIds = [];
  const responses = [
    adminOrder(21, "PENDING", [attempt(21, "INIT", "RECONCILIATION_REQUIRED")]),
    adminOrder(21, "PAID", [attempt(21, "SUCCESS", "COMPLETED")], "2026-09-20T10:05:00.000Z"),
  ];
  const hooks = loader({
    "@/services/orderServices": {
      getAdminOrderByIdApi: async (id) => (fetchedIds.push(id), responses[Math.min(fetchedIds.length - 1, 1)]),
    },
    "@tanstack/react-query": {
      keepPreviousData: Symbol("keepPreviousData"),
      useQuery: (options) => queries.push(options),
      useMutation: (options) => (mutations.push(options), { mutate: () => {}, mutateAsync: () => {}, isPending: false }),
      useQueryClient: () => queryClient,
    },
    "react-hot-toast": { __esModule: true, default: { success: () => {}, error: () => {} } },
  })("hooks/useOrders.js");

  try {
    // The detail page as mounted from /admin/orders/21 (useParams → "21").
    hooks.useGetAdminOrderById("21");
    const observer = new QueryObserver(queryClient, queries.at(-1));
    const unsubscribe = observer.subscribe(() => {});
    const waitFor = async (predicate) => {
      for (let i = 0; i < 50 && !predicate(); i += 1) await new Promise((r) => setTimeout(r, 5));
      assert.ok(predicate());
    };
    await waitFor(() => observer.getCurrentResult().isSuccess);
    assert.deepEqual(getAdminPaymentAttention(observer.getCurrentResult().data.payments).states, [REQUIRED]);
    assert.match(renderDetails(observer.getCurrentResult().data), /data-payment-attention-panel/);

    // The list's status mutation succeeds with the numeric row id.
    hooks.useUpdateOrderStatus();
    mutations.at(-1).onSuccess(undefined, { id: 21, status: "PAID" });
    await waitFor(() => fetchedIds.length === 2 && !observer.getCurrentResult().isFetching);

    assert.deepEqual(fetchedIds, ["21", "21"]);
    const refreshed = observer.getCurrentResult().data;
    assert.equal(refreshed.status, "PAID");
    assert.equal(getAdminPaymentAttention(refreshed.payments), null);
    assert.doesNotMatch(renderDetails(refreshed), /data-payment-attention-panel/);
    // Only one detail entry exists: no numeric twin was created.
    assert.equal(queryClient.getQueryCache().findAll({ queryKey: ["admin-order"] }).length, 1);
    unsubscribe();
  } finally {
    queryClient.clear();
  }
});
