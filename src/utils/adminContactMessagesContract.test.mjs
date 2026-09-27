import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import {
  ADMIN_CONTACT_MESSAGES_PATH,
  ADMIN_CONTACT_PAGE_LIMIT,
  CONTACT_MESSAGE_STATUSES,
  adminContactMessageKeys,
  applyContactStatusChange,
  buildAdminContactListParams,
  contactMessageStatusConfig,
  createContactStatusChanger,
  fetchAdminContactMessage,
  fetchAdminContactMessages,
  formatContactDateTime,
  getAdminContactErrorMessage,
  getAdminContactTotalPages,
  getContactMessagePreview,
  getContactRowNumber,
  getContactStatusBadge,
  getContactStatusCount,
  isContactMessageNotFound,
  parseAdminContactQuery,
  patchAdminContactMessageStatus,
  shouldChangeContactStatus,
  shouldRetryAdminContactQuery,
} from "./adminContactMessagesContract.mjs";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const ADMIN = "../app/(admin)/admin/contact-messages";
const layout = source(`${ADMIN}/_components/ContactMessagesLayout.jsx`);
const table = source(`${ADMIN}/_components/ContactMessagesListTable.jsx`);
const statusButton = source(`${ADMIN}/_components/ContactStatusButton.jsx`);
const detail = source(`${ADMIN}/_components/SingleContactMessagePage.jsx`);
const controls = source(`${ADMIN}/_components/ContactStatusControls.jsx`);
const detailRoute = source(`${ADMIN}/[id]/page.jsx`);
const listRoute = source(`${ADMIN}/page.jsx`);
const service = source("../services/adminContactMessagesServices.js");
const hooks = source("../hooks/useAdminContactMessages.js");
const sidebar = source("../app/(admin)/admin/_components/AdminSidebar.jsx");
const profileLinks = source("../components/ProfileLinks.jsx");

const message = {
  id: 7,
  fullName: "علی حسنی",
  phoneNumber: "989123456789",
  message: "سلام، درباره ارسال سفارش سؤال دارم.",
  status: "NEW",
  readAt: null,
  createdAt: "2026-09-25T10:00:00.000Z",
  updatedAt: "2026-09-25T10:00:00.000Z",
};

function fakeClient(result = {}) {
  const calls = [];
  const respond = async (method, url, second) => {
    calls.push({ method, url, second });
    if (result instanceof Error) throw result;
    return { data: result };
  };
  return {
    calls,
    get: (url, config) => respond("get", url, config),
    patch: (url, body) => respond("patch", url, body),
    post: (url, body) => respond("post", url, body),
    delete: (url) => respond("delete", url),
  };
}

const httpError = (status) => Object.assign(new Error(`status ${status}`), {
  response: { status, data: { message: "Internal detail: ThrottlerException stack" } },
});

const params = (entries) => new URLSearchParams(entries);

// ---------- API URLs and parameters ----------

test("list GET uses the exact admin URL and only page/limit/status", async () => {
  const client = fakeClient({ data: [], meta: {}, statusCounts: {} });

  await fetchAdminContactMessages(client, { page: 2, limit: 15, status: "READ", search: "x", sort: "id" });

  assert.equal(ADMIN_CONTACT_MESSAGES_PATH, "/admin/contact-messages");
  assert.deepEqual(client.calls, [{
    method: "get", url: "/admin/contact-messages",
    second: { params: { page: 2, limit: 15, status: "READ" } },
  }]);
});

test("ALL (and any unknown status) sends no status parameter", async () => {
  for (const status of [undefined, null, "", "ALL", "new", "DELETED"]) {
    const client = fakeClient({});
    await fetchAdminContactMessages(client, { page: 1, status });
    assert.deepEqual(client.calls[0].second.params, { page: 1, limit: ADMIN_CONTACT_PAGE_LIMIT }, String(status));
  }
});

test("detail GET is a plain read of /admin/contact-messages/:id", async () => {
  const client = fakeClient(message);

  const data = await fetchAdminContactMessage(client, 7);

  assert.deepEqual(client.calls, [{ method: "get", url: "/admin/contact-messages/7", second: undefined }]);
  assert.deepEqual(data, message);
  assert.equal(client.calls.some(({ method }) => method !== "get"), false);
});

test("PATCH sends exactly { status } to /admin/contact-messages/:id/status", async () => {
  const client = fakeClient({ ...message, status: "READ" });

  await patchAdminContactMessageStatus(client, { id: 7, status: "READ", readAt: "x", fullName: "y" });

  assert.deepEqual(client.calls, [{
    method: "patch", url: "/admin/contact-messages/7/status", second: { status: "READ" },
  }]);
});

test("the service uses the shared credentialed client and has no DELETE", () => {
  assert.match(service, /import app from "\.\/httpClient";/);
  assert.match(service, /fetchAdminContactMessages\(app, query\)/);
  assert.match(service, /fetchAdminContactMessage\(app, id\)/);
  assert.match(service, /patchAdminContactMessageStatus\(app, \{ id, status \}\)/);
  assert.doesNotMatch(service, /\.delete\(|fetch\(|axios/);
});

// ---------- URL, pagination and filters ----------

test("URL parsing normalizes page and status once", () => {
  assert.deepEqual(parseAdminContactQuery(params({})), { page: 1, status: undefined });
  assert.deepEqual(parseAdminContactQuery(params({ page: "3", status: "ARCHIVED" })), { page: 3, status: "ARCHIVED" });
  for (const page of ["0", "-2", "1.5", "abc", ""]) {
    assert.equal(parseAdminContactQuery(params({ page })).page, 1, page);
  }
  for (const status of ["ALL", "read", "SPAM"]) {
    assert.equal(parseAdminContactQuery(params({ status })).status, undefined, status);
  }
});

test("status filters are ALL, NEW, READ, ARCHIVED with backend count keys", () => {
  assert.deepEqual(contactMessageStatusConfig.map(({ value, countKey }) => [value, countKey]), [
    [undefined, "ALL"], ["NEW", "NEW"], ["READ", "READ"], ["ARCHIVED", "ARCHIVED"],
  ]);
  assert.deepEqual([...CONTACT_MESSAGE_STATUSES], ["NEW", "READ", "ARCHIVED"]);
});

test("pagination and counts come from backend meta and statusCounts", () => {
  const response = {
    data: [message], meta: { total: 31, page: 2, limit: 15, totalPages: 3 },
    statusCounts: { ALL: 31, NEW: 20, READ: 8, ARCHIVED: 3 },
  };
  assert.equal(getAdminContactTotalPages(response), 3);
  assert.equal(getAdminContactTotalPages(undefined), 0);
  assert.equal(getAdminContactTotalPages({ meta: { totalPages: 0 } }), 0);
  assert.deepEqual(contactMessageStatusConfig.map(({ countKey }) => getContactStatusCount(response, countKey)), [31, 20, 8, 3]);
  assert.equal(getContactStatusCount(undefined, "ALL"), 0);
  assert.equal(getContactRowNumber(2, 15, 0), 16);
  assert.equal(getContactRowNumber(undefined, 15, 4), 5);
});

test("the list page keeps status in the URL while paging and resets to page 1 on a new filter", () => {
  assert.match(layout, /parseAdminContactQuery\(searchParams\)/);
  assert.match(layout, /updateParams\(\{ page: newPage \}\)/);
  assert.match(layout, /status: newStatus \|\| undefined,\s*page: 1,/);
  assert.match(layout, /limit: ADMIN_CONTACT_PAGE_LIMIT,\s*status,/);
  assert.match(layout, /getAdminContactTotalPages\(messages\)/);
  assert.match(layout, /<PagesNumber/);
  assert.match(statusButton, /getContactStatusCount\(messages, statusBtnData\?\.countKey\)/);
  assert.match(layout, /<Error \/>/);
  assert.match(layout, /<Loading \/>/);
  assert.match(layout, /پیامی وجود ندارد/);
  assert.match(listRoute, /<Suspense fallback=\{<Loading \/>\}>/);
});

// ---------- query keys ----------

test("query keys are stable, structured and normalized", () => {
  assert.deepEqual(adminContactMessageKeys.all, ["admin-contact-messages"]);
  assert.deepEqual(adminContactMessageKeys.lists(), ["admin-contact-messages", "list"]);
  assert.deepEqual(adminContactMessageKeys.list({ page: 2, limit: 15, status: "READ" }),
    ["admin-contact-messages", "list", { page: 2, limit: 15, status: "READ" }]);
  assert.deepEqual(adminContactMessageKeys.list({ page: 1 }), adminContactMessageKeys.list({ page: 1, limit: 15, status: "ALL" }));
  assert.deepEqual(adminContactMessageKeys.list({ page: 1, status: undefined }),
    ["admin-contact-messages", "list", { page: 1, limit: 15, status: "ALL" }]);
  assert.deepEqual(adminContactMessageKeys.detail(7), adminContactMessageKeys.detail("7"));
  assert.deepEqual(adminContactMessageKeys.detail(7), ["admin-contact-messages", "detail", "7"]);
  assert.deepEqual(adminContactMessageKeys.list({}).slice(0, 2), adminContactMessageKeys.lists());
  assert.deepEqual(adminContactMessageKeys.detail(1).slice(0, 2), adminContactMessageKeys.details());
});

test("hooks use the structured keys, a read-only detail query and no polling", () => {
  assert.match(hooks, /queryKey: adminContactMessageKeys\.list\(params\)/);
  assert.match(hooks, /queryFn: \(\) => getAdminContactMessagesApi\(params\)/);
  assert.match(hooks, /queryKey: adminContactMessageKeys\.detail\(id\)/);
  assert.match(hooks, /queryFn: \(\) => getAdminContactMessageByIdApi\(id\)/);
  assert.match(hooks, /enabled: !!id/);
  assert.doesNotMatch(hooks, /refetchInterval|setInterval|socket/i);
  assert.equal(hooks.match(/updateContactMessageStatusApi/g)?.length, 2);
});

// ---------- status changes ----------

test("same-status actions never PATCH; every other direction does", async () => {
  for (const current of CONTACT_MESSAGE_STATUSES) {
    for (const next of CONTACT_MESSAGE_STATUSES) {
      const client = fakeClient({ ...message, status: next });
      const change = createContactStatusChanger({ send: (body) => patchAdminContactMessageStatus(client, body) });

      const result = await change({ ...message, status: current }, next);

      if (current === next) {
        assert.deepEqual(result, { ok: false, skipped: true });
        assert.equal(client.calls.length, 0, `${current}->${next}`);
      } else {
        assert.equal(result.ok, true);
        assert.deepEqual(client.calls, [{
          method: "patch", url: "/admin/contact-messages/7/status", second: { status: next },
        }], `${current}->${next}`);
      }
    }
  }
  assert.equal(shouldChangeContactStatus("READ", "NEW"), true);
  assert.equal(shouldChangeContactStatus("NEW", "DELETED"), false);
});

test("a status change in flight blocks another; a failure is contained", async () => {
  let finish;
  const sent = [];
  const change = createContactStatusChanger({
    send: (body) => { sent.push(body); return new Promise((resolve) => { finish = resolve; }); },
  });
  const first = change(message, "READ");
  assert.deepEqual(await change(message, "ARCHIVED"), { ok: false, skipped: true });
  finish({ ...message, status: "READ" });
  assert.equal((await first).ok, true);
  assert.equal(sent.length, 1);

  const failing = createContactStatusChanger({ send: async () => { throw httpError(500); } });
  assert.deepEqual(await failing(message, "ARCHIVED"), { ok: false });
});

test("a successful change stores the server row in detail and refetches every list (rows + counts)", async () => {
  const calls = [];
  const queryClient = {
    setQueryData: (key, value) => calls.push(["set", key, value]),
    invalidateQueries: async (filters) => calls.push(["invalidate", filters]),
  };
  const updated = { ...message, status: "READ", readAt: "2026-09-25T10:05:00.000Z" };

  await applyContactStatusChange(queryClient, updated);

  assert.deepEqual(calls, [
    ["set", ["admin-contact-messages", "detail", "7"], updated],
    ["invalidate", { queryKey: ["admin-contact-messages", "list"] }],
  ]);
});

test("the mutation applies that cache update and the existing success toast", () => {
  assert.match(hooks, /onSuccess: \(updated\) => \{\s*applyContactStatusChange\(queryClient, updated\);\s*toast\.success\("وضعیت پیام بروزرسانی شد"/);
  assert.match(hooks, /toast\.error\(getAdminContactErrorMessage\(err, "خطا در تغییر وضعیت پیام"\)/);
});

test("detail controls: explicit NEW/READ/ARCHIVED, current one disabled, no delete", () => {
  assert.match(controls, /CONTACT_MESSAGE_STATUSES\.map/);
  assert.match(controls, /disabled=\{isCurrent \|\| isPending\}/);
  assert.match(controls, /onClick=\{\(\) => changeStatus\(message, status\)\}/);
  assert.match(controls, /createContactStatusChanger\(\{ send: updateContactMessageStatus \}\)/);
  assert.doesNotMatch(detail, /useUpdateContactMessageStatus|changeStatus\(|useEffect/);
});

test("detail shows every required field and handles 404 separately", () => {
  for (const text of ["message.fullName", "normalizeIranPhone(message.phoneNumber)", "{message.message}",
    "badge.label", "formatContactDateTime(message.createdAt)", "message.readAt", "formatContactDateTime(message.readAt)",
    "whitespace-pre-wrap", "isContactMessageNotFound(error)", "<Error />"]) {
    assert.ok(detail.includes(text), text);
  }
  assert.doesNotMatch(detail, /dangerouslySetInnerHTML/);
  assert.match(detailRoute, /<SingleContactMessagePage messageId=\{params\?\.id\} \/>/);
});

// ---------- errors, formatting ----------

test("errors map to fixed Persian text; raw backend details are never shown", () => {
  assert.match(getAdminContactErrorMessage(httpError(401)), /دوباره وارد شوید/);
  assert.equal(getAdminContactErrorMessage(httpError(403)), "شما دسترسی لازم را ندارید");
  assert.equal(getAdminContactErrorMessage(httpError(404)), "پیام مورد نظر یافت نشد");
  assert.equal(getAdminContactErrorMessage(httpError(500), "خطا در تغییر وضعیت پیام"), "خطا در تغییر وضعیت پیام");
  assert.match(getAdminContactErrorMessage(new Error("Network Error")), /ارتباط با سرور/);
  for (const status of [400, 401, 403, 404, 429, 500]) {
    assert.doesNotMatch(getAdminContactErrorMessage(httpError(status)), /Internal|Throttler|stack/);
  }
  assert.equal(isContactMessageNotFound(httpError(404)), true);
  assert.equal(isContactMessageNotFound(httpError(500)), false);
});

test("4xx responses are not retried; network/5xx retried at most twice", () => {
  for (const status of [400, 401, 403, 404]) assert.equal(shouldRetryAdminContactQuery(0, httpError(status)), false);
  assert.equal(shouldRetryAdminContactQuery(0, httpError(500)), true);
  assert.equal(shouldRetryAdminContactQuery(1, new Error("Network Error")), true);
  assert.equal(shouldRetryAdminContactQuery(2, httpError(503)), false);
});

test("dates use the existing fa-IR toLocaleString convention; previews stay short", () => {
  assert.equal(formatContactDateTime(message.createdAt), new Date(message.createdAt).toLocaleString("fa-IR"));
  assert.equal(formatContactDateTime(null), "—");
  assert.equal(getContactMessagePreview("  سلام\n\nدنیا  "), "سلام دنیا");
  assert.equal(getContactMessagePreview("م".repeat(80), 60), `${"م".repeat(60)}…`);
  assert.equal(getContactStatusBadge("ARCHIVED").label, "بایگانی");
  assert.equal(getContactStatusBadge("X").label, "نامشخص");
  assert.match(table, /normalizeIranPhone\(phoneNumber\)/);
  assert.match(table, /formatContactDateTime\(message\.createdAt\)/);
  assert.match(table, /getContactMessagePreview\(message\.message\)/);
  assert.match(table, /href=\{`\/admin\/contact-messages\/\$\{id\}`\}/);
});

// ---------- scope guards ----------

test("no DELETE, reply, bulk, search or notification features exist in the admin UI", () => {
  const files = readdirSync(new URL(`${ADMIN}/_components/`, import.meta.url))
    .map((name) => source(`${ADMIN}/_components/${name}`))
    .concat(detailRoute, listRoute, service, hooks);
  for (const text of files) {
    // (URLSearchParams.delete / useSearchParams in the list URL helper are fine.)
    assert.doesNotMatch(text, /TrashIcon|(app|client)\.delete\(|"DELETE"|delete(Contact|Message)|remove(Contact|Message)|bulk|reply|search:|search=|refetchInterval|socket/i);
  }
});

test("admin navigation has a Contact Messages entry with its own icon", () => {
  assert.match(sidebar, /href: "\/admin\/contact-messages",\s*baseHref: "\/admin\/contact-messages",\s*label: "پیام‌های تماس با ما",/);
  assert.match(profileLinks, /case "\/admin\/contact-messages":[\s\S]*?EnvelopeSolidIcon[\s\S]*?EnvelopeIcon/);
});

test("the public Contact Us integration is untouched by the admin work", () => {
  const publicService = source("../services/contactServices.js");
  const publicHook = source("../hooks/useContactMessages.js");
  assert.match(publicService, /postContactMessage\(app, payload\)/);
  assert.doesNotMatch(publicService, /admin/i);
  assert.doesNotMatch(publicHook, /admin/i);
  assert.match(source("../app/(user)/page/_components/ContactUsForm.jsx"), /onSubmit=\{handleSubmit\(submitContactForm\)\}/);
});
