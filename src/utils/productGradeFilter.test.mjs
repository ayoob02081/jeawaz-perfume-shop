import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  activeFilterCount,
  buildQueryFromFilters,
  emptyFilters,
  filtersReducer,
  getFiltersFromSearchParams,
  initialFilters,
  normalizeProductsQuery,
} from "./productFilterContract.mjs";
import { gradesFromLegacyOriginal, normalizeGrades } from "./productGrade.mjs";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const hydrate = (query) => getFiltersFromSearchParams(new URLSearchParams(query));
const serialize = (filters, current = "") =>
  buildQueryFromFilters(filters, new URLSearchParams(current));

test("grades round-trip through the URL as repeated keys in canonical order", () => {
  assert.deepEqual(emptyFilters.grades, []);
  assert.equal("original" in emptyFilters, false);
  for (const [query, grades] of [
    ["grades=ORIGINAL", ["ORIGINAL"]],
    ["grades=SUPER_MASTER", ["SUPER_MASTER"]],
    ["grades=SUPER_MASTER&grades=ORIGINAL", ["ORIGINAL", "SUPER_MASTER"]],
    ["grades=ORIGINAL&grades=ORIGINAL&grades=nope", ["ORIGINAL"]],
    ["", []],
  ]) {
    const filters = hydrate(query);
    assert.deepEqual(filters.grades, grades, query);
    const url = new URLSearchParams(serialize(filters));
    assert.deepEqual(url.getAll("grades"), grades, query);
    assert.equal(url.get("original"), null);
  }
});

test("selecting one, both, or no grade toggles the draft and reaches the request", () => {
  let state = structuredClone(initialFilters);
  const toggle = (grade) => {
    state = filtersReducer(state, { type: "SET_ITEMS", key: "grades", value: grade });
  };
  toggle("SUPER_MASTER");
  assert.deepEqual(normalizeProductsQuery(state.draft).grades, ["SUPER_MASTER"]);
  toggle("ORIGINAL");
  assert.equal(serialize(state.draft), "grades=ORIGINAL&grades=SUPER_MASTER");
  assert.deepEqual(normalizeProductsQuery(state.draft).grades, ["ORIGINAL", "SUPER_MASTER"]);
  toggle("SUPER_MASTER");
  toggle("ORIGINAL");
  assert.equal(serialize(state.draft), "");
  assert.equal("grades" in normalizeProductsQuery(state.draft), false);
  state = filtersReducer(state, { type: "RESET_ONE", key: "grades" });
  assert.deepEqual(state.draft.grades, []);
});

test("the active filter count includes the grade group once", () => {
  assert.equal(activeFilterCount(emptyFilters), 0);
  assert.equal(activeFilterCount({ ...emptyFilters, grades: ["ORIGINAL"] }), 1);
  assert.equal(activeFilterCount({ ...emptyFilters, grades: ["ORIGINAL", "SUPER_MASTER"] }), 1);
  assert.equal(activeFilterCount({ ...emptyFilters, grades: [] }), 0);
});

test("legacy ?original=true|false links still load meaningfully", () => {
  assert.deepEqual(hydrate("original=true").grades, ["ORIGINAL"]);
  assert.deepEqual(hydrate("original=false").grades, ["SUPER_MASTER"]);
  assert.deepEqual(hydrate("original=yes").grades, []);
  assert.deepEqual(hydrate("original=true&original=false").grades, []);
  // `grades` wins when both are present; Apply rewrites the URL without `original`.
  assert.deepEqual(hydrate("grades=SUPER_MASTER&original=true").grades, ["SUPER_MASTER"]);
  assert.equal(serialize(hydrate("original=true"), "original=true&search=dior"),
    "search=dior&grades=ORIGINAL");
  assert.deepEqual(gradesFromLegacyOriginal(false), ["SUPER_MASTER"]);
  assert.deepEqual(normalizeGrades("ORIGINAL"), ["ORIGINAL"]);
});

test("the storefront filter UI is a grade chip group with per-grade badges", () => {
  const modal = source("../app/(user)/products/_components/FiltersModal.jsx");
  const section = source("../app/(user)/products/_components/FilterSection.jsx");
  const layout = source("../app/(user)/products/_components/ProductsLayout.jsx");

  assert.doesNotMatch(modal, /فقط کالاهای اورجینال|"original"/);
  assert.match(modal, /<FilterOption title=\{GRADE_FILTER_LABEL\}>\s*<GradeFilter/);
  assert.match(modal, /PRODUCT_GRADES\.map\(\(grade\) => \{/);
  assert.match(modal, /aria-pressed=\{selected\}/);
  assert.match(modal, /addFilter\("SET_ITEMS", "grades", grade\)/);

  assert.doesNotMatch(section, /original/);
  assert.match(section, /filtersFromUrl\.grades\.map\(\(grade\) => \(/);
  assert.match(section, /removeValueAndSync\("grades", grade\)/);
  assert.match(section, /title=\{gradeLabel\(grade\)\}/);

  assert.match(layout, /grades: applied\.grades,/);
  assert.doesNotMatch(layout, /original/);
});
