import test from "node:test";
import assert from "node:assert/strict";
import { buildProductFormPayload, initialProductFormValues } from "./productFormContract.js";

const product = {
  id: 7, enTitle: "Rose", perTitle: "رز", stock: 300,
  original: true, images: [], offValue: 0, brand: { id: 2 },
  categories: { gender: { id: 1 }, fragranceFamilies: [], seasons: [],
    temperature: null, characters: [], occasions: [] },
  variants: [{ id: 10, type: "decant", volume: 10, price: 100000 }],
};

test("edit payload keeps an immutable original Variant snapshot separate from edited prices", () => {
  const form = initialProductFormValues(product);
  form.variants[0].price = 120000;
  const { payload, errors } = buildProductFormPayload(form, product.variants);
  assert.deepEqual(errors, []);
  assert.deepEqual(payload.variants, [{ type: "decant", volume: 10, price: 120000 }]);
  assert.deepEqual(payload.expectedVariants, [{ type: "decant", volume: 10, price: 100000 }]);
  assert.equal("expectedVariants" in product, false);
});

test("create payload never sends an expected Variant snapshot", () => {
  const { payload, errors } = buildProductFormPayload(initialProductFormValues(product));
  assert.deepEqual(errors, []);
  assert.equal("expectedVariants" in payload, false);
});

const formWith = (override = {}, variant = {}) => {
  const form = initialProductFormValues(product);
  Object.assign(form, override);
  form.variants = [{ ...form.variants[0], ...variant }];
  return form;
};
const errorFields = (form) => buildProductFormPayload(form).errors.map(({ field }) => field);

test("offValue accepts 0..100 integers and serializes an empty value as null", () => {
  for (const offValue of [0, "0", 100, "37"]) {
    const { payload, errors } = buildProductFormPayload(formWith({ offValue }));
    assert.deepEqual(errors, []);
    assert.equal(payload.offValue, Number(offValue));
  }
  for (const offValue of ["", null, undefined]) {
    const { payload, errors } = buildProductFormPayload(formWith({ offValue }));
    assert.deepEqual(errors, []);
    assert.equal(payload.offValue, null);
  }
  for (const offValue of [-1, 101, 12.5, "abc"]) {
    assert.deepEqual(errorFields(formWith({ offValue })), ["offValue"]);
  }
});

test("a Product without a discount opens with an empty, clearable offValue", () => {
  assert.equal(initialProductFormValues({ ...product, offValue: null }).offValue, "");
  assert.equal(initialProductFormValues(product).offValue, 0);
  const edited = initialProductFormValues({ ...product, offValue: 20 });
  edited.offValue = "";
  assert.equal(buildProductFormPayload(edited, product.variants).payload.offValue, null);
});

test("Variant price is an integer 1..2,147,483,647", () => {
  for (const price of [1, 2_147_483_647]) {
    assert.deepEqual(errorFields(formWith({}, { price })), []);
  }
  for (const price of [0, 2_147_483_648, 1.5, ""]) {
    assert.deepEqual(errorFields(formWith({}, { price })), ["variants.0.price"]);
  }
});

test("Variant volume is an integer 1..16,777,216", () => {
  for (const volume of [1, 16_777_215, 16_777_216]) {
    assert.deepEqual(errorFields(formWith({}, { volume })), []);
  }
  for (const volume of [0, -1, 16_777_217, 4_294_967_295, 10.5, ""]) {
    assert.deepEqual(errorFields(formWith({}, { volume })), ["variants.0.volume"]);
  }
});

test("stock is an integer 0..2,147,483,647 ml", () => {
  for (const stock of [0, 2_147_483_647]) {
    assert.deepEqual(errorFields(formWith({ stock })), []);
  }
  for (const stock of [-1, 2_147_483_648, 2.5, ""]) {
    assert.deepEqual(errorFields(formWith({ stock })), ["stock"]);
  }
});
