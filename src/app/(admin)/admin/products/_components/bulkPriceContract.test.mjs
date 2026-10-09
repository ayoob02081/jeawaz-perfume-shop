import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildBulkPricePreviewRequest,
  classifyBulkPriceError,
  hasBulkFilters,
  OPERATION,
  ROUNDING,
  setVisibleSelection,
  SCOPE,
  supportedBulkFilters,
  TARGET,
  toggleSelectedId,
  validateBulkPriceForm,
} from "./bulkPriceContract.mjs";

const form = {
  targetKind: TARGET.SELECTED,
  variantScope: SCOPE.DECANT,
  operation: OPERATION.PERCENT_INCREASE,
  value: "7.25",
  roundingMode: ROUNDING.NEAREST,
  roundingStep: 10000,
};

test("selected target sends exact unique Product IDs and no page", () => {
  assert.deepEqual(buildBulkPricePreviewRequest(form, [8, 3, 8], {}), {
    target: { kind: TARGET.SELECTED, productIds: [3, 8] },
    variantScope: SCOPE.DECANT,
    operation: OPERATION.PERCENT_INCREASE,
    value: "7.25",
    rounding: { mode: ROUNDING.NEAREST, step: 10000 },
  });
  assert.match(validateBulkPriceForm(form, [], {}), /انتخاب/);
});

test("filtered target sends only supported active filters, not page or price", () => {
  const filters = {
    search: " Rose ", brandIds: [2, 2], grades: ["SUPER_MASTER", "SUPER_MASTER", "NOPE"],
    original: false,
    gender: " unisex ", fragranceFamilies: ["woody", "woody"],
    page: 4, limit: 12, minPrice: 1000, type: "sealed", discounted: true,
  };
  // `grades` replaces the deprecated `original`, which is never sent (the backend
  // rejects the two together).
  const expected = { search: "Rose", brandIds: [2], grades: ["SUPER_MASTER"],
    gender: "unisex", fragranceFamilies: ["woody"] };
  assert.deepEqual(supportedBulkFilters(filters), expected);
  assert.deepEqual(buildBulkPricePreviewRequest({ ...form, targetKind: TARGET.FILTERED }, [], filters).target,
    { kind: TARGET.FILTERED, filters: expected });
  assert.equal(hasBulkFilters({ page: 2, discounted: true }), false);
  assert.match(validateBulkPriceForm({ ...form, targetKind: TARGET.FILTERED }, [], {}), /فیلتر/);
});

test("grade filters keep canonical order and an empty selection sends nothing", () => {
  assert.deepEqual(supportedBulkFilters({ grades: ["SUPER_MASTER", "ORIGINAL"] }),
    { grades: ["ORIGINAL", "SUPER_MASTER"] });
  assert.deepEqual(supportedBulkFilters({ grades: [] }), {});
  assert.deepEqual(supportedBulkFilters({ original: true }), {});
  assert.equal(hasBulkFilters({ grades: ["ORIGINAL"] }), true);
});

test("the admin list filter is grade-aware and never builds an original filter", () => {
  const layout = readFileSync(new URL("./ProductsLayout.jsx", import.meta.url), "utf8");
  assert.match(layout, /grades: draft\.grade \? \[draft\.grade\] : \[\]/);
  assert.match(layout, /PRODUCT_GRADES\.map\(\(grade\) => \(/);
  assert.doesNotMatch(layout, /original|غیراصل|"اصل"/);
});

test("all target never serializes Product IDs or filters", () => {
  const request = buildBulkPricePreviewRequest({ ...form, targetKind: TARGET.ALL,
    roundingMode: ROUNDING.NONE }, [1, 2], { search: "Rose" });
  assert.deepEqual(request.target, { kind: TARGET.ALL });
  assert.deepEqual(request.rounding, { mode: ROUNDING.NONE });
});

test("value validation follows percentage and fixed IRT DTO limits", () => {
  assert.equal(validateBulkPriceForm(form, [1], {}), null);
  for (const value of ["0", "1000.01", "2.345", "-1"]) {
    assert.notEqual(validateBulkPriceForm({ ...form, value }, [1], {}), null);
  }
  const fixed = { ...form, operation: OPERATION.FIXED_DECREASE };
  assert.equal(validateBulkPriceForm({ ...fixed, value: "1000" }, [1], {}), null);
  assert.notEqual(validateBulkPriceForm({ ...fixed, value: "1.5" }, [1], {}), null);
});

test("selection remains explicit across pages and clearing visible IDs leaves other pages", () => {
  let selected = setVisibleSelection([], [1, 2], true);
  selected = setVisibleSelection(selected, [3, 4], true);
  assert.deepEqual(selected, [1, 2, 3, 4]);
  selected = setVisibleSelection(selected, [3, 4], false);
  assert.deepEqual(selected, [1, 2]);
  assert.deepEqual(toggleSelectedId(selected, 2), [1]);
});

test("structured stale and expired errors are distinct from generic failures", () => {
  const stale = classifyBulkPriceError({ response: { status: 409, data: {
    reason: "STALE_PREVIEW", conflictCount: 3,
    conflicts: [{ productId: 1, variantId: 2, reason: "PRICE_CHANGED" }],
  } } });
  assert.deepEqual(stale, { kind: "stale", conflictCount: 3,
    conflicts: [{ productId: 1, variantId: 2, reason: "PRICE_CHANGED" }] });
  assert.deepEqual(classifyBulkPriceError({ response: { status: 410 } }), { kind: "expired" });
  assert.deepEqual(classifyBulkPriceError({ response: { status: 403 } }), { kind: "forbidden" });
});
