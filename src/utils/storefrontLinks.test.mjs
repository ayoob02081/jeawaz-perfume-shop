import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Module, { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildSitemap } from "../lib/seo.mjs";

// Execute the real JSX with the project's installed compiler and real Next Link.
// Only the category data hook/router context is supplied by the test harness.
const require = createRequire(import.meta.url);
// The JSX harness compiles to CJS; use its same Query context instance.
const { QueryClient, QueryClientProvider } = require("@tanstack/react-query");
const { transformSync } = require("next/dist/build/swc");
const root = fileURLToPath(new URL("..", import.meta.url));
const slug = "زنانه & مردانه/خاص";
const categories = {
  gender: [{ id: 1, slug, type: "gender", title: "Gender category", isActive: true, productsCount: 1 }],
  character: [{ id: 2, slug, type: "character", title: "Character category", isActive: true, productsCount: 1 }],
};
const renderedLinks = [];
function renderCategory(Component, type) {
  const client = new QueryClient();
  const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client },
    React.createElement(Component, { initialSnapshot: { data: categories[type], updatedAt: Date.now() } })));
  client.clear();
  return html;
}
function components(react = React) {
  const cache = new Map();
  function load(filename) {
    filename = [filename, `${filename}.jsx`, `${filename}.js`, `${filename}.mjs`]
      .find((candidate) => existsSync(candidate));
    if (!filename) throw new Error("Component module not found");
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = new Module(filename);
    mod.filename = filename;
    cache.set(filename, mod);
    mod.require = (specifier) => {
      if (specifier === "react") return react;
      if (specifier === "next/link") return (props) => {
        renderedLinks.push(props);
        const NextLink = require("next/link");
        return React.createElement(NextLink.default ?? NextLink, props);
      };
      if (specifier === "@/hooks/useCategories") return {
        useGetStorefrontCategoriesByType: (type) => ({ data: categories[type], isPending: false }),
      };
      if (specifier === "next/navigation") return { useRouter: () => ({ push() {} }) };
      if (specifier.startsWith("@/")) return load(resolve(root, specifier.slice(2)));
      if (specifier.startsWith(".")) return load(resolve(dirname(filename), specifier));
      return require(specifier);
    };
    const { code } = transformSync(readFileSync(filename, "utf8"), {
      filename, jsc: { parser: { syntax: "ecmascript", jsx: true },
        transform: { react: { runtime: "automatic" } } }, module: { type: "commonjs" },
    });
    mod._compile(code, filename);
    return mod.exports;
  }
  return load;
}
const load = components();
const card = load(resolve(root, "app/(user)/_components/ProductCard.jsx"));
const renderCard = (product, props = {}) => renderToStaticMarkup(React.createElement(card.default, { product, ...props }));
const product = (overrides = {}) => ({ id: 105, perTitle: "Product name", enTitle: "Product name EN",
  grade: "SUPER_MASTER", brand: { value: "example" }, images: [], stock: 1_000,
  categories: { characters: [{ id: 3, title: "Sweet", type: "character", value: "sweet" }] },
  representativeVariant: { id: 1, type: "decant", volume: 5, price: 125_999 },
  isAvailable: true, ...overrides });

// React escapes text/attributes. This small tag walk checks the generated markup's
// interactive nesting, including the real PriceSection telephone fallback.
function inspect(html) {
  const stack = [], anchors = [], buttons = [];
  const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
  for (const match of html.matchAll(/<(\/?)([a-z][a-z0-9-]*)([^>]*)>/g)) {
    const [, closing, tag, attributes] = match;
    if (closing) { assert.equal(stack.pop(), tag, `balanced ${tag}`); continue; }
    if (tag === "a" || tag === "button") {
      assert(!stack.includes("a") && !stack.includes("button"), "interactive controls must not be nested");
      if (tag === "a") anchors.push(attributes.match(/\bhref="([^"]*)"/)?.[1].replaceAll("&amp;", "&"));
      else buttons.push(attributes);
    }
    if (!voidTags.has(tag)) stack.push(tag);
  }
  assert.equal(stack.length, 0);
  return { anchors, buttons };
}

test("product name, purchasable price and view control render real numeric destination hrefs", () => {
  const html = renderCard(product());
  const { anchors, buttons } = inspect(html);
  // Mobile image, desktop image, name, purchasable price and view control.
  assert.equal(anchors.filter((href) => href === "/products/105").length, 5);
  assert(html.includes("Product name") && html.includes("Product name EN"));
  assert.equal(buttons.length, 3); // Character, gender and temperature tooltip controls remain buttons.
  assert(!html.includes("href=\"/categories"));
});

test("unavailable products still link to their public detail without changing price availability", () => {
  const html = renderCard(product({ isAvailable: false }));
  const { anchors } = inspect(html);
  assert(anchors.includes("/products/105"));
  assert(!anchors.some((href) => href?.startsWith("tel:")));
  assert(html.includes("ناموجود"));
});

test("legacy zero-normalized card prices retain a separate contact link without nesting it", () => {
  const value = product({ representativeVariant: { id: 1, type: "decant", volume: 5, price: 999 } });
  delete value.isAvailable;
  const { anchors } = inspect(renderCard(value));
  assert(anchors.includes("tel:+989302125151"));
  assert(anchors.includes("/products/105"));
});

test("category destination anchors use actual query-filter keys and sitemap-identical encoding", async () => {
  const sitemap = await buildSitemap("https://api.example.test", async () => ({ ok: true, json: async () => ({
    data: [{ id: 105, categories: { gender: categories.gender[0], characters: categories.character } }],
    meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
  }) }));
  for (const [component, key] of [["GenderCategoriesLayout", "gender"], ["AccordCategoriesLayout", "characters"]]) {
    const Component = load(resolve(root, `app/(user)/_components/${component}.jsx`)).default;
    const { anchors, buttons } = inspect(renderCategory(Component, key === "gender" ? "gender" : "character"));
    const href = `/products?${new URLSearchParams({ [key]: slug })}`;
    assert.deepEqual(anchors, [href]);
    assert.equal(new URL(href, "https://jeawaz.com").searchParams.get(key), slug);
    assert(sitemap.some(({ url }) => url === `https://jeawaz.com${href}`));
    assert.equal(buttons.length, 0);
  }
});

test("loading, absent data and error cards never invent product destination links", () => {
  assert.equal(renderCard(null), "");
  for (const props of [{ isPending: true }, { error: new Error("offline") }]) {
    assert(!inspect(renderCard(product(), props)).anchors.includes("/products/105"));
  }
});

test("category tooltip actions remain buttons outside all navigation anchors", () => {
  const html = renderToStaticMarkup(React.createElement(card.CardIconResponsive, { title: "Sweet", type: "sweet", category: true }));
  const { buttons, anchors } = inspect(html);
  assert.equal(buttons.length, 1);
  assert(buttons[0].includes('type="button"'));
  assert.equal(anchors.length, 0);
});

test("destination links preserve normal/modified-click behavior and the public-link default prefetch policy", () => {
  renderedLinks.length = 0;
  renderCard(product());
  for (const name of ["GenderCategoriesLayout", "AccordCategoriesLayout"]) {
    renderCategory(load(resolve(root, `app/(user)/_components/${name}.jsx`)).default,
      name === "GenderCategoriesLayout" ? "gender" : "character");
  }
  assert.equal(renderedLinks.length, 7);
  for (const props of renderedLinks) {
    assert.equal(props.onClick, undefined);
    assert.equal(props.onNavigate, undefined);
    assert.equal(props.prefetch, undefined);
    assert.equal(props.target, undefined);
  }
});

test("the actual tooltip click handler toggles its label and non-button header icons remain noninteractive", () => {
  let state = false;
  // Exercise the existing callback/state updates without a DOM dependency.
  const hooks = { ...React, useState: () => [state, (update) => { state = update(state); }],
    useRef: () => ({ current: null }), useEffect: () => {} };
  const Icon = components(hooks)(resolve(root, "app/(user)/_components/ProductCard.jsx")).CardIconResponsive;
  const props = { category: true, title: "Sweet", type: "sweet" };
  let node = Icon(props);
  assert.equal(node.type, "button");
  assert(!node.props.children[1].props.className.includes("max-md:w-auto"));
  node.props.onClick();
  node = Icon(props);
  assert(node.props.children[1].props.className.includes("max-md:w-auto"));
  node.props.onClick();
  assert(!Icon(props).props.children[1].props.className.includes("max-md:w-auto"));
  assert.equal(Icon({ ...props, as: "span" }).props.onClick, undefined);
});
