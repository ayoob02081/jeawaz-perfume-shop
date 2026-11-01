// Admin notification management wiring. Narrow source checks: there is no
// DOM test environment; behaviour lives in utils/notificationsContract.mjs.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const listPage = read("../[type]/page.jsx");
const layout = read("./AdminNotificationsLayout.jsx");
const filters = read("./AdminNotificationsFilters.jsx");
const listTable = read("./AdminNotificationsListTable.jsx");
const recipients = read("./NotifUsersListTable.jsx");
const detailPage = read("../[type]/[id]/page.jsx");
const notifForm = read("./NotifForm.jsx");
const sidebar = read("../../_components/AdminSidebar.jsx");
const services = read("../../../../../services/notificationServices.js");
const hooks = read("../../../../../hooks/useNotification.js");

test("the admin list uses the admin endpoint, never the customer inbox", () => {
  assert.match(listPage, /<AdminNotificationsLayout \/>/);
  assert.doesNotMatch(listPage, /NotifTypePage|NotifLayout/);
  assert.match(layout, /useGetAdminNotifications\(\{\s*\.\.\.query,\s*limit: ADMIN_NOTIFICATION_PAGE_LIMIT,\s*\}\)/);
  assert.doesNotMatch(layout, /useGetNotifications|useUnreadNotificationsCount/);

  assert.match(services, /\.get\("\/admin\/notifications", \{\s*params: buildAdminNotificationListParams\(query\),/);
  const adminHook = hooks.slice(
    hooks.indexOf("export function useGetAdminNotifications"),
    hooks.indexOf("export function useGetAdminNotificationById"),
  );
  assert.match(adminHook, /queryKey: notificationKeys\.adminList\(params\)/);
  assert.match(adminHook, /queryFn: \(\) => getAdminNotificationsApi\(params\)/);
  assert.match(hooks, /adminList: \(params = \{\}\) => \[\s*\.\.\.notificationKeys\.adminLists\(\),\s*buildAdminNotificationListParams\(params\),/);
});

test("filters: type from the route, the rest in the URL, every change back to page 1", () => {
  assert.match(layout, /parseAdminNotificationQuery\(routeType, searchParams\)/);
  assert.match(layout, /const setType = \(type\) => navigate\(type, \{ page: undefined \}\);/);
  assert.match(layout, /navigate\(currentType, \{ \[key\]: value, page: undefined \}\)/);
  assert.match(filters, /onFilterChange\("channel", event\.target\.value\)/);
  assert.match(filters, /onFilterChange\("target", event\.target\.value\)/);
  assert.match(filters, /onFilterChange\("search", next\)/);
  assert.match(filters, /maxLength=\{ADMIN_NOTIFICATION_SEARCH_MAX\}/);
});

test("the list has explicit loading, error (with a real retry) and empty states", () => {
  assert.match(layout, /\{isError \? \(\s*<Error onRetry=\{\(\) => refetch\(\)\} \/>\s*\) : isLoading \? \(\s*<Loading \/>/);
  assert.match(layout, /rows\.length === 0 \? \(\s*<NotExisted/);
  assert.match(layout, /اعلانی با این جستجو یا فیلترها پیدا نشد/);
});

test("rows are Notifications linked by notification id", () => {
  assert.match(listTable, /`\/admin\/notifs\/\$\{notification\.type\}\/\$\{notification\.id\}`/);
  assert.match(listTable, /notificationStatsSummary\(notification\)/);
  assert.doesNotMatch(listTable, /notification\.recipients|recipient\.id/);
});

test("the admin sidebar shows no personal unread badge", () => {
  const entry = sidebar.slice(sidebar.indexOf('href: "/admin/notifs/ALL"'));
  assert.match(entry.slice(0, entry.indexOf("}")), /countUnread: false/);
});

test("a create success refreshes the real admin list key", () => {
  const sendHook = hooks.slice(
    hooks.indexOf("export function useSendNotification"),
    hooks.indexOf("export function useGetAdminNotifications"),
  );
  assert.match(sendHook, /invalidateQueries\(\{\s*queryKey: notificationKeys\.adminLists\(\),\s*\}\)/);
  // The success toast says "created", from the sent channel; never "sent".
  assert.match(sendHook, /onSuccess: \(_data, payload\) =>/);
  assert.match(sendHook, /toast\.success\(notificationCreatedMessage\(payload\?\.channel\)\)/);
  assert.doesNotMatch(sendHook, /با موفقیت ارسال شد/);
});

test("send: confirmation for ALL or SMS/BOTH, then one locked request", () => {
  const onSubmit = notifForm.slice(
    notifForm.indexOf("const onSubmit"),
    notifForm.indexOf("const cancelSend"),
  );
  assert.match(onSubmit, /getNotificationSendConfirmation\(\{\s*target: payload\.target,\s*channel: payload\.channel,/);
  assert.match(onSubmit, /if \(confirmation\) \{\s*setPendingSend\(\{ payload, confirmation \}\);\s*return;\s*\}\s*send\(payload\);/);

  const send = notifForm.slice(notifForm.indexOf("const send ="), notifForm.indexOf("const onSubmit"));
  assert.match(send, /if \(submitLock\.current \|\| isSending\) return;\s*submitLock\.current = true;/);
  // Only a failed send releases the lock; a success keeps it while the
  // filled form is still mounted during navigation.
  assert.match(send, /onSettled: \(_data, error\) => \{\s*if \(error\) submitLock\.current = false;\s*\}/);
  assert.equal(send.match(/submitLock\.current = false/g)?.length, 1);
  // A locked form opens no second confirmation either.
  assert.match(onSubmit, /^const onSubmit = \(data\) => \{\s*\/\/[^\n]*\n\s*if \(submitLock\.current\) return;/);

  // The confirm dialog renders outside the form (its confirm button is a
  // submit button) and only confirming sends.
  assert.ok(notifForm.indexOf("<ConfirmModal") > notifForm.lastIndexOf("</form>"));
  assert.match(notifForm, /confirmBtn=\{confirmSend\}/);
  assert.match(notifForm, /const confirmSend = \(\) => \{\s*const payload = pendingSend\?\.payload;\s*setPendingSend\(null\);\s*if \(payload\) send\(payload\);/);
});

test("send text: trimmed, with the backend limits, message in a textarea", () => {
  assert.match(notifForm, /title: data\.title\.trim\(\),\s*message: data\.message\.trim\(\),/);
  assert.match(notifForm, /maxLength=\{NOTIFICATION_TITLE_MAX\}/);
  assert.match(notifForm, /<RHFTextAreaField[\s\S]*?name="message"[\s\S]*?maxLength=\{NOTIFICATION_MESSAGE_MAX\}/);
  assert.match(notifForm, /validationSchema=\{titleRules\}/);
  assert.match(notifForm, /validationSchema=\{messageRules\}/);
  assert.equal(notifForm.match(/errors=\{errors\}/g)?.length, 2);
});

test("recipients: SMS status and names come from the contract helpers", () => {
  assert.equal(recipients.match(/recipientSmsStatus\(item, channel\)/g)?.length, 2);
  assert.equal(recipients.match(/recipientDisplayName\(item\.user\)/g)?.length, 2);
  assert.doesNotMatch(recipients, /firstName \+ " " \+/);
  assert.doesNotMatch(recipients, /item\.smsSent\s*\?\s*item\.smsError/);
  assert.match(detailPage, /<NotifUsersListTable data=\{recipients\} channel=\{channel\} \/>/);
  assert.match(detailPage, /onRetry=\{\(\) => refetch\(\)\}/);
  assert.doesNotMatch(detailPage, /ًROLE/);
});
