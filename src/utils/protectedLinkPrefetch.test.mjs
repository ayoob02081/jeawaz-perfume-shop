// Links into proxy-protected routes (/admin, /profile) must not prefetch:
// every prefetch runs proxy.js, which may refresh the session server-side,
// and parallel refreshes of the single stored refresh token conflict. A click
// still navigates through proxy.js as before.

import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { getInvoiceHref } from "./orderInvoice.mjs";

const srcDir = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFileSync(join(srcDir, path), "utf8");

const sourceFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(jsx?|mjs)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });

// Opening `<Link …>` tags; `>` inside `{…}` (arrow functions) or quotes does
// not end a tag.
function linkTags(source) {
  const tags = [];
  let i = 0;
  while ((i = source.indexOf("<Link", i)) !== -1) {
    if (/[\w.]/.test(source[i + 5])) {
      i += 5;
      continue;
    }
    let j = i + 5;
    let depth = 0;
    let quote = null;
    for (; j < source.length; j++) {
      const c = source[j];
      if (quote) {
        if (c === quote) quote = null;
      } else if (depth === 0 && (c === '"' || c === "'")) {
        quote = c;
      } else if (c === "{") {
        depth++;
      } else if (c === "}") {
        depth--;
      } else if (c === ">" && depth === 0) {
        break;
      }
    }
    tags.push({ tag: source.slice(i, j + 1), line: source.slice(0, i).split("\n").length });
    i = j;
  }
  return tags;
}

const hrefOf = (tag) =>
  tag.match(/\bhref=(\{[\s\S]*?\}(?=\s|\/?>)|"[^"]*"|'[^']*')/)?.[1].replace(/\s+/g, " ") ?? null;

const PROTECTED_HREF = /^\{?\s*["'`]\/(admin|profile)(?=[/"'`?]|$)/;
const PUBLIC_HREF = /^\{?\s*["'`](\/(?!admin|profile)|tel:|https?:)/;
const noPrefetch = (tag) => /\bprefetch=\{false\}/.test(tag);

const allLinks = sourceFiles(srcDir)
  .map((path) => ({ file: relative(srcDir, path).split(sep).join("/"), source: readFileSync(path, "utf8") }))
  .filter(({ source }) => /from ["']next\/link["']/.test(source))
  .flatMap(({ file, source }) =>
    linkTags(source).map(({ tag, line }) => ({ where: `${file}:${line}`, file, tag, href: hrefOf(tag) })),
  );

// Links whose href is a variable that always resolves to a protected route
// (the wrappers are checked against their callers below).
const PROTECTED_WRAPPERS = [
  ["components/ProfileLinks.jsx", "{href}"],
  ["app/(admin)/admin/dashboard/_components/AdminDashboardLayout.jsx", "{href}"],
  ["app/(profile)/profile/orders/[id]/invoice/page.jsx", "{href}"],
  ["app/(user)/payment/result/_components/PaymentResult.jsx", "{actions.orderLink.href}"],
  ["components/SingleOrderPage.jsx", "{getInvoiceHref(order.id)}"],
];
const isProtectedWrapper = ({ file, href }) =>
  PROTECTED_WRAPPERS.some(([wrapperFile, wrapperHref]) => file === wrapperFile && href === wrapperHref);

test("every Link to /admin or /profile disables prefetch", () => {
  const protectedLinks = allLinks.filter(({ href }) => href && PROTECTED_HREF.test(href));
  // The admin and profile areas are covered, not just a few links.
  assert.ok(protectedLinks.length >= 35, `found ${protectedLinks.length}`);
  assert.ok(protectedLinks.some(({ href }) => href.includes("/admin")));
  assert.ok(protectedLinks.some(({ href }) => href.includes("/profile")));

  const missing = protectedLinks.filter(({ tag }) => !noPrefetch(tag)).map(({ where, href }) => `${where} ${href}`);
  assert.deepEqual(missing, []);
});

test("links through always-protected wrappers disable prefetch", () => {
  for (const [file, href] of PROTECTED_WRAPPERS) {
    const links = allLinks.filter((link) => link.file === file && link.href === href);
    assert.equal(links.length, 1, `${file} ${href}`);
    assert.ok(noPrefetch(links[0].tag), `${file} ${href}`);
  }
});

test("the admin and profile sidebars only link to protected routes", () => {
  // ProfileLink renders every sidebar entry; its Link is prefetch={false}
  // because these are its only destinations.
  for (const file of [
    "app/(admin)/admin/_components/AdminSidebar.jsx",
    "app/(profile)/profile/_components/UserSidebar.jsx",
  ]) {
    const hrefs = [...read(file).matchAll(/\bhref(?::|=\{?)\s*["'`]([^"'`]+)/g)].map((m) => m[1]);
    assert.ok(hrefs.length > 0, file);
    for (const href of hrefs) assert.match(href, /^\/(admin|profile)(\/|$)/, `${file} ${href}`);
  }
  assert.equal(
    [...read("components/ProfileLinks.jsx").matchAll(/<Link\b/g)].length,
    allLinks.filter(({ file }) => file === "components/ProfileLinks.jsx").length,
  );
});

test("the dashboard, invoice and order-link wrappers only reach protected routes", () => {
  const dashboard = read("app/(admin)/admin/dashboard/_components/AdminDashboardLayout.jsx");
  const cardHrefs = [...dashboard.matchAll(/<(?:DashboardCard|DataDashboardBox)\b[^>]*?\bhref=\{?["'`]([^"'`]+)/g)].map((m) => m[1]);
  assert.ok(cardHrefs.length >= 6);
  for (const href of cardHrefs) assert.match(href, /^\/admin\//);

  const invoice = read("app/(profile)/profile/orders/[id]/invoice/page.jsx");
  const backHrefs = [...invoice.matchAll(/<BackLink\b[^>]*?\bhref=\{?["'`]([^"'`]+)/g)].map((m) => m[1]);
  assert.ok(backHrefs.length >= 1);
  for (const href of backHrefs) assert.match(href, /^\/profile\//);

  assert.match(getInvoiceHref(7), /^\/profile\//);
  const orderLinks = [...read("utils/paymentResultView.mjs").matchAll(/href: [`"]([^`"]+)/g)].map((m) => m[1]);
  assert.ok(orderLinks.length >= 2);
  for (const href of orderLinks) assert.match(href, /^\/profile\//);
});

test("public links keep Next.js default prefetching", () => {
  const publicLinks = allLinks.filter(({ href }) => href && PUBLIC_HREF.test(href));
  assert.ok(publicLinks.length >= 30, `found ${publicLinks.length}`);
  assert.deepEqual(publicLinks.filter(({ tag }) => /\bprefetch=/.test(tag)).map(({ where }) => where), []);

  // Only protected links (literal or known wrapper) opt out.
  const optedOut = allLinks.filter(({ tag }) => /\bprefetch=/.test(tag));
  assert.deepEqual(
    optedOut.filter((link) => !PROTECTED_HREF.test(link.href ?? "") && !isProtectedWrapper(link)).map(({ where, href }) => `${where} ${href}`),
    [],
  );
});

test("proxy.js still protects every /admin and /profile request, prefetch or not", () => {
  const proxy = read("proxy.js");
  assert.match(
    proxy,
    /export const config = \{\s*matcher: \["\/profile", "\/profile\/:path\*", "\/admin", "\/admin\/:path\*"\],\s*\};/,
  );
  assert.doesNotMatch(proxy, /next-router-prefetch|purpose|missing:|has:/);
});

test("middlewareAuth keeps the merged retry cookie from the previous fix", () => {
  const middlewareAuth = read("utils/middlewareAuth.js");
  assert.match(middlewareAuth, /const retryCookie = mergeCookieHeader\(originalCookie, setCookies\);/);
  assert.doesNotMatch(middlewareAuth, /prefetch/);
});
