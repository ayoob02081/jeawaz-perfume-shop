// Baseline for the browser Axios client's 401 → refresh → retry interceptor
// (auth redesign Phase 0). It runs the real httpClient.js module with a fake
// Axios adapter, so no network is used.
//
// Locked behavior:
// - one POST /auth/refresh per burst of 401s in a tab (module-level
//   refreshPromise), then each original request is retried once (_retry);
// - a 401 from /auth/refresh itself is never refreshed again;
// - a refresh failure rejects every waiting request with that failure;
// - the promise is cleared after settling, so a later 401 starts a new refresh.
//
// Known debt (not changed here): React Query's default `retry: 3` re-runs a
// failed query, and every re-run that gets 401 starts another refresh, so one
// query can cause up to 4 refresh attempts after the session has ended.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { isDefinitiveRefreshFailure } from "../utils/authSessionEvents.mjs";

const require = createRequire(import.meta.url);
const axios = require("axios");

const API = "http://api.test";

const SESSION_EVENTS_IMPORT = `import {
  isDefinitiveRefreshFailure,
  notifySessionExpired,
} from "../utils/authSessionEvents.mjs";`;

// httpClient.js is an ES module for Next.js but not loadable by plain Node
// (no "type": "module"), so its exact source is evaluated with axios and the
// session-loss signal injected (`onSessionExpired` records each signal).
// Each rewrite must match exactly once, so a changed module fails here
// instead of being silently skipped.
function loadHttpClient({ onSessionExpired = () => {} } = {}) {
  // Line endings depend on the checkout (core.autocrlf); match on LF.
  let source = readFileSync(new URL("./httpClient.js", import.meta.url), "utf8")
    .replace(/\r\n/g, "\n");
  for (const [from, to] of [
    ['"use client";', ""],
    ['import axios from "axios";', ""],
    [SESSION_EVENTS_IMPORT, ""],
    ["export default app;", "return app;"],
  ]) {
    assert.equal(source.split(from).length, 2, `httpClient.js: ${from}`);
    source = source.replace(from, to);
  }
  return new Function(
    "axios",
    "process",
    "isDefinitiveRefreshFailure",
    "notifySessionExpired",
    source,
  )(
    axios,
    { env: { NEXT_PUBLIC_API_URL: API } },
    isDefinitiveRefreshFailure,
    onSessionExpired,
  );
}

// A server whose session is fixed per scenario; records every request.
function createServer(app, { refreshStatus = 200, refreshDelay = 0 } = {}) {
  const calls = [];
  let refreshed = false;

  app.defaults.adapter = async (config) => {
    const path = config.url;
    calls.push(path);
    const respond = (status) => {
      const response = { status, statusText: "", headers: {}, config, data: {} };
      if (status >= 400) {
        throw new axios.AxiosError(
          `Request failed with status code ${status}`,
          "ERR_BAD_REQUEST",
          config,
          null,
          response,
        );
      }
      return { ...response, data: { path } };
    };

    if (path === "/auth/refresh") {
      await new Promise((resolve) => setTimeout(resolve, refreshDelay));
      if (refreshStatus === 200) refreshed = true;
      return respond(refreshStatus);
    }
    if (path === "/always-401") return respond(401);
    if (path === "/server-error") return respond(500);
    return respond(refreshed ? 200 : 401);
  };

  return {
    calls,
    count: (path) => calls.filter((call) => call === path).length,
    expire: () => {
      refreshed = false;
    },
  };
}

test("a burst of 401s in one tab triggers exactly one refresh, then each request is retried once", async () => {
  const app = loadHttpClient();
  const server = createServer(app, { refreshDelay: 10 });

  const results = await Promise.all(
    ["/a", "/b", "/c", "/d"].map((path) => app.get(path)),
  );

  assert.deepEqual(
    results.map(({ data }) => data.path),
    ["/a", "/b", "/c", "/d"],
  );
  assert.equal(server.count("/auth/refresh"), 1);
  for (const path of ["/a", "/b", "/c", "/d"]) {
    assert.equal(server.count(path), 2, `${path} sent once and retried once`);
  }
});

test("a failed refresh rejects every waiting request with the refresh error and is not refreshed again", async () => {
  const app = loadHttpClient();
  const server = createServer(app, { refreshStatus: 401, refreshDelay: 10 });

  const results = await Promise.allSettled(
    ["/a", "/b", "/c"].map((path) => app.get(path)),
  );

  for (const result of results) {
    assert.equal(result.status, "rejected");
    assert.equal(result.reason.response.status, 401);
    assert.equal(result.reason.config.url, "/auth/refresh");
  }
  assert.equal(server.count("/auth/refresh"), 1);
  assert.equal(server.count("/a"), 1, "not retried after a failed refresh");
});

test("a direct /auth/refresh 401 is not intercepted", async () => {
  const app = loadHttpClient();
  const server = createServer(app, { refreshStatus: 401 });

  await assert.rejects(app.post("/auth/refresh"), (error) => {
    assert.equal(error.response.status, 401);
    return true;
  });
  assert.deepEqual(server.calls, ["/auth/refresh"]);
});

test("a retried request that is still 401 is rejected, not refreshed again (_retry)", async () => {
  const app = loadHttpClient();
  const server = createServer(app);

  await assert.rejects(app.get("/always-401"), (error) => {
    assert.equal(error.response.status, 401);
    assert.equal(error.config.url, "/always-401");
    return true;
  });
  assert.deepEqual(server.calls, ["/always-401", "/auth/refresh", "/always-401"]);
});

test("a request sent with skipAuthRefresh gets its 401 as is: no refresh, no resend", async () => {
  const app = loadHttpClient();
  const server = createServer(app);

  await assert.rejects(app.get("/a", { skipAuthRefresh: true }), (error) => {
    assert.equal(error.response.status, 401);
    return true;
  });
  assert.deepEqual(server.calls, ["/a"]);
});

test("non-401 errors pass through without a refresh", async () => {
  const app = loadHttpClient();
  const server = createServer(app);

  await assert.rejects(app.get("/server-error"), (error) => {
    assert.equal(error.response.status, 500);
    return true;
  });
  assert.deepEqual(server.calls, ["/server-error"]);
});

test("the shared refresh is cleared after it settles: a later 401 starts a new refresh", async () => {
  const app = loadHttpClient();
  const server = createServer(app);

  await app.get("/a");
  server.expire();
  await app.get("/b");

  assert.equal(server.count("/auth/refresh"), 2);
});

test("after the session ends, every new 401 starts another refresh attempt (React Query retry debt)", async () => {
  const app = loadHttpClient();
  const server = createServer(app, { refreshStatus: 401 });

  // One query plus React Query's three default retries, run sequentially.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await assert.rejects(app.get("/a"));
  }

  assert.equal(server.count("/auth/refresh"), 4);
});

// --- session loss signal (checkout/auth Phase 2B) ----------------------------

test("a refresh rejected with 401 signals session loss exactly once, however many requests waited", async () => {
  const signals = [];
  const app = loadHttpClient({ onSessionExpired: () => signals.push("expired") });
  createServer(app, { refreshStatus: 401, refreshDelay: 10 });

  await Promise.allSettled(["/a", "/b", "/c"].map((path) => app.get(path)));

  assert.deepEqual(signals, ["expired"]);
});

test("a successful refresh, a non-401 refresh failure and a credential 401 never signal session loss", async () => {
  for (const scenario of [
    { refreshStatus: 200, request: (app) => app.get("/a") },
    { refreshStatus: 500, request: (app) => app.get("/a") },
    { refreshStatus: 401, request: (app) => app.get("/a", { skipAuthRefresh: true }) },
    { refreshStatus: 401, request: (app) => app.post("/auth/refresh") },
  ]) {
    const signals = [];
    const app = loadHttpClient({ onSessionExpired: () => signals.push("expired") });
    createServer(app, { refreshStatus: scenario.refreshStatus });

    await scenario.request(app).catch(() => {});

    assert.deepEqual(signals, [], `refresh ${scenario.refreshStatus}`);
  }
});

test("the client sends credentials (cookies) with every request", () => {
  const app = loadHttpClient();

  assert.equal(app.defaults.withCredentials, true);
  assert.equal(app.defaults.baseURL, API);
});
