import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runProductDelete } from "./productDeleteContract.mjs";

const recorder = () => {
  const calls = [];
  return { calls, onDeleted: (id) => calls.push(["deleted", id]), close: () => calls.push(["close"]) };
};

test("successful delete reports the deletion, then closes the dialog", async () => {
  const { calls, onDeleted, close } = recorder();
  const deleted = await runProductDelete({
    id: 7, removeProduct: async (id) => calls.push(["remove", id]), onDeleted, close,
  });
  assert.equal(deleted, true);
  assert.deepEqual(calls, [["remove", 7], ["deleted", 7], ["close"]]);
});

test("failed delete (e.g. 409 dependencies) resolves, closes, and never reports success", async () => {
  const { calls, onDeleted, close } = recorder();
  const conflict = Object.assign(new Error("Request failed with status code 409"),
    { response: { status: 409, data: { reason: "PRODUCT_HAS_DEPENDENCIES" } } });
  const deleted = await runProductDelete({
    id: 7, removeProduct: async () => { throw conflict; }, onDeleted, close,
  });
  assert.equal(deleted, false);
  assert.deepEqual(calls, [["close"]]);
});

test("works without optional dialog/selection callbacks (ProductForm)", async () => {
  assert.equal(await runProductDelete({ id: 3, removeProduct: async () => {} }), true);
  assert.equal(await runProductDelete({ id: 3, removeProduct: async () => { throw new Error("x"); } }), false);
});

test("Product delete call sites use the handled path and guard double confirmation", () => {
  const table = readFileSync(new URL("./ProductsListTable.jsx", import.meta.url), "utf8");
  const form = readFileSync(new URL("./ProductForm.jsx", import.meta.url), "utf8");
  assert.match(table, /if \(isDeleting\) return;\s*await runProductDelete\(/);
  assert.match(form, /await runProductDelete\(\{ id: product\.id, removeProduct \}\)/);
  for (const source of [table, form]) {
    assert.doesNotMatch(source, /await removeProduct\(/);
  }
});
