// Customer inbox and realtime wiring. Narrow source checks: there is no DOM
// test environment; behaviour lives in utils/notificationsContract.mjs and
// utils/notificationSocketSync.mjs.

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const path = (file) => new URL(file, import.meta.url);
const read = (file) => readFileSync(path(file), "utf8");
const typePage = read("./NotifTypePage.jsx");
const notifLayout = read("./NotifLayout.jsx");
const singlePage = read("./SingleNotifPage.jsx");
const profileDetail = read("../app/(profile)/profile/notifs/[type]/[id]/page.jsx");
const hooks = read("../hooks/useNotification.js");
const socketHook = read("../hooks/useNotificationSocket.js");
const services = read("../services/notificationServices.js");
const mobilePanel = read("../app/MobilePannel.jsx");
const profileLinks = read("./ProfileLinks.jsx");

test("type tabs are filtered by the server and cached per type", () => {
  assert.match(typePage, /useGetNotifications\(type\)/);
  assert.doesNotMatch(typePage, /notification\?\.type === type/);
  assert.match(hooks, /list: \(type, limit = USER_NOTIFICATION_PAGE_LIMIT\) => \[\s*\.\.\.notificationKeys\.lists\(\),\s*toNotificationTypeFilter\(type\) \?\? "ALL",/);
  assert.match(hooks, /queryKey: notificationKeys\.list\(type, limit\)/);
  assert.match(hooks, /getMyNotificationsApi\(\{\s*page: pageParam,\s*limit,\s*type,\s*\}\)/);
  assert.match(services, /params: buildMyNotificationsParams\(\{ page, limit, type \}\)/);
});

test("the empty state follows the server result; an error is an error, with refetch", () => {
  assert.match(typePage, /if \(isError && !notifications\.length\) \{\s*return <Error onRetry=\{\(\) => refetch\(\)\} \/>;/);
  assert.match(typePage, /notifications\.length > 0 \? \(/);
  assert.match(typePage, /اعلانی وجود ندارد!/);
  // The observer re-arms after every page instead of stalling.
  assert.match(typePage, /\[fetchNextPage, hasNextPage, isFetchingNextPage, loadedPages\]/);
});

test("the inbox is customer-only: no admin routes or admin mutations", () => {
  assert.doesNotMatch(typePage, /\/admin|useDeleteNotification/);
  assert.doesNotMatch(notifLayout, /\/admin/);
  assert.match(typePage, /router\.push\(`\/profile\/notifs\/\$\{type\}\/\$\{id\}`\)/);
});

test("detail retry refetches the client query; opening never leaves a rejection unhandled", () => {
  assert.match(singlePage, /<Error onRetry=\{onRetry\} \/>/);
  assert.match(profileDetail, /onRetry=\{\(\) => refetch\(\)\}/);
  assert.match(profileDetail, /openNotification\(data\.id\)\.catch\(\(\) => \{\}\)/);
});

test("the unread count is never requested for a guest and refetches on focus", () => {
  const unread = hooks.slice(
    hooks.indexOf("export function useUnreadNotificationsCount"),
    hooks.indexOf("export function useOpenNotification"),
  );
  assert.match(unread, /const \{ isAuthenticated \} = useAuth\(\);/);
  assert.match(unread, /enabled: isAuthenticated,/);
  assert.match(unread, /refetchOnWindowFocus: true,/);
  // Every caller goes through the gated hook.
  for (const source of [mobilePanel, profileLinks, notifLayout]) {
    assert.match(source, /useUnreadNotificationsCount\(\)/);
    assert.doesNotMatch(source, /getUnreadNotificationsCountApi/);
  }
});

test("the socket hook delegates to the sync controller and cleans up", () => {
  assert.match(socketHook, /if \(!enabled\) \{\s*disconnectSocket\(\);\s*return;\s*\}/);
  assert.match(socketHook, /createNotificationSocketSync\(\{\s*socket: connectSocket\(\),\s*queryClient,\s*keys: notificationKeys,/);
  assert.match(socketHook, /refreshAuth: getUnreadNotificationsCountApi,/);
  assert.match(socketHook, /return \(\) => \{\s*sync\.stop\(\);\s*disconnectSocket\(\);\s*\};/);
  assert.match(socketHook, /\}, \[enabled, queryClient\]\);/);
});

test("the runner-less Jest socket test is replaced by runnable node tests", () => {
  assert.equal(existsSync(path("../hooks/useNotificationSocket.test.js")), false);
  assert.equal(existsSync(path("../utils/notificationSocketSync.test.mjs")), true);
});
