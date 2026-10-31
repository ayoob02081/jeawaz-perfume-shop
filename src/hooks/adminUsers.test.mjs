import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { MutationObserver, QueryClient } from "@tanstack/react-query";
import { createSessionLifecycle } from "../utils/sessionLifecycle.mjs";
const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");

function hooks({ api, lifecycle, client }) {
  const source = readFileSync(new URL("./useUsers.js", import.meta.url), "utf8");
  const { code } = transformSync(source, { filename: "useUsers.js", module: { type: "commonjs" }, jsc: { parser: { syntax: "ecmascript" } } });
  const exports = {};
  const dependencies = {
    "@/services/usersServices": api,
    "@tanstack/react-query": { useQuery: (options) => options, useMutation: (options) => options, useQueryClient: () => client },
    "next/navigation": {}, "react-hot-toast": {}, "@/contexts/auth/AuthContext": {},
    "@/utils/profileFormContract.mjs": {}, "@/utils/entityPickerContract.mjs": {},
    "@/utils/sessionLifecycle.mjs": { sessionLifecycle: lifecycle },
  };
  new Function("require", "exports", code)((name) => { assert.ok(name in dependencies, name); return dependencies[name]; }, exports);
  return exports;
}
const setup = (request) => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const lifecycle = createSessionLifecycle();
  lifecycle.confirm(0, 1);
  const module = hooks({ api: { setUserBanApi: request }, lifecycle, client });
  return { client, lifecycle, observer: new MutationObserver(client, module.useSetUserBan()) };
};

test("management list keys include filters and cannot collide with cursor picker", async () => {
  let received;
  const module = hooks({ api: { listAdminUsersApi: (...args) => { received = args; return { data: [] }; } } });
  const params = { page: 2, limit: 20, search: "ali", isBanned: false };
  const options = module.useAdminUsers(params);
  assert.equal(module.useAdminUsers(params, { enabled: false }).enabled, false);
  assert.deepEqual(options.queryKey, ["users", "management", params]);
  assert.notDeepEqual(options.queryKey, module.userPickerKeys.list(params));
  const signal = new AbortController().signal;
  await options.queryFn({ signal });
  assert.deepEqual(received, [params, { signal }]);
});

test("a suspended identity cannot dispatch a ban mutation", async () => {
  let calls = 0;
  const { client, lifecycle, observer } = setup(async () => { calls++; });
  lifecycle.pause();
  try { await assert.rejects(observer.mutate({ id: 2, isBanned: true, generation: 0 }), { code: "ERR_SESSION_SUPERSEDED" }); assert.equal(calls, 0); }
  finally { client.clear(); }
});

test("a late ban response after account change cannot invalidate the new account caches", async () => {
  let release, started;
  const dispatched = new Promise((resolve) => { started = resolve; });
  const { client, lifecycle, observer } = setup(() => { started(); return new Promise((resolve) => { release = resolve; }); });
  let invalidations = 0;
  client.invalidateQueries = async () => { invalidations++; };
  const operation = observer.mutate({ id: 2, isBanned: true, generation: 0 });
  const rejection = assert.rejects(operation, { code: "ERR_SESSION_SUPERSEDED" });
  await dispatched;
  lifecycle.invalidate("account-switch");
  release({ id: 2, isBanned: true });
  await rejection;
  assert.equal(invalidations, 0);
  client.clear();
});

test("successful mutation invalidates management/picker and both detail ID forms, preserving catalog", async () => {
  const payloads = [];
  const { client, observer } = setup(async (payload) => { payloads.push(payload); return { id: 2, isBanned: false }; });
  const invalidations = [];
  client.invalidateQueries = async (query) => invalidations.push(query.queryKey);
  try {
    await observer.mutate({ id: 2, isBanned: false, generation: 0 });
    assert.deepEqual(payloads, [{ id: 2, isBanned: false }]);
    assert.deepEqual(invalidations, [["users"], ["user", "2"], ["user", 2]]);
  } finally { client.clear(); }
});

test("API failure propagates without success invalidations", async () => {
  const failure = new Error("synthetic HTTP failure");
  const { client, observer } = setup(async () => { throw failure; });
  let invalidations = 0;
  client.invalidateQueries = async () => { invalidations++; };
  try { await assert.rejects(observer.mutate({ id: 2, isBanned: true, generation: 0 }), (error) => error === failure); assert.equal(invalidations, 0); }
  finally { client.clear(); }
});

test("service contracts preserve cursor requests and send only the explicit ban body", async () => {
  const source = readFileSync(new URL("../services/usersServices.js", import.meta.url), "utf8");
  const { code } = transformSync(source, { filename: "usersServices.js", module: { type: "commonjs" }, jsc: { parser: { syntax: "ecmascript" } } });
  const calls = [];
  const app = {
    get: async (...args) => { calls.push(["get", ...args]); return { data: { data: [], nextCursor: null } }; },
    patch: async (...args) => { calls.push(["patch", ...args]); return { data: { id: 2, isBanned: false } }; },
  };
  const exports = {};
  new Function("require", "exports", code)(() => ({ __esModule: true, default: app }), exports);
  const signal = new AbortController().signal;
  await exports.listAdminUsersApi({ page: 2, limit: 20, isBanned: false }, { signal });
  await exports.searchAdminUsersApi({ search: "ali", cursor: "next", limit: 10 }, { signal });
  await exports.setUserBanApi({ id: 2, isBanned: false, unrelated: "omitted" });
  assert.deepEqual(calls, [
    ["get", "/users/admin/list", { params: { page: 2, limit: 20, isBanned: false }, signal }],
    ["get", "/users/admin", { params: { search: "ali", cursor: "next", limit: 10 }, signal }],
    ["patch", "/users/admin/2/ban", { isBanned: false }],
  ]);
});
