import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Module, { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import React from "react";
import {
  buildProductFormPayload,
  initialProductFormValues,
} from "./productFormContract.js";
import {
  cloneSourceSummary,
  duplicateView,
  isCopyRequested,
  mapProductToCloneDefaults,
  parseCopyFromId,
} from "./productCloneContract.mjs";

// Shaped like GET /products/:id (mapProductResponse).
const source = () => ({
  id: 53,
  enTitle: "Dior Homme Intense",
  perTitle: "دیور هوم اینتنس",
  slug: "dior-homme-intense",
  releaseYear: 2011,
  country: "فرانسه",
  concentration: "EAU_DE_PARFUM",
  perfumer: "François Demachy",
  printName: "DHI",
  performance: {
    longevity: { level: "HIGH", minHours: 6, maxHours: 9 },
    projection: "MODERATE",
    sillage: "HIGH",
  },
  stock: 750,
  grade: "ORIGINAL",
  original: true,
  images: ["/uploads/a.webp", "/uploads/b.webp"],
  offValue: 15,
  description: "توضیحات",
  notesDescription: "نت‌ها",
  notes: { top: ["Lavender"], middle: ["Iris"], base: ["Vetiver", "Leather"] },
  variants: [
    { id: 101, type: "decant", volume: 10, price: 1_200_000 },
    { id: 102, type: "sealed", volume: 100, price: 9_500_000 },
  ],
  representativeVariant: { id: 101, type: "decant", volume: 10, price: 1_200_000 },
  brand: { id: 4, title: "دیور", value: "Dior", isActive: true },
  categories: {
    gender: { id: 1, slug: "male", isActive: true },
    fragranceFamilies: [{ id: 11, slug: "woody", isActive: true }, { id: 12, slug: "old", isActive: false }],
    seasons: [{ id: 21, slug: "autumn", isActive: true }],
    temperature: { id: 31, slug: "warm", isActive: false },
    characters: [{ id: 41, slug: "elegant", isActive: true }],
    occasions: [],
  },
  campaign: { decant: { id: 9, discountPercent: 20 }, sealed: null },
  createdAt: "2026-09-26T10:00:00.000Z",
  updatedAt: "2026-10-01T10:00:00.000Z",
});

test("the clone has exactly the create-form fields (no source/server keys)", () => {
  const clone = mapProductToCloneDefaults(source());
  assert.deepEqual(Object.keys(clone).sort(), Object.keys(initialProductFormValues()).sort());
  for (const forbidden of ["id", "slug", "createdAt", "updatedAt", "campaign",
    "representativeVariant", "original", "brand", "categories", "expectedVariants",
    "inventory", "reservedStock"]) {
    assert.equal(forbidden in clone, false, forbidden);
  }
  const serialized = JSON.stringify(clone);
  for (const leaked of ["dior-homme-intense", "2026-09-26", "101", "102", "1200000", "9500000"]) {
    assert.equal(serialized.includes(leaked), false, leaked);
  }
});

test("content is copied: titles, description, notes, taxonomy, details, performance", () => {
  const clone = mapProductToCloneDefaults(source());
  assert.equal(clone.enTitle, "Dior Homme Intense");
  assert.equal(clone.perTitle, "دیور هوم اینتنس");
  assert.equal(clone.description, "توضیحات");
  assert.equal(clone.notesDescription, "نت‌ها");
  assert.deepEqual(clone.notes, { top: ["Lavender"], middle: ["Iris"], base: ["Vetiver", "Leather"] });
  assert.equal(clone.brandId, "4");
  assert.equal(clone.genderId, "1");
  assert.deepEqual(clone.seasonIds, ["21"]);
  assert.deepEqual(clone.characterIds, ["41"]);
  assert.equal(clone.releaseYear, 2011);
  assert.equal(clone.country, "فرانسه");
  assert.equal(clone.concentration, "EAU_DE_PARFUM");
  assert.equal(clone.perfumer, "François Demachy");
  assert.deepEqual(clone.performance, {
    longevity: { level: "HIGH", minHours: 6, maxHours: 9 }, projection: "MODERATE", sillage: "HIGH",
  });
  // printName is copied (flagged for review in the UI, never rewritten).
  assert.equal(clone.printName, "DHI");
});

test("images reuse the same URLs (plus the empty upload slot)", () => {
  const clone = mapProductToCloneDefaults(source());
  assert.deepEqual(clone.images, [
    { url: "/uploads/a.webp" }, { url: "/uploads/b.webp" }, { url: "" },
  ]);
});

test("grade, prices, stock and discount are reset; Variant structure is kept without ids", () => {
  const clone = mapProductToCloneDefaults(source());
  assert.equal(clone.grade, "");
  assert.equal(clone.stock, 0);
  assert.equal(clone.offValue, 0);
  assert.deepEqual(clone.variants, [
    { type: "decant", volume: 10, price: "" },
    { type: "sealed", volume: 100, price: "" },
  ]);
  for (const product of [{ ...source(), grade: "SUPER_MASTER", original: false }, { ...source(), grade: undefined }]) {
    assert.equal(mapProductToCloneDefaults(product).grade, "");
  }
});

test("inactive categories are dropped so the create POST cannot fail on them", () => {
  const clone = mapProductToCloneDefaults(source());
  assert.deepEqual(clone.fragranceFamilyIds, ["11"]);
  assert.equal(clone.temperatureId, "");
  const inactiveGender = source();
  inactiveGender.categories.gender.isActive = false;
  assert.equal(mapProductToCloneDefaults(inactiveGender).genderId, "");
});

test("the source object is never mutated, and later form edits never reach it", () => {
  const original = source();
  const snapshot = structuredClone(original);
  const clone = mapProductToCloneDefaults(original);
  assert.deepEqual(original, snapshot);
  clone.notes.top.push("Pepper");
  clone.images[0].url = "/uploads/changed.webp";
  clone.variants[0].volume = 20;
  assert.deepEqual(original, snapshot);
});

test("incomplete sources still map to a valid blank-ish create form", () => {
  for (const partial of [{ id: 9 }, { id: 9, notes: null, variants: null, categories: null }]) {
    const clone = mapProductToCloneDefaults(partial);
    assert.deepEqual(Object.keys(clone).sort(), Object.keys(initialProductFormValues()).sort());
    assert.deepEqual(clone.variants, [{ type: "decant", volume: "", price: "" }]);
    assert.equal(clone.grade, "");
  }
});

test("a clone submits only after grade and prices are entered, as a create payload", () => {
  const clone = mapProductToCloneDefaults(source());
  const blocked = buildProductFormPayload(clone).errors.map(({ field }) => field);
  assert.deepEqual(blocked.sort(), ["grade", "variants.0.price", "variants.1.price"]);

  clone.grade = "SUPER_MASTER";
  clone.variants[0].price = 300_000;
  clone.variants[1].price = 2_500_000;
  // Create mode: no Variant baseline is passed, so no expectedVariants.
  const { payload, errors } = buildProductFormPayload(clone);
  assert.deepEqual(errors, []);
  assert.equal(payload.grade, "SUPER_MASTER");
  assert.equal("original" in payload, false);
  assert.equal("expectedVariants" in payload, false);
  assert.equal("id" in payload, false);
  assert.equal(payload.stock, 0);
  assert.equal(payload.offValue, 0);
  assert.deepEqual(payload.images, ["/uploads/a.webp", "/uploads/b.webp"]);
  assert.deepEqual(payload.variants, [
    { type: "decant", volume: 10, price: 300_000 },
    { type: "sealed", volume: 100, price: 2_500_000 },
  ]);
  assert.deepEqual(payload.categoryIds, [1, 11, 21, 41]);
});

test("copyFrom parsing and the explicit loading/error states", () => {
  assert.equal(parseCopyFromId("53"), 53);
  for (const bad of ["0", "-1", "abc", "5.5", " 53", "1e3", "99999999999", "2147483648", "", null, undefined]) {
    assert.equal(parseCopyFromId(bad), null, String(bad));
  }
  assert.equal(isCopyRequested(null), false);
  assert.equal(isCopyRequested(""), false);
  assert.equal(isCopyRequested("abc"), true);

  assert.deepEqual(duplicateView({ copyFrom: null }), { view: "blank" });
  assert.equal(duplicateView({ copyFrom: "abc" }).view, "error");
  assert.match(duplicateView({ copyFrom: "abc" }).message, /معتبر نیست/);
  assert.deepEqual(duplicateView({ copyFrom: "53", isLoading: true }), { view: "loading" });
  assert.match(duplicateView({ copyFrom: "53", error: { response: { status: 404 } } }).message,
    /پیدا نشد/);
  assert.match(duplicateView({ copyFrom: "53", error: new Error("Network Error") }).message,
    /ناموفق/);
  assert.equal(duplicateView({ copyFrom: "53", source: {} }).view, "error");
  assert.deepEqual(duplicateView({ copyFrom: "53", source: source() }), { view: "ready" });
});

test("the banner summary names the source and its grade", () => {
  assert.deepEqual(cloneSourceSummary(source()), { id: 53, title: "Dior Homme Intense", grade: "ORIGINAL" });
  assert.equal(cloneSourceSummary({ id: 1, perTitle: "رز", original: false }).grade, "SUPER_MASTER");
  assert.equal(cloneSourceSummary({ id: 1 }).grade, null);
});

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("duplicate mode is create mode: the source is never productToEdit", () => {
  const page = read("./AddProductPage.jsx");
  const form = read("./ProductForm.jsx");

  assert.match(page, /const searchParams = useSearchParams\(\);\s*const copyFrom = searchParams\.get\(COPY_FROM_PARAM\);/);
  assert.match(page, /<ProductForm\s+key=\{`copy-\$\{id\}`\}\s+cloneDefaults=\{cloneDefaults\}\s+copySource=\{cloneSourceSummary\(source\)\}\s+returnQuery=\{returnQuery\}\s+\/>/);
  assert.doesNotMatch(page, /productToEdit=/);
  assert.match(page, /mapProductToCloneDefaults\(source, aliases\?\.searchAliases\)/);
  // A failed copy never silently becomes a blank form.
  assert.match(page, /if \(view === "error"\) \{\s*return <CopySourceError message=\{message\} returnQuery=\{returnQuery\} \/>;\s*\}/);
  assert.match(page, /if \(view === "loading"\) return <Loading \/>;/);
  // Starting blank keeps the list to return to.
  assert.match(page, /href=\{adminProductCreateHref\(returnQuery\)\}[\s\S]*?شروع محصول خالی/);

  // Edit is chosen only by productToEdit; the Variant baseline and PATCH follow it.
  // Alias defaults are loaded before mounting; edit/PATCH still uses productToEdit only.
  assert.match(form, /productToEdit\s*\?\s*initialProductFormValues\(productToEdit, searchAliases\)\s*:\s*\(cloneDefaults \?\? initialProductFormValues\(\)\)/);
  assert.match(form, /buildProductFormPayload\(\s*data,\s*productToEdit \? editBaseline\.current\.variants : undefined,\s*\{ searchAliasesEditable: !searchAliasesUnavailable \},\s*\)/);
  assert.match(form, /productToEdit \? editProduct\(payload, release\) : addProduct\(payload, release\);/);
  assert.match(form, /useEditProduct\(productToEdit\?\.id\)/);
});

test("the Add route reads copyFrom inside Suspense", () => {
  const route = read("../add/page.jsx");
  assert.match(route, /<Suspense fallback=\{<Loading \/>\}>\s*<AddProductPage \/>\s*<\/Suspense>/);
});

test("the duplicate banner makes the new-Product context and printName review explicit", () => {
  const form = read("./ProductForm.jsx");
  assert.match(form, /در حال ساخت محصول جدید بر اساس «\{copySource\.title\}»/);
  assert.match(form, /منبع: \{gradeLabel\(copySource\.grade\) \|\| "نامشخص"\}/);
  assert.match(form, /href=\{`\/products\/\$\{copySource\.id\}`\}[\s\S]*?مشاهده محصول منبع/);
  assert.match(form, /\{copySource && \(\s*<p[^>]*>\s*از محصول منبع کپی شده است/);
});

test("both admin product tables offer «ساخت محصول مشابه» and a grade badge", () => {
  const table = read("./ProductsListTable.jsx");
  const actions = table.match(/href=\{adminProductCreateHref\(listSearch, product\.id\)\}\s*prefetch=\{false\}\s*title="ساخت محصول مشابه"\s*aria-label="ساخت محصول مشابه"/g);
  assert.equal(actions?.length, 2);
  assert.equal(table.match(/<DocumentDuplicateIcon className="size-5" \/>/g)?.length, 2);
  // Any JSX formatting of the props.
  assert.equal(table.match(/<ProductGradeBadge\s+product=\{product\}\s+variant="admin"\s*\/>/g)?.length, 2);
});


test("duplicate copies the exact admin alias string and emits it with zero discount", () => {
  const aliases = "دیور هوم اینتنس\nDior Homme Intense\nهوم اینتنس";
  const original = source();
  const clone = mapProductToCloneDefaults(original, aliases);
  assert.equal(clone.searchAliases, aliases);
  assert.equal(clone.offValue, 0);
  clone.grade = "SUPER_MASTER";
  clone.variants.forEach(variant => { variant.price = 100000; });
  const result = buildProductFormPayload(clone);
  assert.deepEqual(result.errors, []);
  assert.equal(result.payload.searchAliases, aliases);
  assert.equal(result.payload.offValue, 0);
  assert.equal(original.offValue, 15);
});

test("missing/empty alias values remain safe and every source discount starts at zero", () => {
  for (const aliases of [undefined, null, ""]) {
    const clone = mapProductToCloneDefaults(source(), aliases);
    assert.equal(clone.searchAliases, "");
    clone.grade = "ORIGINAL";
    clone.variants.forEach(variant => { variant.price = 100000; });
    const result = buildProductFormPayload(clone);
    assert.deepEqual(result.errors, []);
    assert.equal(result.payload.searchAliases, null);
    assert.equal(result.payload.offValue, 0);
  }
  for (const offValue of [undefined, null, "", 0, 15, 100]) {
    assert.equal(mapProductToCloneDefaults({ ...source(), offValue }).offValue, 0);
  }
});

test("manual duplicate discount edits reach create payload while ordinary edit/create defaults stay unchanged", () => {
  const clone = mapProductToCloneDefaults(source(), "دیور");
  clone.grade = "ORIGINAL";
  clone.variants.forEach(variant => { variant.price = 100000; });
  for (const value of [25, "10", 0]) {
    clone.offValue = value;
    const result = buildProductFormPayload(clone);
    assert.deepEqual(result.errors, []);
    assert.equal(result.payload.offValue, Number(value));
  }
  assert.equal(initialProductFormValues(source()).offValue, 15);
  assert.equal(initialProductFormValues().offValue, "");
});

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const addFilename = fileURLToPath(new URL("./AddProductPage.jsx", import.meta.url));
const addCode = transformSync(readFileSync(addFilename, "utf8"), {
  filename: addFilename, module: { type: "commonjs" },
  jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } },
}).code;
function copyPage({ copyFrom = "53", product = { data: source(), isLoading: false }, aliases = { data: { searchAliases: "دیور\nDior" }, isLoading: false } } = {}) {
  const calls = [];
  const Form = () => null;
  const Loading = () => null;
  const mod = new Module(addFilename);
  mod.filename = addFilename;
  mod.require = name => {
    if (name === "react") return { ...React, useMemo: fn => fn() };
    if (name === "next/navigation") return { useSearchParams: () => new URLSearchParams(copyFrom === null ? "" : "copyFrom=" + copyFrom) };
    if (name === "@/hooks/useProducts") return {
      useGetProductById: id => { calls.push(["product", id]); return product; },
      useGetProductSearchAliases: id => { calls.push(["aliases", id]); return aliases; },
    };
    if (name === "./ProductForm") return Form;
    if (name === "@/components/Loading") return Loading;
    if (name === "./productCloneContract.mjs") return { COPY_FROM_PARAM: "copyFrom", cloneSourceSummary, duplicateView, isCopyRequested, mapProductToCloneDefaults, parseCopyFromId };
    if (name === "@/utils/adminProductsListContract.mjs") return { ADMIN_PRODUCTS_RETURN_PARAM: "returnTo", adminProductsReturnQuery: () => "", adminProductCreateHref: () => "/admin/products/add", adminProductsReturnHref: () => "/admin/products" };
    return require(name);
  };
  mod._compile(addCode, addFilename);
  let view = mod.exports.default();
  if (view.type !== Form) view = view.type(view.props);
  return { view, calls, Form, Loading };
}

test("copy route reads aliases through the existing admin hook before creating form defaults", () => {
  const result = copyPage();
  assert.deepEqual(result.calls, [["product", 53], ["aliases", 53]]);
  assert.equal(result.view.type, result.Form);
  assert.equal(result.view.props.cloneDefaults.searchAliases, "دیور\nDior");
  assert.equal(result.view.props.cloneDefaults.offValue, 0);
  assert.equal(result.view.props.productToEdit, undefined);
});

test("copy never mounts a blank-alias form while the alias read is pending or failed", () => {
  const loading = copyPage({ aliases: { isLoading: true } });
  assert.equal(loading.view.type, loading.Loading);
  const failed = copyPage({ aliases: { isLoading: false, error: new Error("network") } });
  assert.notEqual(failed.view.type, failed.Form);
  assert.match(failed.view.props.message, /ناموفق/);
  const empty = copyPage({ aliases: { isLoading: false, data: { searchAliases: null } } });
  assert.equal(empty.view.type, empty.Form);
  assert.equal(empty.view.props.cloneDefaults.searchAliases, "");
});

test("ordinary blank creation makes no source or alias request", () => {
  const result = copyPage({ copyFrom: null });
  assert.equal(result.view.type, result.Form);
  assert.deepEqual(result.calls, []);
});
