import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { productListView } from "./productFilterContract.mjs";

test("storefront list shows skeletons only while the first request loads", () => {
  assert.equal(productListView({ isLoading: true, data: undefined }), "loading");
});

test("a successful zero-Product response shows the empty state", () => {
  assert.equal(productListView({ isLoading: false, data: { data: [], meta: { total: 0 } } }), "empty");
  assert.equal(productListView({ isLoading: false, data: {} }), "empty");
});

test("Products render as before when the response has items", () => {
  const data = { data: [{ id: 1 }], meta: { total: 1 } };
  assert.equal(productListView({ isLoading: false, data }), "products");
  // A background refetch keeps the previous result visible.
  assert.equal(productListView({ isLoading: true, data }), "products");
});

test("no empty state before any response exists", () => {
  assert.equal(productListView({ isLoading: false, data: undefined }), "products");
});

test("layout renders the Persian empty state, keeps error first and pagination intact", () => {
  const layout = readFileSync(new URL("../app/(user)/products/_components/ProductsLayout.jsx",
    import.meta.url), "utf8");
  assert.match(layout, /productListView\(\{ isLoading: isProductsLoading, data \}\)/);
  assert.match(layout, /view === "empty" && \(\s*<NotExisted[^>]*>محصولی با این مشخصات یافت نشد\.<\/NotExisted>/);
  assert.ok(layout.indexOf("if (isProductsError)") < layout.indexOf('view === "empty"'),
    "error state returns before the empty state can render");
  assert.match(layout, /<PagesNumber[\s\S]*totalPages=\{totalPages\}/);
});
