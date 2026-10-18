// Local generations describe browser identity transitions, never token rotation.
// The cross-tab marker contains no identity, credentials or account data.
export class SessionSupersededError extends Error {
  constructor() { super("Session changed; operation cancelled"); this.name = "SessionSupersededError"; this.code = "ERR_SESSION_SUPERSEDED"; }
}
export const isSessionSuperseded = (error) => error?.code === "ERR_SESSION_SUPERSEDED";
export const SESSION_CHANGE_KEY = "jeawaz:session-change";

export const REMOTE_TRANSITION_TIMEOUT_MS = 30_000;

export function createSessionLifecycle({ setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  let generation = 0, ready = false, identity, confirmedGeneration = -1, checking = true;
  let changing = 0, barrier = Promise.resolve(), publish = () => {};
  const listeners = new Set();
  const remoteTransitions = new Map();
  const emit = (event) => [...listeners].map((listener) => listener(event));
  const lifecycle = {
    generation: () => generation,
    identity: () => identity,
    ready: () => ready,
    canConfirm: () => changing === 0 && remoteTransitions.size === 0,
    current: (captured) => captured === generation,
    assertCurrent(captured, requireReady = false) {
      if (captured !== generation || (requireReady && !ready)) throw new SessionSupersededError();
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    invalidate(reason) {
      generation += 1; ready = false; checking = true;
      // Subscribers cancel the captured old requests synchronously. Await only
      // that cancellation barrier; never issue another cancellation afterwards.
      barrier = Promise.allSettled(emit({ type: "invalidate", reason, generation }));
      return generation;
    },
    async wait(captured) { await barrier; lifecycle.assertCurrent(captured); },
    pause() { ready = false; checking = true; },
    unconfirmed() { ready = false; checking = false; confirmedGeneration = -1; emit({ type: "unconfirmed", generation }); },
    async waitUntilReady(captured) {
      lifecycle.assertCurrent(captured);
      if (ready) return;
      if (!checking) throw new SessionSupersededError();
      await new Promise((resolve, reject) => {
        const stop = lifecycle.subscribe((event) => {
          if (!lifecycle.current(captured) || event.type === "unconfirmed") {
            stop(); reject(new SessionSupersededError());
          } else if (event.type === "ready") { stop(); resolve(); }
        });
      });
      lifecycle.assertCurrent(captured, true);
    },
    confirm(captured, nextIdentity) {
      lifecycle.assertCurrent(captured);
      if (!lifecycle.canConfirm()) throw new SessionSupersededError();
      const changed = confirmedGeneration !== generation;
      identity = nextIdentity; ready = true; checking = false; confirmedGeneration = generation;
      emit({ type: "ready", generation, changed, identity });
    },
    async change(reason, action) {
      const captured = lifecycle.invalidate(reason);
      changing += 1;
      const transition = publish("started");
      let success = false;
      try {
        const value = await action();
        lifecycle.assertCurrent(captured);
        success = true;
        return value;
      } finally {
        changing -= 1;
        // A late credential response may already have affected HttpOnly cookies.
        // Reconcile their actual identity; do not claim to undo server effects.
        if (!lifecycle.current(captured)) lifecycle.invalidate("late-auth-response");
        publish("settled", transition);
        emit({ type: "settled", reason, success, generation, changing: changing > 0 });
      }
    },
    announce() { publish("settled"); },
    connect(target) {
      if (!target?.addEventListener) return () => {};
      let channel;
      try { if (target.BroadcastChannel) channel = new target.BroadcastChannel(SESSION_CHANGE_KEY); } catch { /* storage fallback */ }
      const seen = new Set();
      const remember = (key) => {
        seen.add(key);
        if (seen.size > 64) seen.delete(seen.values().next().value);
      };
      const reconcileIfSettled = () => { if (lifecycle.canConfirm()) emit({ type: "reconcile" }); };
      const receive = (message) => {
        if (message?.version !== 1 || typeof message.id !== "string" || message.id.length > 128 || !["started", "settled"].includes(message.phase)) return;
        const key = message.phase + ":" + message.id;
        if (seen.has(key) || (message.phase === "started" && seen.has("settled:" + message.id))) return;
        remember(key);
        if (message.phase === "started") {
          // A disappeared tab must not suspend this tab forever. Expiry only
          // permits a fresh identity read; it never assumes a login succeeded.
          const timer = setTimer(() => {
            if (!remoteTransitions.has(message.id)) return;
            remoteTransitions.delete(message.id);
            lifecycle.invalidate("external-timeout");
            reconcileIfSettled();
          }, REMOTE_TRANSITION_TIMEOUT_MS);
          remoteTransitions.set(message.id, timer);
        } else {
          if (remoteTransitions.has(message.id)) clearTimer(remoteTransitions.get(message.id));
          remoteTransitions.delete(message.id);
        }
        lifecycle.invalidate("external");
        if (message.phase === "settled") reconcileIfSettled();
      };
      const readMarker = () => {
        try {
          const marker = target.localStorage?.getItem(SESSION_CHANGE_KEY);
          if (marker) receive(JSON.parse(marker));
        } catch { /* storage unavailable or malformed marker */ }
      };
      const storage = (event) => {
        if (event.key !== SESSION_CHANGE_KEY || !event.newValue) return;
        try { receive(JSON.parse(event.newValue)); } catch { /* malformed marker */ }
      };
      const reconcile = () => { readMarker(); reconcileIfSettled(); };
      const send = (phase, id = target.crypto?.randomUUID?.() ?? Date.now() + ":" + Math.random()) => {
        // The same credential-free id correlates this transition's two phases.
        const message = { version: 1, phase, id };
        remember(phase + ":" + id);
        try { target.localStorage?.setItem(SESSION_CHANGE_KEY, JSON.stringify(message)); } catch { /* private browsing */ }
        try { channel?.postMessage(message); } catch { /* channel unavailable */ }
        return id;
      };
      publish = send;
      if (channel) channel.onmessage = (event) => receive(event.data);
      target.addEventListener("storage", storage);
      target.addEventListener("focus", reconcile);
      target.addEventListener("pageshow", reconcile);
      readMarker();
      return () => {
        if (publish === send) publish = () => {};
        target.removeEventListener("storage", storage);
        target.removeEventListener("focus", reconcile);
        target.removeEventListener("pageshow", reconcile);
        channel?.close();
        for (const timer of remoteTransitions.values()) clearTimer(timer);
        remoteTransitions.clear();
      };
    },
  };
  return lifecycle;
}

export const sessionLifecycle = createSessionLifecycle();
