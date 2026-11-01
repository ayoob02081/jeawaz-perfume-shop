// NotifForm recipient picker wiring. Narrow source checks: there is no DOM
// test environment; behaviour lives in utils/entityPickerContract.mjs.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const notifForm = read("./NotifForm.jsx");
const actionButtons = read("../../_components/ActionButtons.jsx");
const useNotification = read("../../../../../hooks/useNotification.js");

test("the raw user-ID input is gone", () => {
  assert.doesNotMatch(notifForm, /شناسه کاربران/);
  assert.doesNotMatch(notifForm, /name="userIds"/);
  assert.doesNotMatch(notifForm, /\.split\(","\)/);
});

test("the user picker renders outside the form", () => {
  const formEnd = notifForm.lastIndexOf("</form>");
  assert.ok(formEnd > 0);
  assert.ok(notifForm.indexOf("<UserPicker") > formEnd);
});

test("USER recipients are required and sent as IDs; ALL omits them", () => {
  assert.match(notifForm, /values\.target !== NOTIFICATION_TARGETS\.USER \|\|\s+value\.length > 0/);
  assert.match(notifForm, /\.\.\.buildNotificationTargetPayload\(/);
});

test("notification submit navigates only after a confirmed success", () => {
  // sendNotification is react-query's mutate: it returns before the server
  // answers, so awaiting it and navigating would leave on failure too.
  const sendHook = useNotification.slice(
    useNotification.indexOf("export function useSendNotification"),
    useNotification.indexOf("export function useGetAdminNotifications"),
  );
  assert.match(sendHook, /mutate: sendNotification/);
  assert.match(sendHook, /onError: \(error\) => showApiError\(error\)/);
  assert.doesNotMatch(sendHook, /router|navigate/);

  // Every send goes through `send`, which navigates only from onSuccess, to
  // the admin list (a fixed route, not history: the form may have been
  // opened directly); nothing navigates on error.
  const send = notifForm.slice(
    notifForm.indexOf("const send ="),
    notifForm.indexOf("const onSubmit"),
  );
  assert.ok(send.length > 0);
  assert.doesNotMatch(notifForm, /await sendNotification/);
  assert.match(
    send,
    /sendNotification\(payload, \{\s*onSuccess: \(\) => router\.replace\(ADMIN_NOTIFICATIONS_PATH\),/,
  );
  assert.equal(notifForm.match(/router\./g)?.length, 1);
  assert.doesNotMatch(send, /onError/);
  assert.equal(notifForm.match(/sendNotification\(/g)?.length, 1);
  // The only "back" is the shared ActionButtons' non-submitting button.
  assert.doesNotMatch(notifForm, /router\.back\(\)/);
  assert.match(notifForm, /<ActionButtons\b/);
  assert.equal(actionButtons.match(/router\.back\(\)/g)?.length, 1);
  assert.match(
    actionButtons,
    /type="button"\s+onClick=\{\(\) => router\.back\(\)\}/,
  );

  // The picker wiring is unchanged.
  assert.match(notifForm, /onConfirm=\{usersField\.onChange\}/);
  assert.match(notifForm, /\.\.\.buildNotificationTargetPayload\(\{\s+target: data\.target,\s+selectedUsers: data\.selectedUsers,/);
});
