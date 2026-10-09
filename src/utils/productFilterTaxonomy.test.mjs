import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import axios from "axios";
import {
  CONCENTRATION_FILTER_LABEL,
  TAXONOMY_FILTER_GROUPS,
  activeFilterCount,
  buildQueryFromFilters,
  categoryBadgeTitle,
  emptyFilters,
  filtersReducer,
  getFiltersFromSearchParams,
  initialFilters,
  normalizeProductsQuery,
  productListKey,
  storefrontCategoryOptions,
  withoutFilterValue,
} from "./productFilterContract.mjs";
import {
  CONCENTRATION_LABELS,
  PRODUCT_CONCENTRATIONS,
  concentrationLabel,
  isProductConcentration,
} from "./productConcentration.mjs";
import { concentrationOptions } from "../app/(admin)/admin/products/_components/productFormContract.js";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const filterSection = source("../app/(user)/products/_components/FilterSection.jsx");
const filtersModal = source("../app/(user)/products/_components/FiltersModal.jsx");
const categorySidebar = source("../app/(user)/_components/CategorySidebar.jsx");
const productsLayout = source("../app/(user)/products/_components/ProductsLayout.jsx");
const singleProductPage = source("../app/(user)/products/_components/SingleProductPage.jsx");

const hydrate = (query) => getFiltersFromSearchParams(new URLSearchParams(query));
const serialize = (filters, current = "") =>
  new URLSearchParams(buildQueryFromFilters(filters, new URLSearchParams(current)));

// ProductsLayout: URL → normalized list query (the query key and request).
function listQueryFromUrl(query) {
  const searchParams = new URLSearchParams(query);
  const applied = getFiltersFromSearchParams(searchParams);
  return normalizeProductsQuery({
    search: searchParams.get("search") || undefined,
    brandIds: applied.brandIds, gender: applied.gender,
    fragranceFamilies: applied.fragranceFamilies,
    seasons: applied.seasons, temperature: applied.temperature,
    characters: applied.characters, occasions: applied.occasions,
    concentrations: applied.concentrations,
    volumes: applied.volumes, minVolume: applied.minVolume, maxVolume: applied.maxVolume,
    inStock: applied.inStock, grades: applied.grades, discounted: applied.discounted,
    minPrice: applied.priceRange[0], maxPrice: applied.priceRange[1],
    type: applied.type, sort: applied.sort || "newest",
    page: searchParams.get("page"), limit: searchParams.get("limit"),
  });
}
// The exact GET /products URL with the app's axios serializer settings.
const requestSearch = (query) => new URL(axios.getUri({
  url: "http://api.test/products", params: listQueryFromUrl(query),
  paramsSerializer: { indexes: null },
})).searchParams;

const FULL = "gender=male&fragranceFamilies=woody&fragranceFamilies=floral"
  + "&seasons=summer&seasons=spring&temperature=cool&characters=sweet&characters=sour"
  + "&occasions=daily&occasions=work&concentrations=EAU_DE_PARFUM&concentrations=PARFUM";

// --- 1–6: hydration and serialization ----------------------------------------

test("seasons hydrate from repeated keys and serialize as repeated keys", () => {
  const filters = hydrate("seasons=summer&seasons=spring&seasons=summer&seasons=");
  assert.deepEqual(filters.seasons, ["spring", "summer"]);
  assert.deepEqual(serialize(filters).getAll("seasons"), ["spring", "summer"]);
});

test("characters and occasions hydrate and serialize like seasons", () => {
  for (const key of ["characters", "occasions"]) {
    const filters = hydrate(`${key}=b&${key}=a`);
    assert.deepEqual(filters[key], ["a", "b"], key);
    assert.deepEqual(serialize(filters).getAll(key), ["a", "b"], key);
  }
});

test("temperature is single-valued", () => {
  assert.equal(hydrate("temperature=cool").temperature, "cool");
  assert.equal(hydrate("temperature=cool&temperature=warm").temperature, null);
  assert.equal(hydrate("temperature=").temperature, null);
  assert.equal(hydrate("").temperature, null);
  assert.deepEqual(serialize({ ...emptyFilters, temperature: "warm" }).getAll("temperature"), ["warm"]);

  // Single-select in the reducer: SET_ITEM replaces, null clears.
  let state = structuredClone(initialFilters);
  state = filtersReducer(state, { type: "SET_ITEM", key: "temperature", value: "cool" });
  state = filtersReducer(state, { type: "SET_ITEM", key: "temperature", value: "warm" });
  assert.equal(state.draft.temperature, "warm");
  state = filtersReducer(state, { type: "SET_ITEM", key: "temperature", value: null });
  assert.equal(state.draft.temperature, null);
});

test("concentrations hydrate and serialize only canonical values, repeated", () => {
  const filters = hydrate("concentrations=PARFUM&concentrations=edp&concentrations=EAU_DE_PARFUM"
    + "&concentrations=PARFUM");
  assert.deepEqual(filters.concentrations, ["PARFUM", "EAU_DE_PARFUM"]);
  assert.deepEqual(serialize(filters).getAll("concentrations"), ["PARFUM", "EAU_DE_PARFUM"]);
});

// --- 7–8: reset and badges ------------------------------------------------------

test("Reset All clears all five taxonomy filters and page, keeping search", () => {
  const url = serialize(emptyFilters, `search=rose&page=3&${FULL}&discounted=true`);
  for (const key of ["seasons", "temperature", "characters", "occasions", "concentrations",
    "gender", "fragranceFamilies", "discounted", "page"]) {
    assert.equal(url.get(key), null, key);
  }
  assert.equal(url.get("search"), "rose");
});

test("each selected value can be removed individually; temperature is removable", () => {
  const current = `search=rose&page=2&${FULL}`;
  const filters = hydrate(current);

  const withoutSummer = serialize(withoutFilterValue(filters, "seasons", "summer"), current);
  assert.deepEqual(withoutSummer.getAll("seasons"), ["spring"]);
  assert.equal(withoutSummer.get("page"), null);
  assert.equal(withoutSummer.get("search"), "rose");
  assert.deepEqual(withoutSummer.getAll("characters"), ["sour", "sweet"]);

  assert.deepEqual(serialize(withoutFilterValue(filters, "characters", "sweet"), current)
    .getAll("characters"), ["sour"]);
  assert.deepEqual(serialize(withoutFilterValue(filters, "occasions", "work"), current)
    .getAll("occasions"), ["daily"]);
  assert.deepEqual(serialize(withoutFilterValue(filters, "concentrations", "PARFUM"), current)
    .getAll("concentrations"), ["EAU_DE_PARFUM"]);
  assert.equal(serialize(withoutFilterValue(filters, "temperature", "cool"), current)
    .get("temperature"), null);
});

test("active badges show Persian titles/labels and remove through the URL at once", () => {
  const categories = [
    { type: "season", slug: "summer", title: "تابستان" },
    { type: "temperature", slug: "cool", title: "سرد" },
  ];
  assert.equal(categoryBadgeTitle(categories, "season", "summer", "فصل"), "تابستان");
  assert.equal(categoryBadgeTitle(categories, "character", "summer", "طعم"), "طعم");
  assert.equal(categoryBadgeTitle(undefined, "season", "summer", "فصل"), "فصل");

  assert.match(filterSection,
    /TAXONOMY_FILTER_GROUPS\.flatMap\(\(\{ key, type, label \}\) =>[\s\S]*?title=\{categoryBadgeTitle\(categories, type, slug, label\)\}\s*onClick=\{\(\) => removeValueAndSync\(key, slug\)\}/);
  assert.match(filterSection,
    /title=\{concentrationLabel\(value\)\}\s*onClick=\{\(\) => removeValueAndSync\("concentrations", value\)\}/);
  assert.match(filterSection,
    /function removeValueAndSync\(key, value\) \{\s*const next = withoutFilterValue\(filtersFromUrl, key, value\);\s*const query = buildQueryFromFilters\(next, searchParams\);\s*router\.replace/);
  // The Phase A discounted badge is untouched.
  assert.match(filterSection, /title="تخفیف‌دار"\s*onClick=\{\(\) => resetOneAndSync\("discounted"\)\}/);
});

// --- 9: request -----------------------------------------------------------------

test("Apply sends all five to GET /products with repeated keys, in the query key too", () => {
  let state = structuredClone(initialFilters);
  const act = (type, key, value) => { state = filtersReducer(state, { type, key, value }); };
  state = filtersReducer(state, { type: "HYDRATE_FROM_URL", payload: hydrate("gender=male") });
  act("SET_ITEMS", "seasons", "summer");
  act("SET_ITEMS", "seasons", "spring");
  act("SET_ITEM", "temperature", "cool");
  act("SET_ITEMS", "characters", "sweet");
  act("SET_ITEMS", "occasions", "daily");
  act("SET_ITEMS", "concentrations", "EAU_DE_PARFUM");
  act("SET_ITEMS", "concentrations", "PARFUM");
  const url = buildQueryFromFilters(state.draft, new URLSearchParams("gender=male"));

  const request = requestSearch(url);
  assert.deepEqual(request.getAll("seasons"), ["spring", "summer"]);
  assert.deepEqual(request.getAll("temperature"), ["cool"]);
  assert.deepEqual(request.getAll("characters"), ["sweet"]);
  assert.deepEqual(request.getAll("occasions"), ["daily"]);
  assert.deepEqual(request.getAll("concentrations"), ["PARFUM", "EAU_DE_PARFUM"]);
  assert.equal(request.get("gender"), "male");

  const key = productListKey(listQueryFromUrl(url));
  assert.deepEqual(key[2].seasons, ["spring", "summer"]);
  assert.equal(key[2].temperature, "cool");
  assert.deepEqual(key[2].concentrations, ["PARFUM", "EAU_DE_PARFUM"]);

  for (const key of ["seasons", "temperature", "characters", "occasions", "concentrations"]) {
    assert.match(productsLayout, new RegExp(`${key}: applied\\.${key},`), key);
  }
});

test("existing filters serialize and normalize exactly as before (no new keys when unused)", () => {
  const query = "brandIds=2&brandIds=1&fragranceFamilies=woody&gender=female&type=sealed"
    + "&volumes=100&volumes=50&minPrice=100&maxPrice=900&inStock=true&original=true"
    + "&discounted=true&sort=oldest&search=rose";
  const url = serialize(hydrate(query), query);
  // The legacy `original=true` link loads as grades=ORIGINAL and is rewritten.
  assert.equal(url.get("original"), null);
  assert.deepEqual(url.getAll("grades"), ["ORIGINAL"]);
  assert.deepEqual(url.getAll("brandIds"), ["1", "2"]);
  assert.deepEqual(url.getAll("volumes"), ["50", "100"]);
  assert.equal(url.get("discounted"), "true");
  for (const key of ["seasons", "temperature", "characters", "occasions", "concentrations"]) {
    assert.equal(url.get(key), null, key);
  }
  const normalized = listQueryFromUrl(query);
  for (const key of ["seasons", "temperature", "characters", "occasions", "concentrations"]) {
    assert.equal(key in normalized, false, key);
  }
  assert.deepEqual(normalizeProductsQuery({ seasons: [], temperature: "", concentrations: ["edp"] }),
    normalizeProductsQuery({}));
});

test("next-page prefetch keeps the same normalized taxonomy filters", () => {
  const filters = listQueryFromUrl(FULL);
  const next = normalizeProductsQuery({ ...filters, page: filters.page + 1 });
  assert.deepEqual({ ...next, page: filters.page }, filters);
  for (const key of ["seasons", "temperature", "characters", "occasions", "concentrations"]) {
    assert.deepEqual(productListKey(next)[2][key], filters[key], key);
  }
  assert.match(productsLayout,
    /const nextPageFilters = normalizeProductsQuery\(\{\s*\.\.\.filters,\s*page: page \+ 1,\s*\}\);/);
  assert.match(productsLayout, /queryKey: productKeys\.list\(nextPageFilters\)/);
});

// --- 10–12 ----------------------------------------------------------------------

test("the active filter count includes every new group", () => {
  assert.equal(activeFilterCount(emptyFilters), 0);
  for (const [key, value] of [["seasons", ["summer"]], ["temperature", "cool"],
    ["characters", ["sweet"]], ["occasions", ["daily"]], ["concentrations", ["PARFUM"]]]) {
    assert.equal(activeFilterCount({ ...emptyFilters, [key]: value }), 1, key);
  }
  assert.equal(activeFilterCount(hydrate(FULL)), 7);
  assert.equal(activeFilterCount({ ...emptyFilters, sort: "oldest" }), 0);
});

test("storefront taxonomy options come from the inactive-free hook in both filter UIs", () => {
  assert.deepEqual(storefrontCategoryOptions([
    { slug: "summer", isActive: true }, { slug: "retired", isActive: false }, { slug: "spring" },
  ]).map((c) => c.slug), ["summer", "spring"]);
  for (const ui of [filtersModal, categorySidebar]) {
    for (const type of ["season", "temperature", "character", "occasion"]) {
      assert.match(ui, new RegExp(`useGetStorefrontCategoriesByType\\("${type}"\\)`), type);
    }
    assert.doesNotMatch(ui, /useGetCategoriesByType\(/);
  }
  assert.deepEqual(TAXONOMY_FILTER_GROUPS.map(({ key, type, label, multiple }) =>
    [key, type, label, multiple]), [
    ["seasons", "season", "فصل", true],
    ["characters", "character", "شخصیت", true],
    ["occasions", "occasion", "موقعیت استفاده", true],
    ["temperature", "temperature", "طبع", false],
    ["gender", "gender", "جنسیت", false],
  ]);
  assert.equal(CONCENTRATION_FILTER_LABEL, "غلظت");
  // The modal renders gender through the shared groups with storefront options.
  assert.match(filtersModal, /gender: genderCategories,/);
});

test("gender has exactly one active badge, from the shared taxonomy groups", () => {
  // The old dedicated «جنسیت» badge is gone; the group loop renders the
  // gender's Persian title and removes it through the URL.
  assert.doesNotMatch(filterSection, /title="جنسیت"/);
  assert.doesNotMatch(filterSection, /resetOneAndSync\("gender"\)/);
  // The only direct gender read left is the product-list heading.
  assert.deepEqual(filterSection.match(/.*filtersFromUrl\??\.gender.*/g)?.map((line) => line.trim()),
    ["{productListHeading(filtersFromUrl.gender, categories)}"]);
  assert.match(filterSection, /TAXONOMY_FILTER_GROUPS\.flatMap\(/);
  const categories = [{ type: "gender", slug: "male", title: "مردانه" }];
  assert.equal(categoryBadgeTitle(categories, "gender", "male", "جنسیت"), "مردانه");

  const current = "gender=male&seasons=summer&page=4&search=rose";
  const url = serialize(withoutFilterValue(hydrate(current), "gender", "male"), current);
  assert.equal(url.get("gender"), null);
  assert.equal(url.get("page"), null);
  assert.deepEqual(url.getAll("seasons"), ["summer"]);
  assert.equal(url.get("search"), "rose");
});

test("the category sidebar's generic taxonomy columns exclude gender (it has its own panel)", () => {
  assert.match(categorySidebar,
    /const SIDEBAR_TAXONOMY_GROUPS = TAXONOMY_FILTER_GROUPS\.filter\(\s*\(\{ key \}\) => key !== "gender",\s*\);/);
  assert.match(categorySidebar, /\{SIDEBAR_TAXONOMY_GROUPS\.map\(\(\{ key, label, multiple \}\) => \(/);
  assert.doesNotMatch(categorySidebar, /\{TAXONOMY_FILTER_GROUPS\.map\(/);
  // Every generic sidebar group has storefront options; the dedicated gender panel stays.
  const sidebarGroups = TAXONOMY_FILTER_GROUPS.filter(({ key }) => key !== "gender")
    .map(({ key }) => key);
  for (const key of sidebarGroups) {
    assert.match(categorySidebar, new RegExp(`\\b${key}: \\w+Categories,`), key);
  }
  assert.match(categorySidebar, /<GenderCategoriesFilter fieldsetId="category-section">/);
});

test("single-choice sub-view rows never emit a literal false class", () => {
  assert.doesNotMatch(filtersModal, /\$\{!mode && /);
  assert.equal((filtersModal.match(/\$\{mode \? "" : "max-md:hidden"\}/g) ?? []).length, 2);
});

test("concentration labels map the canonical values to Persian; one shared list", () => {
  assert.deepEqual(PRODUCT_CONCENTRATIONS, ["PARFUM", "EXTRAIT_DE_PARFUM", "EAU_DE_PARFUM",
    "EAU_DE_TOILETTE", "EAU_DE_COLOGNE", "PERFUME_OIL", "BODY_MIST", "OTHER"]);
  assert.deepEqual(Object.keys(CONCENTRATION_LABELS), PRODUCT_CONCENTRATIONS);
  assert.equal(concentrationLabel("EAU_DE_PARFUM"), "ادو پرفیوم");
  assert.equal(concentrationLabel("PARFUM"), "پارفوم");
  assert.equal(isProductConcentration("edp"), false);
  // Admin ProductForm and Product detail reuse the same values and labels.
  assert.equal(concentrationOptions, PRODUCT_CONCENTRATIONS);
  assert.match(singleProductPage,
    /import \{ CONCENTRATION_LABELS as concentrationLabels \} from "@\/utils\/productConcentration\.mjs";/);
  assert.doesNotMatch(singleProductPage, /EAU_DE_PARFUM:/);
  for (const ui of [filtersModal, categorySidebar]) {
    assert.match(ui, /PRODUCT_CONCENTRATIONS/);
    assert.match(ui, /concentrationLabel\(value\)/);
  }
});

// --- 13: Phase A --------------------------------------------------------------------

test("Phase A discounted keeps working alongside the new filters", () => {
  let state = structuredClone(initialFilters);
  state = filtersReducer(state, { type: "HYDRATE_FROM_URL", payload: hydrate("discounted=true") });
  state = filtersReducer(state, { type: "SET_ITEMS", key: "seasons", value: "summer" });
  const url = serialize(state.draft, "discounted=true");
  assert.equal(url.get("discounted"), "true");
  assert.deepEqual(url.getAll("seasons"), ["summer"]);
  assert.equal(requestSearch(url.toString()).get("discounted"), "true");
});
