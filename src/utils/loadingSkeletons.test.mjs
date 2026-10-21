import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const React = require("react");
const { renderToStaticMarkup: render } = require("react-dom/server");
const { transformSync } = require("next/dist/build/swc");
const SRC = fileURLToPath(new URL("../", import.meta.url));
let auth, addresses, addressOptions;
const modules = new Map();
const stubs = {
  "@/contexts/auth/AuthContext": { useAuth: () => auth },
  "@/hooks/useAddress": { useGetAddresses: (options) => { addressOptions = options; return addresses; }, useRemoveAddress: () => ({ removeAddress: () => {}, isDeleting: false }) },
  "@/components/AppImage": () => null,
  "@/utils/date": { toJalali: () => "-" },
  "next/link": ({ href, children, prefetch, ...props }) => React.createElement("a", { href, ...props }, children),
};
function resolveFile(base) {
  for (const file of [base, base + ".jsx", base + ".js", base + ".mjs"]) if (existsSync(file)) return file;
  throw new Error(base);
}
function load(file) {
  if (modules.has(file)) return modules.get(file).exports;
  const module = { exports: {} }; modules.set(file, module);
  const local = (name) => Object.hasOwn(stubs, name) ? stubs[name] : name.startsWith("@/") ? load(resolveFile(SRC + name.slice(2))) : name.startsWith(".") ? load(resolveFile(resolve(dirname(file), name))) : require(name);
  const { code } = transformSync(readFileSync(file, "utf8"), { filename: file, jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } }, module: { type: "commonjs" } });
  new Function("require", "module", "exports", code)(local, module, module.exports);
  return module.exports;
}
const cardModule = load(resolveFile(SRC + "app/(user)/_components/skeleton/ProductCardSkeletons"));
const profileDir = SRC + "app/(profile)/profile/_components/";
const Info = load(resolveFile(profileDir + "ProfileInfo")).default;
const Address = load(resolveFile(profileDir + "AddressLayout")).default;
const skeletons = load(resolveFile(profileDir + "ProfileSkeletons"));
const html = (Component, props) => render(React.createElement(Component, props));
const user = { id: 1, firstName: "کاربر", lastName: "آزمایشی", phoneNumber: "09123456789" };
const rows = [{ id: 1, label: "خانه", fullName: "نام خصوصی", addressLine: "آدرس خصوصی", ostan: "تهران", shahr: "تهران" }];
test.beforeEach(() => { auth = { user, loading: false, sessionReady: true }; addresses = { data: undefined, isLoading: true }; addressOptions = undefined; });

test("one product overlay owns animation and all thirteen shapes are static and decorative", () => {
  const output = html(cardModule.default);
  assert.equal((output.match(/product-card-skeleton/g) || []).length, 1);
  assert.equal((output.match(/bg-stroke-250 dark:bg-stroke-0/g) || []).length, 13);
  assert.doesNotMatch(output, /before:animate|animate-pulse|<a |<button|<input/);
  assert.match(output, /<article aria-hidden="true"/);
});
test("shared card dimensions and requested card counts are preserved", () => {
  for (const count of [1, 4, 12]) assert.equal((render(cardModule.ProductCardSkeletons({ count })).match(/<article/g) || []).length, count);
  const output = html(cardModule.default);
  for (const token of ["h-54", "md:h-115.5", "aspect-2/3", "max-md:min-w-78", "max-md:pr-0", "md:hidden", "max-md:hidden", "rounded-2xl"]) assert(output.includes(token));
});
test("card animation moves only transform, has no pointer target and disables motion on request", () => {
  const css = readFileSync(SRC + "app/globals.css", "utf8");
  const scoped = css.slice(css.indexOf("/* One transform-only shimmer"));
  assert.match(scoped, /pointer-events: none/);
  assert.match(scoped, /@keyframes product-card-shimmer[\s\S]*translateX\(-100%\)[\s\S]*translateX\(100%\)/);
  assert.doesNotMatch(scoped, /background-position|will-change/);
  assert.match(scoped, /prefers-reduced-motion: reduce[\s\S]*animation: none;[\s\S]*content: none;/);
});
test("every current product loading consumer retains the same shared module and no loading logic changes", () => {
  for (const name of ["RecentProducts", "PopularProducts", "CampaignsProducts"]) assert.match(readFileSync(SRC + "app/(user)/_components/" + name + ".jsx", "utf8"), /<ProductCardSkeletons count=\{HOME_SECTION_SKELETON_COUNT\} \/>/);
  assert.match(readFileSync(SRC + "app/(user)/products/_components/ProductsLayout.jsx", "utf8"), /<ProductCardSkeleton key=\{index\} \/>/);
});
test("profile placeholders are static named statuses with no private values or focusable controls", () => {
  for (const Component of Object.values(skeletons)) {
    const output = html(Component);
    assert.match(output, /role="status" aria-live="polite" aria-busy="true"/);
    assert.match(output, /در حال بارگذاری/);
    assert.doesNotMatch(output, /before:animate|animate-pulse|<a |<button|<input|نام خصوصی|091234/);
  }
});
test("profile info shows its skeleton only while no user has been confirmed", () => {
  auth = { user: null, loading: true, sessionReady: false };
  assert.match(html(Info), /در حال بارگذاری اطلاعات کاربری/);
});
test("profile confirmed data survives ordinary background confirmation without a loading flash", () => {
  auth.loading = true; auth.sessionReady = false;
  const output = html(Info); assert.match(output, /کاربر آزمایشی/); assert.doesNotMatch(output, /aria-busy/);
});
test("missing or failed authentication cannot render profile values", () => {
  auth = { user: null, loading: false, sessionReady: false };
  assert.equal(html(Info), "");
});
test("address loading waits for confirmation and never exposes a cached previous account", () => {
  auth = { user: null, loading: true, sessionReady: false }; addresses = { data: rows, isLoading: false };
  const output = html(Address); assert.equal(addressOptions.enabled, false); assert.match(output, /در حال بارگذاری آدرس‌ها/); assert.doesNotMatch(output, /آدرس خصوصی|نام خصوصی/);
});
test("confirmed address initial fetch uses the static address skeleton", () => {
  assert.match(html(Address), /در حال بارگذاری آدرس‌ها/); assert.equal(addressOptions.enabled, true);
});
test("successful address data and background refetches retain real controls without a skeleton", () => {
  addresses = { data: rows, isLoading: false, isFetching: true };
  const output = html(Address); assert.match(output, /آدرس خصوصی/); assert.match(output, /href="\/profile\/me\/address\/edit\/1"/); assert.doesNotMatch(output, /aria-busy/);
});
test("an authenticated address error retains the existing non-loading fallback", () => {
  addresses = { data: undefined, isLoading: false, error: new Error("offline") };
  const output = html(Address); assert.match(output, /لیست آدرس ها/); assert.doesNotMatch(output, /aria-busy|آدرس خصوصی/);
});
test("empty addresses are settled results rather than a perpetual skeleton", () => {
  addresses = { data: [], isLoading: false }; assert.doesNotMatch(html(Address), /aria-busy/);
});
test("unauthenticated addresses stay hidden and make no enabled query", () => {
  auth = { user: null, loading: false, sessionReady: true }; addresses = { data: rows, isLoading: false };
  assert.equal(html(Address), ""); assert.equal(addressOptions.enabled, false);
});
