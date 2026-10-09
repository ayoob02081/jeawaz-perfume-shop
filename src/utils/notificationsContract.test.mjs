import test from "node:test";
import assert from "node:assert/strict";
import {
  ADMIN_NOTIFICATIONS_PATH,
  ADMIN_NOTIFICATION_PAGE_LIMIT,
  ADMIN_NOTIFICATION_SEARCH_MAX,
  NOTIFICATION_MESSAGE_MAX,
  NOTIFICATION_TITLE_MAX,
  buildAdminNotificationListParams,
  buildMyNotificationsParams,
  getAdminNotificationTotalPages,
  getNotificationRowNumber,
  getNotificationSendConfirmation,
  hasActiveNotificationFilters,
  notificationCreatedMessage,
  notificationStatsSummary,
  notificationTargetLabel,
  parseAdminNotificationQuery,
  recipientDisplayName,
  recipientSmsStatus,
  validateNotificationText,
} from "./notificationsContract.mjs";

const params = (entries) => new URLSearchParams(entries);

test("the customer inbox sends the selected type; ALL and unknown types send none", () => {
  assert.deepEqual(buildMyNotificationsParams({ page: 2, limit: 10, type: "DISCOUNT" }), {
    page: 2,
    limit: 10,
    type: "DISCOUNT",
  });
  assert.deepEqual(buildMyNotificationsParams({ type: "ALL" }), { page: 1, limit: 10 });
  assert.deepEqual(buildMyNotificationsParams({ type: "PROMO" }), { page: 1, limit: 10 });
});

test("the admin list query comes from the route type and the URL", () => {
  assert.deepEqual(
    parseAdminNotificationQuery(
      "CAMPAIGN",
      params({ page: "3", channel: "SMS", target: "USER", search: "  spring   sale " }),
    ),
    { page: 3, type: "CAMPAIGN", channel: "SMS", target: "USER", search: "spring sale" },
  );
  // ALL, invalid page and unknown filters are dropped.
  assert.deepEqual(
    parseAdminNotificationQuery("ALL", params({ page: "0", channel: "EMAIL", target: "x", search: "  " })),
    { page: 1, type: undefined, channel: undefined, target: undefined, search: undefined },
  );
});

test("admin list params carry only what GET /admin/notifications applies", () => {
  assert.deepEqual(
    buildAdminNotificationListParams({
      page: 2,
      type: "SYSTEM",
      channel: "IN_APP",
      target: "ALL",
      search: " 50%_off ",
      from: "2026-01-01",
    }),
    {
      page: 2,
      limit: ADMIN_NOTIFICATION_PAGE_LIMIT,
      type: "SYSTEM",
      channel: "IN_APP",
      target: "ALL",
      search: "50%_off",
    },
  );
  assert.deepEqual(buildAdminNotificationListParams({ type: "ALL", search: "" }), {
    page: 1,
    limit: ADMIN_NOTIFICATION_PAGE_LIMIT,
  });
  const long = buildAdminNotificationListParams({ search: "a".repeat(150) });
  assert.equal(long.search.length, ADMIN_NOTIFICATION_SEARCH_MAX);
});

test("list helpers: filters, pages, row numbers, stats", () => {
  assert.equal(hasActiveNotificationFilters({ type: "SYSTEM" }), false);
  assert.equal(hasActiveNotificationFilters({ search: "x" }), true);
  assert.equal(getAdminNotificationTotalPages({ meta: { totalPages: 4 } }), 4);
  assert.equal(getAdminNotificationTotalPages(undefined), 0);
  assert.equal(getNotificationRowNumber(3, 15, 0), 31);

  const stats = { totalRecipients: 4, readCount: 1, readPercentage: 25, smsSuccess: 2, smsFailed: 1 };
  assert.deepEqual(notificationStatsSummary({ channel: "BOTH", stats }), {
    recipients: 4,
    read: 1,
    readPercentage: 25,
    sms: { success: 2, failed: 1 },
  });
  assert.equal(notificationStatsSummary({ channel: "IN_APP", stats }).sms, null);
  assert.equal(notificationTargetLabel("ROLE"), "نقش مربوطه");
});

test("SMS status: a failed send shows its error; a sent one is never an error", () => {
  const failed = { smsSent: false, smsError: "Kavenegar API error: 412", smsSentAt: null };
  assert.deepEqual(recipientSmsStatus(failed, "BOTH"), {
    kind: "failed",
    label: "ناموفق",
    error: "Kavenegar API error: 412",
  });
  assert.deepEqual(recipientSmsStatus({ smsSent: true, smsSentAt: "2026-10-09T10:00:00Z" }, "SMS"), {
    kind: "sent",
    label: "فرستاده شده",
    sentAt: "2026-10-09T10:00:00Z",
  });
  assert.equal(recipientSmsStatus({ smsSent: false, smsError: null }, "SMS").kind, "pending");
  // An in-app-only notification sends no SMS at all.
  assert.equal(recipientSmsStatus(failed, "IN_APP").kind, "none");
});

test("a recipient without a name never renders as 'null null'", () => {
  assert.equal(recipientDisplayName({ id: 1, firstName: null, lastName: null }), "اسمی ثبت نشده");
  assert.equal(recipientDisplayName({ id: 1, firstName: "علی", lastName: null }), "علی");
  assert.equal(recipientDisplayName({ id: 1, firstName: "علی", lastName: "رضایی" }), "علی رضایی");
  assert.equal(recipientDisplayName(undefined), "اسمی ثبت نشده");
});

test("title and message are validated trimmed, with the backend limits", () => {
  const title = { label: "عنوان اعلان", min: 2, max: NOTIFICATION_TITLE_MAX };
  assert.equal(validateNotificationText("   ", title), "عنوان اعلان الزامی است");
  assert.equal(validateNotificationText(" a ", title), "عنوان اعلان باید بین 2 تا 150 کاراکتر باشد");
  assert.equal(validateNotificationText("a".repeat(151), title), "عنوان اعلان باید بین 2 تا 150 کاراکتر باشد");
  assert.equal(validateNotificationText(` ${"a".repeat(150)} `, title), true);
  const message = { label: "متن اعلان", min: 2, max: NOTIFICATION_MESSAGE_MAX };
  assert.equal(validateNotificationText("م".repeat(1001), message), "متن اعلان باید بین 2 تا 1000 کاراکتر باشد");
  assert.equal(validateNotificationText("م".repeat(1000), message), true);
});

test("ALL and SMS/BOTH sends need confirmation; a selected-user in-app send does not", () => {
  assert.equal(getNotificationSendConfirmation({ target: "USER", channel: "IN_APP", recipientCount: 2 }), null);

  const all = getNotificationSendConfirmation({ target: "ALL", channel: "IN_APP" });
  assert.equal(all.title, "ارسال اعلان به همه کاربران");
  assert.match(all.audience, /همه حساب‌های کاربری سایت، از جمله مدیران و کاربران مسدود/);
  assert.equal(all.smsWarning, null);
  assert.equal(all.emphasize, false);

  const sms = getNotificationSendConfirmation({ target: "USER", channel: "SMS", recipientCount: 3 });
  assert.equal(sms.title, "ارسال پیامک");
  assert.equal(sms.audience, "۳ کاربر منتخب");
  assert.match(sms.smsWarning, /پیامک واقعی/);

  const allSms = getNotificationSendConfirmation({ target: "ALL", channel: "BOTH" });
  assert.equal(allSms.title, "ارسال پیامک به همه کاربران");
  assert.equal(allSms.channel, "سایت و پیامک");
  assert.equal(allSms.emphasize, true);
});

test("success lands on the admin management list", () => {
  assert.equal(ADMIN_NOTIFICATIONS_PATH, "/admin/notifs/ALL");
});

test("the success message says created, never delivered", () => {
  // The POST answers before SMS fan-out finishes.
  assert.equal(notificationCreatedMessage("IN_APP"), "اعلان ثبت شد");
  for (const channel of ["SMS", "BOTH"]) {
    const message = notificationCreatedMessage(channel);
    assert.match(message, /^اعلان ثبت شد؛/);
    assert.match(message, /جزئیات اعلان/);
  }
  for (const channel of ["IN_APP", "SMS", "BOTH", undefined]) {
    assert.doesNotMatch(notificationCreatedMessage(channel), /ارسال شد|موفقیت/);
  }
});
