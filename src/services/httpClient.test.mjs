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

import { createSessionLifecycle, SessionSupersededError } from "../utils/sessionLifecycle.mjs";
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
function loadHttpClient({ onSessionExpired = () => {}, lifecycle = createSessionLifecycle() } = {}) {
  if (!lifecycle.ready()) lifecycle.confirm(lifecycle.generation(), 7);
  // Line endings depend on the checkout (core.autocrlf); match on LF.
  let source = readFileSync(new URL("./httpClient.js", import.meta.url), "utf8")
    .replace(/\r\n/g, "\n");
  for (const [from, to] of [
    ['"use client";', ""],
    ['import axios from "axios";', ""],
    [SESSION_EVENTS_IMPORT, ""],
    ['import { sessionLifecycle, SessionSupersededError } from "../utils/sessionLifecycle.mjs";', ""],
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
    "sessionLifecycle", "SessionSupersededError",
    source,
  )(
    axios,
    { env: { NEXT_PUBLIC_API_URL: API } },
    isDefinitiveRefreshFailure,
    onSessionExpired, lifecycle, SessionSupersededError,
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

const deferredSession = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };
const sessionTick = () => new Promise(setImmediate);
function responseFor(config, status = 200) {
  const response = { config, status, data: {}, headers: {}, statusText: "" };
  if (status >= 400) throw new axios.AxiosError("fixture", "ERR_BAD_REQUEST", config, null, response);
  return response;
}
test("A's delayed 401 is not refreshed or replayed after switching to B", async () => {
  const lifecycle = createSessionLifecycle(), app = loadHttpClient({ lifecycle });
  const old = deferredSession(), calls = [];
  app.defaults.adapter = async (config) => {
    calls.push(config.url);
    await old.promise;
    return responseFor(config, 401);
  };
  const outcome = app.post("/cart/item", { productId: 1 }).catch((error) => error);
  await sessionTick(); lifecycle.invalidate("account-B"); old.resolve();
  assert.equal((await outcome).code, "ERR_SESSION_SUPERSEDED");
  assert.deepEqual(calls, ["/cart/item"]);
});
for (const status of [200, 401, 500]) test("delayed old refresh " + status + " cannot replay or signal loss of B", async () => {
  const lifecycle = createSessionLifecycle(), signals = [], app = loadHttpClient({ lifecycle, onSessionExpired: () => signals.push(1) });
  const old = deferredSession(), entered = deferredSession(); let cart = 0;
  app.defaults.adapter = async (config) => {
    if (config.url === "/auth/refresh") { entered.resolve(); await old.promise; return responseFor(config, status); }
    cart++; return responseFor(config, 401);
  };
  const outcome = app.post("/cart/item", {}).catch((error) => error);
  await entered.promise; lifecycle.invalidate("account-B"); old.resolve();
  assert.equal((await outcome).code, "ERR_SESSION_SUPERSEDED");
  assert.equal(cart, 1); assert.deepEqual(signals, []);
});
test("old refresh cleanup cannot clear the newer generation's single flight", async () => {
  const lifecycle = createSessionLifecycle(), app = loadHttpClient({ lifecycle });
  const old = deferredSession(), newer = deferredSession(), entered = [deferredSession(), deferredSession()]; let refreshes = 0;
  app.defaults.adapter = async (config) => {
    if (config.url === "/auth/refresh") {
      const index = refreshes++; entered[index].resolve(); await (index ? newer : old).promise;
      return responseFor(config);
    }
    return responseFor(config, config._retry ? 200 : 401);
  };
  const a = app.get("/cart").catch((error) => error); await entered[0].promise;
  lifecycle.invalidate("account-B"); lifecycle.confirm(lifecycle.generation(), 8);
  const b = app.get("/cart"); await entered[1].promise;
  old.resolve(); assert.equal((await a).code, "ERR_SESSION_SUPERSEDED");
  const b2 = app.get("/orders"); await sessionTick(); assert.equal(refreshes, 2);
  newer.resolve(); await Promise.all([b, b2]); assert.equal(refreshes, 2);
});
test("late private success is rejected; same-session success and public catalog responses survive", async () => {
  const lifecycle = createSessionLifecycle(), app = loadHttpClient({ lifecycle }), old = deferredSession();
  app.defaults.adapter = async (config) => { await old.promise; return responseFor(config); };
  const privateResult = app.get("/cart").catch((error) => error), publicResult = app.get("/products");
  await sessionTick(); lifecycle.invalidate("changed"); old.resolve();
  assert.equal((await privateResult).code, "ERR_SESSION_SUPERSEDED"); await publicResult;
  await app.get("/cart");
});

test("a late public catalog 503 preserves its error contract across a session transition", async () => {
  const lifecycle=createSessionLifecycle(),app=loadHttpClient({lifecycle}),held=deferredSession();
  app.defaults.adapter=async config=>{await held.promise;return responseFor(config,503);};
  const result=app.get("/products").catch(error=>error);await sessionTick();lifecycle.invalidate("B");held.resolve();
  assert.equal((await result).response?.status,503);
});

test("a session transition aborts only captured old cart transports, releasing the old request promptly",async()=>{
  const lifecycle=createSessionLifecycle(),app=loadHttpClient({lifecycle}),started=deferredSession();let aborted=0;
  app.defaults.adapter=config=>new Promise((resolve,reject)=>{
    if(config.url==="/cart"){started.resolve();config.signal.addEventListener("abort",()=>{aborted++;reject(new axios.CanceledError("aborted",config));},{once:true});}
    else resolve(responseFor(config));
  });
  const old=app.get("/cart").catch(e=>e);await started.promise;lifecycle.invalidate("B");assert.equal((await old).code,"ERR_SESSION_SUPERSEDED");assert.equal(aborted,1);await app.get("/products");
});
test("cart cancellation still honors the caller signal and releases its generation subscription",async()=>{
  const lifecycle=createSessionLifecycle(),app=loadHttpClient({lifecycle}),caller=new AbortController(),started=deferredSession();let aborted=0;
  app.defaults.adapter=config=>new Promise((resolve,reject)=>{started.resolve();config.signal.addEventListener("abort",()=>{aborted++;reject(new axios.CanceledError("aborted",config));},{once:true});});
  const request=app.get("/cart",{signal:caller.signal}).catch(e=>e);await started.promise;caller.abort();assert(axios.isCancel(await request));lifecycle.invalidate("B");assert.equal(aborted,1);
});

test("caller cancellation during refresh prevents the original cart request from being replayed",async()=>{
  const lifecycle=createSessionLifecycle(),app=loadHttpClient({lifecycle}),caller=new AbortController(),entered=deferredSession(),held=deferredSession();let cartRequests=0;
  app.defaults.adapter=async config=>{if(config.url==="/auth/refresh"){entered.resolve();await held.promise;return responseFor(config);}cartRequests++;return responseFor(config,401);};
  const result=app.get("/cart",{signal:caller.signal}).catch(e=>e);await entered.promise;caller.abort();held.resolve();assert(axios.isCancel(await result));assert.equal(cartRequests,1);
});


test("same-turn A invocation cannot be tagged as B or refresh/replay under B", async () => {
  const lifecycle=createSessionLifecycle(), app=loadHttpClient({lifecycle});
  const old=deferredSession(), login=deferredSession(), calls=[]; let owner=7;
  app.defaults.adapter=async config=>{
    calls.push({url:config.url,owner,retry:!!config._retry});
    if(config.url==="/cart/item"&&!config._retry){await old.promise;return responseFor(config,401);}
    return responseFor(config);
  };
  const a=app.post("/cart/item",{productId:105}).catch(error=>error);
  const b=lifecycle.change("login",async()=>{await login.promise;owner=8;});
  await sessionTick();login.resolve();await b;lifecycle.confirm(lifecycle.generation(),8);old.resolve();
  assert.equal((await a).code,"ERR_SESSION_SUPERSEDED");
  assert.deepEqual(calls,[]);
});
test("capture precedes asynchronous interceptors for callable, request and method aliases",async()=>{
  for(const invoke of [
    app=>app({url:"/orders",method:"get"}),
    app=>app("/orders",{method:"get"}),
    app=>app.request({url:"/orders",method:"get"}),
    app=>app.get("/orders"),
    app=>app.post("/cart/item",{}),
  ]){
    const lifecycle=createSessionLifecycle(),app=loadHttpClient({lifecycle}),gate=deferredSession();let dispatched=0;
    app.interceptors.request.use(async config=>{await gate.promise;return config;});
    app.defaults.adapter=async config=>{dispatched++;return responseFor(config);};
    const result=invoke(app).catch(error=>error);
    lifecycle.invalidate("B");gate.resolve();
    assert.equal((await result).code,"ERR_SESSION_SUPERSEDED");assert.equal(dispatched,0);
  }
});
