// The phone-change API calls (authServices.js) on the real httpClient.js,
// against a fake Axios adapter. Both modules are ES modules for Next.js but
// not loadable by plain Node, so their exact sources are evaluated with the
// import replaced; every rewrite must match exactly once.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const axios = require("axios");

function rewrite(file, replacements) {
  let source = readFileSync(new URL(file, import.meta.url), "utf8");
  for (const [from, to] of replacements) {
    assert.equal(source.split(from).length, 2, `${file}: ${from}`);
    source = source.replace(from, to);
  }
  return source;
}

function loadServices() {
  const app = new Function(
    "axios",
    "process",
    rewrite("./httpClient.js", [
      ['"use client";', ""],
      ['import axios from "axios";', ""],
      ["export default app;", "return app;"],
    ]),
  )(axios, { env: { NEXT_PUBLIC_API_URL: "http://api.test" } });

  const services = new Function(
    "app",
    rewrite("./authServices.js", [
      ['import app from "./httpClient";', ""],
      [
        "export function requestPhoneChangeApi(",
        "function requestPhoneChangeApi(",
      ],
      [
        "export async function verifyPhoneChangeApi(",
        "async function verifyPhoneChangeApi(",
      ],
    ]).replace(/^export /gm, "") +
      "\nreturn { requestPhoneChangeApi, verifyPhoneChangeApi };",
  )(app);

  return { app, ...services };
}

// Records every request; `respond(config)` returns [status, data].
function fakeServer(app, respond) {
  const calls = [];
  app.defaults.adapter = async (config) => {
    calls.push({
      method: config.method,
      url: config.url,
      body: config.data ? JSON.parse(config.data) : undefined,
      skipAuthRefresh: config.skipAuthRefresh === true,
      withCredentials: config.withCredentials,
      authorization: config.headers?.Authorization,
    });
    const [status, data] = respond(config, calls);
    const response = { status, statusText: "", headers: {}, config, data };
    if (status >= 400) {
      throw new axios.AxiosError(`status ${status}`, "ERR_BAD_REQUEST", config, null, response);
    }
    return response;
  };
  return calls;
}

const VERIFY_BODY = {
  challengeId: "6f1c2b8e-1d2a-4c3b-9e4f-5a6b7c8d9e0f",
  currentPhoneCode: "11111",
  newPhoneCode: "22222",
};

test("request: one POST /auth/phone-change/request with exactly { phoneNumber }, cookies only", async () => {
  const { app, requestPhoneChangeApi } = loadServices();
  const calls = fakeServer(app, () => [201, { message: "کد تایید ارسال شد", challengeId: "c", expiresAt: "x" }]);

  const data = await requestPhoneChangeApi("09122222222");

  assert.deepEqual(data, { message: "کد تایید ارسال شد", challengeId: "c", expiresAt: "x" });
  assert.deepEqual(calls, [
    {
      method: "post",
      url: "/auth/phone-change/request",
      body: { phoneNumber: "09122222222" },
      skipAuthRefresh: false,
      withCredentials: true,
      authorization: undefined,
    },
  ]);
});

test("request keeps the normal session refresh: an expired access token is refreshed and the request resent", async () => {
  const { app, requestPhoneChangeApi } = loadServices();
  let refreshed = false;
  const calls = fakeServer(app, (config) => {
    if (config.url === "/auth/refresh") {
      refreshed = true;
      return [200, {}];
    }
    return refreshed ? [201, { challengeId: "c" }] : [401, { message: "Unauthorized" }];
  });

  await requestPhoneChangeApi("09122222222");

  assert.deepEqual(calls.map(({ url }) => url), [
    "/auth/phone-change/request",
    "/auth/refresh",
    "/auth/phone-change/request",
  ]);
});

test("verify: a session read first, then exactly one POST with the three fields and no refresh-and-resend", async () => {
  const { app, verifyPhoneChangeApi } = loadServices();
  const calls = fakeServer(app, (config) =>
    config.url === "/users/me"
      ? [200, { id: 7 }]
      : [200, { message: "شماره موبایل با موفقیت تغییر کرد", user: { id: 7, phoneNumber: "989122222222" } }],
  );

  const data = await verifyPhoneChangeApi({ ...VERIFY_BODY, extra: "ignored" });

  assert.deepEqual(data.user, { id: 7, phoneNumber: "989122222222" });
  assert.deepEqual(
    calls.map(({ method, url, body, skipAuthRefresh }) => ({ method, url, body, skipAuthRefresh })),
    [
      { method: "get", url: "/users/me", body: undefined, skipAuthRefresh: false },
      { method: "post", url: "/auth/phone-change/verify", body: VERIFY_BODY, skipAuthRefresh: true },
    ],
  );
  assert.ok(calls.every(({ withCredentials, authorization }) => withCredentials && !authorization));
});

test("verify: a wrong code (401) is sent once, never refreshed and resent (no second failed attempt)", async () => {
  const { app, verifyPhoneChangeApi } = loadServices();
  const calls = fakeServer(app, (config) =>
    config.url === "/users/me" ? [200, {}] : [401, { message: "کد نامعتبر یا منقضی است" }],
  );

  await assert.rejects(verifyPhoneChangeApi(VERIFY_BODY), (error) => {
    assert.equal(error.response.status, 401);
    assert.equal(error.config.url, "/auth/phone-change/verify");
    return true;
  });
  assert.deepEqual(calls.map(({ url }) => url), ["/users/me", "/auth/phone-change/verify"]);
});

test("verify: an expired access token is refreshed by the session read, then the codes are sent once", async () => {
  const { app, verifyPhoneChangeApi } = loadServices();
  let refreshed = false;
  const calls = fakeServer(app, (config) => {
    if (config.url === "/auth/refresh") {
      refreshed = true;
      return [200, {}];
    }
    if (config.url === "/users/me") return refreshed ? [200, {}] : [401, {}];
    return [200, { user: { id: 7, phoneNumber: "989122222222" } }];
  });

  await verifyPhoneChangeApi(VERIFY_BODY);

  assert.deepEqual(calls.map(({ url }) => url), [
    "/users/me",
    "/auth/refresh",
    "/users/me",
    "/auth/phone-change/verify",
  ]);
});

test("verify: an ended session stops at the session read; the codes are never sent", async () => {
  const { app, verifyPhoneChangeApi } = loadServices();
  const calls = fakeServer(app, () => [401, {}]);

  await assert.rejects(verifyPhoneChangeApi(VERIFY_BODY));
  assert.ok(!calls.some(({ url }) => url === "/auth/phone-change/verify"));
});

test("the service touches no token, cookie or browser storage", () => {
  const source = readFileSync(new URL("./authServices.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /localStorage|sessionStorage|document\.cookie|Authorization|accessToken|refreshToken/);
});
