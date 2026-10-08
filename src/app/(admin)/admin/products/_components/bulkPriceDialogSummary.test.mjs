// Bulk price preview summary labels. Narrow source checks: there is no DOM
// test environment; the request/response logic lives in bulkPriceContract.mjs.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dialog = readFileSync(new URL("./BulkPriceDialog.jsx", import.meta.url), "utf8");

test("variant scope and targeted variant count have distinct labels", () => {
  // The scope is shown once in the summary, labelled «واریانت».
  assert.equal(dialog.match(/>واریانت:</g)?.length, 1);
  assert.match(
    dialog,
    /<p className="text-stroke-600">واریانت:<\/p>\s*<p className="font-bold">\{scopeLabels\[preview\.variantScope\]\}<\/p>/,
  );
  // The count is labelled «تعداد واریانت».
  assert.match(
    dialog,
    /<p className="text-stroke-600">تعداد واریانت:<\/p>\s*<p className="font-bold">\s*\{toPersianNumbers\(preview\.summary\.targetedVariants\)\}/,
  );
});

test("preview table carries no misspelled overflow class", () => {
  assert.doesNotMatch(dialog, /overflow-x-aut(?!o)/);
});
