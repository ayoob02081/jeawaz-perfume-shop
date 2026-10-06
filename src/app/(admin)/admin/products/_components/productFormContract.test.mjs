import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  PRINT_NAME_MAX,
  buildProductFormPayload,
  initialProductFormValues,
} from "./productFormContract.js";

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

/* ================= printName (admin print/export short name) ================= */

test("printName opens with the saved value, or empty when unset", () => {
  assert.equal(
    initialProductFormValues({ ...product, printName: "SWY Intensely" }).printName,
    "SWY Intensely",
  );
  for (const printName of [null, undefined]) {
    assert.equal(initialProductFormValues({ ...product, printName }).printName, "");
  }
  assert.equal(initialProductFormValues().printName, "");
  // enTitle is never copied into the field.
  assert.notEqual(initialProductFormValues(product).printName, product.enTitle);
});

test("printName is trimmed into the payload; empty or blank sends null", () => {
  const { payload, errors } = buildProductFormPayload(
    formWith({ printName: "  SWY Intensely  " }),
  );
  assert.deepEqual(errors, []);
  assert.equal(payload.printName, "SWY Intensely");

  for (const printName of ["", "   ", null, undefined]) {
    const result = buildProductFormPayload(formWith({ printName }));
    assert.deepEqual(result.errors, []);
    assert.equal(result.payload.printName, null);
    assert.equal("printName" in result.payload, true);
  }
});

test("clearing an existing printName on edit sends printName: null", () => {
  const form = initialProductFormValues({ ...product, printName: "SWY Intensely" });
  form.printName = "";
  const { payload, errors } = buildProductFormPayload(form, product.variants);
  assert.deepEqual(errors, []);
  assert.equal(payload.printName, null);
});

test("printName accepts 100 characters and rejects 101", () => {
  assert.equal(PRINT_NAME_MAX, 100);
  const accepted = buildProductFormPayload(formWith({ printName: "P".repeat(100) }));
  assert.deepEqual(accepted.errors, []);
  assert.equal(accepted.payload.printName, "P".repeat(100));
  // Surrounding spaces do not count.
  assert.deepEqual(
    buildProductFormPayload(formWith({ printName: ` ${"P".repeat(100)} ` })).errors,
    [],
  );
  assert.deepEqual(errorFields(formWith({ printName: "P".repeat(101) })), ["printName"]);
});

test("printName leaves every existing Product field unchanged", () => {
  const without = buildProductFormPayload(formWith({ printName: "" }), product.variants);
  const withName = buildProductFormPayload(
    formWith({ printName: "SWY Intensely" }),
    product.variants,
  );
  const { printName: _a, ...restWithout } = without.payload;
  const { printName: _b, ...restWith } = withName.payload;
  assert.deepEqual(restWith, restWithout);
  assert.equal(withName.payload.enTitle, "Rose");
});

test("ProductForm renders the admin-only printName field with enTitle only as placeholder", () => {
  const form = readFileSync(new URL("./ProductForm.jsx", import.meta.url), "utf8");
  const field = form.slice(form.indexOf('name="printName"') - 200, form.indexOf('name="printName"') + 400);
  assert.match(field, /label="نام کوتاه برای چاپ"/);
  assert.match(field, /maxLength=\{PRINT_NAME_MAX\}/);
  assert.match(field, /dir="auto"/);
  assert.match(field, /placeholder=\{watch\("enTitle"\) \|\| "نام انگلیسی محصول"\}/);
  assert.match(form, /اختیاری؛ در صورت خالی بودن، نام انگلیسی محصول استفاده می‌شود\./);
  // enTitle is never written into printName (no setValue/reset copy).
  assert.doesNotMatch(form, /setValue\(\s*["']printName["']/);
  assert.equal(form.match(/name="printName"/g).length, 1);
});

test("printName is not rendered anywhere outside the admin Product form", () => {
  const storefrontFiles = [
    "../../../../(user)/products/_components/SingleProductPage.jsx",
    "../../../../(user)/_components/ProductCard.jsx",
  ];
  for (const path of storefrontFiles) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(source, /printName/, path);
  }
});
