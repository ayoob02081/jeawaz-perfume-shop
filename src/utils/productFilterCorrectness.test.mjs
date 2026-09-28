import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createFormControl } from "react-hook-form";
import {
  PRICE_RANGE_ERROR,
  buildQueryFromFilters,
  emptyFilters,
  filtersReducer,
  getFiltersFromSearchParams,
  initialFilters,
  normalizeProductsQuery,
  priceFormValues,
  productListHeading,
  storefrontCategoryOptions,
  validatePriceRange,
} from "./productFilterContract.mjs";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const filterSection = source("../app/(user)/products/_components/FilterSection.jsx");
const filtersModal = source("../app/(user)/products/_components/FiltersModal.jsx");
const categorySidebar = source("../app/(user)/_components/CategorySidebar.jsx");
const productsLayout = source("../app/(user)/products/_components/ProductsLayout.jsx");
const categoryHooks = source("../hooks/useCategories.js");

// The /products Filters modal: the reducer draft plus FilterSection's
// react-hook-form price inputs, which PriceFilter's effect copies into the
// draft whenever they change or PriceFilter (re)mounts.
function filtersPage(initialUrl = "", { restorePriceOnCancel = true } = {}) {
  let url = new URLSearchParams(initialUrl);
  let state = structuredClone(initialFilters);
  const dispatch = (action) => { state = filtersReducer(state, action); };
  const form = createFormControl({
    defaultValues: priceFormValues(getFiltersFromSearchParams(url).priceRange),
  });
  // reset() drops registrations; the next render re-registers the inputs.
  const render = () => {
    form.register("minPrice", { deps: ["maxPrice"] });
    form.register("maxPrice", {
      validate: (maxPrice, values) => validatePriceRange(values.minPrice, maxPrice),
    });
  };
  const priceEffect = () => {
    const { minPrice, maxPrice } = form.getValues();
    dispatch({ type: "SET_ITEM", key: "priceRange", value: [
      minPrice ? Number(minPrice) : null, maxPrice ? Number(maxPrice) : null] });
  };
  const hydrate = () => {
    const filters = getFiltersFromSearchParams(url);
    dispatch({ type: "HYDRATE_FROM_URL", payload: filters });
    form.reset(priceFormValues(filters.priceRange));
    render();
  };
  const hideModal = () => dispatch({ type: "RESET_DRAFT" });
  hydrate();
  let requests = 0;
  return {
    get state() { return state; },
    get url() { return url.toString(); },
    get requests() { return requests; },
    get errors() { return form.control._formState.errors; },
    open: () => priceEffect(), // PriceFilter mounts with the form's values
    typePrice: (minPrice, maxPrice) => {
      form.setValue("minPrice", minPrice);
      form.setValue("maxPrice", maxPrice);
      priceEffect();
    },
    inModal: (action) => dispatch(action),
    cancel: () => {
      hideModal();
      if (restorePriceOnCancel) {
        form.reset(priceFormValues(getFiltersFromSearchParams(url).priceRange));
        render();
      }
    },
    // The Apply button submits through react-hook-form's handleSubmit.
    apply: async () => {
      await form.handleSubmit(() => {
        url = new URLSearchParams(buildQueryFromFilters(state.draft, url));
        dispatch({ type: "APPLY_FILTERS" });
        hideModal();
        requests += 1;
        hydrate(); // the URL change re-hydrates, as FilterSection's effect does
      })();
      return url.toString();
    },
  };
}

// --- A1: cancelled price -----------------------------------------------------

test("regression: a cancelled price is not serialized by the next Apply", async () => {
  const page = filtersPage("minPrice=100000");
  page.open();
  page.typePrice("900000", "2000000");
  page.cancel();
  page.open(); // reopen: PriceFilter copies the form into the draft again
  page.inModal({ type: "SET_ITEMS", key: "brandIds", value: 3 });
  const url = new URLSearchParams(await page.apply());

  assert.equal(url.get("minPrice"), "100000");
  assert.equal(url.get("maxPrice"), null);
  assert.deepEqual(url.getAll("brandIds"), ["3"]);
});

test("without restoring the form on cancel, the cancelled price would leak (the old bug)", async () => {
  const page = filtersPage("", { restorePriceOnCancel: false });
  page.open();
  page.typePrice("900000", "");
  page.cancel();
  page.open();
  assert.equal(new URLSearchParams(await page.apply()).get("minPrice"), "900000");
});

test("cancel restores the price form from the applied URL; Apply keeps the entered price", async () => {
  assert.match(filterSection,
    /const CloseModal = \(\) => \{\s*hideModal\(\);\s*reset\(priceFormValues\(filtersFromUrl\.priceRange\)\);/);
  assert.match(filterSection,
    /function applyFilter\(\) \{[\s\S]*?dispatch\(\{ type: "APPLY_FILTERS" \}\);\s*hideModal\(\);\s*\}/);
  assert.match(filterSection, /defaultValues: priceFormValues\(filtersFromUrl\.priceRange\)/);
  assert.match(filterSection, /reset\(priceFormValues\(filtersFromUrl\.priceRange\)\);\s*\}, \[search, dispatch, reset\]\);/);

  const page = filtersPage();
  page.open();
  page.typePrice("150000", "900000");
  const url = new URLSearchParams(await page.apply());
  assert.deepEqual([url.get("minPrice"), url.get("maxPrice")], ["150000", "900000"]);
});

test("back/forward hydration still drives the price form and draft", () => {
  const page = filtersPage("minPrice=5000&maxPrice=9000");
  assert.deepEqual(page.state.applied.priceRange, [5000, 9000]);
  assert.deepEqual(priceFormValues([5000, 9000]), { minPrice: 5000, maxPrice: 9000 });
  assert.deepEqual(priceFormValues([0, null]), { minPrice: null, maxPrice: null });
});

// --- A2: min <= max ------------------------------------------------------------

test("minPrice > maxPrice is rejected before the URL or a request changes", async () => {
  const page = filtersPage("brandIds=2");
  page.open();
  page.typePrice("900000", "100000");
  const before = page.url;
  await page.apply();

  assert.equal(page.url, before);
  assert.equal(page.requests, 0);
  assert.equal(page.errors.maxPrice?.message, PRICE_RANGE_ERROR);
  assert.match(PRICE_RANGE_ERROR, /حداقل قیمت/);
});

test("valid price ranges still serialize: empty, min only, max only, equal, zero minimum", async () => {
  const cases = [
    [["", ""], {}],
    [["120000", ""], { minPrice: "120000" }],
    [["", "800000"], { maxPrice: "800000" }],
    [["500000", "500000"], { minPrice: "500000", maxPrice: "500000" }],
    [["0", "700000"], { maxPrice: "700000" }],
  ];
  for (const [[min, max], expected] of cases) {
    const page = filtersPage();
    page.open();
    page.typePrice(min, max);
    const url = new URLSearchParams(await page.apply());
    assert.equal(page.requests, 1, `${min}-${max}`);
    assert.equal(url.get("minPrice"), expected.minPrice ?? null);
    assert.equal(url.get("maxPrice"), expected.maxPrice ?? null);
  }
  assert.equal(validatePriceRange(null, null), true);
  assert.equal(validatePriceRange(0, 5), true);
  assert.equal(validatePriceRange(6, 5), PRICE_RANGE_ERROR);
});

test("the modal's price inputs carry the range rule and show its error", () => {
  assert.match(filtersModal,
    /name="maxPrice"\s*errors=\{errors\}\s*validationSchema=\{\{\s*validate: \(maxPrice, values\) =>\s*validatePriceRange\(values\.minPrice, maxPrice\),/);
  assert.match(filtersModal, /name="minPrice"\s*errors=\{errors\}\s*validationSchema=\{\{ deps: \["maxPrice"\] \}\}/);
  assert.match(filterSection, /watch=\{watch\}\s*errors=\{errors\}/);
  assert.match(filterSection, /onSubmit=\{handleSubmit\(HandleSubmitfilter\)\}/);
});

// --- A3: discounted ------------------------------------------------------------

test("discounted=true hydrates as an active filter with a visible, removable badge", () => {
  const filters = getFiltersFromSearchParams(new URLSearchParams("discounted=true"));
  assert.equal(filters.discounted, true);
  assert.equal(getFiltersFromSearchParams(new URLSearchParams("")).discounted, null);
  assert.match(filterSection,
    /\{filtersFromUrl\?\.discounted && \(\s*<Badge\s*title="تخفیف‌دار"\s*onClick=\{\(\) => resetOneAndSync\("discounted"\)\}/);
  // No new modal/sidebar control; only reset/Apply awareness.
  assert.doesNotMatch(filtersModal, /"SET_ITEM", "discounted"/);
  assert.doesNotMatch(categorySidebar, /"SET_ITEM", "discounted"/);
});

test("removing the discounted badge clears it, deletes page and keeps search", () => {
  const current = new URLSearchParams("search=rose&discounted=true&brandIds=1&page=3");
  const filtersFromUrl = getFiltersFromSearchParams(current);
  const url = new URLSearchParams(buildQueryFromFilters(
    { ...filtersFromUrl, discounted: emptyFilters.discounted }, current));
  assert.equal(url.get("discounted"), null);
  assert.equal(url.get("page"), null);
  assert.equal(url.get("search"), "rose");
  assert.deepEqual(url.getAll("brandIds"), ["1"]);
});

test("Reset All clears discounted and page but keeps unrelated search", () => {
  const url = new URLSearchParams(buildQueryFromFilters(emptyFilters,
    new URLSearchParams("search=rose&discounted=true&sort=most_discounted&page=2")));
  assert.equal(url.get("discounted"), null);
  assert.equal(url.get("page"), null);
  assert.equal(url.get("search"), "rose");
});

test("a normal Apply keeps discounted active and it reaches the request", async () => {
  const page = filtersPage("discounted=true&sort=most_discounted");
  page.open();
  page.inModal({ type: "SET_ITEMS", key: "fragranceFamilies", value: "woody" });
  const url = new URLSearchParams(await page.apply());
  assert.equal(url.get("discounted"), "true");
  assert.deepEqual(url.getAll("fragranceFamilies"), ["woody"]);

  const applied = getFiltersFromSearchParams(url);
  assert.equal(normalizeProductsQuery({ discounted: applied.discounted }).discounted, true);
  assert.equal(normalizeProductsQuery({ discounted: null }).discounted, undefined);
  assert.match(productsLayout, /discounted: applied\.discounted,/);
  assert.match(filtersModal, /filtersFromUrl\?\.discounted \|\|/);
  assert.match(categorySidebar, /state\.draft\.discounted \|\|/);
});

// --- A4: inactive categories ---------------------------------------------------

test("storefront category options exclude inactive categories and keep order", () => {
  const categories = [
    { id: 3, slug: "woody", isActive: true },
    { id: 1, slug: "leather", isActive: false },
    { id: 2, slug: "floral" },
    { id: 4, slug: "citrus", isActive: true },
  ];
  assert.deepEqual(storefrontCategoryOptions(categories).map((c) => c.slug),
    ["woody", "floral", "citrus"]);
  assert.equal(storefrontCategoryOptions(undefined), undefined);
});

test("only storefront filter UIs use the inactive-free hook; the shared hook is unchanged", () => {
  assert.match(categoryHooks,
    /export const useGetStorefrontCategoriesByType = \(type\) =>[\s\S]*?queryKey: \["categories", type\][\s\S]*?select: storefrontCategoryOptions,/);
  assert.match(categoryHooks,
    /export const useGetCategoriesByType = \(type\) =>\s*useQuery\(\{\s*queryKey: \["categories", type\],\s*queryFn: \(\) => getCategoriesByTypeApi\(type\),\s*enabled: !!type,\s*retry: false,\s*staleTime: 1000 \* 60 \* 5,\s*refetchOnWindowFocus: false,\s*\}\);/);
  for (const ui of [filtersModal, categorySidebar]) {
    assert.match(ui, /useGetStorefrontCategoriesByType\("gender"\)/);
    assert.match(ui, /useGetStorefrontCategoriesByType\("fragrance_family"\)/);
    assert.doesNotMatch(ui, /useGetCategoriesByType\(/);
  }
});

test("Home category sections render only storefront (active) categories", () => {
  // Each Home section renders its data straight from the storefront hook, whose
  // select drops inactive categories; the components add no filtering of their own.
  for (const [name, type, list] of [
    ["GenderCategoriesLayout", "gender", "genderCategories"],
    ["AccordCategoriesLayout", "fragrance_family", "fragranceFamilyCategories"],
  ]) {
    const home = source(`../app/(user)/_components/${name}.jsx`);
    assert.match(home,
      new RegExp(`data: ${list},\\s*isPending,\\s*error,\\s*\\} = useGetStorefrontCategoriesByType\\("${type}"\\);`));
    assert.match(home, /import \{ useGetStorefrontCategoriesByType \} from "@\/hooks\/useCategories";/);
    assert.doesNotMatch(home, /useGetCategoriesByType\(|isActive/);
    assert.match(home, new RegExp(`${list}\\??\\.map\\(`));
  }
  const rendered = storefrontCategoryOptions([
    { id: 1, slug: "male", isActive: true },
    { id: 2, slug: "retired", isActive: false },
  ]);
  assert.deepEqual(rendered.map((c) => c.slug), ["male"]);
});

// --- A5: heading ---------------------------------------------------------------

test("product-list heading never renders undefined", () => {
  const genders = [
    { type: "gender", slug: "male", title: "مردانه" },
    { type: "fragrance_family", slug: "woody", title: "چوبی" },
  ];
  assert.equal(productListHeading(null, genders), "همه ادکلن‌ها");
  assert.equal(productListHeading("male", genders), "ادکلن‌های مردانه");
  for (const [slug, categories] of [["unknown", genders], ["male", undefined], ["male", []], ["woody", genders]]) {
    const heading = productListHeading(slug, categories);
    assert.equal(heading, "ادکلن‌ها");
    assert.doesNotMatch(heading, /undefined/);
  }
  assert.match(filterSection, /\{productListHeading\(filtersFromUrl\.gender, categories\)\}/);
  assert.doesNotMatch(filterSection, /currentGenderData/);
});

// --- A6 ------------------------------------------------------------------------

test("the dead constants/filterItems.js is gone", () => {
  assert.throws(() => source("../constants/filterItems.js"), { code: "ENOENT" });
});
