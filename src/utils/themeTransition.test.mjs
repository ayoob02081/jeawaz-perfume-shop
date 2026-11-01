import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { THEME_BOOTSTRAP, transitionTheme } from "./themeTransition.mjs";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
function load(relative, dependencies = {}) {
  const { code } = transformSync(readFileSync(new URL(relative, import.meta.url), "utf8"), {
    filename: relative, module: { type: "commonjs" },
    jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } },
  });
  const exports = {};
  new Function("require", "exports", code)((name) => dependencies[name] ?? require(name), exports);
  return exports.default;
}
const Provider = load("../components/providers/ThemeProvider.jsx");
const serverHtml = renderToStaticMarkup(React.createElement(Provider, null, "content"));
const boot = serverHtml.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];

for (const osDark of [false, true]) {
  for (const [stored, expected] of [[null, "light"], ["light", "light"], ["dark", "dark"], ["system", "light"]]) {
    test(`pre-paint script: saved=${stored}, OS dark=${osDark} -> ${expected}`, () => {
      const classes = new Set(), root = { classList: { remove: (...values) => values.forEach((v) => classes.delete(v)), add: (v) => classes.add(v) }, style: {} };
      let mediaReads = 0;
      vm.runInNewContext(boot, {
        document: { documentElement: root }, localStorage: { getItem: () => stored },
        window: { matchMedia: () => { mediaReads++; return { matches: osDark }; } },
      });
      assert.deepEqual([...classes], [expected]);
      // next-themes maps legacy "system" to the light class before paint;
      // CSS supplies the native-control scheme until its migration effect runs.
      if (stored !== "system") assert.equal(root.style.colorScheme, expected);
      else assert.match(readFileSync(new URL("../app/globals.css", import.meta.url), "utf8"), /html\.light\s*\{\s*color-scheme:\s*light;/);
      assert.equal(mediaReads, 0);
    });
  }
}
test("SSR toggle is stable and disabled until mounted; no window/localStorage read", () => {
  const Toggle = load("../ui/ThemeToggle.jsx", {
    "@/utils/themeTransition.mjs": { transitionTheme },
  });
  const html = renderToStaticMarkup(React.createElement(Provider, null, React.createElement(Toggle)));
  assert.match(html, /role="switch"/);
  assert.match(html, /aria-label="حالت تاریک"/);
  assert.match(html, /aria-checked="false"/);
  assert.match(html, /data-mounted="false"/);
  assert.match(html, /disabled=""/);
});
test("first hydration markup stays identical even when the client already knows saved dark", () => {
  const render = (theme) => {
    const Toggle = load("../ui/ThemeToggle.jsx", {
      "next-themes": { useTheme: () => ({ theme, setTheme() {} }) },
      "@/utils/themeTransition.mjs": { transitionTheme },
    });
    return renderToStaticMarkup(React.createElement(Toggle));
  };
  assert.equal(render(undefined), render("dark"));
});
test("icon-only toggle keeps a fixed centered box with no track or sliding thumb", () => {
  const Toggle = load("../ui/ThemeToggle.jsx", {
    "@/utils/themeTransition.mjs": { transitionTheme },
  });
  const html = renderToStaticMarkup(React.createElement(Toggle));
  assert.match(html, /inline-flex size-8 shrink-0 items-center justify-center/);
  assert.doesNotMatch(html, /theme-toggle__thumb|bg-gradient|shadow|w-12/);
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.doesNotMatch(css, /theme-thumb-|theme-toggle__thumb/);
  assert.match(css, /\.theme-toggle__sun,\s*\.theme-toggle\[data-dark="true"\] \.theme-toggle__moon\s*\{\s*opacity: 0;/);
  assert.match(css, /\.theme-toggle\[data-dark="true"\] \.theme-toggle__sun\s*\{\s*opacity: 1;/);
  assert.match(css, /@keyframes theme-icon-in/);
});
test("head bootstrap establishes the saved theme before streamed body scripts, including blocked storage", () => {
  for (const saved of [null, "dark", "light", "system", "invalid theme", "blocked"]) {
    const classes = new Set(["font-sans"]), writes = [];
    const root = { style: {}, classList: { remove: (...values) => values.forEach((v) => classes.delete(v)), add: (value) => classes.add(value) } };
    vm.runInNewContext(THEME_BOOTSTRAP, {
      document: { documentElement: root },
      localStorage: {
        getItem: () => { if (saved === "blocked") throw Error("storage blocked"); return saved; },
        setItem: (_key, value) => writes.push(value),
      },
    });
    assert.equal(root.style.colorScheme, saved === "dark" ? "dark" : "light");
    assert.ok(classes.has(root.style.colorScheme));
    assert.ok(classes.has("font-sans"));
    assert.deepEqual(writes, ["system", "invalid theme"].includes(saved) ? ["light"] : []);
  }
  const layout = readFileSync(new URL("../app/layout.jsx", import.meta.url), "utf8");
  assert.ok(layout.indexOf("jeawaz-theme-init") < layout.indexOf("<body"));
});
test("legacy system preference is migrated, but explicit dark is preserved", () => {
  for (const theme of ["system", "dark", "light"]) {
    const writes = [];
    const P = load("../components/providers/ThemeProvider.jsx", {
      react: { useEffect: (fn) => fn() },
      "next-themes": { ThemeProvider: "provider", useTheme: () => ({ theme, setTheme: (value) => writes.push(value) }) },
    });
    const tree = P({ children: "content" });
    tree.props.children[0].type();
    assert.deepEqual(writes, theme === "system" ? ["light"] : []);
    assert.equal(tree.props.enableSystem, false);
  }
});

function fixture(options = {}) {
  const originalDocument = globalThis.document, originalWindow = globalThis.window;
  const attrs = new Set(), animations = [], calls = [];
  const root = {
    hasAttribute: (key) => attrs.has(key), setAttribute: (key) => attrs.add(key), removeAttribute: (key) => attrs.delete(key),
    animate: options.noAnimate ? undefined : (frames, config) => {
      if (options.animationThrows) throw Error("unsupported pseudo-element");
      animations.push({ frames, config });
      return { finished: Promise.resolve() };
    },
  };
  globalThis.document = {
    documentElement: root, visibilityState: options.hidden ? "hidden" : "visible",
    startViewTransition: options.noApi ? undefined : (update) => {
      calls.push("start");
      if (options.startThrows) throw Error("unavailable");
      update();
      return { ready: options.skipped ? Promise.reject(Error("skipped")) : Promise.resolve(), finished: options.finished ?? Promise.resolve() };
    },
  };
  globalThis.window = { innerWidth: 1200, innerHeight: 800, matchMedia: () => ({ matches: !!options.reduce }) };
  return { attrs, animations, calls, button: { getBoundingClientRect: () => ({ left: 100, top: 40, width: 48, height: 24 }) },
    restore() { globalThis.document = originalDocument; globalThis.window = originalWindow; } };
}
for (const direction of ["light-dark", "dark-light"]) {
  test(`${direction}: reveal the new theme from button center and cover the farthest corner`, async () => {
    const f = fixture();
    try {
      let updates = 0;
      await transitionTheme(() => updates++, f.button);
      assert.equal(updates, 1);
      assert.equal(f.animations.length, 1);
      assert.equal(f.animations[0].frames.clipPath[0], "circle(0px at 124px 52px)");
      const radius = Math.hypot(1200 - 124, 800 - 52);
      assert.equal(f.animations[0].frames.clipPath[1], `circle(${radius}px at 124px 52px)`);
      assert.equal(f.animations[0].config.pseudoElement, "::view-transition-new(root)");
      assert.equal(f.attrs.size, 0);
    } finally { f.restore(); }
  });
}
for (const options of [{ noApi: true }, { noAnimate: true }, { reduce: true }, { hidden: true }, { startThrows: true }, { skipped: true }, { animationThrows: true }, { finished: Promise.resolve() }]) {
  test(`safe fallback/cleanup: ${JSON.stringify(options)}`, async () => {
    const f = fixture(options);
    try {
      let updates = 0;
      await transitionTheme(() => updates++, f.button);
      assert.equal(updates, 1);
      assert.equal(f.attrs.size, 0);
      if (options.reduce || options.noApi || options.hidden || options.noAnimate) assert.equal(f.calls.length, 0);
    } finally { f.restore(); }
  });
}
test("rejected finished promise is handled without losing the theme update", async () => {
  const f = fixture({ finished: Promise.reject(Error("skipped finish")) });
  try {
    let updates = 0;
    await transitionTheme(() => updates++, f.button);
    assert.equal(updates, 1);
    assert.equal(f.attrs.size, 0);
  } finally { f.restore(); }
});
test("two toggles cannot start concurrent document transitions; the next click works after completion", async () => {
  let finish;
  const f = fixture({ finished: new Promise((resolve) => { finish = resolve; }) });
  try {
    let updates = 0;
    const first = transitionTheme(() => updates++, f.button);
    await transitionTheme(() => updates++, f.button);
    assert.equal(updates, 1);
    finish();
    await first;
    await transitionTheme(() => updates++, f.button);
    assert.equal(updates, 2);
    assert.equal(f.attrs.size, 0);
  } finally { f.restore(); }
});
