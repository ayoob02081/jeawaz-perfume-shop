import assert from "node:assert/strict";
import test from "node:test";
import { SITE_ORIGIN } from "../lib/seo.mjs";
import {
  ADMIN_ORDER_LINK_LABEL,
  TRUSTED_NOTIFICATION_ORIGIN,
  parseNotificationMessage,
} from "./notificationMessage.mjs";
import { adminOrderDetailHref } from "./adminOrdersListContract.mjs";

// The customer inbox, unless a test names another reader.
const parse = (message, audience = "customer") =>
  parseNotificationMessage(message, { audience });
const links = (message, audience) =>
  parse(message, audience).filter((s) => s.type === "orderLink");
const joined = (message, audience) =>
  parse(message, audience).map((s) => s.text).join("");

// The exact shape NotificationTemplateService.orderPaid builds.
const paid = (id) =>
  [
    "جیاواز | پرداخت سفارش JW-1405-0041 با موفقیت انجام شد.",
    "ممنون از خریدت!",
    "جزئیات سفارش:",
    `https://jeawaz.com/profile/orders/${id}`,
  ].join("\n");

test("the trusted origin is the production storefront origin", () => {
  assert.equal(TRUSTED_NOTIFICATION_ORIGIN, "https://jeawaz.com");
  assert.equal(TRUSTED_NOTIFICATION_ORIGIN, SITE_ORIGIN);
});

test("a backend order notification links its order page, keeping every line", () => {
  assert.deepEqual(parse(paid(41)), [
    {
      type: "text",
      text: "جیاواز | پرداخت سفارش JW-1405-0041 با موفقیت انجام شد.\nممنون از خریدت!\nجزئیات سفارش:\n",
    },
    {
      type: "orderLink",
      text: "https://jeawaz.com/profile/orders/41",
      label: "https://jeawaz.com/profile/orders/41",
      href: "/profile/orders/41",
      orderId: 41,
    },
  ]);
  // Rendered once, as the link itself: no duplicated URL text.
  assert.equal(joined(paid(41)), paid(41));
  assert.equal(joined(paid(41)).split("https://").length, 2);
});

test("single and multi-digit order ids up to the safe-integer limit", () => {
  for (const id of ["1", "7", "10", "41", "1234567", String(Number.MAX_SAFE_INTEGER)]) {
    const [link] = links(paid(id));
    assert.equal(link.href, `/profile/orders/${id}`);
    assert.equal(link.orderId, Number(id));
  }
  // Beyond it the id cannot be represented exactly: left as text.
  assert.deepEqual(links(paid("9007199254740993")), []);
  assert.equal(joined(paid("9007199254740993")), paid("9007199254740993"));
});

test("a link in the middle of a line, and several links, keep the text around them", () => {
  const message =
    "اول https://jeawaz.com/profile/orders/5 وسط\n\thttps://jeawaz.com/profile/orders/600 آخر";
  assert.deepEqual(
    parse(message).map((s) => [s.type, s.text]),
    [
      ["text", "اول "],
      ["orderLink", "https://jeawaz.com/profile/orders/5"],
      ["text", " وسط\n\t"],
      ["orderLink", "https://jeawaz.com/profile/orders/600"],
      ["text", " آخر"],
    ],
  );
  assert.equal(joined(message), message);
});

test("messages without a link are returned as one unchanged text segment", () => {
  for (const message of [
    "سفارش شما ارسال شد.",
    "خط اول\nخط دوم\n\nخط چهارم",
    "  فاصله‌های اول و آخر  ",
    "جزئیات سفارش:",
  ]) {
    assert.deepEqual(parse(message), [{ type: "text", text: message }]);
  }
});

test("missing or non-string messages render nothing", () => {
  for (const message of [undefined, null, "", 0, 41, {}, ["https://jeawaz.com/profile/orders/1"]]) {
    assert.deepEqual(parse(message), []);
  }
});

test("external, lookalike, malformed and script URLs stay plain text", () => {
  const rejected = [
    "http://jeawaz.com/profile/orders/1",
    "HTTPS://jeawaz.com/profile/orders/1",
    "https://JEAWAZ.com/profile/orders/1",
    "https://www.jeawaz.com/profile/orders/1",
    "https://admin.jeawaz.com/profile/orders/1",
    "https://jeawaz.com.evil.com/profile/orders/1",
    "https://evil-jeawaz.com/profile/orders/1",
    "https://evil.com/profile/orders/1",
    "https://jeawaz.co/profile/orders/1",
    "https://jeawaz.com@evil.com/profile/orders/1",
    "https://user@jeawaz.com/profile/orders/1",
    "https://jeawaz.com:8443/profile/orders/1",
    "https://jeawaz.com./profile/orders/1",
    "//jeawaz.com/profile/orders/1",
    "/profile/orders/1",
    "javascript:alert(1)",
    "javascript://jeawaz.com/profile/orders/1",
    "data:text/html,https://jeawaz.com/profile/orders/1",
    "https://evil.com/?next=https://jeawaz.com/profile/orders/1",
    "https://jeawaz.com/profile/orders/",
    "https://jeawaz.com/profile/orders/0",
    "https://jeawaz.com/profile/orders/007",
    "https://jeawaz.com/profile/orders/-1",
    "https://jeawaz.com/profile/orders/1.5",
    "https://jeawaz.com/profile/orders/1e3",
    "https://jeawaz.com/profile/orders/12abc",
    "https://jeawaz.com/profile/orders/abc",
    "https://jeawaz.com/profile/orders/۴۱",
    "https://jeawaz.com/profile/orders/1/",
    "https://jeawaz.com/profile/orders/1/../../admin",
    "https://jeawaz.com/profile/orders/1?x=1",
    "https://jeawaz.com/profile/orders/1#top",
    "https://jeawaz.com/profile/orders/1.",
    "https://jeawaz.com/profile/orders/1،",
    "https://jeawaz.com/profile/orders/1​",
    "https://jeawaz.com/profile/orders/1<script>",
    "https://jeawaz.com/profile/order/1",
    "https://jeawaz.com/Profile/orders/1",
    "https://jeawaz.com/admin/orders/1",
    "https://jeawaz.com//profile/orders/1",
    "https://jeawaz.com/profile/orders/1/timeline",
    "سفارش:https://jeawaz.com/profile/orders/1",
    "\"https://jeawaz.com/profile/orders/1\"",
    "(https://jeawaz.com/profile/orders/1)",
  ];
  for (const url of rejected) {
    for (const message of [url, `جزئیات سفارش:\n${url}`, `${url}\nپایان`]) {
      assert.deepEqual(links(message), [], `${JSON.stringify(message)} must not link`);
      assert.equal(joined(message), message);
    }
  }
});

test("markup and script-like content is kept verbatim as text, never as a link", () => {
  const message = [
    "<script>alert(1)</script>",
    '<img src=x onerror="alert(1)">',
    '<a href="javascript:alert(1)">https://jeawaz.com/profile/orders/1</a>',
    "&lt;b&gt; &amp; {{constructor}} ${process}",
    "https://jeawaz.com/profile/orders/9",
  ].join("\n");
  const segments = parse(message);
  assert.deepEqual(
    segments.map((s) => s.type),
    ["text", "orderLink"],
  );
  assert.equal(segments[1].href, "/profile/orders/9");
  assert.equal(joined(message), message);
});

test("every produced href is a same-site relative order path, for arbitrary input", () => {
  const pieces = [
    "https://jeawaz.com/profile/orders/", "1", "23", "0", "x", " ", "\n", "/",
    "?", "#", ".", "<", "javascript:", "https://evil.com", "سفارش", "۱", "‌",
  ];
  let seed = 7;
  const random = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  for (let i = 0; i < 3000; i++) {
    const length = 1 + Math.floor(random() * 10);
    const message = Array.from({ length }, () => pieces[Math.floor(random() * pieces.length)]).join("");
    assert.equal(joined(message), message);
    for (const link of links(message)) {
      assert.match(link.href, /^\/profile\/orders\/[1-9]\d*$/);
      assert.equal(link.text, `https://jeawaz.com${link.href}`);
      assert.ok(Number.isSafeInteger(link.orderId) && link.orderId > 0);
    }
  }
});

test("admins get the admin order detail for the same numeric Order id", () => {
  assert.deepEqual(links(paid(41), "admin"), [
    {
      type: "orderLink",
      text: "https://jeawaz.com/profile/orders/41",
      label: ADMIN_ORDER_LINK_LABEL,
      href: "/admin/orders/41",
      orderId: 41,
    },
  ]);
  // The admin route the list already uses for that id (GET /orders/admin/:id).
  assert.equal(links(paid(41), "admin")[0].href, adminOrderDetailHref(41));
  assert.equal(links(paid(1234567), "admin")[0].href, "/admin/orders/1234567");
  assert.equal(joined(paid(41), "admin"), paid(41));
  // Never the customer route for an admin, never the admin route for a customer.
  assert.ok(links(paid(41), "admin").every((link) => !link.href.startsWith("/profile/")));
  assert.ok(links(paid(41), "customer").every((link) => !link.href.startsWith("/admin/")));
});

test("admins get the same strict parsing: rejected URLs stay text", () => {
  for (const url of [
    "https://evil.com/profile/orders/1",
    "https://jeawaz.com.evil.com/profile/orders/1",
    "https://jeawaz.com/admin/orders/1",
    "https://jeawaz.com/profile/orders/1?x=1",
    "https://jeawaz.com/profile/orders/0",
    "javascript:alert(1)",
  ]) {
    assert.deepEqual(links(`جزئیات سفارش:\n${url}`, "admin"), [], url);
  }
});

test("an unknown or missing audience renders the message as plain text", () => {
  for (const audience of [undefined, null, "", "user", "ADMIN", "guest", "constructor", "__proto__", "toString"]) {
    assert.deepEqual(
      parseNotificationMessage(paid(41), { audience }),
      [{ type: "text", text: paid(41) }],
      String(audience),
    );
  }
  assert.deepEqual(parseNotificationMessage(paid(41)), [{ type: "text", text: paid(41) }]);
});

test("an admin link names its real destination; a customer link shows the URL it opens", () => {
  assert.equal(ADMIN_ORDER_LINK_LABEL, "مشاهده سفارش در پنل ادمین");
  const [admin] = links(paid(41), "admin");
  assert.equal(admin.label, "مشاهده سفارش در پنل ادمین");
  assert.equal(admin.href, "/admin/orders/41");
  // The message data itself is untouched: the URL text survives.
  assert.equal(admin.text, "https://jeawaz.com/profile/orders/41");
  assert.equal(joined(paid(41), "admin"), paid(41));
  // The admin label never shows the customer URL it does not open.
  assert.doesNotMatch(admin.label, /https?:|\/profile\//);
  for (const id of ["7", "1234567"]) {
    const [customer] = links(paid(id), "customer");
    assert.equal(customer.label, customer.text);
    assert.equal(customer.label, `https://jeawaz.com${customer.href}`);
  }
});
