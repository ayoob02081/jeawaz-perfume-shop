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
  // Line endings depend on the checkout (core.autocrlf); match on LF.
  let source = readFileSync(new URL(file, import.meta.url), "utf8").replace(
    /\r\n/g,
    "\n",
  );
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
    "isDefinitiveRefreshFailure",
    "notifySessionExpired",
    rewrite("./httpClient.js", [
      ['"use client";', ""],
      ['import axios from "axios";', ""],
      [
        `import {
  isDefinitiveRefreshFailure,
  notifySessionExpired,
} from "../utils/authSessionEvents.mjs";`,
        "",
      ],
      ["export default app;", "return app;"],
    ]),
  )(
    axios,
    { env: { NEXT_PUBLIC_API_URL: "http://api.test" } },
    (error) => error?.response?.status === 401,
    () => {},
  );

  const services = new Function(
    "app",
    rewrite("./authServices.js", [
      ['import app from "./httpClient";', ""],
      [
        "export function requestCurrentPhoneCodeApi(",
        "function requestCurrentPhoneCodeApi(",
      ],
      [
        "export async function verifyCurrentPhoneCodeApi(",
        "async function verifyCurrentPhoneCodeApi(",
      ],
      [
        "export function requestNewPhoneCodeApi(",
        "function requestNewPhoneCodeApi(",
      ],
      [
        "export async function verifyNewPhoneCodeApi(",
        "async function verifyNewPhoneCodeApi(",
      ],
    ]).replace(/^export /gm, "") +
      "\nreturn { requestCurrentPhoneCodeApi, verifyCurrentPhoneCodeApi, requestNewPhoneCodeApi, verifyNewPhoneCodeApi };",
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

const CHALLENGE_ID = "6f1c2b8e-1d2a-4c3b-9e4f-5a6b7c8d9e0f";
const PROOF_ID = "0b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e";
const SENT = { message: "کد تایید ارسال شد", challengeId: CHALLENGE_ID, expiresAt: "x" };

// The two code checks share one contract; each runs against its own path.
const CHECKS = [
  ["verifyCurrentPhoneCodeApi", "/auth/phone-change/current/verify"],
  ["verifyNewPhoneCodeApi", "/auth/phone-change/new/verify"],
];

test("step 1 request: one POST /auth/phone-change/current/request with an empty body, cookies only", async () => {
  const { app, requestCurrentPhoneCodeApi } = loadServices();
  const calls = fakeServer(app, () => [201, SENT]);

  const data = await requestCurrentPhoneCodeApi("09122222222");

  assert.deepEqual(data, SENT);
  // No number ever goes with it: the server sends to the stored number.
  assert.deepEqual(calls, [
    {
      method: "post",
      url: "/auth/phone-change/current/request",
      body: {},
      skipAuthRefresh: false,
      withCredentials: true,
      authorization: undefined,
    },
  ]);
});

test("step 2 request: one POST /auth/phone-change/new/request with exactly { proofId, phoneNumber }", async () => {
  const { app, requestNewPhoneCodeApi } = loadServices();
  const calls = fakeServer(app, () => [201, SENT]);

  const data = await requestNewPhoneCodeApi({ proofId: PROOF_ID, phoneNumber: "09122222222", extra: "x" });

  assert.deepEqual(data, SENT);
  assert.deepEqual(calls, [
    {
      method: "post",
      url: "/auth/phone-change/new/request",
      body: { proofId: PROOF_ID, phoneNumber: "09122222222" },
      skipAuthRefresh: false,
      withCredentials: true,
      authorization: undefined,
    },
  ]);
});

test("requests keep the normal session refresh: an expired access token is refreshed and the request resent once", async () => {
  for (const [name, call, url] of [
    ["requestCurrentPhoneCodeApi", (api) => api(), "/auth/phone-change/current/request"],
    ["requestNewPhoneCodeApi", (api) => api({ proofId: PROOF_ID, phoneNumber: "09122222222" }), "/auth/phone-change/new/request"],
  ]) {
    const services = loadServices();
    let refreshed = false;
    const calls = fakeServer(services.app, (config) => {
      if (config.url === "/auth/refresh") {
        refreshed = true;
        return [200, {}];
      }
      return refreshed ? [201, SENT] : [401, { message: "Unauthorized" }];
    });

    await call(services[name]);

    assert.deepEqual(calls.map(({ url: called }) => called), [url, "/auth/refresh", url], name);
  }
});

test("a 403 (proof gone) from the step 2 request is passed through, never refreshed or resent", async () => {
  const { app, requestNewPhoneCodeApi } = loadServices();
  const calls = fakeServer(app, () => [403, { message: "تایید شماره فعلی معتبر نیست" }]);

  await assert.rejects(requestNewPhoneCodeApi({ proofId: PROOF_ID, phoneNumber: "09122222222" }), (error) => {
    assert.equal(error.response.status, 403);
    return true;
  });
  assert.deepEqual(calls.map(({ url }) => url), ["/auth/phone-change/new/request"]);
});

test("code checks: a session read first, then exactly one POST with { challengeId, code } and no refresh-and-resend", async () => {
  for (const [name, url] of CHECKS) {
    const services = loadServices();
    const calls = fakeServer(services.app, (config) =>
      config.url === "/users/me" ? [200, { id: 7 }] : [200, { message: "ok", proofId: PROOF_ID }],
    );

    const data = await services[name]({ challengeId: CHALLENGE_ID, code: "12345", extra: "ignored" });

    assert.equal(data.message, "ok");
    assert.deepEqual(
      calls.map(({ method, url: called, body, skipAuthRefresh }) => ({ method, url: called, body, skipAuthRefresh })),
      [
        { method: "get", url: "/users/me", body: undefined, skipAuthRefresh: false },
        { method: "post", url, body: { challengeId: CHALLENGE_ID, code: "12345" }, skipAuthRefresh: true },
      ],
      name,
    );
    assert.ok(calls.every(({ withCredentials, authorization }) => withCredentials && !authorization));
  }
});

test("code checks: a wrong code (401) or a 403 is sent once, never refreshed and resent", async () => {
  for (const [name, url] of CHECKS) {
    for (const status of [401, 403]) {
      const services = loadServices();
      const calls = fakeServer(services.app, (config) =>
        config.url === "/users/me" ? [200, {}] : [status, { message: "کد نامعتبر یا منقضی است" }],
      );

      await assert.rejects(services[name]({ challengeId: CHALLENGE_ID, code: "12345" }), (error) => {
        assert.equal(error.response.status, status);
        assert.equal(error.config.url, url);
        return true;
      });
      assert.deepEqual(calls.map(({ url: called }) => called), ["/users/me", url], `${name} ${status}`);
    }
  }
});

test("code checks: an expired access token is refreshed by the session read, then the code is sent once", async () => {
  for (const [name, url] of CHECKS) {
    const services = loadServices();
    let refreshed = false;
    const calls = fakeServer(services.app, (config) => {
      if (config.url === "/auth/refresh") {
        refreshed = true;
        return [200, {}];
      }
      if (config.url === "/users/me") return refreshed ? [200, {}] : [401, {}];
      return [200, {}];
    });

    await services[name]({ challengeId: CHALLENGE_ID, code: "12345" });

    assert.deepEqual(calls.map(({ url: called }) => called), ["/users/me", "/auth/refresh", "/users/me", url], name);
  }
});

test("code checks: an ended session stops at the session read; the code is never sent", async () => {
  for (const [name, url] of CHECKS) {
    const services = loadServices();
    const calls = fakeServer(services.app, () => [401, {}]);

    await assert.rejects(services[name]({ challengeId: CHALLENGE_ID, code: "12345" }));
    assert.ok(!calls.some(({ url: called }) => called === url), name);
  }
});

test("the legacy two-code calls are gone from the client", () => {
  const source = readFileSync(new URL("./authServices.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\/auth\/phone-change\/(request|verify)["']/);
  assert.doesNotMatch(source, /currentPhoneCode|newPhoneCode/);
});

test("the service touches no token, cookie or browser storage", () => {
  const source = readFileSync(new URL("./authServices.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /localStorage|sessionStorage|document\.cookie|Authorization|accessToken|refreshToken/);
});
