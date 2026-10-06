import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  cookiePairFromSetCookie,
  mergeCookieHeader,
  parseCookieHeader,
} from "./requestCookies.mjs";
import middlewareAuth from "./middlewareAuth.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

// Set-Cookie headers as the backend writes them (attributes included).
const NEW_ACCESS = "accessToken=NEW; Max-Age=900; Path=/; HttpOnly; SameSite=Lax";
const NEW_REFRESH =
  "refreshToken=NEW_REFRESH; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax";

// Reads a Cookie header the way the backend's parser does: a repeated name
// keeps its first value.
const backendRead = (header) => Object.fromEntries(parseCookieHeader(header));

const cookieNames = (header) =>
  header.split("; ").map((pair) => pair.slice(0, pair.indexOf("=")));

// --- helper -----------------------------------------------------------------

test("the refreshed access token replaces the old one", () => {
  assert.equal(
    mergeCookieHeader("accessToken=OLD; refreshToken=OLD_REFRESH", [NEW_ACCESS]),
    "accessToken=NEW; refreshToken=OLD_REFRESH",
  );
});

test("the refreshed refresh token replaces the old one", () => {
  assert.equal(
    mergeCookieHeader("accessToken=OLD; refreshToken=OLD_REFRESH", [NEW_REFRESH]),
    "accessToken=OLD; refreshToken=NEW_REFRESH",
  );
});

test("both refreshed tokens replace both old ones, with no duplicate names", () => {
  const merged = mergeCookieHeader("accessToken=OLD; refreshToken=OLD_REFRESH", [
    NEW_ACCESS,
    NEW_REFRESH,
  ]);

  assert.equal(merged, "accessToken=NEW; refreshToken=NEW_REFRESH");
  assert.doesNotMatch(merged, /OLD/);
  assert.deepEqual(cookieNames(merged), ["accessToken", "refreshToken"]);
  assert.deepEqual(backendRead(merged), {
    accessToken: "NEW",
    refreshToken: "NEW_REFRESH",
  });
});

test("the old append-style retry header is read as the expired token", () => {
  // The previous retry header: original cookies followed by refreshed ones.
  const appended = "accessToken=OLD; refreshToken=OLD_REFRESH; accessToken=NEW; refreshToken=NEW_REFRESH";
  assert.equal(backendRead(appended).accessToken, "OLD");
});

test("unrelated browser cookies survive in place", () => {
  assert.equal(
    mergeCookieHeader(
      "theme=dark; accessToken=OLD_ACCESS; locale=fa; refreshToken=OLD_REFRESH",
      [NEW_ACCESS, NEW_REFRESH],
    ),
    "theme=dark; accessToken=NEW; locale=fa; refreshToken=NEW_REFRESH",
  );
  assert.equal(
    mergeCookieHeader("accessToken=OLD_ACCESS; refreshToken=OLD_REFRESH; theme=dark", [
      "accessToken=NEW_ACCESS; Path=/; HttpOnly",
      "refreshToken=NEW_REFRESH; Path=/; HttpOnly",
    ]),
    "accessToken=NEW_ACCESS; refreshToken=NEW_REFRESH; theme=dark",
  );
});

test("without original cookies the refreshed ones are used", () => {
  for (const original of ["", undefined, null, "   "]) {
    assert.equal(
      mergeCookieHeader(original, [NEW_ACCESS, NEW_REFRESH]),
      "accessToken=NEW; refreshToken=NEW_REFRESH",
    );
  }
  assert.equal(mergeCookieHeader("", []), "");
  assert.equal(mergeCookieHeader("theme=dark"), "theme=dark");
});

test("each cookie name appears once, even when the browser sent it twice", () => {
  // e.g. a leftover host-only copy next to the domain cookie.
  const merged = mergeCookieHeader(
    "accessToken=A1; theme=dark; accessToken=A2; refreshToken=R1; refreshToken=R2",
    [NEW_ACCESS],
  );
  assert.equal(merged, "accessToken=NEW; theme=dark; refreshToken=R1");
  assert.equal(new Set(cookieNames(merged)).size, cookieNames(merged).length);
});

test("whitespace is normalised and values are kept as sent", () => {
  assert.equal(
    mergeCookieHeader("  accessToken = OLD ;refreshToken=OLD_REFRESH;;  theme=dark ;", [
      "  accessToken=NEW ;Path=/",
    ]),
    "accessToken=NEW; refreshToken=OLD_REFRESH; theme=dark",
  );
  // "=" inside a value and quoted values are preserved.
  assert.equal(
    mergeCookieHeader('a=x=y; b="quoted value"', []),
    'a=x=y; b="quoted value"',
  );
});

test("only the leading pair of a Set-Cookie header is used", () => {
  assert.deepEqual(
    cookiePairFromSetCookie(
      "accessToken=NEW; Expires=Thu, 01 Jan 2099 00:00:00 GMT; Domain=example.com; Path=/; Secure; HttpOnly",
    ),
    { name: "accessToken", value: "NEW" },
  );
  const merged = mergeCookieHeader("theme=dark", [
    "hint=1; Path=/; Max-Age=60",
    NEW_ACCESS,
  ]);
  assert.equal(merged, "theme=dark; hint=1; accessToken=NEW");
  assert.doesNotMatch(merged, /Path|Max-Age|HttpOnly|SameSite|Expires|Domain|Secure/);
});

test("malformed or empty fragments are ignored without crashing", () => {
  assert.equal(
    mergeCookieHeader("=novalue; ; justtext; a=1; =; b", [
      "",
      ";Path=/",
      "=x; Path=/",
      "noequals; HttpOnly",
      null,
      undefined,
      NEW_ACCESS,
    ]),
    "a=1; accessToken=NEW",
  );
  assert.equal(cookiePairFromSetCookie(undefined), null);
  assert.deepEqual(Object.fromEntries(parseCookieHeader(42)), {});
});

// --- middlewareAuth ---------------------------------------------------------

const API = "https://api.test";

function setCookieHeaders(setCookies) {
  const headers = new Headers({ "content-type": "application/json" });
  for (const cookie of setCookies) headers.append("set-cookie", cookie);
  return headers;
}

// Stubs fetch with one queued response per backend call and records each
// call's URL, method and Cookie header.
function stubBackend(responses) {
  const calls = [];
  const queue = [...responses];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url,
      method: init.method,
      cookie: new Headers(init.headers).get("cookie"),
    });
    const { status, body = {}, setCookies = [] } = queue.shift();
    return new Response(JSON.stringify(body), {
      status,
      headers: setCookieHeaders(setCookies),
    });
  };
  return { calls, restore: () => (globalThis.fetch = originalFetch) };
}

const requestWithCookie = (cookie) => ({
  headers: new Headers(cookie ? { cookie } : {}),
});

async function runMiddlewareAuth(cookie, responses) {
  const previousApi = process.env.NEXT_PUBLIC_API_URL;
  process.env.NEXT_PUBLIC_API_URL = API;
  const backend = stubBackend(responses);
  try {
    const result = await middlewareAuth(requestWithCookie(cookie));
    return { result, calls: backend.calls };
  } finally {
    backend.restore();
    process.env.NEXT_PUBLIC_API_URL = previousApi;
  }
}

const ADMIN = { id: 1, role: "admin" };
const BROWSER_COOKIE = "accessToken=OLD; refreshToken=OLD_REFRESH; theme=dark";

test("after a refresh, the retry sends the NEW access token", async () => {
  const { result, calls } = await runMiddlewareAuth(BROWSER_COOKIE, [
    { status: 401 },
    { status: 200, setCookies: [NEW_ACCESS, NEW_REFRESH] },
    { status: 200, body: ADMIN },
  ]);

  assert.deepEqual(
    calls.map(({ url, method }) => [method, url]),
    [
      ["GET", `${API}/users/me`],
      ["POST", `${API}/auth/refresh`],
      ["GET", `${API}/users/me`],
    ],
  );
  // The first lookup and the refresh use the browser's cookies.
  assert.equal(calls[0].cookie, BROWSER_COOKIE);
  assert.equal(calls[1].cookie, BROWSER_COOKIE);
  // The retry carries each name once, refreshed values winning.
  assert.equal(
    calls[2].cookie,
    "accessToken=NEW; refreshToken=NEW_REFRESH; theme=dark",
  );
  assert.equal(backendRead(calls[2].cookie).accessToken, "NEW");

  assert.deepEqual(result, {
    user: ADMIN,
    statusCode: 200,
    setCookies: [NEW_ACCESS, NEW_REFRESH],
  });
});

test("refreshed Set-Cookie headers are passed on to the browser unchanged", async () => {
  const withAttributes = [
    "accessToken=NEW; Max-Age=900; Domain=example.com; Path=/; Expires=Thu, 01 Jan 2099 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax",
    "refreshToken=NEW_REFRESH; Max-Age=604800; Domain=example.com; Path=/; HttpOnly; Secure; SameSite=Lax",
  ];
  const { result } = await runMiddlewareAuth(BROWSER_COOKIE, [
    { status: 401 },
    { status: 200, setCookies: withAttributes },
    { status: 200, body: ADMIN },
  ]);
  assert.deepEqual(result.setCookies, withAttributes);

  // Also when the retried lookup still fails.
  const { result: rejected } = await runMiddlewareAuth(BROWSER_COOKIE, [
    { status: 401 },
    { status: 200, setCookies: withAttributes },
    { status: 401 },
  ]);
  assert.deepEqual(rejected, {
    user: null,
    statusCode: 401,
    setCookies: withAttributes,
  });

  // proxy.js copies them onto its response as they are.
  const proxySource = read("../proxy.js");
  assert.match(
    proxySource,
    /for \(const cookie of setCookies\) \{\s*response\.headers\.append\("Set-Cookie", cookie\);/,
  );
});

test("a valid access token needs no refresh and no retry", async () => {
  const { result, calls } = await runMiddlewareAuth(BROWSER_COOKIE, [
    { status: 200, body: ADMIN },
  ]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].cookie, BROWSER_COOKIE);
  assert.deepEqual(result, { user: ADMIN, statusCode: 200, setCookies: [] });
});

test("a failed refresh returns its status without a retry", async () => {
  const { result, calls } = await runMiddlewareAuth(BROWSER_COOKIE, [
    { status: 401 },
    { status: 401 },
  ]);
  assert.equal(calls.length, 2);
  assert.deepEqual(result, { user: null, statusCode: 401, setCookies: [] });
});

test("a request without cookies retries with only the refreshed ones", async () => {
  const { calls } = await runMiddlewareAuth("", [
    { status: 401 },
    { status: 200, setCookies: [NEW_ACCESS, NEW_REFRESH] },
    { status: 200, body: ADMIN },
  ]);
  assert.equal(calls[0].cookie, "");
  assert.equal(calls[2].cookie, "accessToken=NEW; refreshToken=NEW_REFRESH");
});
