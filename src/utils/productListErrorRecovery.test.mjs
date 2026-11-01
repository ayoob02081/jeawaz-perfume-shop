// /products error recovery: a failed list request keeps the filter controls
// usable, and Retry runs the list query's own React Query refetch. The query
// is driven through a real QueryObserver with useGetAllProducts' options;
// rendering itself needs a browser and is checked by source.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { QueryClient, QueryObserver, keepPreviousData } from "@tanstack/react-query";
import { productListKey, productListView } from "./productFilterContract.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const layout = read("../app/(user)/products/_components/ProductsLayout.jsx");
const hooks = read("../hooks/useProducts.js");
const errorComponent = read("../components/Error.jsx");

const ok = { data: [{ id: 1 }], meta: { total: 1, page: 1, limit: 12, totalPages: 1 } };

// The storefront list query with useGetAllProducts' options.
function listObserver(client, query, queryFn) {
  return new QueryObserver(client, {
    queryKey: productListKey(query),
    queryFn,
    retry: false,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}

const settled = (observer) => new Promise((resolve) => {
  const check = (result) => {
    if (result.fetchStatus === "idle" && result.status !== "pending") {
      unsubscribe();
      resolve(result);
    }
  };
  const unsubscribe = observer.subscribe(check);
  check(observer.getCurrentResult());
});

const viewOf = (result) => productListView({
  isLoading: result.isLoading, data: result.data, error: result.error,
});

test("the mirrored options are the ones useGetAllProducts uses", () => {
  assert.match(hooks,
    /export const useGetAllProducts = [\s\S]*?retry: false,\s*refetchOnWindowFocus: false,\s*placeholderData: keepPreviousData,/);
});

test("Retry refetches the failed list query and the products render", async () => {
  const client = new QueryClient();
  let calls = 0;
  const observer = listObserver(client, { sort: "newest" }, async () => {
    calls += 1;
    if (calls === 1) throw new Error("503");
    return ok;
  });
  const keepAlive = observer.subscribe(() => {});

  const failed = await settled(observer);
  assert.equal(viewOf(failed), "error");
  assert.equal(calls, 1, "retry: false — one request, no automatic retries");

  // ProductsLayout passes this query's `refetch` to <Error onRetry>.
  await failed.refetch();
  const recovered = await settled(observer);
  assert.equal(calls, 2);
  assert.equal(viewOf(recovered), "products");
  assert.deepEqual(recovered.data, ok);

  keepAlive();
  client.clear();
});

test("correcting the filter that failed loads the corrected list", async () => {
  const client = new QueryClient();
  const requested = [];
  const queryFn = async ({ queryKey }) => {
    requested.push(queryKey[2]);
    if (queryKey[2].brandIds) throw new Error("400");
    return ok;
  };
  const observer = listObserver(client, { brandIds: [9] }, queryFn);
  const keepAlive = observer.subscribe(() => {});
  assert.equal(viewOf(await settled(observer)), "error");

  // Removing the badge changes the URL, hence the normalized key.
  observer.setOptions({
    queryKey: productListKey({}),
    queryFn,
    retry: false,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
  const corrected = await settled(observer);
  assert.equal(viewOf(corrected), "products");
  assert.equal(requested.length, 2);
  assert.equal(requested[1].brandIds, undefined);

  keepAlive();
  client.clear();
});

test("the filter controls render whatever the request state; Retry is the real refetch", () => {
  assert.match(layout, /const result = useGetAllProducts\(filters, initialOptions\);/);
  assert.match(layout, /refetch: refetchProducts,\s*\} = catalogInitialView\(result, initialOptions, useIsHydrated\(\)\);/);
  assert.match(layout, /<Error className="w-full" onRetry=\{refetchProducts\} \/>/);
  // FilterSection comes first and outside the error/success branch.
  const filters = layout.indexOf("<FilterSection />");
  const branch = layout.indexOf('{view === "error" ? (');
  assert.ok(filters > 0 && branch > filters, "FilterSection renders before the branch");
  assert.doesNotMatch(layout, /if \(isProductsError\)/, "no early return drops the filters");
  assert.doesNotMatch(layout, /className="h-dvh"/);
  // Error calls onRetry when given (router.refresh() would not refetch a client query).
  assert.match(errorComponent, /onClick=\{\(\) => \(onRetry \? onRetry\(\) : router\.refresh\(\)\)\}/);
});

test("loading, empty and pagination stay in the success branch", () => {
  const success = layout.slice(layout.indexOf('{view === "error" ? ('));
  assert.match(success, /view === "loading" &&/);
  assert.match(success, /view === "empty" && \(/);
  assert.match(success, /<ProductPagination/);
  assert.match(layout, /const totalPages = isProductsLoading \? 0 : \(meta\?\.totalPages \?\? 1\);/);
});
