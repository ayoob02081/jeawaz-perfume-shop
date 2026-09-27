import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import axios from "axios";
import { createOutsideClickListener } from "../hooks/useOutsideClick.js";
import {
  buildQueryFromFilters,
  filtersReducer,
  getFiltersFromSearchParams,
  initialFilters,
  normalizeProductsQuery,
  productListKey,
} from "./productFilterContract.mjs";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

// The storefront page keeps two Modals mounted that share one filter draft:
// the Filters modal (FilterSection) and the category sidebar
// (CategorySidebar). Both close with RESET_DRAFT. Each Modal registers a
// document click listener; `modalsListenWhileClosed` reproduces the
// regression where a closed Modal still reacted to outside clicks.
function storefront({ modalsListenWhileClosed = false } = {}) {
  let state = structuredClone(initialFilters);
  const dispatch = (action) => { state = filtersReducer(state, action); };
  const modals = {
    filters: { open: false, container: { contains: (target) => target.in === "filters" } },
    sidebar: { open: false, container: { contains: (target) => target.in === "sidebar" } },
  };
  const click = (where, action) => {
    for (const modal of Object.values(modals)) {
      createOutsideClickListener(
        () => modal.container,
        () => dispatch({ type: "RESET_DRAFT" }),
        modalsListenWhileClosed || modal.open,
      )({ target: { in: where } });
    }
    if (action) dispatch(action);
  };
  let url = new URLSearchParams();
  return {
    get state() { return state; },
    openFilters: () => { click("page"); modals.filters.open = true; },
    // A control inside the open Filters modal (setMode-only clicks pass no action).
    inModal: (action) => click("filters", action),
    apply: () => {
      // applyFilter reads state.draft from the render it was created in, i.e.
      // before this click's own document listeners run.
      const draft = state.draft;
      click("filters");
      url = new URLSearchParams(buildQueryFromFilters(draft, url));
      dispatch({ type: "APPLY_FILTERS" });
      modals.filters.open = false;
      dispatch({ type: "RESET_DRAFT" });
      return url.toString();
    },
    navigate: (query) => { url = new URLSearchParams(query); },
    get url() { return url.toString(); },
  };
}

// ProductsLayout: URL → normalized list query (query key + request params).
function listQueryFromUrl(query) {
  const searchParams = new URLSearchParams(query);
  const applied = getFiltersFromSearchParams(searchParams);
  return normalizeProductsQuery({
    search: searchParams.get("search") || undefined,
    brandIds: applied.brandIds, gender: applied.gender,
    fragranceFamilies: applied.fragranceFamilies, volumes: applied.volumes,
    minVolume: applied.minVolume, maxVolume: applied.maxVolume,
    inStock: applied.inStock, original: applied.original,
    minPrice: applied.priceRange[0], maxPrice: applied.priceRange[1],
    type: applied.type, sort: applied.sort || "newest",
    page: searchParams.get("page"), limit: searchParams.get("limit"),
  });
}
// The exact GET /products URL, using the app's axios serializer settings.
const requestUrl = (query) => decodeURIComponent(axios.getUri({
  url: "/products", params: listQueryFromUrl(query), paramsSerializer: { indexes: null },
}));

test("a closed Modal's outside-click listener never fires; an open one fires only outside", () => {
  let calls = 0;
  const container = { contains: (target) => target === "inside" };
  const closed = createOutsideClickListener(() => container, () => calls++, false);
  closed({ target: "outside" });
  assert.equal(calls, 0);
  const open = createOutsideClickListener(() => container, () => calls++, true);
  open({ target: "inside" });
  assert.equal(calls, 0);
  open({ target: "outside" });
  assert.equal(calls, 1);
  createOutsideClickListener(() => null, () => calls++, true)({ target: "outside" });
  assert.equal(calls, 1);
});

test("Modal only listens for outside clicks while open", () => {
  const modal = source("../components/Modal.jsx");
  assert.match(modal, /useOutsideClick\(onClose, true, isOpen\)/);
  const hook = source("../hooks/useOutsideClick.js");
  assert.match(hook, /if \(!enabled\) return undefined;/);
  // Both always-mounted Modals on the storefront reset the shared draft on close.
  assert.match(source("../app/(user)/_components/CategorySidebar.jsx"),
    /function cancelCategory\(\) \{\s*dispatch\(\{ type: "RESET_DRAFT" \}\);/);
  assert.match(source("../app/(user)/products/_components/FilterSection.jsx"),
    /const CloseModal = \(\) => \{[\s\S]*?dispatch\(\{ type: "RESET_DRAFT" \}\);/);
});

const realisticFlow = (page) => {
  page.openFilters();
  page.inModal(); // open brand sub-screen
  page.inModal({ type: "SET_ITEMS", key: "brandIds", value: 1 });
  page.inModal(); // "بازگشت"
  page.inModal(); // open fragrance-family sub-screen
  page.inModal({ type: "SET_ITEMS", key: "fragranceFamilies", value: "leather" });
  page.inModal(); // "بازگشت"
  page.inModal({ type: "SET_ITEM", key: "inStock", value: true });
  return page.apply();
};

test("regression: multi-step modal selections survive until Apply and reach GET /products", () => {
  const url = realisticFlow(storefront());
  assert.equal(url, "brandIds=1&fragranceFamilies=leather&inStock=true");
  assert.equal(requestUrl(url),
    "/products?brandIds=1&inStock=true&fragranceFamilies=leather&sort=newest&page=1&limit=12");
  assert.notDeepEqual(productListKey(listQueryFromUrl(url)), productListKey(listQueryFromUrl("")));

  // The pre-fix wiring (closed Modals listening) loses every earlier selection.
  assert.equal(realisticFlow(storefront({ modalsListenWhileClosed: true })), "inStock=true");
});

test("each filter type changes the URL, the query key and the request", () => {
  const unfilteredKey = JSON.stringify(productListKey(listQueryFromUrl("")));
  const cases = [
    [{ type: "SET_ITEMS", key: "fragranceFamilies", value: "floral" }, "fragranceFamilies=floral"],
    [{ type: "SET_ITEMS", key: "brandIds", value: 2 }, "brandIds=2"],
    [{ type: "SET_ITEM", key: "priceRange", value: [null, 1_000_000] }, "maxPrice=1000000"],
    [{ type: "SET_ITEM", key: "type", value: "sealed" }, "type=sealed"],
    [{ type: "SET_ITEMS", key: "volumes", value: 102 }, "volumes=102"],
    [{ type: "SET_ITEM", key: "inStock", value: true }, "inStock=true"],
    [{ type: "SET_ITEM", key: "original", value: true }, "original=true"],
    [{ type: "SET_ITEM", key: "gender", value: "women" }, "gender=women"],
  ];
  for (const [action, expected] of cases) {
    const page = storefront();
    page.openFilters();
    page.inModal(action);
    const url = page.apply();
    assert.equal(url, expected);
    assert.ok(requestUrl(url).includes(expected), `${expected} missing from ${requestUrl(url)}`);
    assert.notEqual(JSON.stringify(productListKey(listQueryFromUrl(url))), unfilteredKey);
  }
});

test("combination, reset-one and reset-all reach the request", () => {
  const page = storefront();
  page.openFilters();
  page.inModal({ type: "SET_ITEM", key: "original", value: true });
  page.inModal({ type: "SET_ITEM", key: "inStock", value: true });
  page.inModal({ type: "SET_ITEM", key: "type", value: "decant" });
  page.inModal({ type: "SET_ITEMS", key: "volumes", value: 10 });
  const combined = page.apply();
  assert.equal(combined, "volumes=10&type=decant&inStock=true&original=true");
  assert.equal(requestUrl(combined),
    "/products?original=true&inStock=true&type=decant&volumes=10&sort=newest&page=1&limit=12");

  // Reset one (FilterSection.resetOneAndSync): drop inStock, keep the rest.
  const current = getFiltersFromSearchParams(new URLSearchParams(combined));
  const withoutStock = buildQueryFromFilters({ ...current, inStock: null }, new URLSearchParams(combined));
  assert.equal(requestUrl(withoutStock),
    "/products?original=true&type=decant&volumes=10&sort=newest&page=1&limit=12");

  // Reset all keeps unrelated search while clearing every owned filter.
  const all = buildQueryFromFilters(structuredClone(initialFilters.draft),
    new URLSearchParams(`${combined}&search=dior`));
  assert.equal(all, "search=dior");
  assert.equal(requestUrl(all), "/products?search=dior&sort=newest&page=1&limit=12");
});
