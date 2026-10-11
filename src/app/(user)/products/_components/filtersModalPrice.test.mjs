// FiltersModal price inputs: the `hidde` typo rendered a literal "undefined"
// class. The fix keeps the inputs visible inline on mobile in the "all"
// view (no control opens the separate "price" view). Source checks only:
// actual mobile layout needs device testing.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const modal = readFileSync(new URL("./FiltersModal.jsx", import.meta.url), "utf8");
const priceFilters = modal.match(/<PriceFilter\b[\s\S]*?\/>/g) ?? [];

test("no PriceFilter receives the misspelled prop or hides its inputs", () => {
  assert.equal(priceFilters.length, 2);
  for (const element of priceFilters) {
    assert.doesNotMatch(element, /\bhidde\b/);
    assert.doesNotMatch(element, /\bhidden\b/, "the inputs stay visible on mobile");
  }
});

test("the optional hidden class never renders `undefined`", () => {
  assert.doesNotMatch(modal, /\$\{hidden && /);
  assert.match(modal, /\$\{hidden \? "max-md:hidden" : ""\}/);
});

test("the price inputs remain in the default (all) view", () => {
  const allView = modal.slice(modal.indexOf('case "all":'), modal.indexOf('case "brand":'));
  assert.match(allView, /<FilterOption title="قیمت">\s*<PriceFilter\b/);
});
