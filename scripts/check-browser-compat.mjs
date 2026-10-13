// Production-build browser compatibility gate. Runs as part of `pnpm build`.
//
// Parses every emitted client script and fails on JavaScript syntax that the
// oldest supported browser (iOS/macOS Safari 15.4, see `browserslist` in
// package.json) cannot parse. A chunk that fails to parse never registers with
// the Turbopack runtime, so the app silently never hydrates.
//
// Manual run after a build: pnpm run check:browser-compat
//
// The parser is the SWC binding that ships with Next.js (no extra dependency).
// It is an internal API, so the gate fails closed: a missing build, missing
// startup files, an unexpected parser result or a rule that stops detecting its
// known-bad sample all exit non-zero instead of passing.
//
// Exit codes: 0 pass, 1 incompatible syntax found, 2 gate could not run safely.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Project root = the parent of this scripts/ folder, whatever the cwd is.
const projectDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
// next.config.mjs keeps the default distDir.
const distDir = path.join(projectDir, ".next");
const require = createRequire(path.join(projectDir, "package.json"));

// Escaped characters (`\(`) are not syntax; drop them before matching.
const unescaped = (pattern) => pattern.replace(/\\./g, "");

// Each rule: syntax unsupported by Safari 15.4 (minimum version in the label).
const RULES = [
  {
    id: "class-static-block",
    label: "class static initialization block (Safari 16.4)",
    test: (node) => node.type === "StaticBlock",
  },
  {
    id: "regexp-lookbehind",
    label: "RegExp lookbehind (Safari 16.4)",
    test: (node) =>
      node.type === "RegExpLiteral" && /\(\?<[=!]/.test(unescaped(node.pattern)),
  },
  {
    id: "regexp-v-flag",
    label: "RegExp v flag (Safari 17)",
    test: (node) => node.type === "RegExpLiteral" && node.flags.includes("v"),
  },
  {
    id: "regexp-modifiers",
    label: "RegExp pattern modifiers (Safari 18.4)",
    test: (node) =>
      node.type === "RegExpLiteral" &&
      /\(\?[ims]*-?[ims]+:/.test(unescaped(node.pattern)),
  },
];

// Known-bad samples: every rule must fire on its own sample.
const MUST_FIRE = {
  "class-static-block": "class A{static{this.x=1}}",
  "regexp-lookbehind": "var r=/(?<=a)b/;",
  "regexp-v-flag": "var r=/[a]/v;",
  "regexp-modifiers": "var r=/(?i:a)b/;",
};
// Safari 15.4-safe code that must not fire any rule (including the lowered
// form of a static block and escaped parentheses).
const MUST_PASS =
  "class A{static #e=this.x=1}var r=[/(?:a)(?=b)(?!c)/,/\\(?<=a/,/\\(?i:a/,/a/u];";

function fail(message, code = 2) {
  console.error(message);
  process.exit(code);
}

async function loadParser() {
  let swc;
  try {
    swc = require("next/dist/build/swc");
    await swc.loadBindings();
    return swc.getBindingsSync();
  } catch (error) {
    fail(
      `Cannot load Next.js SWC parser (internal API changed?): ${error.message}`,
    );
  }
}

async function parse(bindings, source) {
  const out = await bindings.parse(source, {
    syntax: "ecmascript",
    jsx: false,
    dynamicImport: true,
    importAssertions: true,
  });
  const ast = typeof out === "string" ? JSON.parse(out) : out;
  if (!ast || (ast.type !== "Module" && ast.type !== "Script")) {
    throw new Error("unexpected parser result");
  }
  return ast;
}

function findViolations(ast, source) {
  // SWC spans are UTF-8 byte offsets relative to the root node's start.
  const base = ast.span ? ast.span.start : 0;
  const found = [];
  const stack = [ast];
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;
    if (Array.isArray(node)) {
      for (const child of node) stack.push(child);
      continue;
    }
    if (typeof node.type === "string") {
      for (const rule of RULES) {
        if (rule.test(node)) found.push({ rule, node, source, base });
      }
    }
    for (const key in node) {
      if (key !== "span") stack.push(node[key]);
    }
  }
  return found;
}

function snippet({ node, source, base }) {
  if (node.type === "RegExpLiteral") return `/${node.pattern}/${node.flags}`;
  if (!node.span) return "";
  const bytes = Buffer.from(source, "utf8");
  const start = Math.max(0, node.span.start - base - 60);
  const end = Math.min(bytes.length, node.span.end - base + 20);
  return bytes.subarray(start, end).toString("utf8").replace(/\s+/g, " ");
}

function listScripts(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) files.push(...listScripts(full));
    else if (name.endsWith(".js") || name.endsWith(".mjs")) files.push(full);
  }
  return files;
}

async function selfCheck(bindings) {
  for (const rule of RULES) {
    const source = MUST_FIRE[rule.id];
    const hits = findViolations(await parse(bindings, source), source);
    if (!hits.some((hit) => hit.rule.id === rule.id)) {
      fail(`self-check failed: rule "${rule.id}" no longer fires`);
    }
  }
  const clean = findViolations(await parse(bindings, MUST_PASS), MUST_PASS);
  if (clean.length) {
    fail(
      `self-check failed: false positive on safe code (${clean
        .map((hit) => hit.rule.id)
        .join(", ")})`,
    );
  }
}

async function main() {
  let manifest;
  try {
    manifest = JSON.parse(
      readFileSync(path.join(distDir, "build-manifest.json"), "utf8"),
    );
  } catch {
    fail(`No production build found in ${distDir}. Run the build first.`);
  }

  const bindings = await loadParser();
  await selfCheck(bindings);

  // Everything the browser can download as script lives under .next/static.
  const staticDir = path.join(distDir, "static");
  if (!existsSync(staticDir)) fail(`Missing ${staticDir}.`);
  const scripts = listScripts(staticDir);
  const scanned = new Set(scripts.map((file) => path.normalize(file)));

  // The files the manifest says every page needs must exist and be scanned.
  const startupFiles = manifest.rootMainFiles;
  if (!Array.isArray(startupFiles) || startupFiles.length === 0) {
    fail("build-manifest.json has no rootMainFiles (build output changed?).");
  }
  const required = [
    ...startupFiles,
    ...(manifest.polyfillFiles || []),
    ...(manifest.lowPriorityFiles || []),
  ].filter((file) => file.endsWith(".js"));
  for (const file of required) {
    if (!scanned.has(path.normalize(path.join(distDir, file)))) {
      fail(`Manifest file not found among emitted scripts: ${file}`);
    }
  }
  if (scripts.length < startupFiles.length) {
    fail(`Only ${scripts.length} scripts found; build output looks incomplete.`);
  }

  const startup = new Set(
    startupFiles.map((file) => path.normalize(path.join(distDir, file))),
  );
  const failures = [];

  for (const file of scripts) {
    const source = readFileSync(file, "utf8");
    const rel = path.relative(distDir, file).split(path.sep).join("/");
    const tag = startup.has(path.normalize(file)) ? " [startup]" : "";
    let ast;
    try {
      ast = await parse(bindings, source);
    } catch (error) {
      failures.push(
        `${rel}${tag}: parse error: ${String(error.message || error).split("\n")[0]}`,
      );
      continue;
    }
    for (const hit of findViolations(ast, source)) {
      failures.push(`${rel}${tag}: ${hit.rule.label}: ${snippet(hit)}`);
    }
  }

  console.log(
    `Browser compat: checked ${scripts.length} client scripts (${startup.size} startup) for Safari 15.4 syntax.`,
  );
  if (failures.length) {
    console.error(`FAIL: ${failures.length} incompatible construct(s):`);
    for (const line of failures) console.error(`  ${line}`);
    process.exit(1);
  }
  console.log("PASS: no unsupported syntax found.");
}

main().catch((error) => {
  fail(`Browser compat gate crashed: ${error.stack || error}`);
});
