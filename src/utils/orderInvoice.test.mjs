import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import {
  PRINTABLE_ORDER_STATUSES,
  buildInvoiceView,
  canPrintInvoice,
  getInvoiceHref,
  waitForDocumentFonts,
} from "./orderInvoice.mjs";
import { resolvePaymentResult } from "./paymentFlowContract.mjs";
import { renderUserStatuses } from "../constants/orderStatus.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const invoicePage = read("../app/(profile)/profile/orders/[id]/invoice/page.jsx");
const singleOrderPage = read("../components/SingleOrderPage.jsx");
const paymentResult = read("../app/(user)/payment/result/_components/PaymentResult.jsx");
const rootLayout = read("../app/layout.jsx");
const profileLayout = read("../app/(profile)/profile/layout.jsx");
const globalsCss = read("../app/globals.css");

// Shape of GET /orders/:id (backend OrderMapper.toResponse).
const paidOrder = () => ({
  id: 41,
  orderNumber: "JW-1405-0041",
  status: "PAID",
  orderDate: "2026-09-20T10:00:00.000Z",
  totalItems: 3,
  customer: { id: 5, firstName: "سارا", lastName: "رضایی", phone: "09120000000" },
  payment: { status: "SUCCESS", gateway: "zarinpal", paidAt: "2026-09-20T10:05:00.000Z" },
  dates: { created: "2026-09-20T10:00:00.000Z", paid: "2026-09-20T10:05:00.000Z", printed: null, shipped: null, delivered: null },
  items: [
    { id: 1, productId: 9, perTitle: "عطر نمونه", enTitle: "Sample Scent", image: "/x.webp", quantity: 2, price: 450000, lineTotal: 900000, variantType: "decant", volume: 10 },
    { id: 2, productId: 12, perTitle: "عطر دوم", enTitle: "Second Scent", image: null, quantity: 1, price: 3200000, lineTotal: 3200000, variantType: "sealed", volume: 100 },
  ],
  // As the backend stores it: subtotal = Σ lineTotal (after product discount),
  // grandTotal = subtotal - couponDiscount + shippingCost, and the mapper's
  // itemsTotal = subtotal + productDiscount (gross, before any discount).
  pricing: { itemsTotal: 4300000, productDiscount: 200000, couponDiscount: 100000, subtotal: 4100000, shippingCost: 150000, grandTotal: 4150000 },
  shipping: { method: "post", address: "تهران ، تهران ، خیابان نمونه", postalCode: "1234567890", receiver: "علی رضایی", phone: "09121111111" },
  trackingCode: null,
});

test("paid statuses are printable", () => {
  assert.deepEqual(PRINTABLE_ORDER_STATUSES, ["PAID", "READY_TO_PRINT", "PRINTED", "SHIPPED"]);
  for (const status of PRINTABLE_ORDER_STATUSES) assert.equal(canPrintInvoice(status), true);
});

test("pending, cancelled, expired and unknown statuses are not printable", () => {
  for (const status of ["PENDING", "CANCELLED", "EXPIRED", "DELIVERED", "", null, undefined]) {
    assert.equal(canPrintInvoice(status), false);
  }
});

test("regression: printable statuses are the raw statuses GET /orders/:id returns for paid orders", () => {
  // The backend mapper passes order.status through unchanged; the invoice
  // agrees with PaymentResult on which of those mean a finalized payment.
  for (const status of ["PENDING", "PAID", "READY_TO_PRINT", "PRINTED", "SHIPPED", "CANCELLED", "EXPIRED"]) {
    const paid = resolvePaymentResult({ order: { id: 1, status } }).state === "success";
    assert.equal(canPrintInvoice(status), paid, status);
  }
  // CONFIRMED is the orders-list display group for READY_TO_PRINT/PRINTED,
  // which are printable; gating must use the raw status, not that group.
  assert.equal(renderUserStatuses("READY_TO_PRINT"), "CONFIRMED");
  assert.equal(renderUserStatuses("PRINTED"), "CONFIRMED");
  assert.doesNotMatch(singleOrderPage, /canPrintInvoice\(\s*renderUserStatuses/);
});

test("invoice href targets the customer order route", () => {
  assert.equal(getInvoiceHref(41), "/profile/orders/41/invoice");
});

test("item rows use the purchase-time variantType and volume", () => {
  const [decant, sealed] = buildInvoiceView(paidOrder()).items;
  assert.equal(decant.variantLabel, "دکانت ۱۰ میل");
  assert.equal(sealed.variantLabel, "پلمپ ۱۰۰ میل");
});

test("item rows preserve title, quantity, unit price and line total", () => {
  const [decant] = buildInvoiceView(paidOrder()).items;
  assert.deepEqual(decant, {
    id: 1,
    title: "عطر نمونه",
    subtitle: "Sample Scent",
    variantLabel: "دکانت ۱۰ میل",
    quantity: 2,
    unitPrice: 450000,
    lineTotal: 900000,
  });
});

test("a missing variant or title does not crash", () => {
  const order = paidOrder();
  order.items = [
    { id: 3, perTitle: null, enTitle: "Only English", quantity: 1, price: 1000, lineTotal: 1000, variantType: null, volume: null },
    null,
    // A type without a volume must not render "دکانت  میل".
    { id: 4, perTitle: "عطر", enTitle: null, quantity: 1, price: 1000, lineTotal: 1000, variantType: "decant", volume: null },
  ];
  const [item, empty, typeOnly] = buildInvoiceView(order).items;
  assert.equal(item.variantLabel, null);
  assert.equal(item.title, "Only English");
  assert.equal(item.subtitle, null);
  assert.equal(empty.title, null);
  assert.equal(empty.quantity, null);
  assert.equal(typeOnly.variantLabel, null);
  assert.equal(typeOnly.subtitle, null);
});

test("totals follow backend pricing semantics and add up to grandTotal", () => {
  const order = paidOrder();
  const view = buildInvoiceView(order);
  assert.deepEqual(
    view.totals.map(({ key, amount }) => [key, amount]),
    [
      ["subtotal", 4100000],
      ["productDiscount", 200000],
      ["couponDiscount", 100000],
      ["shippingCost", 150000],
    ],
  );
  assert.equal(view.grandTotal, 4150000);
  // The goods total is the sum of the invoice line totals (unit prices are
  // already product-discounted, so that discount is shown as applied).
  assert.equal(view.items.reduce((sum, item) => sum + item.lineTotal, 0), 4100000);
  assert.match(view.totals[1].label, /اعمال‌شده در قیمت‌ها/);
  // Only the coupon and shipping change the payable amount.
  const row = (key) => view.totals.find((t) => t.key === key)?.amount ?? 0;
  assert.equal(row("subtotal") - row("couponDiscount") + row("shippingCost"), view.grandTotal);
  // The invoice totals start from subtotal (matching the line totals); the
  // gross pricing.itemsTotal is not one of its rows.
  assert.ok(!view.totals.some(({ key, amount }) => key === "itemsTotal" || amount === order.pricing.itemsTotal));
});

test("zero discounts are omitted and zero shipping is kept", () => {
  const order = paidOrder();
  order.pricing = { itemsTotal: 900000, productDiscount: 0, couponDiscount: 0, subtotal: 900000, shippingCost: 0, grandTotal: 900000 };
  const view = buildInvoiceView(order);
  assert.deepEqual(view.totals.map(({ key, amount }) => [key, amount]), [["subtotal", 900000], ["shippingCost", 0]]);
  assert.equal(view.grandTotal, 900000);
});

test("buyer lines are dropped when they repeat the receiver", () => {
  const order = paidOrder();
  order.shipping = { ...order.shipping, receiver: "سارا رضایی", phone: "+98 912 000 0000" };
  assert.equal(buildInvoiceView(order).customer, null);
  // A different phone (or name) keeps the buyer lines.
  order.shipping.phone = "09121111111";
  assert.deepEqual(buildInvoiceView(order).customer, { name: "سارا رضایی", phone: "09120000000" });
});

test("customer, shipping and payment come from the real response", () => {
  const view = buildInvoiceView(paidOrder());
  assert.equal(view.orderNumber, "JW-1405-0041");
  assert.equal(view.orderDate, "2026-09-20T10:00:00.000Z");
  assert.deepEqual(view.customer, { name: "سارا رضایی", phone: "09120000000" });
  assert.deepEqual(view.shipping, {
    receiver: "علی رضایی",
    phone: "09121111111",
    address: "تهران ، تهران ، خیابان نمونه",
    postalCode: "1234567890",
    methodLabel: "پست پیشتاز",
  });
  assert.deepEqual(view.payment, { statusLabel: "پرداخت شده", gatewayLabel: "زرین‌پال", paidAt: "2026-09-20T10:05:00.000Z" });
  assert.equal(view.trackingCode, null);
});

test("payment state follows the Order status, not the latest attempt", () => {
  const failedAttempt = { ...paidOrder(), payment: { status: "FAILED", gateway: "zarinpal", paidAt: null } };
  assert.deepEqual(buildInvoiceView(failedAttempt).payment, {
    statusLabel: "پرداخت شده",
    gatewayLabel: null,
    paidAt: "2026-09-20T10:05:00.000Z",
  });
  const pending = buildInvoiceView({ ...paidOrder(), status: "PENDING" });
  assert.equal(pending.printable, false);
  assert.equal(pending.payment.statusLabel, null);
});

test("nullable customer, shipping, payment and pricing fields do not crash", () => {
  assert.equal(buildInvoiceView(null), null);
  assert.equal(buildInvoiceView(undefined), null);
  const view = buildInvoiceView({ id: 7, status: "SHIPPED", customer: null, shipping: null, payment: null, pricing: null, items: null, trackingCode: "  TX-9 " });
  assert.equal(view.printable, true);
  assert.equal(view.customer, null);
  assert.deepEqual(view.shipping, { receiver: null, phone: null, address: null, postalCode: null, methodLabel: null });
  assert.deepEqual(view.payment, { statusLabel: "پرداخت شده", gatewayLabel: null, paidAt: null });
  assert.deepEqual(view.items, []);
  assert.deepEqual(view.totals.map(({ key, amount }) => [key, amount]), [["subtotal", null], ["shippingCost", null]]);
  assert.equal(view.grandTotal, null);
  assert.equal(view.trackingCode, "TX-9");
  assert.equal(buildInvoiceView({ ...paidOrder(), shipping: { method: "courier" } }).shipping.methodLabel, "courier");
});

test("font readiness waits for document.fonts.ready and falls back safely", async () => {
  let resolved = false;
  const ready = new Promise((resolve) => setTimeout(() => { resolved = true; resolve(); }, 5));
  await waitForDocumentFonts({ fonts: { ready } });
  assert.equal(resolved, true);
  await waitForDocumentFonts({});
  await waitForDocumentFonts(undefined);
  await waitForDocumentFonts({ fonts: { ready: Promise.reject(new Error("font load failed")) } });
});

test("invoice page loads the real order through the authorized customer hook", () => {
  assert.match(invoicePage, /const \{ id \} = useParams\(\)/);
  assert.match(invoicePage, /useGetOrderById\(id\)/);
  assert.doesNotMatch(invoicePage, /useGetOrderById\(\s*["'\d]/);
  assert.doesNotMatch(invoicePage, /Admin|admin|[Tt]imeline|useMutation|Status\(/);
  assert.match(invoicePage, /buildInvoiceView\(order\)/);
  assert.match(invoicePage, /item\.variantLabel/);
});

test("print only runs from an explicit click on a loaded, printable invoice", () => {
  assert.equal(invoicePage.match(/window\.print\(\)/g)?.length, 1);
  assert.doesNotMatch(invoicePage, /useEffect|setTimeout|beforeprint|afterprint/);
  const handler = invoicePage.slice(invoicePage.indexOf("const handlePrint"), invoicePage.indexOf("if (isLoading)"));
  assert.match(handler, /if \(!invoice\?\.printable \|\| preparingRef\.current\) return;/);
  assert.ok(handler.indexOf("await waitForDocumentFonts()") < handler.indexOf("window.print()"));
  assert.match(handler, /finally \{\s*preparingRef\.current = false;/);

  const button = invoicePage.indexOf("onClick={handlePrint}");
  for (const guard of ["if (isLoading)", "if (!invoice)", "if (!invoice.printable)"]) {
    assert.ok(invoicePage.indexOf(guard) > -1 && invoicePage.indexOf(guard) < button, guard);
  }
  const buttonTag = invoicePage.slice(invoicePage.lastIndexOf("<button", button), invoicePage.indexOf("</button>", button));
  assert.match(buttonTag, /disabled=\{isPreparing\}/);
  assert.match(buttonTag, /print:hidden/);
  assert.match(buttonTag, /چاپ فاکتور/);
});

test("unpaid and error states offer no print and link back", () => {
  const unpaid = invoicePage.slice(invoicePage.indexOf("if (!invoice.printable)"), invoicePage.indexOf("const { customer, shipping, payment }"));
  assert.match(unpaid, /چاپ فاکتور پس از تکمیل پرداخت سفارش امکان‌پذیر است/);
  assert.match(unpaid, /href=\{`\/profile\/orders\/\$\{id\}`\}/);
  const failed = invoicePage.slice(invoicePage.indexOf("if (!invoice)"), invoicePage.indexOf("if (!invoice.printable)"));
  assert.match(failed, /<Error \/>/);
  assert.match(failed, /href="\/profile\/orders"/);
  for (const state of [unpaid, failed]) assert.doesNotMatch(state, /handlePrint|<button/);
});

test("invoice is a print-safe RTL document without images or hardcoded data", () => {
  assert.match(invoicePage, /<article\s+dir="rtl"/);
  assert.match(invoicePage, /bg-white text-black font-display/);
  assert.match(invoicePage, /<table[\s\S]*<thead>[\s\S]*<tbody>/);
  assert.match(invoicePage, /className="break-inside-avoid"/);
  assert.match(invoicePage, /invoice-totals[^"]*break-inside-avoid/);
  assert.doesNotMatch(invoicePage, /AppImage|<img|item\.image|AdaptiveOverlayPage|fixed|h-dvh/);
  assert.doesNotMatch(invoicePage, /موفق|۱ روز کاری|refId|console\./);
  assert.doesNotMatch(invoicePage, /\d{5,}/);
  // Missing or unparsable dates render the empty marker, never "Invalid Date".
  assert.match(invoicePage, /value && !Number\.isNaN\(new Date\(value\)\.getTime\(\)\)/);
  assert.match(invoicePage, /\{customer\?\.name && \(/);
});

test("window.print is only called from the customer invoice page", () => {
  const root = new URL("../", import.meta.url);
  const callers = readdirSync(root, { recursive: true })
    .filter((file) => /\.(jsx?|mjs)$/.test(file) && !file.endsWith(".test.mjs"))
    .filter((file) => readFileSync(new URL(file.replaceAll("\\", "/"), root), "utf8").includes("window.print"))
    .map((file) => file.replaceAll("\\", "/"));
  assert.deepEqual(callers, ["app/(profile)/profile/orders/[id]/invoice/page.jsx"]);
});

test("SingleOrderPage links customers of paid orders to the invoice and hides it from admins", () => {
  assert.match(singleOrderPage, /\{!admin && canPrintInvoice\(order\?\.status\) && \(\s*<Link\s+href=\{getInvoiceHref\(order\.id\)\}/);
  assert.match(singleOrderPage, /مشاهده فاکتور/);
  assert.doesNotMatch(singleOrderPage, /<button/);
  assert.doesNotMatch(singleOrderPage, /window\.print|\/admin\/[^"]*invoice/);
});

test("PaymentResult keeps its removed invoice button removed", () => {
  assert.doesNotMatch(paymentResult, /فاکتور|invoice|window\.print/);
});

test("site chrome is hidden in print and the page is A4", () => {
  assert.match(rootLayout, /<div className="contents print:hidden">\s*<Header \/>\s*<Sidebars \/>\s*<\/div>/);
  assert.match(rootLayout, /<div className="contents print:hidden">\s*<Footer \/>\s*<MobilePannel \/>\s*<\/div>/);
  assert.match(rootLayout, /bg-stroke-0! print:bg-white!/);
  assert.match(profileLayout, /<UserSidebar className="max-lg:hidden print:hidden" \/>/);
  // The profile container neither caps the A4 width nor paginates as flex.
  assert.match(profileLayout, /container mx-auto[^"]*print:block print:max-w-none/);
  assert.match(globalsCss, /@page \{\s*size: A4;\s*margin: 12mm;\s*\}/);
  assert.match(globalsCss, /\.invoice thead \{\s*display: table-header-group;/);
  assert.doesNotMatch(globalsCss, /visibility:\s*hidden/);
});
