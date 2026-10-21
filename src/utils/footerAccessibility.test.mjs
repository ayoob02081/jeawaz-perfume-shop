import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Module, { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const Link = ({ href, children, prefetch, ...props }) => React.createElement("a", { href, ...props }, children);
const filename = fileURLToPath(new URL("../app/Footer.jsx", import.meta.url));
const module = new Module(filename);
module.filename = filename;
module.require = (name) => name === "next/link" ? Link
  : name.includes("AppImage") ? ({ src, alt }) => React.createElement("img", { src, alt })
    : name.includes("OptionsFooter") ? () => null
      : name.includes("toPersianNumbers") ? { toPersianNumbers: String } : require(name);
module._compile(transformSync(readFileSync(filename, "utf8"), {
  filename,
  jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } },
  module: { type: "commonjs" },
}).code, filename);
const Footer = module.exports.default;
function visit(node, callback, parent = null) {
  if (!node || typeof node !== "object") return;
  callback(node, parent);
  for (const child of React.Children.toArray(node.props?.children)) visit(child, callback, node);
}

test("footer lists own only list items and every list item has a list parent", () => {
  let lists = 0;
  let items = 0;
  visit(Footer(), (node, parent) => {
    if (["ul", "ol"].includes(node.type)) {
      lists++;
      for (const child of React.Children.toArray(node.props.children)) assert.equal(child.type, "li");
    }
    if (node.type === "li") {
      items++;
      assert(["ul", "ol"].includes(parent?.type));
    }
  });
  assert.equal(lists, 3);
  assert.equal(items, 11);
});

test("navigation headings follow the page h1 without changing their typography; all eight storefront/account destinations retain their order", () => {
  const headings = [];
  const links = [];
  visit(Footer(), (node, parent) => {
    if (node.type === "h2") { headings.push(node.props.children); assert.notEqual(parent?.type, "li"); }
    if (node.type === Link && node.props.href.startsWith("/") && node.props.href !== "/") links.push(node.props.href);
  });
  assert.deepEqual(headings, ["عطر فروشی", "فروشگاه"]);
  assert.deepEqual(links, ["/page/about-us", "/page/contact-us", "/page/terms", "/profile/me", "/products?sort=newest", "/products?sort=most_discounted&discounted=true", "/products", "/products?sort=best_selling"]);
  const html = renderToStaticMarkup(React.createElement(Footer));
  assert.match(html, /<ul class="footer--link grid-cols-2">/);
  assert.match(html, /<ul class="footer--link grid-cols-3 \*:even:col-span-2">/);
  assert.match(html, /class="bg-stone-950 /);
  assert.equal([...html.matchAll(/<h2 class="text-lg">/g)].length, 2);
  assert.doesNotMatch(html, /<h[3-6]\b/);
});
