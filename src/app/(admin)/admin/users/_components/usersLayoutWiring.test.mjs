// Admin users list wiring. Narrow source checks: there is no DOM test
// environment. An empty list used to throw (NotExisted was never imported).

import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");
const layout = read("./UsersLayout.jsx");

// Capitalised JSX tags (`<Name` / `<Name.Part`) and the names a module
// defines through imports or its own declarations.
const jsxComponents = (source) =>
  new Set([...source.matchAll(/<([A-Z][A-Za-z0-9]*)[\s.>/]/g)].map((m) => m[1]));
const definedNames = (source) =>
  new Set([
    ...[...source.matchAll(/^import\s+([A-Z][A-Za-z0-9]*)/gm)].map((m) => m[1]),
    ...[...source.matchAll(/^import\s+(?:[A-Za-z0-9_$]+\s*,\s*)?\{([^}]*)\}/gm)].flatMap((m) =>
      m[1].split(",").map((name) => name.trim().split(/\s+as\s+/).pop()).filter(Boolean)),
    ...[...source.matchAll(/^(?:export\s+)?(?:default\s+)?(?:function|const|class)\s+([A-Z][A-Za-z0-9]*)/gm)].map((m) => m[1]),
  ]);

test("every component UsersLayout renders is imported or defined", () => {
  const missing = [...jsxComponents(layout)].filter((name) => !definedNames(layout).has(name));
  assert.deepEqual(missing, []);
  assert.match(layout, /^import NotExisted from "@\/components\/NotExisted";$/m);
});

test("loading, error, results and the empty state stay distinct", () => {
  assert.match(layout, /if \(error\) return <Error \/>;/);
  assert.match(layout, /\{isPending \? <Loading \/> : <UsersListTable users=\{users\} \/>\}/);
  // Only a settled, successful, empty answer shows the empty state.
  assert.match(layout, /\{users && !isPending && users\?\.length === 0 && \(\s*<NotExisted className="h-96">کاربری وجود ندارد!<\/NotExisted>/);
});

test("every file that renders NotExisted imports it", () => {
  const srcDir = fileURLToPath(new URL("../../../../../", import.meta.url));
  const files = (dir) =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return files(path);
      return /\.(jsx?|mjs)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
    });
  const users = files(srcDir).filter((path) => /<NotExisted\b/.test(readFileSync(path, "utf8")));
  assert.ok(users.length >= 10, `found ${users.length}`);
  const missing = users.filter(
    (path) => !/^import NotExisted from "@\/components\/NotExisted";$/m.test(readFileSync(path, "utf8")),
  );
  assert.deepEqual(missing, []);
});
