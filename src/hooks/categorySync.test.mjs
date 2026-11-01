import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { MutationObserver, QueryClient, QueryObserver } from "@tanstack/react-query";
import { storefrontCategoryOptions } from "../utils/productFilterContract.mjs";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const tick = () => new Promise(setImmediate);
const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; };
const copy = (value) => structuredClone(value);
function fixture() {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { gcTime: Infinity, retry: false } } });
  const state = { rows: [{ id: 47, type: "gender", title: "Old", isActive: true }], reads: [], toasts: [], fail: false, heldRead: null };
  const api = {
    getAllCategoriesApi: async () => { state.reads.push("all"); return state.heldRead?.promise ?? copy(state.rows); },
    getCategoriesByTypeApi: async (type) => { state.reads.push(type); return copy(state.rows.filter((row) => row.type === type)); },
    getCategoryByIdApi: async (id) => { state.reads.push(`detail:${id}`); return copy(state.rows.find((row) => row.id === Number(id))); },
    addCategoryApi: async (value) => { if (state.fail) throw Error("save failed"); const row = { id: 48, ...value }; state.rows.push(row); return copy(row); },
    updateCategoryApi: async ({ categoryId, data }) => { if (state.fail) throw Error("save failed"); const row = state.rows.find((row) => row.id === Number(categoryId)); Object.assign(row, data); return copy(row); },
  };
  const dependencies = {
    "@/services/categoriesServices": api,
    "@tanstack/react-query": {
      useQuery: (options) => options, useQueryClient: () => client,
      useMutation: (options) => {
        const observer = new MutationObserver(client, options);
        return { mutateAsync: (value) => observer.mutate(value), isPending: false };
      },
    },
    "@/utils/productFilterContract.mjs": { storefrontCategoryOptions },
    "react-hot-toast": { __esModule: true, default: { success: () => state.toasts.push("success"), error: () => state.toasts.push("error") } },
  };
  const { code } = transformSync(readFileSync(new URL("./useCategories.js", import.meta.url), "utf8"), { filename: "useCategories.js", module: { type: "commonjs" }, jsc: { parser: { syntax: "ecmascript" } } });
  const hooks = {};
  new Function("require", "exports", code)((name) => { assert.ok(name in dependencies, name); return dependencies[name]; }, hooks);
  const stops = [];
  return { client, state, api, hooks,
    watch(options, initial) {
      if (initial !== undefined) client.setQueryData(options.queryKey, copy(initial));
      const observer = new QueryObserver(client, options);
      stops.push(observer.subscribe(() => {}));
      return observer;
    },
    add(value = { type: "gender", title: "New", isActive: true }) { return hooks.useAddCategory().addCategory(value); },
    edit(value, id = 47) { return hooks.useEditCategory(id).editCategory(value); },
    close() { stops.forEach((stop) => stop()); client.clear(); },
  };
}

test("create refreshes the active all-category list and the shared admin/storefront typed cache exactly once", async () => {
  const h = fixture();
  try {
    const old = copy(h.state.rows);
    const list = h.watch(h.hooks.useGetAllCategories(), old);
    const admin = h.watch(h.hooks.useGetCategoriesByType("gender"), old);
    const storefront = h.watch(h.hooks.useGetStorefrontCategoriesByType("gender"), old);
    h.client.setQueryData(["get-brands"], ["brand"]);
    h.client.setQueryData(["products", {}], ["product"]);
    await h.add();
    assert.deepEqual(list.getCurrentResult().data.map((row) => row.id), [47, 48]);
    assert.deepEqual(admin.getCurrentResult().data, storefront.getCurrentResult().data);
    assert.deepEqual(admin.getCurrentResult().data.map((row) => row.id), [47, 48]);
    assert.deepEqual(h.state.reads.sort(), ["all", "gender"]);
    assert.equal(h.client.getQueryState(["get-brands"]).isInvalidated, false);
    assert.equal(h.client.getQueryState(["products", {}]).isInvalidated, false);
    assert.deepEqual(h.state.toasts, ["success"]);
  } finally { h.close(); }
});
test("edit refreshes both numeric/string/leading-zero detail keys without invalidating another category", async () => {
  const h = fixture();
  try {
    const old = copy(h.state.rows[0]);
    const details = [47, "47", "047"].map((id) => h.watch(h.hooks.useGetCategorybyID(id), old));
    h.client.setQueryData(["get-category", "99"], { id: 99, title: "Other" });
    await h.edit({ title: "Edited" });
    for (const observer of details) assert.equal(observer.getCurrentResult().data.title, "Edited");
    assert.equal(h.client.getQueryState(["get-category", "99"]).isInvalidated, false);
  } finally { h.close(); }
});
test("changing type or activity refreshes both old/new type memberships and retains storefront selection", async () => {
  const h = fixture();
  try {
    const gender = h.watch(h.hooks.useGetCategoriesByType("gender"), h.state.rows);
    const season = h.watch(h.hooks.useGetCategoriesByType("season"), []);
    const storefront = h.watch(h.hooks.useGetStorefrontCategoriesByType("season"), []);
    await h.edit({ type: "season", isActive: false, title: "Changed" });
    assert.deepEqual(gender.getCurrentResult().data, []);
    assert.equal(season.getCurrentResult().data[0].title, "Changed");
    assert.deepEqual(storefront.getCurrentResult().data, []);
    assert.deepEqual(h.state.reads.sort(), ["gender", "season"]);
  } finally { h.close(); }
});
test("inactive cached types are invalidated without requests and refresh on return within staleTime", async () => {
  const h = fixture();
  try {
    h.client.setQueryData(["categories", "gender"], copy(h.state.rows));
    await h.add();
    assert.equal(h.client.getQueryState(["categories", "gender"]).isInvalidated, true);
    assert.equal(h.state.reads.length, 0);
    const observer = h.watch(h.hooks.useGetCategoriesByType("gender"));
    await tick();
    assert.deepEqual(observer.getCurrentResult().data.map((row) => row.id), [47, 48]);
    assert.deepEqual(h.state.reads, ["gender"]);
  } finally { h.close(); }
});
for (const operation of ["create", "edit"]) {
  test(`${operation} failure preserves cached data, performs no refetch and never announces success`, async () => {
    const h = fixture();
    try {
      const old = copy(h.state.rows);
      h.watch(h.hooks.useGetAllCategories(), old);
      h.watch(h.hooks.useGetCategoriesByType("gender"), old);
      h.state.fail = true;
      await assert.rejects(operation === "create" ? h.add() : h.edit({ title: "Failed" }), /save failed/);
      assert.deepEqual(h.client.getQueryData(["get-categories"]), old);
      assert.deepEqual(h.client.getQueryData(["categories", "gender"]), old);
      assert.equal(h.state.reads.length, 0);
      assert.deepEqual(h.state.toasts, ["error"]);
    } finally { h.close(); }
  });
}
test("mutation completion and success feedback wait for the active list refresh", async () => {
  const h = fixture(), held = deferred();
  try {
    h.watch(h.hooks.useGetAllCategories(), h.state.rows);
    h.state.heldRead = held;
    let finished = false;
    const mutation = h.add().then(() => { finished = true; });
    await tick();
    assert.equal(finished, false);
    assert.deepEqual(h.state.toasts, []);
    held.resolve(copy(h.state.rows));
    await mutation;
    assert.deepEqual(h.state.toasts, ["success"]);
  } finally { held.resolve([]); h.close(); }
});
for (const type of ["all", "gender"]) {
  test(`a pending initial ${type} fetch cannot adopt its old result after successful creation`, async () => {
    const h = fixture(), oldRequest = deferred();
    try {
      const old = copy(h.state.rows);
      let reads = 0;
      const options = type === "all" ? h.hooks.useGetAllCategories() : h.hooks.useGetCategoriesByType(type);
      const observer = h.watch({ ...options, queryFn: () => ++reads === 1 ? oldRequest.promise : Promise.resolve(copy(h.state.rows)) });
      await tick();
      await h.add();
      assert.equal(reads, 2);
      assert.deepEqual(observer.getCurrentResult().data.map((row) => row.id), [47, 48]);
      oldRequest.resolve(old);
      await tick();
      assert.deepEqual(observer.getCurrentResult().data.map((row) => row.id), [47, 48]);
    } finally { oldRequest.resolve([]); h.close(); }
  });
}
