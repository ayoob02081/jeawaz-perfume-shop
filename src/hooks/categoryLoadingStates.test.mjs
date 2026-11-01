import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const h = React.createElement;
const output = (mode, query) => {
  let retry;
  const dependencies = {
    react: { ...React, useState: () => [mode, () => {}] },
    "next/link": { __esModule: true, default: ({ children }) => h("a", null, children) },
    "@/components/NotExisted": { __esModule: true, default: () => h("p", null, "empty") },
    "@/components/Loading": { __esModule: true, default: () => h("p", null, "loading") },
    "@/components/Error": { __esModule: true, default: ({ onRetry }) => { retry = onRetry; return h("p", { role: "alert" }, "error"); } },
    "./CategoriesListTable": { __esModule: true, default: ({ categories }) => h("p", null, `rows:${categories?.map((row) => row.title).join(",")}`) },
    "@/hooks/useCategories": { useGetAllBrandCategories: () => query, useGetAllCategories: () => query },
    "@/ui/RadioButton": { __esModule: true, default: ({ children }) => h("label", null, children) },
    "@heroicons/react/24/outline": { PlusIcon: () => null },
  };
  const { code } = transformSync(readFileSync(new URL("../app/(admin)/admin/categories/_components/CategoriesLayout.jsx", import.meta.url), "utf8"), {
    filename: "CategoriesLayout.jsx", module: { type: "commonjs" },
    jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } },
  });
  const exports = {};
  new Function("require", "exports", code)((name) => dependencies[name] ?? require(name), exports);
  return { html: renderToStaticMarkup(h(exports.default)), retry };
};
for (const mode of ["brands", "gender"]) {
  test(`${mode}: pending shows loading, without fabricated rows or empty state`, () => {
    const { html } = output(mode, { isPending: true });
    assert.match(html, />loading</);
    assert.doesNotMatch(html, /rows:|>empty<|>error</);
  });
  test(`${mode}: failed reads show retry instead of stale rows or an empty result`, () => {
    const refetch = () => "retried";
    const { html, retry } = output(mode, { data: [], error: Error("offline"), refetch });
    assert.match(html, /role="alert">error/);
    assert.doesNotMatch(html, /rows:|>empty<|>loading</);
    assert.equal(retry, refetch);
    assert.equal(retry(), "retried");
  });
  test(`${mode}: background refetch keeps settled records`, () => {
    const { html } = output(mode, { data: [{ id: 1, type: "gender", title: "Saved" }], isPending: false, isFetching: true });
    assert.match(html, /rows:Saved/);
    assert.doesNotMatch(html, />loading<|>error</);
  });
}
