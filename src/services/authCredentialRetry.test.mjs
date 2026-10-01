// Credential checks are never resent by the client's 401 refresh-and-retry.
// A wrong password or OTP code answers 401; treating that as an expired
// session (refresh, then resend) would submit the credential twice and, for
// OTPs, count two failed attempts for one user action. Runs the real
// authServices.js on the real httpClient.js against a fake server that always
// has a valid refresh session (the case that used to trigger the resend).

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import {
  OTP_INVALID_CODE_MESSAGE,
  getOtpVerifyErrorMessage,
} from "../utils/otpLoginFlow.mjs";

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
    rewrite("./authServices.js", [['import app from "./httpClient";', ""]]).replace(
      /^export (async )?function /gm,
      "$1function ",
    ) +
      "\nreturn { loginApi, logoutApi, requestOtpApi, verifyOtpApi, getMe: () => app.get('/users/me') };",
  )(app);

  return { app, ...services };
}

// `answers[url]` is [status, data] or a function of how often it was called.
function fakeServer(app, answers) {
  const calls = [];
  app.defaults.adapter = async (config) => {
    calls.push({
      url: config.url,
      body: config.data ? JSON.parse(config.data) : undefined,
      headers: { ...config.headers },
    });
    const count = calls.filter(({ url }) => url === config.url).length;
    const answer = answers[config.url] ?? [404, {}];
    const [status, data] = typeof answer === "function" ? answer(count) : answer;
    const response = { status, statusText: "", headers: {}, config, data };
    if (status >= 400) {
      throw new axios.AxiosError(`status ${status}`, "ERR_BAD_REQUEST", config, null, response);
    }
    return response;
  };
  return {
    calls,
    count: (url) => calls.filter((call) => call.url === url).length,
  };
}

const REFRESH_OK = { "/auth/refresh": [200, { message: "Token refreshed" }] };

test("wrong OTP: exactly one POST /auth/verify-otp, no refresh, and the login flow shows the generic code message", async () => {
  const { app, verifyOtpApi } = loadServices();
  const server = fakeServer(app, {
    ...REFRESH_OK,
    "/auth/verify-otp": [401, { message: "کد نامعتبر یا منقضی است" }],
  });

  const error = await verifyOtpApi({ phoneNumber: "09121111111", code: "12345" }).catch((e) => e);

  assert.equal(error.response.status, 401);
  assert.equal(server.count("/auth/verify-otp"), 1);
  assert.equal(server.count("/auth/refresh"), 0);
  assert.equal(getOtpVerifyErrorMessage(error), OTP_INVALID_CODE_MESSAGE);
});

test("valid OTP: exactly one POST /auth/verify-otp with the unchanged body", async () => {
  const { app, verifyOtpApi } = loadServices();
  const server = fakeServer(app, {
    "/auth/verify-otp": [201, { message: "Logged in successfully", user: { id: 7 } }],
  });

  const data = await verifyOtpApi({ phoneNumber: "09121111111", code: "12345" });

  assert.deepEqual(data, { message: "Logged in successfully", user: { id: 7 } });
  assert.deepEqual(server.calls.map(({ url, body }) => ({ url, body })), [
    { url: "/auth/verify-otp", body: { phoneNumber: "09121111111", code: "12345" } },
  ]);
});

test("wrong password: exactly one POST /auth/login, no refresh, no hidden second attempt", async () => {
  const { app, loginApi } = loadServices();
  const server = fakeServer(app, {
    ...REFRESH_OK,
    "/auth/login": [401, { message: "Invalid credentials" }],
  });

  await assert.rejects(loginApi({ phoneNumber: "09121111111", password: "wrong-password" }), (error) => {
    assert.equal(error.response.status, 401);
    return true;
  });
  assert.equal(server.count("/auth/login"), 1);
  assert.equal(server.count("/auth/refresh"), 0);
});

test("the opt-out is client config only: never sent as a header or in the body", async () => {
  const { app, loginApi, verifyOtpApi } = loadServices();
  const server = fakeServer(app, {
    "/auth/login": [200, { message: "Logged in successfully" }],
    "/auth/verify-otp": [201, { message: "Logged in successfully" }],
  });

  await loginApi({ phoneNumber: "09121111111", password: "secret1" });
  await verifyOtpApi({ phoneNumber: "09121111111", code: "12345" });

  for (const call of server.calls) {
    assert.ok(!("skipAuthRefresh" in call.body));
    assert.ok(!Object.keys(call.headers).some((name) => /skip/i.test(name)));
  }
});

test("protected requests keep the refresh: 401 → one refresh → the original request resent once", async () => {
  const { app, getMe, logoutApi } = loadServices();
  const server = fakeServer(app, {
    ...REFRESH_OK,
    "/users/me": (count) => (count === 1 ? [401, {}] : [200, { id: 7 }]),
    "/auth/logout": (count) => (count === 1 ? [401, {}] : [200, { message: "Logged out successfully" }]),
  });

  assert.deepEqual((await getMe()).data, { id: 7 });
  await logoutApi();

  assert.deepEqual(server.calls.map(({ url }) => url), [
    "/users/me",
    "/auth/refresh",
    "/users/me",
    "/auth/logout",
    "/auth/refresh",
    "/auth/logout",
  ]);
});

test("request-otp is unaffected: its 400 answers pass straight through", async () => {
  const { app, requestOtpApi } = loadServices();
  const server = fakeServer(app, {
    ...REFRESH_OK,
    "/auth/request-otp": [400, { message: "لطفاً ۶۰ ثانیه بعد دوباره تلاش کنید" }],
  });

  await assert.rejects(requestOtpApi({ phoneNumber: "09121111111" }));
  assert.deepEqual(server.calls.map(({ url }) => url), ["/auth/request-otp"]);
});
