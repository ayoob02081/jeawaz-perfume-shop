// Password login is cookie-only: POST /auth/login answers { message, user }
// and the session travels only in the HttpOnly accessToken / refreshToken
// cookies (as for OTP login). The client must never depend on, or store,
// tokens from a response body; after login it learns the user from
// GET /users/me, which the browser authenticates with those cookies.

import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const srcDir = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFileSync(join(srcDir, path), "utf8");

const sourceFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(jsx?|mjs)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });

test("loginApi posts the credentials with the cookie-sending client", () => {
  const source = read("services/authServices.js");

  assert.match(source, /^import app from "\.\/httpClient";$/m);
  assert.match(
    source,
    /export function loginApi\(data\) \{\s*return app\.post\("\/auth\/login", data\)\.then\(\(\{ data \}\) => data\);\s*\}/,
  );
  assert.match(read("services/httpClient.js"), /withCredentials: true/);
});

test("AuthContext.login ignores the login body and loads the user from /users/me", () => {
  const source = read("contexts/auth/AuthContext.jsx");
  const login = source.slice(
    source.indexOf("const login = useCallback("),
    source.indexOf("const updateUser = useCallback("),
  );

  // The login result is awaited and discarded …
  assert.match(login, /^\s*await loginApi\(data\);$/m);
  assert.doesNotMatch(login, /=\s*await loginApi/);
  // … then the session is confirmed through the cookies.
  assert.match(login, /await checkAuth\(\);/);
  assert.match(source, /const me = await getUserApi\(\);/);
  assert.match(
    read("services/usersServices.js"),
    /export function getUserApi\(\) \{\s*return app\.get\("\/users\/me"\)/,
  );
});

test("no source reads a token from a response or stores one in browser storage", () => {
  const offenders = sourceFiles(srcDir).flatMap((path) => {
    const source = readFileSync(path, "utf8");
    const file = relative(srcDir, path).split(sep).join("/");
    return [
      /\.(accessToken|refreshToken)\b/.test(source) && `${file}: reads a token property`,
      /(localStorage|sessionStorage)\.setItem\([^)]*token/i.test(source) &&
        `${file}: stores a token in browser storage`,
    ].filter(Boolean);
  });

  assert.deepEqual(offenders, []);
});
