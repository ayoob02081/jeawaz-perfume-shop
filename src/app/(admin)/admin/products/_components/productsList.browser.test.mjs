// Opt-in real-browser regression for the admin Products list: URL state,
// numbering, edit round trip, page correction and the mobile filter sheet.
// Run a synthetic loopback fixture API (identity `jeawaz-admin-products`,
// 123 generated products) and an isolated `next start` built against it,
// then set ADMIN_PRODUCTS_BROWSER_ORIGIN / _API / _CDP. Never a live API.
import test from "node:test";
import assert from "node:assert/strict";

const origin = process.env.ADMIN_PRODUCTS_BROWSER_ORIGIN;
const api = process.env.ADMIN_PRODUCTS_BROWSER_API;
const cdp = process.env.ADMIN_PRODUCTS_BROWSER_CDP;
const configured = Boolean(origin && api && cdp);

const FILTERS = "[data-admin-product-filters]";
const ascii = (text) => text.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

test("admin Products list: URL state, numbering, edit return and mobile filters", { skip: !configured, timeout: 300000 }, async (t) => {
  for (const address of [origin, api, cdp]) {
    assert(["127.0.0.1", "localhost"].includes(new URL(address).hostname), "Synthetic loopback targets only");
  }
  assert.deepEqual(await (await fetch(`${api}/__test/identity`)).json(), { fixture: "jeawaz-admin-products", synthetic: true });
  await fetch(`${api}/__test/reset`);

  const target = await (await fetch(`${cdp}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  t.after(async () => {
    ws.close();
    await fetch(`${cdp}/json/close/${target.id}`).catch(() => {});
  });
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

  let id = 0;
  const pending = new Map();
  const exceptions = [];
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Fetch.requestPaused") {
      const allowed = [origin, api].includes(new URL(message.params.request.url).origin);
      void send(allowed ? "Fetch.continueRequest" : "Fetch.failRequest",
        allowed ? { requestId: message.params.requestId } : { requestId: message.params.requestId, errorReason: "BlockedByClient" }).catch(() => {});
      return;
    }
    if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result);
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    pending.set(++id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Fetch.enable", { patterns: [{ urlPattern: "*" }] });

  const value = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const wait = async (expression, label) => {
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      if (await value(expression).catch(() => false)) return;
      await sleep(30);
    }
    throw new Error(`Timeout: ${label}; ${JSON.stringify(await value("({url: location.href, body: document.body.innerText.slice(0, 600)})"))}`);
  };
  const press = async (key, code, modifiers = 0) => {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key, code: key, windowsVirtualKeyCode: code, modifiers });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key, code: key, windowsVirtualKeyCode: code, modifiers });
  };
  // A real pointer click at the centre of the first visible match, once it
  // has stopped moving (paging starts a smooth scroll to the top).
  const click = async (selector, text) => {
    const locate = `(() => {
      const element = [...document.querySelectorAll(${JSON.stringify(selector)})]
        .find((e) => e.getClientRects().length && (${JSON.stringify(text ?? null)} === null || e.textContent.trim() === ${JSON.stringify(text ?? "")}));
      if (!element) throw new Error("missing " + ${JSON.stringify(`${selector} ${text ?? ""}`)});
      element.scrollIntoView({ block: "center", behavior: "instant" });
      const r = element.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`;
    let point = await value(locate);
    for (let stable = 0; stable < 3;) {
      await sleep(50);
      const next = await value(locate);
      stable = next.x === point.x && next.y === point.y ? stable + 1 : 0;
      point = next;
    }
    await send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
  };
  // Sets a visible control's value the way React observes user input.
  const setField = (scope, name, fieldValue) => value(`(() => {
    const element = [...document.querySelectorAll(${JSON.stringify(`${scope} [name="${name}"]`)})].find((e) => e.getClientRects().length);
    const proto = element.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(element, ${JSON.stringify(fieldValue)});
    element.dispatchEvent(new Event(element.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
    return true;
  })()`);
  const fieldValue = (scope, name) => value(`[...document.querySelectorAll(${JSON.stringify(`${scope} [name="${name}"]`)})].find((e) => e.getClientRects().length)?.value`);
  const listUrl = () => value("location.pathname + location.search");
  const rows = async () => (await value(`(() => {
    const table = [...document.querySelectorAll("table")].find((e) => e.getClientRects().length);
    return [...table.querySelectorAll("tbody tr")].map((row) => row.querySelector("td:nth-child(2)").textContent.trim());
  })()`)).map((text) => Number(ascii(text)));
  const firstTitle = () => value(`(() => {
    const table = [...document.querySelectorAll("table")].find((e) => e.getClientRects().length);
    return table.querySelector("tbody tr td:nth-child(3)").textContent.trim();
  })()`);
  const settled = (expected) => wait(`(() => {
    const table = [...document.querySelectorAll("table")].find((e) => e.getClientRects().length);
    return !!table && !document.body.innerText.includes("در حال به‌روزرسانی") &&
      [...table.querySelectorAll("tbody tr")].length > 0 &&
      ${expected ? `table.querySelector("tbody tr td:nth-child(2)").textContent.trim() === ${JSON.stringify(expected)}` : "true"};
  })()`, `list settled ${expected ?? ""}`);
  const persian = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
  const viewport = (width) => send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
  const goto = async (path) => { await send("Page.navigate", { url: origin + path }); };
  const historyLength = () => value("history.length");
  const results = [];

  /* ---------- desktop: numbering and paging ---------- */
  await viewport(1280);
  await goto("/admin/products");
  await settled(persian(123));
  let numbers = await rows();
  assert.equal(numbers.length, 12);
  assert.deepEqual(numbers, Array.from({ length: 12 }, (_, i) => 123 - i));
  await click("section button", persian(2));
  await wait(`location.search === "?page=2"`, "page 2 URL");
  await settled(persian(111));
  assert.deepEqual(await rows(), Array.from({ length: 12 }, (_, i) => 111 - i));
  await goto("/admin/products?page=11");
  await settled(persian(3));
  assert.deepEqual(await rows(), [3, 2, 1], "last page of 123 at 12 per page");
  results.push({ numbering: "page1 123..112, page2 111..100, page11 3..1" });

  /* ---------- filters, refresh, Back/Forward ---------- */
  await goto("/admin/products?page=4");
  await settled(persian(87));
  await setField(FILTERS, "brandId", "2");
  await click(`${FILTERS} button[type=submit]`, "اعمال فیلتر");
  await wait(`location.search === "?brandId=2"`, "filter resets the page");
  await settled(persian(41));
  await click("section button", persian(2));
  await wait(`location.search === "?brandId=2&page=2"`, "paging keeps the filter");
  await settled(persian(29));
  assert.deepEqual(await rows(), Array.from({ length: 12 }, (_, i) => 29 - i));
  await send("Page.reload");
  await settled(persian(29));
  assert.equal(await listUrl(), "/admin/products?brandId=2&page=2");
  assert.equal(await fieldValue(FILTERS, "brandId"), "2", "refresh restores the form");
  await value("history.back()");
  await wait(`location.search === "?brandId=2"`, "Back to page 1");
  await settled(persian(41));
  await value("history.back()");
  await wait(`location.search === "?page=4"`, "Back before the filter");
  await settled(persian(87));
  assert.equal(await fieldValue(FILTERS, "brandId"), "", "Back restores the unfiltered form");
  await value("history.forward()");
  await wait(`location.search === "?brandId=2"`, "Forward");
  await settled(persian(41));
  assert.equal(await fieldValue(FILTERS, "brandId"), "2");
  results.push({ refresh: true, back: true, forward: true });

  /* ---------- edit and return ---------- */
  await click("section button", persian(2));
  await settled(persian(29));
  const before = await historyLength();
  await click(`a[aria-label="ویرایش محصول"]`);
  await wait(`location.pathname.startsWith("/admin/products/edit/")`, "edit page");
  await wait(`!!document.querySelector('input[name="perTitle"]')`, "edit form");
  await value("history.back()");
  await wait(`location.search === "?brandId=2&page=2"`, "return without saving");
  await settled(persian(29));
  assert.equal(await fieldValue(FILTERS, "brandId"), "2");
  await click(`a[aria-label="ویرایش محصول"]`);
  await wait(`!!document.querySelector('input[name="perTitle"]')`, "edit form again");
  const editedId = Number(await value("location.pathname.split('/').pop()"));
  await setField("form", "perTitle", "محصول ویرایش‌شده");
  await click('form:has(input[name="perTitle"]) button[type=submit]');
  await wait(`location.pathname === "/admin/products" && location.search === "?brandId=2&page=2"`, "save returns to the list state");
  await wait(`document.body.innerText.includes("محصول ویرایش‌شده")`, "edited row refetched in place");
  await settled(persian(29));
  assert.match(await firstTitle(), /محصول ویرایش‌شده/);
  assert.equal(await historyLength(), before + 1, "no extra history entries");
  const log = await (await fetch(`${api}/__test/stats`)).json();
  const patchIndex = log.findIndex((entry) => entry.method === "PATCH" && entry.path === `/products/${editedId}`);
  assert(patchIndex >= 0, "PATCH sent");
  assert(log.slice(patchIndex).some((entry) => entry.method === "GET" && entry.path === "/products" && /brandIds=2/.test(entry.search) && /page=2/.test(entry.search)),
    "the same filtered page is refetched after the save");
  results.push({ editReturn: true, saveReturn: true, refetchedInPlace: true });

  /* ---------- page correction after deletion, invalid links ---------- */
  await goto("/admin/products?brandId=2&page=4");
  await settled(persian(5));
  assert.deepEqual(await rows(), [5, 4, 3, 2, 1]);
  const lastIds = (await (await fetch(`${api}/products?brandIds=2&page=4&limit=12`)).json()).data.map((p) => p.id);
  for (const productId of lastIds.slice(1)) await fetch(`${api}/products/${productId}`, { method: "DELETE" });
  await send("Page.reload");
  await settled(persian(1));
  await click(`button[aria-label="حذف محصول"]`);
  await wait(`document.body.innerText.includes("حذف شود؟") &&
    [...document.querySelectorAll("button")].some((b) => b.textContent.trim() === "تایید" && b.getClientRects().length)`, "delete confirmation open");
  await sleep(300); // the confirmation slides in
  await click("button", "تایید");
  const deleted = async () => (await (await fetch(`${api}/__test/stats`)).json())
    .some((entry) => entry.method === "DELETE" && entry.path === `/products/${lastIds[0]}`);
  for (let i = 0; !(await deleted()); i++) {
    if (i > 100) throw new Error("the UI delete request was not sent");
    await sleep(50);
  }
  await wait(`location.search === "?brandId=2&page=3"`, "empty page corrected, filter kept");
  await settled(persian(12));
  results.push({ deletionCorrection: "page 4 → 3, brandId kept" });
  const length = await historyLength();
  await goto("/admin/products?page=abc&limit=7&grade=FAKE&search=%20");
  await wait(`location.pathname === "/admin/products" && location.search === ""`, "invalid link canonicalized");
  // 5 of the 123 were deleted above (4 through the fixture, 1 through the UI).
  await settled(persian(118));
  await goto("/admin/products?brandId=2&page=99");
  await wait(`location.search === "?brandId=2&page=3"`, "stale page corrected");
  assert(await historyLength() <= length + 2, "corrections replace, they do not add entries");
  results.push({ invalidParams: true, stalePage: true });

  /* ---------- mobile filter sheet ---------- */
  await fetch(`${api}/__test/reset`);
  await viewport(390);
  await goto("/admin/products?brandId=2");
  await settled(persian(41));
  assert.equal(await value(`[...document.querySelectorAll("form")].some((f) => f.getClientRects().length && f.hasAttribute("data-admin-product-filters"))`), false, "inline filters hidden on mobile");
  assert.equal(await value(`document.querySelector("[data-admin-product-filter-trigger]").getAttribute("aria-label")`), "فیلترها، ۱ فیلتر فعال");
  assert.equal(await value("document.documentElement.scrollWidth <= innerWidth"), true, "no horizontal page scroll");
  await click("[data-admin-product-filter-trigger]");
  await wait(`!!document.querySelector('[role="dialog"][aria-label="فیلتر محصولات"]') && document.activeElement?.name === "search"`, "sheet opens with focus inside");
  assert.equal(await value(`document.querySelector('[role="dialog"]').getAttribute("aria-modal")`), "true");
  assert.equal(await value(`document.querySelector('[role="dialog"]').getAttribute("dir")`), "rtl");
  assert.equal(await fieldValue('[role="dialog"]', "brandId"), "2", "sheet starts from the applied filters");
  for (let i = 0; i < 15; i++) {
    await press("Tab", 9);
    await wait(`document.querySelector('[role="dialog"]').contains(document.activeElement)`, "Tab stays in the sheet");
  }
  const applyBox = await value(`(() => { const b = [...document.querySelectorAll('[role="dialog"] button[type=submit]')][0].getBoundingClientRect(); return { bottom: b.bottom, height: innerHeight }; })()`);
  assert(applyBox.bottom <= applyBox.height && applyBox.bottom > applyBox.height - 140, "Apply sits at the bottom of the sheet");
  await setField('[role="dialog"]', "gender", "women");
  await press("Escape", 27);
  await wait(`!document.querySelector('[role="dialog"]')`, "Escape closes");
  await wait(`document.activeElement?.hasAttribute("data-admin-product-filter-trigger")`, "focus returns to the trigger");
  assert.equal(await listUrl(), "/admin/products?brandId=2", "closing without Apply keeps the applied filters");
  await click("[data-admin-product-filter-trigger]");
  await wait(`!!document.querySelector('[role="dialog"]')`, "sheet reopens");
  assert.equal(await fieldValue('[role="dialog"]', "gender"), "", "unapplied edits are discarded");
  await setField('[role="dialog"]', "gender", "women");
  await click('[role="dialog"] button[type=submit]');
  await wait(`location.search === "?brandId=2&gender=women" && !document.querySelector('[role="dialog"]')`, "Apply writes the URL and closes");
  await settled();
  assert.equal(await value(`document.querySelector("[data-admin-product-filter-trigger]").getAttribute("aria-label")`), "فیلترها، ۲ فیلتر فعال");
  await send("Page.reload");
  await settled();
  assert.equal(await listUrl(), "/admin/products?brandId=2&gender=women");
  await value("history.back()");
  await wait(`location.search === "?brandId=2"`, "Back restores the earlier filters on mobile");
  await settled(persian(41));
  await click("[data-admin-product-filter-trigger]");
  await wait(`!!document.querySelector('[role="dialog"]')`, "sheet for reset");
  await click('[role="dialog"] button', "پاک کردن فیلتر");
  await wait(`location.search === "" && !document.querySelector('[role="dialog"]')`, "Reset clears the URL filters");
  await settled(persian(123));
  assert.equal(await value(`document.querySelector("[data-admin-product-filter-trigger]").getAttribute("aria-label")`), "فیلترها");
  results.push({ mobileSheet: "count, focus trap, Escape, focus return, discard, apply, reset, refresh, back" });

  /* ---------- desktop keeps inline filters ---------- */
  await viewport(1024);
  await settled();
  assert.equal(await value(`[...document.querySelectorAll("form")].some((f) => f.getClientRects().length && f.hasAttribute("data-admin-product-filters"))`), true);
  assert.equal(await value(`!!document.querySelector("[data-admin-product-filter-trigger]")?.getClientRects().length`), false);

  assert.deepEqual(exceptions, [], "no uncaught page exceptions");
  console.log(JSON.stringify(results));
});
