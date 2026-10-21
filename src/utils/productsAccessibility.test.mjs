import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Module, { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as contract from "./productFilterContract.mjs";
import * as concentration from "./productConcentration.mjs";
import * as grade from "./productGrade.mjs";
import { toPersianNumbers } from "./toPersianNumbers.js";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const filename = fileURLToPath(new URL("../app/(user)/products/_components/FiltersModal.jsx", import.meta.url));
const mod = new Module(filename);
mod.filename = filename;
let draft = structuredClone(contract.emptyFilters);
const field = () => null;
mod.require = (name) => {
  if (name === "react") return { ...React, useEffect: () => {} };
  if (name.includes("productFilterContract")) return contract;
  if (name.includes("productConcentration")) return concentration;
  if (name.includes("productGrade")) return grade;
  if (name.includes("toPersianNumbers")) return { toPersianNumbers };
  if (name.includes("useProducts")) return { useGetProductVolumeOptions: () => ({ data: { data: [5] } }) };
  if (name.includes("useCategories")) return { useGetAllBrandCategories: () => ({}), useGetStorefrontCategoriesByType: () => ({}) };
  if (name.includes("useIsHydrated")) return { useIsHydrated: () => true };
  if (name.includes("useFilters")) return { useFilters: () => ({ state: { draft } }) };
  if (name.includes("/Badge")) return { Badge: ({ title }) => React.createElement("span", null, title) };
  if (name.includes("FilterCheckBox") || name.includes("RHFTextField")) return field;
  return require(name);
};
mod._compile(transformSync(readFileSync(filename, "utf8"), {
  filename, jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } },
  module: { type: "commonjs" },
}).code, filename);
const FiltersModal = mod.exports.default;
function buttons(node, found = []) {
  if (!node || typeof node !== "object") return found;
  if (typeof node.type === "function") return buttons(node.type(node.props), found);
  if (node.type === "button") found.push(node);
  for (const child of React.Children.toArray(node.props?.children)) buttons(child, found);
  return found;
}
const options = (setMode) => ({ mode: "all", isOpen: true, setMode, watch: () => "", errors: {}, filtersFromUrl: draft });

test("every icon-only filter panel arrow has a Persian action name and retains its panel handler", () => {
  const modes = [];
  const arrows = buttons(FiltersModal(options(mode => modes.push(mode)))).filter(b => b.props.className.includes("justify-end") && b.props.className.includes("w-full"));
  assert.equal(arrows.length, 10);
  const names = new Set();
  for (const arrow of arrows) {
    assert.match(arrow.props["aria-label"] ?? "", /^انتخاب .+/);
    names.add(arrow.props["aria-label"]);
    assert.equal(arrow.props.type, "button");
    arrow.props.onClick();
  }
  assert.equal(names.size, arrows.length);
  assert.deepEqual(modes, ["brand", "fragranceFamilies", "seasons", "characters", "occasions", "temperature", "gender", "type", "concentrations", "volume"]);
});

test("selected filters retain their action names, selected controls and unchanged markup classes", () => {
  draft = { ...structuredClone(contract.emptyFilters), brandIds: [1], type: "sealed", temperature: "warm" };
  try {
    const html = renderToStaticMarkup(React.createElement(FiltersModal, options(() => {})));
    assert.match(html, /aria-label="انتخاب برند"/);
    assert.match(html, /aria-label="انتخاب نوع محصول"/);
    assert.match(html, /aria-pressed="true"/);
    assert.match(html, /class="flex items-center justify-end w-full"/);
    assert.match(html, /اعمال فیلتر/);
  } finally { draft = structuredClone(contract.emptyFilters); }
});

test("the desktop brand strip's icon button names its scroll action without changing it", () => {
  const section = readFileSync(new URL("../app/(user)/products/_components/FilterSection.jsx", import.meta.url), "utf8");
  assert.match(section, /<button\s+type="button"\s+aria-label="نمایش برندهای بیشتر"\s+onClick=\{\(\) => scrollTo\(ref, "x", -400\)\}/);
});
