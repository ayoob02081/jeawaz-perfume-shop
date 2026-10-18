import { sessionLifecycle, SessionSupersededError } from "./sessionLifecycle.mjs";

// The backend mints a new guest cart token (HttpOnly cookie) for every guest
// cart request that arrives without one, so concurrent first requests each
// create their own guest cart and the last Set-Cookie wins: lines added under
// the other tokens become unreachable. Until a guest request of the current
// session generation has succeeded (its Set-Cookie is then stored), this tab
// sends guest cart requests one at a time, and that first request also holds
// a cross-tab Web Lock. Both waits are bounded so a hung or abandoned holder
// never blocks the cart; past them a request proceeds unserialized, as before.
// Tabs without this code (or browsers without Web Locks) are not coordinated.
export const GUEST_CART_LOCK = "jeawaz:guest-cart-init";
export const GUEST_CART_HOLD_MS = 15_000;
export const GUEST_CART_LOCK_WAIT_MS = 20_000;

export function createGuestCartInit({
  lifecycle = sessionLifecycle,
  locks = () => globalThis.navigator?.locks,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  holdMs = GUEST_CART_HOLD_MS,
  lockWaitMs = GUEST_CART_LOCK_WAIT_MS,
} = {}) {
  let established = -1; // generation whose guest cart token a success confirmed
  let pending = null; // this tab's current initializing request

  // Settles (never rejects) when `promise` settles or after `ms`.
  const bounded = (promise, ms) => new Promise((resolve) => {
    const timer = setTimer(resolve, ms);
    const done = () => { clearTimer(timer); resolve(); };
    promise.then(done, done);
  });

  // Runs `start` under the cross-tab lock when the browser offers one. A wait
  // ends early when the generation changes (the request is then superseded)
  // or after `lockWaitMs` (the request then proceeds without the lock).
  function crossTab(generation, start) {
    const manager = locks();
    if (typeof manager?.request !== "function") return start();
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      let state = "waiting", timer, stop;
      const cleanup = () => { clearTimer(timer); stop?.(); };
      // Leaving does not rely on the abort signal being honoured: a grant
      // that still arrives later is released at once.
      const leave = () => {
        if (state !== "waiting") return;
        state = "left";
        cleanup();
        controller.abort();
        if (!lifecycle.current(generation)) reject(new SessionSupersededError());
        else start().then(resolve, reject);
      };
      timer = setTimer(leave, lockWaitMs);
      stop = lifecycle.subscribe(() => { if (!lifecycle.current(generation)) leave(); });
      try {
        Promise.resolve(manager.request(GUEST_CART_LOCK, { signal: controller.signal }, () => {
          if (state !== "waiting") return undefined;
          state = "held";
          cleanup();
          if (!lifecycle.current(generation)) {
            reject(new SessionSupersededError());
            return undefined;
          }
          const hold = start();
          hold.then(resolve, reject);
          return hold;
        })).catch(leave);
      } catch {
        leave();
      }
    });
  }

  function initialize(generation, task) {
    let work;
    const start = () => {
      // Checked again at the call: Axios captures the generation current then.
      work = Promise.resolve().then(() => {
        lifecycle.assertCurrent(generation);
        return task();
      });
      // Registered before the hold below, so waiters released by a success
      // already see the established generation.
      work.then(() => { if (lifecycle.current(generation)) established = generation; }, () => {});
      return bounded(work, holdMs);
    };
    const held = crossTab(generation, start);
    const entry = { generation, released: held.catch(() => {}) };
    pending = entry;
    entry.released.then(() => { if (pending === entry) pending = null; });
    return held.then(() => work);
  }

  return {
    established: () => established === lifecycle.generation(),
    async run(task) {
      const generation = lifecycle.generation();
      // An account's cart is found by user; only guest requests mint tokens.
      if (lifecycle.identity() != null) return task();
      for (;;) {
        lifecycle.assertCurrent(generation);
        if (established === generation) return task();
        if (pending?.generation !== generation) return initialize(generation, task);
        // A failed or timed-out initializer is replaced by the next waiter.
        await pending.released;
      }
    },
  };
}

export const guestCartInit = createGuestCartInit();

export const guestCartRequest = (task) => guestCartInit.run(task);
