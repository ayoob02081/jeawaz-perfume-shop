import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const { createElement: h } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const SRC = fileURLToPath(new URL("../", import.meta.url));
const read = (path) => readFileSync(SRC + path, "utf8");
const stubs = {
  "next/navigation": {},
  "next/server": { connection: async () => {} },
  "next/link": ({ href, children, prefetch, ...props }) => h("a", { href, ...props }, children),
  "@/components/HeaderLayout": () => null,
  "@/lib/storefrontCatalog.server.mjs": { fetchCatalogSnapshot: async () => ({}) },
};
for (const name of ["RecentProducts", "CampaignsProducts", "PopularProducts", "GenderCategoriesLayout", "AccordCategoriesLayout", "PrimaryBannerLayout", "SecondaryBannerLayout"])
  stubs[`./_components/${name}`] = () => null;
const modules = new Map();
function file(base) {
  for (const candidate of [base, `${base}.jsx`, `${base}.js`, `${base}.mjs`])
    if (existsSync(candidate) && statSync(candidate).isFile()) return resolve(candidate);
  throw new Error(`Cannot resolve ${base}`);
}
function load(path) {
  if (path.endsWith(".mjs")) return require(path);
  if (modules.has(path)) return modules.get(path).exports;
  const module = { exports: {} };
  modules.set(path, module);
  const { code } = transformSync(readFileSync(path, "utf8"), {
    filename: path,
    jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } },
    module: { type: "commonjs" },
  });
  const local = (name) => Object.hasOwn(stubs, name) ? stubs[name]
    : name.startsWith("@/") ? load(file(SRC + name.slice(2)))
      : name.startsWith(".") ? load(file(resolve(dirname(path), name))) : require(name);
  new Function("require", "module", "exports", "process", code)(local, module, module.exports, process);
  return module.exports;
}
const component = (path) => load(file(SRC + path)).default;
const images = (html) => [...html.matchAll(/<img\b[^>]*>/g)].map(([tag]) => tag);

test("header does not render an external animation stylesheet or preload", () => {
  const html = renderToStaticMarkup(h(component("app/Header")));
  assert.doesNotMatch(html, /cdnjs|animate\.css/);
});

test("home flowers have responsive local image URLs, fixed aspect ratio and no image preload", async () => {
  const html = renderToStaticMarkup(await component("app/(user)/page")());
  const flowers = images(html).filter((tag) => tag.includes("flower.webp"));
  assert.equal(flowers.length, 3);
  for (const tag of flowers) {
    assert.match(tag, /srcSet="[^\"]*\/_next\/image\?/i);
    assert.match(tag, /width="843"/);
    assert.match(tag, /height="1200"/);
    assert.match(tag, /sizes="\(min-width: 40rem\) 104px, 96px"/);
    assert.match(tag, /loading="lazy"/);
    assert.match(tag, /fetchPriority="low"/i);
    assert.match(tag, /alt=""/);
  }
  assert.doesNotMatch(html, /<link[^>]*as="image"/);
});

test("footer logo and trust badge stay lazy without generating image preloads", () => {
  const html = renderToStaticMarkup(h(component("app/Footer")));
  assert.doesNotMatch(html, /<link[^>]*as="image"/);
  const imgs = images(html);
  const logo = imgs.find((tag) => tag.includes("jeawaz-logo-v6.0-w"));
  assert(logo);
  assert.match(logo, /loading="lazy"/);
  const badge = imgs.find((tag) => tag.includes("trustseal.enamad.ir\/logo.aspx"));
  assert(badge);
  assert.match(badge, /loading="lazy"/);
  assert.match(badge, /referrerPolicy="origin"/i);
  const link = html.match(/<a\b[^>]*href="https:\/\/trustseal.enamad.ir\/[^>]*>/)?.[0];
  assert(link);
  assert.match(link, /target="_blank"/);
});

test("local CSS defines every animation used by Modal and Backdrop and retains duration overrides", () => {
  const css = read("app/globals.css");
  const used = new Set([...(`${read("components/Modal.jsx")} ${read("ui/Backdrop.jsx")}`).matchAll(/animate__(fade\w+)/g)].map((match) => match[1]));
  assert.deepEqual([...used].sort(), ["fadeIn", "fadeInRightBig", "fadeInUpBig", "fadeOut"]);
  for (const name of used) {
    assert.match(css, new RegExp(`@keyframes ${name}\\s*\\{`));
    assert.match(css, new RegExp(`\\.animate__${name}\\s*\\{[^}]*animation-name:\\s*${name}`));
  }
  assert.match(css, /\.animate__animated\s*\{[^}]*--animate-duration:\s*400ms/);
  assert.match(css, /animation-duration:\s*var\(--animate-duration\)/);
  assert.match(css, /animation-fill-mode:\s*both/);
  assert.match(css, /\.animate__fadeOut\s*\{[^}]*--animate-duration:\s*200ms/);
});

test("reduced-motion and print reduce animation/transition duration and keep exiting surfaces invisible", () => {
  const css = read("app/globals.css");
  const block = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce), print"));
  assert(block.startsWith("@media"));
  assert.match(block, /animation-duration:\s*1ms\s*!important/);
  assert.match(block, /transition-duration:\s*1ms\s*!important/);
  assert.match(block, /animation-iteration-count:\s*1\s*!important/);
  assert.match(block, /\.animate__animated\[class\*="Out"\]\s*\{\s*opacity:\s*0/);
});
