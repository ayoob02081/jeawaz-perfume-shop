// Finding #5: concurrent first guest cart requests must share one guest cart
// token. A fake browser models the backend's ensureGuestCartToken (a request
// without the cookie is served under a newly minted token and its response
// sets that cookie) and lets each response, and so each Set-Cookie, be
// delivered in any order. Tabs share one cookie jar and one fake Web Lock
// manager; timers are manual.

import assert from "node:assert/strict";
import test from "node:test";
import { createGuestCartInit } from "./guestCartInit.mjs";
import { createSessionLifecycle, isSessionSuperseded } from "./sessionLifecycle.mjs";

const flush = async () => { for (let i = 0; i < 20; i += 1) await new Promise((resolve) => setImmediate(resolve)); };

function createClock() {
  let now = 0;
  const timers = new Set();
  return {
    setTimer: (fn, ms) => { const timer = { fn, at: now + ms }; timers.add(timer); return timer; },
    clearTimer: (timer) => timers.delete(timer),
    async advance(ms) {
      now += ms;
      for (const timer of [...timers].sort((a, b) => a.at - b.at)) {
        if (timer.at <= now && timers.delete(timer)) timer.fn();
      }
      await flush();
    },
  };
}

function createBrowser() {
  const jar = {};
  const carts = new Map();
  const inflight = [];
  let minted = 0;
  return {
    jar, carts, inflight,
    minted: () => minted,
    // The cookie is attached at dispatch; the server acts on arrival.
    send(op, payload) {
      let token = jar.cartToken;
      const setCookie = token ? undefined : (token = `token-${++minted}`);
      if (!carts.has(token)) carts.set(token, []);
      if (op === "add") carts.get(token).push(payload);
      let settle;
      const promise = new Promise((resolve, reject) => { settle = { resolve, reject }; });
      const entry = {
        op, payload, sentCookie: jar.cartToken, token,
        deliver() {
          if (setCookie) jar.cartToken = setCookie;
          settle.resolve({ status: 200, data: { guestId: token, items: [...carts.get(token)] } });
        },
        // A network failure: no response, so no Set-Cookie either.
        fail() { settle.reject(Object.assign(new Error("Network Error"), { code: "ERR_NETWORK" })); },
      };
      inflight.push(entry);
      return promise;
    },
    reachable: () => carts.get(jar.cartToken) ?? [],
  };
}

function createLocks() {
  const queue = [];
  let held = null;
  const abortError = () => new DOMException("The request was aborted.", "AbortError");
  const grant = () => {
    if (held || !queue.length) return;
    const entry = queue.shift();
    held = entry;
    entry.signal?.removeEventListener("abort", entry.onAbort);
    Promise.resolve().then(() => entry.callback({ name: entry.name })).then(
      (value) => { if (held === entry) { held = null; grant(); } entry.resolve(value); },
      (error) => { if (held === entry) { held = null; grant(); } entry.reject(error); },
    );
  };
  return {
    holder: () => held?.tab,
    waiting: () => queue.length,
    forTab: (tab) => ({
      request(name, options, callback) {
        return new Promise((resolve, reject) => {
          if (options.signal?.aborted) { reject(abortError()); return; }
          const entry = { tab, name, callback, resolve, reject, signal: options.signal };
          entry.onAbort = () => {
            const index = queue.indexOf(entry);
            if (index >= 0) { queue.splice(index, 1); reject(abortError()); }
          };
          options.signal?.addEventListener("abort", entry.onAbort, { once: true });
          queue.push(entry);
          grant();
        });
      },
    }),
    // The browser releases a closed tab's locks and drops its queued requests.
    close(tab) {
      for (let i = queue.length - 1; i >= 0; i -= 1) if (queue[i].tab === tab) queue.splice(i, 1);
      if (held?.tab === tab) { held = null; grant(); }
    },
  };
}

function guestTab({ locks, clock = createClock(), identity = null, ...options } = {}) {
  const lifecycle = createSessionLifecycle();
  lifecycle.confirm(lifecycle.generation(), identity);
  const init = createGuestCartInit({
    lifecycle,
    locks: () => locks,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    ...options,
  });
  return { lifecycle, init, clock };
}

const settled = (promise) => promise.then((value) => ({ value }), (error) => ({ error }));

test("baseline without the barrier: a racing first GET makes the added line unreachable", async () => {
  const browser = createBrowser();
  const get = browser.send("get");
  const add = browser.send("add", "line-1");
  browser.inflight[1].deliver();
  browser.inflight[0].deliver(); // the GET's Set-Cookie arrives last and wins
  await Promise.all([get, add]);
  assert.equal(browser.minted(), 2);
  assert.equal(browser.jar.cartToken, "token-1");
  assert.deepEqual(browser.reachable(), []);
  assert.deepEqual(browser.carts.get("token-2"), ["line-1"]);
});

test("initial GET racing an add: the add waits and uses the established token", async () => {
  const browser = createBrowser();
  const { init } = guestTab({ locks: createLocks() });
  const get = init.run(() => browser.send("get"));
  const add = init.run(() => browser.send("add", "line-1"));
  await flush();
  assert.equal(browser.inflight.length, 1, "the add is not dispatched while the first request is pending");
  browser.inflight[0].deliver();
  await flush();
  assert.equal(browser.inflight.length, 2);
  assert.equal(browser.inflight[1].sentCookie, "token-1");
  browser.inflight[1].deliver();
  assert.deepEqual((await add).data, { guestId: "token-1", items: ["line-1"] });
  assert.equal((await get).data.guestId, "token-1");
  assert.equal(browser.minted(), 1);
  assert.deepEqual(browser.reachable(), ["line-1"]);
});

test("two simultaneous first-time additions land in one guest cart", async () => {
  const browser = createBrowser();
  const { init } = guestTab({ locks: createLocks() });
  const first = init.run(() => browser.send("add", "line-1"));
  const second = init.run(() => browser.send("add", "line-2"));
  await flush();
  browser.inflight[0].deliver();
  await flush();
  browser.inflight[1].deliver();
  await Promise.all([first, second]);
  assert.equal(browser.minted(), 1);
  assert.deepEqual(browser.reachable(), ["line-1", "line-2"]);
});

test("after establishment, guest requests run concurrently and deliver in any order", async () => {
  const browser = createBrowser();
  const { init } = guestTab({ locks: createLocks() });
  const first = init.run(() => browser.send("get"));
  await flush();
  browser.inflight[0].deliver();
  await first;
  assert.equal(init.established(), true);
  const a = init.run(() => browser.send("add", "line-1"));
  const b = init.run(() => browser.send("add", "line-2"));
  await flush();
  assert.equal(browser.inflight.length, 3, "both dispatched at once");
  browser.inflight[2].deliver();
  browser.inflight[1].deliver();
  await Promise.all([a, b]);
  assert.equal(browser.minted(), 1);
  assert.deepEqual(browser.reachable(), ["line-1", "line-2"]);
});

test("a delayed first Set-Cookie holds every other first request of the tab", async () => {
  const browser = createBrowser();
  const clock = createClock();
  const { init } = guestTab({ locks: createLocks(), clock });
  const requests = [
    init.run(() => browser.send("get")),
    init.run(() => browser.send("add", "line-1")),
    init.run(() => browser.send("add", "line-2")),
  ];
  await clock.advance(10_000); // slow, but within the hold bound
  assert.equal(browser.inflight.length, 1);
  browser.inflight[0].deliver();
  await flush();
  assert.deepEqual(browser.inflight.slice(1).map((entry) => entry.sentCookie), ["token-1", "token-1"]);
  for (const entry of browser.inflight.slice(1).reverse()) entry.deliver();
  await Promise.all(requests);
  assert.equal(browser.minted(), 1);
  assert.deepEqual(browser.reachable(), ["line-1", "line-2"]);
});

test("simultaneous initialization in two tabs shares the first tab's token", async () => {
  const browser = createBrowser();
  const locks = createLocks();
  const a = guestTab({ locks: locks.forTab("a") });
  const b = guestTab({ locks: locks.forTab("b") });
  const getA = a.init.run(() => browser.send("get"));
  const getB = b.init.run(() => browser.send("get"));
  const addB = b.init.run(() => browser.send("add", "line-b"));
  const addA = a.init.run(() => browser.send("add", "line-a"));
  await flush();
  assert.equal(browser.inflight.length, 1, "the other tab waits for the lock");
  browser.inflight[0].deliver();
  await flush();
  // Tab a's add runs concurrently with tab b's first (locked) request; both
  // already carry the established cookie.
  assert.deepEqual(browser.inflight.slice(1).map((entry) => entry.sentCookie), ["token-1", "token-1"]);
  for (let round = 0; round < 3; round += 1) {
    for (const entry of browser.inflight) entry.deliver();
    await flush();
  }
  await Promise.all([getA, getB, addA, addB]);
  assert.equal(browser.minted(), 1);
  assert.deepEqual([...browser.reachable()].sort(), ["line-a", "line-b"]);
  assert.equal(a.init.established() && b.init.established(), true);
});

test("a failed initialization is retried by the next request without losing it", async () => {
  const browser = createBrowser();
  const { init } = guestTab({ locks: createLocks() });
  const first = settled(init.run(() => browser.send("add", "line-1")));
  const second = init.run(() => browser.send("add", "line-2"));
  await flush();
  browser.inflight[0].fail(); // no response: the server's minted cookie never arrives
  assert.equal((await first).error.code, "ERR_NETWORK");
  await flush();
  assert.equal(init.established(), false);
  assert.equal(browser.inflight.length, 2);
  assert.equal(browser.inflight[1].sentCookie, undefined, "the next waiter initializes afresh");
  browser.inflight[1].deliver();
  await second;
  assert.equal(init.established(), true);
  // A later retry of the failed line joins the established cart.
  const retry = init.run(() => browser.send("add", "line-1"));
  await flush();
  assert.equal(browser.inflight[2].sentCookie, "token-2");
  browser.inflight[2].deliver();
  await retry;
  assert.deepEqual(browser.reachable(), ["line-2", "line-1"]);
});

test("closing a tab during initialization releases the other tab", async () => {
  const browser = createBrowser();
  const locks = createLocks();
  const a = guestTab({ locks: locks.forTab("a") });
  const b = guestTab({ locks: locks.forTab("b") });
  void a.init.run(() => browser.send("get"));
  const addB = b.init.run(() => browser.send("add", "line-b"));
  await flush();
  assert.equal(locks.holder(), "a");
  locks.close("a"); // tab a's request is cancelled and never delivered
  await flush();
  assert.equal(browser.inflight.length, 2);
  assert.equal(locks.holder(), "b");
  browser.inflight[1].deliver();
  assert.equal((await addB).data.guestId, "token-2");
  assert.deepEqual(browser.reachable(), ["line-b"]);
});

test("a hung initializer or lock holder never blocks the cart indefinitely", async () => {
  const browser = createBrowser();
  const clock = createClock();
  const { init } = guestTab({ locks: createLocks(), clock, holdMs: 15_000, lockWaitMs: 20_000 });
  void init.run(() => browser.send("get")); // never answered
  const add = init.run(() => browser.send("add", "line-1"));
  await clock.advance(14_999);
  assert.equal(browser.inflight.length, 1);
  await clock.advance(1);
  assert.equal(browser.inflight.length, 2, "the hold bound released the waiter");
  browser.inflight[1].deliver();
  await add;
  assert.equal(init.established(), true);

  // A lock held elsewhere by a non-releasing holder: bounded wait, then the
  // request proceeds without the lock instead of stalling.
  const frozenBrowser = createBrowser();
  const frozen = createLocks();
  void frozen.forTab("frozen").request("jeawaz:guest-cart-init", {}, () => new Promise(() => {}));
  const tab = guestTab({ locks: frozen.forTab("b"), clock, lockWaitMs: 20_000 });
  const get = tab.init.run(() => frozenBrowser.send("get"));
  await clock.advance(19_999);
  assert.equal(frozenBrowser.inflight.length, 0);
  await clock.advance(1);
  assert.equal(frozenBrowser.inflight.length, 1);
  assert.equal(frozen.waiting(), 0, "the timed-out lock request was withdrawn");
  frozenBrowser.inflight[0].deliver();
  await get;
});

test("a lock manager that ignores the abort signal still cannot stall the cart", async () => {
  const browser = createBrowser();
  const clock = createClock();
  const locks = createLocks();
  const ignoring = locks.forTab("b");
  const unsignalled = { request: (name, _options, callback) => ignoring.request(name, {}, callback) };
  let unblock;
  void locks.forTab("frozen").request("jeawaz:guest-cart-init", {}, () => new Promise((resolve) => { unblock = resolve; }));
  const { init } = guestTab({ locks: unsignalled, clock, lockWaitMs: 20_000 });
  const get = init.run(() => browser.send("get"));
  await clock.advance(20_000);
  assert.equal(browser.inflight.length, 1, "proceeded without the lock");
  browser.inflight[0].deliver();
  await get;
  unblock();
  await flush();
  assert.equal(locks.holder(), undefined, "the late grant was released at once");
  assert.equal(browser.inflight.length, 1, "the late grant did not resend the request");
});

test("guest login during pending initialization cancels queued guest work and bypasses the barrier", async () => {
  const browser = createBrowser();
  const locks = createLocks();
  const other = guestTab({ locks: locks.forTab("other") });
  void other.init.run(() => browser.send("get")); // holds the cross-tab lock
  const { lifecycle, init } = guestTab({ locks: locks.forTab("tab") });
  const queued = settled(init.run(() => browser.send("add", "line-1")));
  const sameTab = settled(init.run(() => browser.send("add", "line-2")));
  await flush();
  assert.equal(locks.waiting(), 1);
  const generation = lifecycle.invalidate("otp-login");
  await flush();
  assert.equal(isSessionSuperseded((await queued).error), true);
  assert.equal(isSessionSuperseded((await sameTab).error), true);
  assert.equal(locks.waiting(), 0, "the superseded lock request was withdrawn");
  assert.equal(browser.inflight.length, 1, "no superseded guest request was dispatched");
  lifecycle.confirm(generation, 7);
  const userCart = init.run(() => browser.send("get"));
  const userAdd = init.run(() => browser.send("add", "account-line"));
  await flush();
  assert.equal(browser.inflight.length, 3, "account requests are not serialized");
  for (const entry of browser.inflight.slice(1)) entry.deliver();
  await Promise.all([userCart, userAdd]);
});

test("logout starts a new guest session that is initialized again", async () => {
  const browser = createBrowser();
  const { lifecycle, init } = guestTab({ locks: createLocks() });
  const first = init.run(() => browser.send("get"));
  await flush();
  browser.inflight[0].deliver();
  await first;
  assert.equal(init.established(), true);
  // Logout: the backend clears the cookie and a new generation is a guest.
  const generation = lifecycle.invalidate("logout");
  delete browser.jar.cartToken;
  lifecycle.confirm(generation, null);
  assert.equal(init.established(), false);
  const get = init.run(() => browser.send("get"));
  const add = init.run(() => browser.send("add", "new-guest-line"));
  await flush();
  assert.equal(browser.inflight.length, 2);
  browser.inflight[1].deliver();
  await flush();
  assert.equal(browser.inflight[2].sentCookie, "token-2");
  browser.inflight[2].deliver();
  await Promise.all([get, add]);
  assert.deepEqual(browser.reachable(), ["new-guest-line"]);
});

test("authenticated requests are never serialized", async () => {
  const browser = createBrowser();
  const { init } = guestTab({ locks: createLocks(), identity: 7 });
  const requests = [init.run(() => browser.send("get")), init.run(() => browser.send("add", "a"))];
  await flush();
  assert.equal(browser.inflight.length, 2);
  for (const entry of browser.inflight) entry.deliver();
  await Promise.all(requests);
  assert.equal(init.established(), false);
});

test("without Web Locks the tab still serializes its own first requests", async () => {
  const browser = createBrowser();
  const { init } = guestTab({ locks: undefined });
  const get = init.run(() => browser.send("get"));
  const add = init.run(() => browser.send("add", "line-1"));
  await flush();
  assert.equal(browser.inflight.length, 1);
  browser.inflight[0].deliver();
  await flush();
  browser.inflight[1].deliver();
  await Promise.all([get, add]);
  assert.equal(browser.minted(), 1);
  assert.deepEqual(browser.reachable(), ["line-1"]);
});

// The initializer calls its task one microtask after its last generation
// check, and Axios captures the generation current at that call. A change in
// that microtask must cancel the request, never send it as the new identity.
async function assertSupersededBeforeDispatch(init, lifecycle, browser) {
  const caller = lifecycle.generation();
  const result = settled(init.run(() => browser.send("add", "stale-line")));
  await flush();
  assert.notEqual(lifecycle.generation(), caller);
  assert.equal(browser.inflight.length, 0, "no request was dispatched under the new generation");
  assert.equal(isSessionSuperseded((await result).error), true);
  assert.equal(init.established(), false);
  // The new guest generation initializes normally.
  lifecycle.confirm(lifecycle.generation(), null);
  const next = init.run(() => browser.send("get"));
  await flush();
  assert.equal(browser.inflight.length, 1);
  browser.inflight[0].deliver();
  await next;
  assert.equal(init.established(), true);
  assert.deepEqual(browser.reachable(), []);
}

test("no Web Locks: a generation change before the scheduled task cancels it", async () => {
  const browser = createBrowser();
  const { lifecycle, init } = guestTab({ locks: undefined });
  // Queued ahead of the initializer's task microtask.
  queueMicrotask(() => lifecycle.invalidate("otp-login"));
  await assertSupersededBeforeDispatch(init, lifecycle, browser);
});

test("Web Lock granted: a generation change before the scheduled task cancels it", async () => {
  const browser = createBrowser();
  const locks = createLocks().forTab("tab");
  // Invalidate once, right after the first grant's own check, before its task runs.
  let changed = false;
  const granted = { request: (name, options, callback) => locks.request(name, options, () => {
    const hold = callback();
    if (!changed) { changed = true; lifecycle.invalidate("otp-login"); }
    return hold;
  }) };
  const { lifecycle, init } = guestTab({ locks: granted });
  await assertSupersededBeforeDispatch(init, lifecycle, browser);
});

test("a throwing lock manager falls back to same-tab serialization", async () => {
  const browser = createBrowser();
  const { init } = guestTab({ locks: { request() { throw new DOMException("denied", "SecurityError"); } } });
  const get = init.run(() => browser.send("get"));
  const add = init.run(() => browser.send("add", "line-1"));
  await flush();
  assert.equal(browser.inflight.length, 1);
  browser.inflight[0].deliver();
  await flush();
  browser.inflight[1].deliver();
  await Promise.all([get, add]);
  assert.deepEqual(browser.reachable(), ["line-1"]);
});
