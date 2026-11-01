import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_SOCKET_AUTH_RETRIES,
  NOTIFICATION_EVENT,
  createNotificationSocketSync,
} from "./notificationSocketSync.mjs";

const keys = {
  lists: () => ["notifications", "list"],
  unreadCount: () => ["notifications", "unread-count"],
};

// A minimal Socket.IO client stand-in: `active` is false after the server
// rejected the handshake (the client then never reconnects by itself).
function fakeSocket() {
  const handlers = new Map();
  return {
    active: true,
    connectCalls: 0,
    on(event, handler) {
      handlers.set(event, [...(handlers.get(event) ?? []), handler]);
    },
    off(event, handler) {
      handlers.set(event, (handlers.get(event) ?? []).filter((h) => h !== handler));
    },
    connect() {
      this.connectCalls += 1;
    },
    count: (event) => (handlers.get(event) ?? []).length,
    emit: async (event, payload) => {
      for (const handler of handlers.get(event) ?? []) await handler(payload);
    },
  };
}

function setup({ refreshAuth = async () => ({}) } = {}) {
  const socket = fakeSocket();
  const invalidated = [];
  const notified = [];
  const refreshes = { count: 0 };
  const sync = createNotificationSocketSync({
    socket,
    queryClient: {
      invalidateQueries: (filters) => invalidated.push(filters),
      setQueryData: () => assert.fail("socket payloads never become cache data"),
    },
    keys,
    notify: (notification) => notified.push(notification),
    refreshAuth: async () => {
      refreshes.count += 1;
      return refreshAuth();
    },
  });
  sync.start();
  return { socket, sync, invalidated, notified, refreshes };
}

const reconcileCalls = [
  { queryKey: ["notifications", "list"] },
  { queryKey: ["notifications", "unread-count"], exact: true },
];

test("a new notification toasts once and invalidates the persisted list and count", async () => {
  const { socket, invalidated, notified } = setup();

  await socket.emit(NOTIFICATION_EVENT, { id: 9, title: "New" });

  assert.deepEqual(notified, [{ id: 9, title: "New" }]);
  assert.deepEqual(invalidated, reconcileCalls);
});

test("every (re)connect reconciles what was missed while disconnected", async () => {
  const { socket, invalidated } = setup();

  await socket.emit("connect");
  await socket.emit("connect");

  assert.deepEqual(invalidated, [...reconcileCalls, ...reconcileCalls]);
});

test("a transport error is left to Socket.IO's own reconnection", async () => {
  const { socket, refreshes } = setup();

  await socket.emit("connect_error", new Error("xhr poll error"));

  assert.equal(refreshes.count, 0);
  assert.equal(socket.connectCalls, 0);
});

test("a rejected handshake renews the session through REST, then reconnects once", async () => {
  const { socket, refreshes } = setup();
  socket.active = false;

  await socket.emit("connect_error", new Error("Unauthorized"));

  assert.equal(refreshes.count, 1);
  assert.equal(socket.connectCalls, 1);
});

test("a refused refresh does not reconnect (the session-loss flow owns it)", async () => {
  const { socket, refreshes } = setup({
    refreshAuth: async () => {
      throw Object.assign(new Error("401"), { response: { status: 401 } });
    },
  });
  socket.active = false;

  await socket.emit("connect_error", new Error("Unauthorized"));

  assert.equal(refreshes.count, 1);
  assert.equal(socket.connectCalls, 0);
});

test("repeated rejections stop after the bounded retries: no refresh loop", async () => {
  const { socket, refreshes } = setup();
  socket.active = false;

  for (let i = 0; i < 6; i += 1) {
    await socket.emit("connect_error", new Error("Unauthorized"));
  }

  assert.equal(refreshes.count, MAX_SOCKET_AUTH_RETRIES);
  assert.equal(socket.connectCalls, MAX_SOCKET_AUTH_RETRIES);
});

test("a successful connect restores the retry budget", async () => {
  const { socket, refreshes } = setup();
  socket.active = false;
  for (let i = 0; i < MAX_SOCKET_AUTH_RETRIES; i += 1) {
    await socket.emit("connect_error", new Error("Unauthorized"));
  }

  await socket.emit("connect");
  await socket.emit("connect_error", new Error("Unauthorized"));

  assert.equal(refreshes.count, MAX_SOCKET_AUTH_RETRIES + 1);
});

test("overlapping rejections share one renewal", async () => {
  let release;
  const { socket, refreshes } = setup({
    refreshAuth: () => new Promise((resolve) => (release = resolve)),
  });
  socket.active = false;

  const first = socket.emit("connect_error", new Error("Unauthorized"));
  await socket.emit("connect_error", new Error("Unauthorized"));
  release();
  await first;

  assert.equal(refreshes.count, 1);
  assert.equal(socket.connectCalls, 1);
});

test("stop removes every listener and a pending renewal never reconnects", async () => {
  let release;
  const { socket, sync, refreshes } = setup({
    refreshAuth: () => new Promise((resolve) => (release = resolve)),
  });
  socket.active = false;

  const pending = socket.emit("connect_error", new Error("Unauthorized"));
  sync.stop();
  release();
  await pending;

  assert.equal(refreshes.count, 1);
  assert.equal(socket.connectCalls, 0);
  for (const event of [NOTIFICATION_EVENT, "connect", "connect_error"]) {
    assert.equal(socket.count(event), 0, event);
  }
});

test("a restarted sync never keeps the previous listeners (no duplicate toasts)", async () => {
  const socket = fakeSocket();
  const notified = [];
  const options = {
    socket,
    queryClient: { invalidateQueries: () => {} },
    keys,
    notify: (notification) => notified.push(notification),
    refreshAuth: async () => ({}),
  };
  const first = createNotificationSocketSync(options);
  first.start();
  first.stop();
  createNotificationSocketSync(options).start();

  await socket.emit(NOTIFICATION_EVENT, { id: 1 });

  assert.equal(notified.length, 1);
});
