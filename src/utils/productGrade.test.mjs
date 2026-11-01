import test from "node:test";
import assert from "node:assert/strict";
import {
  GRADE_LABELS,
  PRODUCT_GRADES,
  gradeLabel,
  isProductGrade,
  productGrade,
} from "./productGrade.mjs";

test("the grade values mirror the backend ProductGrade enum, with canonical labels", () => {
  assert.deepEqual(PRODUCT_GRADES, ["ORIGINAL", "SUPER_MASTER"]);
  assert.deepEqual(Object.keys(GRADE_LABELS), PRODUCT_GRADES);
  assert.equal(gradeLabel("ORIGINAL"), "اورجینال");
  assert.equal(gradeLabel("SUPER_MASTER"), "سوپر مستر");
  assert.ok(Object.values(GRADE_LABELS).every((label) => !label.includes("اروپا")));
});

test("an unknown or missing grade has no label and is not a grade", () => {
  for (const value of [undefined, null, "", "original", "TESTER", "SEALED", 1, true]) {
    assert.equal(gradeLabel(value), "");
    assert.equal(isProductGrade(value), false);
  }
});

test("productGrade prefers grade and falls back only to an explicit boolean original", () => {
  assert.equal(productGrade({ grade: "SUPER_MASTER", original: true }), "SUPER_MASTER");
  assert.equal(productGrade({ grade: "ORIGINAL", original: false }), "ORIGINAL");
  assert.equal(productGrade({ original: true }), "ORIGINAL");
  assert.equal(productGrade({ original: false }), "SUPER_MASTER");
  for (const product of [undefined, null, {}, { original: "false" }, { original: null },
    { grade: "TESTER" }, { grade: null }]) {
    assert.equal(productGrade(product), null);
  }
});
