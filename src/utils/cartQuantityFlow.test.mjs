// Cart quantity "+" / "-" under real React Query v5 concurrency. Each control
// is modelled as useQuantityHandler runs it: the ["cart-items"] query with its
// resync effect, useCart's three mutations (subscribed, like useMutation) and
// the flow from cartQuantityFlow.mjs; the server enforces stock and answers
// after a delay. The previous handler is kept as `legacy` to show the bug.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { MutationObserver, QueryClient, QueryObserver } from "@tanstack/react-query";
import { findCartLine, resolveIncrement } from "./addedToCartContract.mjs";
import {
  cartLineScope,
  createLineGuard,
  createQuantityFlow,
  lineScopeFor,
  settledLineQuantity,
} from "./cartQuantityFlow.mjs";
import { isStaleAvailabilityRejection } from "./productAvailability.mjs";

const CART_KEY = ["cart-items"];
const STOCK_ERROR = "موجودی کافی نیست";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const lineKey = ({ productId, mode, volume }) => `${productId}:${mode}:${volume}`;
const apiError = (message, status = 400) =>
  Object.assign(new Error(String(message)), { response: { status, data: { message } } });

// The Cart service: absolute quantities, stock per Product in ml, full cart
// from POST /cart/item, every change applied when the request is processed.
function createServer({ stock = {}, lines = [], delay = () => 5 } = {}) {
  let nextId = 100;
  let sequence = 0;
  const items = lines.map((line, index) => ({ id: index + 1, ...line }));
  const log = [];
  const active = new Map();
  const stats = { maxActive: 0, maxActiveOnOneLine: 0, requests: { get: 0, add: 0, update: 0, remove: 0 } };
  const hooks = { beforeApply: null, failNext: null };
  const cart = () => ({
    items: items.map((item) => ({
      id: item.id,
      product: { id: item.productId },
      mode: item.mode,
      volume: item.volume,
      quantity: item.quantity,
    })),
  });
  const fits = (line, quantity) =>
    items
      .filter((item) => item.productId === line.productId && item !== line)
      .reduce((ml, item) => ml + item.volume * item.quantity, 0) +
      line.volume * quantity <=
    (stock[line.productId] ?? Infinity);

  async function handle(kind, key, apply) {
    const n = sequence++;
    stats.requests[kind] += 1;
    log.push({ n, kind, key, at: "start" });
    active.set(key, (active.get(key) ?? 0) + 1);
    const total = [...active.values()].reduce((sum, count) => sum + count, 0);
    stats.maxActive = Math.max(stats.maxActive, total - (active.get("get") ?? 0));
    if (key !== "get") stats.maxActiveOnOneLine = Math.max(stats.maxActiveOnOneLine, active.get(key));
    try {
      await sleep(delay(kind, n));
      hooks.beforeApply?.(kind, n);
      if (kind === "get" && hooks.failGets > 0) {
        hooks.failGets -= 1;
        throw apiError("Network Error", 503);
      }
      if (kind !== "get" && hooks.failNext) {
        const error = hooks.failNext;
        hooks.failNext = null;
        throw error;
      }
      return apply();
    } finally {
      active.set(key, active.get(key) - 1);
      log.push({ n, kind, key, at: "end" });
    }
  }

  return {
    items,
    log,
    stats,
    hooks,
    quantity: (line) => items.find((item) => lineKey(item) === lineKey(line))?.quantity ?? 0,
    getCart: () => handle("get", "get", cart),
    add: (payload) =>
      handle("add", lineKey(payload), () => {
        const existing = items.find((item) => lineKey(item) === lineKey(payload));
        const line = existing ?? { id: nextId++, ...payload, quantity: 0 };
        const quantity = line.quantity + payload.quantity;
        if (!fits(line, quantity)) throw apiError(STOCK_ERROR);
        if (!existing) items.push(line);
        line.quantity = quantity;
        return cart();
      }),
    update: ({ itemId, quantity }) => {
      const line = items.find((item) => item.id === itemId);
      return handle("update", line ? lineKey(line) : `missing:${itemId}`, () => {
        if (!line || !items.includes(line)) throw apiError("آیتم یافت نشد", 404);
        if (quantity === 0) items.splice(items.indexOf(line), 1);
        else if (!fits(line, quantity)) throw apiError(STOCK_ERROR);
        else line.quantity = quantity;
        return { message: "updated" };
      });
    },
    remove: (itemId) => {
      const line = items.find((item) => item.id === itemId);
      return handle("remove", line ? lineKey(line) : `missing:${itemId}`, () => {
        if (!line || !items.includes(line)) throw apiError("آیتم یافت نشد", 404);
        items.splice(items.indexOf(line), 1);
        return { message: "removed" };
      });
    },
  };
}

// One mounted control (Product Detail or a cart page line) for one line.
function mountControl(client, server, ui, { line, onAdded, onRejected, legacy = false }) {
  let request = line;
  const state = { quantity: 0, pending: false };
  const setQuantity = (value) => {
    state.quantity = typeof value === "function" ? value(state.quantity) : value;
  };
  const currentLine = () => findCartLine(client.getQueryData(CART_KEY), request);

  // useGetAllCartItems + the hook's effect: the count follows the cart line
  // whenever that line object changes (structural sharing keeps it otherwise).
  const query = new QueryObserver(client, { queryKey: CART_KEY, queryFn: server.getCart, staleTime: 300_000 });
  let shownLine;
  const unsubscribeQuery = query.subscribe(() => {
    const line = currentLine();
    if (line !== shownLine) {
      shownLine = line;
      setQuantity(line?.quantity ?? 0);
    }
  });

  // useCart, as configured by the hook (lineChangeOptions), or as it was before.
  const guard = createLineGuard();
  const scopeForRender = () => (legacy ? undefined : lineScopeFor(guard, request));
  const reRead = () => client.invalidateQueries({ queryKey: CART_KEY });
  const lineChange = (scope) => (legacy ? {} : { ...(scope ? { scope: { id: scope } } : {}), onSettled: reRead });
  const onError = (error) => ui.errors.push(error.response?.data?.message);
  const mutationOptions = (scope) => ({
    add: {
      mutationFn: server.add,
      onSuccess: (data, variables) => {
        if (Array.isArray(data?.items)) client.setQueryData(CART_KEY, data);
        if (onAdded) onAdded(data, variables);
        else ui.successes.push("add");
        if (legacy) reRead();
      },
      onError,
      ...lineChange(scope),
    },
    update: {
      mutationFn: server.update,
      onSuccess: () => {
        ui.successes.push("update");
        if (legacy) reRead();
      },
      onError,
      ...lineChange(scope),
    },
    remove: {
      mutationFn: server.remove,
      onSuccess: () => {
        ui.successes.push("remove");
        if (legacy) reRead();
      },
      onError,
      ...lineChange(scope),
    },
  });
  const initial = mutationOptions(scopeForRender());
  const observers = {
    add: new MutationObserver(client, initial.add),
    update: new MutationObserver(client, initial.update),
    remove: new MutationObserver(client, initial.remove),
  };
  // A re-render with another selection (Product Detail: volume or mode):
  // useMutation hands the new options to its observer, as React does.
  const rerender = (nextRequest) => {
    request = nextRequest;
    const next = mutationOptions(scopeForRender());
    for (const kind of Object.keys(observers)) observers[kind].setOptions(next[kind]);
  };
  const unsubscribeMutations = Object.values(observers).map((observer) => observer.subscribe(() => {}));
  // useMutation: mutate() swallows the rejection, mutateAsync() returns it.
  const mutate = (observer) => (variables, options) => observer.mutate(variables, options).catch(() => {});

  const flow = () =>
    createQuantityFlow({
      guard,
      quantity: state.quantity,
      setQuantity,
      line: currentLine(),
      request,
      readCart: () => client.getQueryData(CART_KEY),
      add: mutate(observers.add),
      update: mutate(observers.update),
      remove: (itemId) => observers.remove.mutate(itemId),
      onRejected,
      onPendingChange: (pending) => {
        state.pending = pending;
        ui.pending.push({ pending, logLength: server.log.length });
      },
    });

  // The previous useQuantityHandler "+": no guard, rollback by one per call.
  const legacyPlus = () => {
    const action = resolveIncrement({ line: currentLine(), quantity: state.quantity, request });
    const rollback = (error) => {
      setQuantity((q) => Math.max(0, q - 1));
      onRejected?.(error);
    };
    if (action.type === "update") {
      mutate(observers.update)({ itemId: action.itemId, quantity: action.quantity }, { onError: rollback });
    } else {
      mutate(observers.add)(action.payload, { onError: rollback });
    }
    setQuantity((q) => q + 1);
  };

  return {
    state,
    plus: () => (legacy ? legacyPlus() : flow().increment()),
    minus: () => flow().decrement(),
    rerender,
    unmount: () => {
      unsubscribeQuery();
      unsubscribeMutations.forEach((unsubscribe) => unsubscribe());
    },
  };
}

async function idle(client) {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    await sleep(2);
    if (!client.isMutating() && !client.isFetching()) {
      await sleep(3);
      if (!client.isMutating() && !client.isFetching()) return;
    }
  }
  throw new Error("React Query never became idle");
}

async function setup({ stock, lines, delay, controls }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const server = createServer({ stock, lines, delay });
  const ui = { errors: [], successes: [], pending: [] };
  const mounted = controls.map((options) => mountControl(client, server, ui, options));
  await idle(client);
  return { client, server, ui, controls: mounted, done: () => { mounted.forEach((c) => c.unmount()); client.clear(); } };
}

const D5 = { productId: 7, mode: "decant", volume: 5 };
const D10 = { productId: 7, mode: "decant", volume: 10 };
const S100 = { productId: 8, mode: "sealed", volume: 100 };

test("1. a single accepted '+' shows the server's new quantity", async () => {
  const t = await setup({ stock: { 7: 50 }, lines: [{ ...D5, quantity: 1 }], controls: [{ line: D5 }] });
  const [control] = t.controls;
  control.plus();
  assert.equal(control.state.quantity, 2);
  assert.equal(control.state.pending, true);
  await idle(t.client);
  assert.equal(t.server.quantity(D5), 2);
  assert.equal(control.state.quantity, 2);
  assert.equal(control.state.pending, false);
  assert.deepEqual(t.ui.successes, ["update"]);
  assert.deepEqual(t.ui.errors, []);
  t.done();
});

test("2. a single rejected '+' returns to the server's quantity, with one error", async () => {
  const rejected = [];
  const t = await setup({
    stock: { 7: 10 },
    lines: [{ ...D5, quantity: 2 }],
    controls: [{ line: D5, onRejected: (error) => rejected.push(error) }],
  });
  const [control] = t.controls;
  control.plus();
  assert.equal(control.state.quantity, 3);
  await idle(t.client);
  assert.equal(t.server.quantity(D5), 2);
  assert.equal(control.state.quantity, 2);
  assert.deepEqual(t.ui.errors, [STOCK_ERROR]);
  assert.equal(rejected.length, 1);
  t.done();
});

test("3. three rapid rejected '+': one request, one error, the server's quantity (the previous handler drifted)", async () => {
  const fixed = await setup({ stock: { 7: 10 }, lines: [{ ...D5, quantity: 2 }], controls: [{ line: D5 }] });
  const [control] = fixed.controls;
  control.plus();
  control.plus();
  control.plus();
  await idle(fixed.client);
  assert.equal(fixed.server.stats.requests.update, 1);
  assert.deepEqual(fixed.ui.errors, [STOCK_ERROR]);
  assert.equal(control.state.quantity, fixed.server.quantity(D5));
  assert.equal(control.state.quantity, 2);
  fixed.done();

  // Reproduction: React Query delivers only the latest call's onError, so one
  // rollback for three rejections, and nothing re-reads the cart.
  const legacy = await setup({ stock: { 7: 10 }, lines: [{ ...D5, quantity: 2 }], controls: [{ line: D5, legacy: true }] });
  const [old] = legacy.controls;
  old.plus();
  old.plus();
  old.plus();
  await idle(legacy.client);
  assert.equal(legacy.server.stats.requests.update, 3);
  assert.equal(legacy.ui.errors.length, 3);
  assert.equal(legacy.server.quantity(D5), 2);
  assert.equal(old.state.quantity, 4);
  legacy.done();
});

test("4. rapid mixed acceptance and rejection converge on the server's quantity", async () => {
  const t = await setup({ stock: { 7: 15 }, lines: [{ ...D5, quantity: 2 }], controls: [{ line: D5 }] });
  const [control] = t.controls;
  control.plus();
  control.plus();
  await idle(t.client);
  assert.equal(t.server.quantity(D5), 3);
  assert.equal(control.state.quantity, 3);
  control.plus();
  control.plus();
  await idle(t.client);
  assert.equal(t.server.quantity(D5), 3);
  assert.equal(control.state.quantity, 3);
  assert.deepEqual(t.ui.successes, ["update"]);
  assert.deepEqual(t.ui.errors, [STOCK_ERROR]);
  assert.equal(t.server.stats.requests.update, 2);
  t.done();
});

test("5. one line never has two changes in flight, even from two controls showing it", async () => {
  // A slow first answer and a fast second one: overlapping requests could
  // land out of order; the previous handler sent them overlapped.
  const delay = (kind, n) => (kind === "get" ? 2 : n % 2 ? 40 : 5);
  const legacy = await setup({ stock: { 7: 50 }, lines: [{ ...D5, quantity: 1 }], delay, controls: [{ line: D5, legacy: true }] });
  legacy.controls[0].plus();
  legacy.controls[0].plus();
  await idle(legacy.client);
  assert.equal(legacy.server.stats.maxActiveOnOneLine, 2);
  legacy.done();

  // Product Detail and the cart page, or the cart table and the checkout
  // summary: both show the line; its scope runs their changes in turn.
  const t = await setup({ stock: { 7: 50 }, lines: [{ ...D5, quantity: 1 }], delay, controls: [{ line: D5 }, { line: D5 }] });
  const [table, summary] = t.controls;
  table.plus();
  table.plus();
  summary.plus();
  await idle(t.client);
  // The table's second click waited for its first change; the summary's
  // change was queued behind it, never overlapped.
  assert.equal(t.server.stats.maxActiveOnOneLine, 1);
  assert.equal(t.server.stats.requests.update, 2);
  const updates = t.server.log.filter((entry) => entry.kind === "update").map((entry) => entry.at);
  assert.deepEqual(updates, ["start", "end", "start", "end"]);
  assert.equal(table.state.quantity, t.server.quantity(D5));
  assert.equal(summary.state.quantity, t.server.quantity(D5));
  t.done();
});

test("6. different cart lines change independently and in parallel", async () => {
  const t = await setup({
    stock: { 7: 100, 8: 1000 },
    lines: [{ ...D10, quantity: 1 }, { ...S100, quantity: 1 }],
    delay: (kind) => (kind === "get" ? 2 : 20),
    controls: [{ line: D10 }, { line: S100 }],
  });
  const [decant, sealed] = t.controls;
  decant.plus();
  sealed.plus();
  assert.equal(decant.state.pending && sealed.state.pending, true);
  await idle(t.client);
  assert.equal(t.server.stats.maxActive, 2);
  assert.equal(t.server.quantity(D10), 2);
  assert.equal(t.server.quantity(S100), 2);
  assert.equal(decant.state.quantity, 2);
  assert.equal(sealed.state.quantity, 2);
  t.done();
});

test("7. after a rejection the count is the re-read server quantity, not the old count minus one", async () => {
  // While our "+" is refused, the same cart lost a unit elsewhere (another
  // tab); the previous rollback showed the stale count.
  for (const legacy of [false, true]) {
    const t = await setup({ stock: { 7: 10 }, lines: [{ ...D5, quantity: 2 }], controls: [{ line: D5, legacy }] });
    t.server.hooks.beforeApply = (kind) => {
      if (kind === "update") {
        t.server.items[0].quantity = 1;
        t.server.hooks.failNext = apiError(STOCK_ERROR);
        t.server.hooks.beforeApply = null;
      }
    };
    t.controls[0].plus();
    await idle(t.client);
    assert.equal(t.server.quantity(D5), 1);
    assert.equal(t.controls[0].state.quantity, legacy ? 2 : 1);
    t.done();
  }
  assert.equal(settledLineQuantity(undefined, D5, 3), 3);
  assert.equal(settledLineQuantity({ items: [] }, D5, 3), 0);
});

test("8. no stale or repeated error toasts: one per refused request, none afterwards", async () => {
  const t = await setup({ stock: { 7: 10 }, lines: [{ ...D5, quantity: 2 }], controls: [{ line: D5 }] });
  const [control] = t.controls;
  for (let round = 0; round < 3; round += 1) {
    control.plus();
    control.plus();
    await idle(t.client);
  }
  assert.deepEqual(t.ui.errors, [STOCK_ERROR, STOCK_ERROR, STOCK_ERROR]);
  assert.equal(t.server.stats.requests.update, 3);
  control.minus();
  await idle(t.client);
  assert.equal(t.ui.errors.length, 3);
  assert.equal(control.state.quantity, 1);
  assert.equal(t.server.quantity(D5), 1);
  t.done();
});

test("9. the controls stay pending until the cart has been re-read", async () => {
  const t = await setup({ stock: { 7: 10 }, lines: [{ ...D5, quantity: 1 }], controls: [{ line: D5 }] });
  const [control] = t.controls;
  control.plus();
  control.minus();
  await idle(t.client);
  assert.deepEqual(t.ui.pending.map((p) => p.pending), [true, false]);
  const released = t.ui.pending[1].logLength;
  const before = t.server.log.slice(0, released);
  const updateEnd = before.findIndex((e) => e.kind === "update" && e.at === "end");
  assert.ok(updateEnd >= 0);
  assert.ok(before.slice(updateEnd).some((e) => e.kind === "get" && e.at === "end"));
  assert.equal(t.server.stats.requests.update, 1);
  assert.equal(control.state.quantity, 2);
  t.done();
});

test("10. Product Detail and cart page: add, '+', '-', remove, and a refused remove", async () => {
  const t = await setup({ stock: { 7: 50 }, lines: [], controls: [{ line: D5 }] });
  const [detail] = t.controls;
  detail.plus();
  await idle(t.client);
  assert.equal(t.server.stats.requests.add, 1);
  assert.equal(detail.state.quantity, 1);
  detail.plus();
  await idle(t.client);
  assert.equal(t.server.stats.requests.update, 1);
  assert.equal(detail.state.quantity, 2);
  await detail.minus();
  await idle(t.client);
  assert.equal(detail.state.quantity, 1);
  await detail.minus();
  await idle(t.client);
  assert.equal(t.server.stats.requests.remove, 1);
  assert.equal(detail.state.quantity, 0);
  assert.equal(t.server.items.length, 0);
  t.done();

  // Cart page line, last unit: a refused remove keeps the line and shows one
  // error (it was an unhandled rejection before).
  const page = await setup({ stock: { 7: 50 }, lines: [{ ...D5, quantity: 1 }], controls: [{ line: D5 }] });
  page.server.hooks.failNext = apiError("خطای سرور", 500);
  await page.controls[0].minus();
  await idle(page.client);
  assert.equal(page.server.quantity(D5), 1);
  assert.equal(page.controls[0].state.quantity, 1);
  assert.deepEqual(page.ui.errors, ["خطای سرور"]);
  assert.equal(page.controls[0].state.pending, false);
  page.done();
});

test("11. the added-to-cart feedback still gets the returned cart, once, before the re-read", async () => {
  const added = [];
  let cachedAtFeedback;
  const t = await setup({
    stock: { 7: 50 },
    lines: [],
    controls: [{ line: D5, onAdded: (data, variables) => added.push(variables) }],
  });
  const [detail] = t.controls;
  const client = t.client;
  const original = client.setQueryData.bind(client);
  client.setQueryData = (key, data) => {
    cachedAtFeedback = findCartLine(data, D5)?.quantity;
    return original(key, data);
  };
  detail.plus();
  detail.plus();
  await idle(client);
  assert.equal(added.length, 1);
  assert.deepEqual(added[0], { ...D5, quantity: 1 });
  assert.equal(cachedAtFeedback, 1);
  assert.deepEqual(t.ui.successes, []);
  assert.equal(detail.state.quantity, 1);
  t.done();
});

test("12. P2: a stale-stock refusal reaches the page once; a request error does not look stale", async () => {
  const rejected = [];
  const t = await setup({
    stock: { 7: 4 },
    lines: [],
    controls: [{ line: D5, onRejected: (error) => rejected.push(error) }],
  });
  const [detail] = t.controls;
  detail.plus();
  detail.plus();
  await idle(t.client);
  assert.equal(rejected.length, 1);
  assert.equal(isStaleAvailabilityRejection(rejected[0]), true);
  assert.equal(detail.state.quantity, 0);
  t.server.hooks.failNext = apiError(["volume must be a positive number"]);
  detail.plus();
  await idle(t.client);
  assert.equal(rejected.length, 2);
  assert.equal(isStaleAvailabilityRejection(rejected[1]), false);
  assert.equal(detail.state.quantity, 0);
  t.done();
});

test("13. a selection change during a pending change keeps that change in its line's queue", async () => {
  // Product Detail switches volume while its change is in flight; another
  // control's change of the same line is queued behind it. React Query hands
  // the re-rendered options (a new scope) to the pending mutation.
  const t = await setup({
    stock: { 7: 100 },
    lines: [{ ...D5, quantity: 1 }],
    delay: (kind) => (kind === "get" ? 2 : 25),
    controls: [{ line: D5 }, { line: D5 }],
  });
  const [detail, other] = t.controls;
  detail.plus();
  other.plus();
  detail.rerender(D10);
  await idle(t.client);
  assert.equal(detail.state.pending, false);
  assert.equal(other.state.pending, false);
  assert.equal(t.server.stats.requests.update, 2);
  assert.equal(other.state.quantity, t.server.quantity(D5));
  // The new selection works afterwards, in its own line's queue.
  detail.plus();
  await idle(t.client);
  assert.equal(t.server.quantity(D10), 1);
  assert.equal(detail.state.quantity, 1);
  t.done();
});

test("A. accepted change, failed cart re-read: released, count is the confirmed quantity", async () => {
  const t = await setup({ stock: { 7: 50 }, lines: [{ ...D5, quantity: 2 }], controls: [{ line: D5 }] });
  const [control] = t.controls;
  t.server.hooks.failGets = 1;
  control.plus();
  await idle(t.client);
  assert.equal(control.state.pending, false);
  assert.equal(t.server.quantity(D5), 3);
  assert.equal(control.state.quantity, 3);
  assert.deepEqual(t.ui.errors, []);
  // One re-read attempt, no loop: the initial load plus the failed re-read.
  assert.equal(t.server.stats.requests.get, 2);
  control.plus();
  await idle(t.client);
  assert.equal(t.server.quantity(D5), 4);
  assert.equal(control.state.quantity, 4);
  t.done();
});

test("B. refused change, failed cart re-read: released, the server's last known quantity, error shown", async () => {
  const t = await setup({ stock: { 7: 10 }, lines: [{ ...D5, quantity: 2 }], controls: [{ line: D5 }] });
  const [control] = t.controls;
  t.server.hooks.failGets = 1;
  control.plus();
  await idle(t.client);
  assert.equal(control.state.pending, false);
  assert.equal(t.server.quantity(D5), 2);
  assert.equal(control.state.quantity, 2);
  assert.deepEqual(t.ui.errors, [STOCK_ERROR]);
  assert.equal(t.server.stats.requests.get, 2);
  t.done();
});

test("C. a control unmounted mid-change does not block the line's queued change", async () => {
  const t = await setup({
    stock: { 7: 100 },
    lines: [{ ...D5, quantity: 1 }],
    delay: (kind) => (kind === "get" ? 2 : 25),
    controls: [{ line: D5 }, { line: D5 }],
  });
  const [leaving, staying] = t.controls;
  leaving.plus();
  staying.plus();
  leaving.unmount();
  await idle(t.client);
  // The unmounted control's change still completed and re-read the cart.
  assert.equal(t.server.stats.requests.update, 2);
  assert.equal(staying.state.pending, false);
  assert.equal(staying.state.quantity, t.server.quantity(D5));
  t.done();
});

test("the hook and pages are wired to the flow, the line scope and the pending state", () => {
  const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
  const handler = source("../hooks/useQuantityHandler.js");
  assert.match(handler, /const scope = lineScopeFor\(guardRef\.current, request\);/);
  const guard = createLineGuard();
  assert.equal(lineScopeFor(guard, D5), "cart-line:7:decant:5");
  guard.begin(cartLineScope(D5));
  assert.equal(lineScopeFor(guard, D10), "cart-line:7:decant:5");
  guard.end();
  assert.equal(lineScopeFor(guard, D10), "cart-line:7:decant:10");
  assert.match(handler, /readCart: \(\) => queryClient\.getQueryData\(cartKeys\.items\(\)\),/);
  assert.match(handler, /onPendingChange: setIsPending,/);
  assert.match(handler, /if \(selectedVolume > product\?\.stock\) return;\s*flow\.increment\(\);/);
  const detail = source("../app/(user)/products/_components/SingleProductPage.jsx");
  assert.match(detail, /addDisabled=\{!canPurchase\}\s*pending=\{isPending\}/);
  assert.match(detail, /disabled=\{quantity === 0 && isPending\}/);
  const cartPage = source("../app/(user)/cart/_components/CartItemsLayout.jsx");
  assert.equal(cartPage.match(/const \{ AddToCartHandler, RemoveFromCartHandler, isPending \} = useQuantityHandler\(/g)?.length, 3);
  assert.equal(cartPage.match(/pending=\{isPending\}/g)?.length, 3);
  assert.equal(cartLineScope(D5), "cart-line:7:decant:5");
  assert.equal(cartLineScope({ productId: 7, mode: "decant" }), undefined);
});
