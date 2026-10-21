import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryCache, QueryClient, QueryClientProvider, QueryObserver, keepPreviousData, useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  HOME_CATALOG_QUERY, STOREFRONT_CATALOG_STALE_TIME, catalogInitialQueryOptions,
  categoryInitialQueryOptions, catalogSearchParams, catalogInitialView,
  catalogSnapshotQueryOptions, commitCatalogSnapshot, prepareCatalogSnapshot,
} from "./storefrontCatalog.mjs";
import { fetchCatalogSnapshot, CATALOG_SNAPSHOT_TIMEOUT_MS } from "./storefrontCatalog.server.mjs";
import {
  getFiltersFromSearchParams, normalizeProductsQuery, productListKey,
  productsQueryFromSearchParams, storefrontCategoryOptions,
} from "../utils/productFilterContract.mjs";

const apiUrl = "https://api.example.test/base";
const payload = (query, ids = [105]) => ({
  data: ids.map((id) => ({ id })),
  meta: { page: query.page, limit: query.limit, total: ids.length, totalPages: Math.ceil(ids.length / query.limit) },
});
const reply = (data) => ({ ok: true, json: async () => data });
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};
const pricedPayload = (query, price, isAvailable) => ({
  ...payload(query), data: [{ id: 105, representativeVariant: { price }, isAvailable }],
});
const filters = "search=دیور+%26+oud&brandIds=2&brandIds=1&gender=زنانه+%26+مردانه%2Fخاص" +
  "&characters=sweet&characters=woody&seasons=summer&seasons=winter&temperature=cool" +
  "&occasions=daily&concentrations=PARFUM&fragranceFamilies=amber&volumes=5&volumes=10" +
  "&grades=SUPER_MASTER&type=decant&inStock=true&discounted=true&minVolume=3&maxVolume=50&minPrice=100&maxPrice=9000&page=2&limit=24";

test("server record conversion preserves repeated values and the exact client URL/filter/key contract", () => {
  const client = new URLSearchParams(filters);
  const record = Object.fromEntries([...new Set(client.keys())].map((key) => [key, client.getAll(key)]));
  const server = catalogSearchParams(record);
  assert.equal(server.toString(), client.toString());
  const actual = productsQueryFromSearchParams(server);
  const applied = getFiltersFromSearchParams(client);
  assert.deepEqual(actual, normalizeProductsQuery({
    search: client.get("search"), ...applied, minPrice: applied.priceRange[0], maxPrice: applied.priceRange[1],
    page: client.get("page"), limit: client.get("limit"),
  }));
  assert.equal(actual.sort, undefined, "omitted search sort preserves relevance");
  assert.deepEqual(productListKey(actual), productListKey(productsQueryFromSearchParams(client)));
  assert.deepEqual(actual.characters, ["sweet", "woody"]);
  assert.equal(actual.page, 2);
  assert.equal(actual.limit, 24);
});

test("default, explicit sort, legacy links and invalid URL bounds keep existing normalization", () => {
  for (const sort of ["newest", "oldest", "price_low_to_high", "price_high_to_low", "best_selling", "most_discounted"]) {
    const query = productsQueryFromSearchParams(new URLSearchParams(`search=oud&sort=${sort}`));
    assert.equal(query.sort, sort);
  }
  assert.equal(productsQueryFromSearchParams(new URLSearchParams()).sort, "newest");
  const query = productsQueryFromSearchParams(new URLSearchParams("page=-1&limit=99999&original=false&minPrice=9&maxPrice=1"));
  assert.equal(query.page, 1);
  assert.equal(query.limit, 12);
  assert.deepEqual(query.grades, ["SUPER_MASTER"]);
  assert.equal(query.minPrice, undefined);
  assert.equal(query.maxPrice, undefined);
});

test("snapshot makes only three parallel anonymous no-store homepage reads with bounded product count", async () => {
  const calls = [];
  let finish;
  const gate = new Promise((resolve) => { finish = resolve; });
  const pending = fetchCatalogSnapshot({ apiUrl, query: HOME_CATALOG_QUERY, includeCategories: true,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      await gate;
      return reply(url.pathname.endsWith("/products") ? payload(normalizeProductsQuery(HOME_CATALOG_QUERY)) : []);
    },
  });
  assert.equal(calls.length, 3, "requests start before any has completed");
  finish();
  const result = await pending;
  assert.equal(result.products.data.data[0].id, 105);
  assert.deepEqual(result.gender.data, []);
  assert.deepEqual(result.character.data, []);
  assert.deepEqual(calls.map(({ url }) => url.pathname), ["/base/products", "/base/categories/type/gender", "/base/categories/type/character"]);
  assert.equal(calls[0].url.searchParams.get("limit"), "8");
  assert.equal(calls[0].url.searchParams.get("inStock"), "true");
  assert.equal(CATALOG_SNAPSHOT_TIMEOUT_MS, 5000);
  for (const { options } of calls) {
    assert.equal(options.cache, "no-store");
    assert.equal(options.credentials, "omit");
    assert(options.signal instanceof AbortSignal);
    assert.deepEqual(options.headers, { Accept: "application/json" });
  }
});

test("listing uses one public request and the same repeated-key wire parameters as browser Axios", async () => {
  const query = productsQueryFromSearchParams(new URLSearchParams(filters));
  let requested;
  await fetchCatalogSnapshot({ apiUrl, query, fetchImpl: async (url) => {
    requested = url;
    return reply(payload(query));
  } });
  const browser = new URL(axios.getUri({ url: `${apiUrl}/products`, params: query, paramsSerializer: { indexes: null } }));
  assert.deepEqual([...requested.searchParams], [...browser.searchParams]);
  assert.equal(requested.searchParams.has("sort"), false);
  assert.deepEqual(requested.searchParams.getAll("brandIds"), ["1", "2"]);
});

test("initialData seed produces real server HTML and the same first client query state without a mount refetch", async () => {
  const snapshot = await fetchCatalogSnapshot({ apiUrl, query: HOME_CATALOG_QUERY,
    fetchImpl: async () => reply(payload(normalizeProductsQuery(HOME_CATALOG_QUERY))),
  });
  const client = new QueryClient();
  let requests = 0;
  const options = { queryKey: productListKey(HOME_CATALOG_QUERY), queryFn: async () => { requests++; return {}; },
    ...catalogInitialQueryOptions(HOME_CATALOG_QUERY, snapshot.products) };
  function Links() {
    const result = useQuery(options);
    assert.equal(result.isPending, false);
    assert.equal(result.isFetching, false);
    return result.data.data.map(({ id }) => React.createElement("a", { key: id, href: `/products/${id}` }, String(id)));
  }
  const render = () => renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(Links)));
  assert.equal(render(), '<a href="/products/105">105</a>');
  const observer = new QueryObserver(client, options);
  const unsubscribe = observer.subscribe(() => {});
  assert.equal(observer.getCurrentResult().isFetching, false);
  assert.equal(requests, 0);
  assert.equal(render(), '<a href="/products/105">105</a>');
  unsubscribe();
  client.clear();
});

test("category seed fills a sidebar's existing pending query and preserves active-only selection without duplicate fetching", () => {
  const client = new QueryClient();
  let requests = 0;
  const queryKey = ["categories", "gender"];
  const base = { queryKey, queryFn: async () => { requests++; return []; }, staleTime: 300000 };
  const snapshot = { data: [{ id: 1, isActive: true }, { id: 2, isActive: false }], updatedAt: Date.now() };
  function Sidebar() { useQuery(base); return null; }
  function Cards() {
    const result = useQuery({ ...base, ...categoryInitialQueryOptions(snapshot), select: storefrontCategoryOptions });
    assert.equal(result.isPending, false);
    return React.createElement("span", null, result.data.map(({ id }) => id).join(","));
  }
  const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(Sidebar), React.createElement(Cards)));
  assert.equal(html, "<span>1</span>");
  assert.equal(client.getQueryData(queryKey).length, 2, "raw cache remains compatible with admin");
  const observers = [new QueryObserver(client, base), new QueryObserver(client, { ...base, ...categoryInitialQueryOptions(snapshot) })];
  const unsubscribe = observers.map((observer) => observer.subscribe(() => {}));
  assert.equal(requests, 0);
  unsubscribe.forEach((fn) => fn());
  client.clear();
});

test("initial product data is never assigned to a different filter, sort, search, gender or page key", () => {
  const query = normalizeProductsQuery(HOME_CATALOG_QUERY);
  const snapshot = { query, data: payload(query), updatedAt: Date.now() };
  assert(catalogInitialQueryOptions(query, JSON.parse(JSON.stringify(snapshot))).initialData);
  for (const change of [{ page: 2 }, { limit: 12 }, { sort: "oldest" }, { gender: "female" }, { search: "oud" }, { characters: ["sweet"] }]) {
    assert.equal(catalogInitialQueryOptions({ ...query, ...change }, snapshot).initialData, undefined);
  }
  assert.equal(catalogInitialQueryOptions(query).initialData, undefined);
  assert.equal(STOREFRONT_CATALOG_STALE_TIME, 30000);
});

test("first hydration view matches server HTML even if a sibling already filled or refreshed the cache", () => {
  const query = normalizeProductsQuery({});
  const snapshot = { query, data: payload(query, [105]), updatedAt: Date.now() };
  const options = catalogInitialQueryOptions(query, snapshot);
  const newerResult = { data: payload(query, [106]), isPending: false, isLoading: false,
    isFetching: true, error: new Error("late background failure"), refetch: () => {} };
  const first = catalogInitialView(newerResult, options, false);
  assert.deepEqual(first.data, snapshot.data);
  assert.equal(first.isFetching, false);
  assert.equal(first.error, null);
  assert.equal(first.refetch, newerResult.refetch);
  assert.equal(catalogInitialView(newerResult, options, true), newerResult, "live query takes over after hydration");
  const sidebar = catalogInitialView(newerResult, {}, false);
  assert.equal(sidebar.data, undefined);
  assert.equal(sidebar.isPending, true, "sidebar keeps its original server placeholder despite page seeding");
  const category = catalogInitialView(newerResult, { initialData: [{ id: 1 }, { id: 2, isActive: false }] }, false, storefrontCategoryOptions);
  assert.deepEqual(category.data, [{ id: 1 }]);
});

test("closed sidebar reads no categories; intent loads each key once and reopening reuses it", async () => {
  const client = new QueryClient();
  const requests = {};
  const base = (type) => ({
    queryKey: ["categories", type],
    queryFn: async () => { requests[type] = (requests[type] ?? 0) + 1; return [{ id: type }]; },
    retry: false, staleTime: 300000, refetchOnWindowFocus: false,
  });
  const settle = () => new Promise(setImmediate);
  // Closed, no intent: the sidebar's observers stay disabled on every route.
  const sidebar = ["gender", "season"].map((type) => new QueryObserver(client, { ...base(type), enabled: false }));
  const stops = sidebar.map((observer) => observer.subscribe(() => {}));
  await settle();
  assert.deepEqual(requests, {}, "a closed sidebar starts no category read");
  // Home seeds its own keys; the closed sidebar does not race that snapshot.
  const page = new QueryObserver(client, { ...base("gender"), ...categoryInitialQueryOptions({ data: [{ id: 1 }], updatedAt: Date.now() }) });
  stops.push(page.subscribe(() => {}));
  await settle();
  assert.deepEqual(requests, {}, "page seed requires no extra client fetch");
  // Intent or opening: a fresh seeded key is reused, a missing key loads once.
  sidebar.forEach((observer, index) => observer.setOptions({ ...base(["gender", "season"][index]), enabled: true }));
  await settle();
  assert.deepEqual(requests, { season: 1 });
  assert.deepEqual(client.getQueryData(["categories", "gender"]), [{ id: 1 }]);
  // A visible consumer of the same key (the /products filters) shares it.
  const products = new QueryObserver(client, base("season"));
  stops.push(products.subscribe(() => {}));
  await settle();
  assert.deepEqual(requests, { season: 1 }, "one request per key across consumers");
  // Close and reopen keep the observers; fresh data is not read again.
  sidebar[1].setOptions({ ...base("season"), enabled: true });
  await settle();
  assert.deepEqual(requests, { season: 1 }, "reopening within staleTime reuses the cache");
  stops.forEach((stop) => stop());
  client.clear();
});

test("a newer server snapshot replaces a stale populated cache after commit without a duplicate client fetch", () => {
  const client = new QueryClient();
  const query = normalizeProductsQuery({});
  const key = productListKey(query);
  const now = Date.now();
  client.setQueryData(key, payload(query, [105]), { updatedAt: now - 60000 });
  const snapshot = { query, data: payload(query, [106]), updatedAt: now };
  const initial = catalogInitialQueryOptions(query, snapshot);
  let requests = 0;
  const base = { queryKey: key, queryFn: async () => { requests++; return {}; } };
  let options = catalogSnapshotQueryOptions(client.getQueryState(key), initial);
  assert.equal(options.enabled, false);
  const observer = new QueryObserver(client, { ...base, ...options });
  const stop = observer.subscribe(() => {});
  assert.equal(requests, 0);
  assert.equal(catalogInitialView(observer.getCurrentResult(), options, true).data.data[0].id, 106);
  commitCatalogSnapshot(client, key, initial);
  options = catalogSnapshotQueryOptions(client.getQueryState(key), initial);
  assert.equal(options.enabled, undefined);
  observer.setOptions({ ...base, ...options });
  assert.equal(observer.getCurrentResult().data.data[0].id, 106);
  assert.equal(requests, 0);
  client.setQueryData(key, payload(query, [107]), { updatedAt: now + 1000 });
  commitCatalogSnapshot(client, key, initial);
  assert.equal(client.getQueryData(key).data[0].id, 107, "a newer client response is never reverted");
  stop();
  client.clear();
});

test("expired snapshot refetches on mount; successful empty and out-of-range pages stay empty successes", async () => {
  const query = normalizeProductsQuery({ page: 10 });
  const empty = { data: [], meta: { page: 10, limit: 12, total: 2, totalPages: 1 } };
  const snapshot = await fetchCatalogSnapshot({ apiUrl, query, fetchImpl: async () => reply(empty) });
  assert.deepEqual(snapshot.products.data, empty);
  const client = new QueryClient();
  let requests = 0;
  const observer = new QueryObserver(client, { queryKey: productListKey(query), queryFn: async () => { requests++; return empty; },
    ...catalogInitialQueryOptions(query, { ...snapshot.products, updatedAt: Date.now() - STOREFRONT_CATALOG_STALE_TIME - 1000 }) });
  const unsubscribe = observer.subscribe(() => {});
  assert.equal(requests, 1);
  await observer.refetch();
  assert.deepEqual(observer.getCurrentResult().data, empty);
  unsubscribe();
  client.clear();
  const zero = await fetchCatalogSnapshot({ apiUrl, query: {}, fetchImpl: async () => reply(payload(normalizeProductsQuery({}), [])) });
  assert.deepEqual(zero.products.data.data, []);
});

test("interactive query changes retain placeholder semantics and seeded navigation avoids a second client request", async () => {
  const client = new QueryClient();
  const first = normalizeProductsQuery({});
  const second = normalizeProductsQuery({ gender: "female", sort: "oldest", page: 2 });
  const firstData = payload(first, [105]);
  let requests = 0;
  const options = (query, snapshot) => ({ queryKey: productListKey(query), retry: false,
    placeholderData: keepPreviousData, ...catalogInitialQueryOptions(query, snapshot),
    queryFn: async () => { requests++; return payload(query, [106]); } });
  const initialSnapshot = { query: first, data: firstData, updatedAt: Date.now() };
  const observer = new QueryObserver(client, options(first, initialSnapshot));
  const unsubscribe = observer.subscribe(() => {});
  observer.setOptions(options(second, initialSnapshot));
  assert.equal(observer.getCurrentResult().isPlaceholderData, true);
  assert.deepEqual(observer.getCurrentResult().data, firstData);
  assert.equal(client.getQueryData(productListKey(second)), undefined, "previous query never poisons the new cache key");
  await observer.refetch();
  assert.equal(client.getQueryData(productListKey(second)).data[0].id, 106);
  assert.equal(requests, 1);
  const third = normalizeProductsQuery({ search: "oud", page: 3 });
  observer.setOptions(options(third, { query: third, data: payload(third, [107]), updatedAt: Date.now() }));
  assert.equal(observer.getCurrentResult().data.data[0].id, 107);
  assert.equal(observer.getCurrentResult().isPlaceholderData, false);
  assert.equal(observer.getCurrentResult().isFetching, false);
  assert.equal(requests, 1);
  unsubscribe();
  client.clear();
});

test("429, timeouts, malformed catalog and partial category failure do not seed false empty data", async (t) => {
  t.mock.method(console, "warn", () => {});
  for (const fetchImpl of [
    async () => ({ ok: false, status: 429 }),
    async () => { throw new DOMException("Timeout", "TimeoutError"); },
    async () => reply({ data: [], meta: {} }),
    async () => reply({ ...payload(normalizeProductsQuery(HOME_CATALOG_QUERY)), data: Array(9).fill({ id: 105 }) }),
  ]) {
    const snapshot = await fetchCatalogSnapshot({ apiUrl, query: HOME_CATALOG_QUERY, fetchImpl });
    assert.deepEqual(snapshot, {});
    assert.equal(catalogInitialQueryOptions(HOME_CATALOG_QUERY, snapshot.products).initialData, undefined);
  }
  const partial = await fetchCatalogSnapshot({ apiUrl, query: HOME_CATALOG_QUERY, includeCategories: true,
    fetchImpl: async (url) => url.pathname.endsWith("/products") ? reply(payload(normalizeProductsQuery(HOME_CATALOG_QUERY))) : { ok: false },
  });
  assert(partial.products);
  assert.equal(partial.gender, undefined);
  assert.equal(partial.character, undefined);
});

test("API failure leaves existing pending, error and explicit retry states available", async () => {
  const client = new QueryClient();
  const options = { queryKey: productListKey({}), ...catalogInitialQueryOptions({}), retry: false,
    queryFn: async () => { throw new Error("unavailable"); } };
  const observer = new QueryObserver(client, options);
  assert.equal(observer.getCurrentResult().isPending, true);
  await observer.refetch();
  assert.equal(observer.getCurrentResult().isError, true);
  observer.setOptions({ ...options, queryFn: async () => payload(normalizeProductsQuery({})) });
  await observer.refetch();
  assert.equal(observer.getCurrentResult().isSuccess, true);
  client.clear();
});

test("snapshots have no shared server query state and invalid API configuration never sends a request", async (t) => {
  t.mock.method(console, "warn", () => {});
  let calls = 0;
  for (const invalid of [undefined, "", "ftp://api.test", "https://u:p@api.test", "https://api.test?secret=x", "https://api.test#x"]) {
    assert.deepEqual(await fetchCatalogSnapshot({ apiUrl: invalid, query: {}, fetchImpl: async () => { calls++; } }), {});
  }
  assert.equal(calls, 0);
  const a = await fetchCatalogSnapshot({ apiUrl, query: {}, fetchImpl: async () => reply(payload(normalizeProductsQuery({}), [105])) });
  const b = await fetchCatalogSnapshot({ apiUrl, query: {}, fetchImpl: async () => reply(payload(normalizeProductsQuery({}), [106])) });
  assert.equal(a.products.data.data[0].id, 105);
  assert.equal(b.products.data.data[0].id, 106);
});

for (const populated of [false, true]) {
  test(`late browser response cannot replace adopted prices/availability (${populated ? "populated" : "pending"} cache)`, async () => {
    const client = new QueryClient();
    const query = normalizeProductsQuery({});
    const key = productListKey(query);
    const older = pricedPayload(query, 100000, true);
    const fresh = pricedPayload(query, 200000, false);
    if (populated) client.setQueryData(key, older, { updatedAt: Date.now() - 60000 });
    const transport = deferred();
    let requests = 0;
    const queryFn = () => { requests++; return transport.promise; };
    // Like the existing API adapters, this transport can finish after logical
    // cancellation. Its result must not be allowed back into the query cache.
    const completion = client.fetchQuery({ queryKey: key, queryFn, staleTime: 0 }).catch((error) => error);
    const options = catalogInitialQueryOptions(query, { query, data: fresh, updatedAt: Date.now() });
    const observer = new QueryObserver(client, { queryKey: key, queryFn,
      ...catalogSnapshotQueryOptions(client.getQueryState(key), options) });
    const stop = observer.subscribe(() => {});
    try {
      await commitCatalogSnapshot(client, key, options);
      assert.deepEqual(client.getQueryData(key), fresh);
      transport.resolve(older);
      await transport.promise;
      await completion;
      assert.deepEqual(client.getQueryData(key), fresh);
      assert.equal(client.getQueryState(key).fetchStatus, "idle");
      assert.equal(client.getQueryState(key).error, null);
      assert.equal(requests, 1, "adoption starts no replacement browser fetch");
    } finally {
      transport.resolve(older);
      stop();
      client.clear();
    }
  });

  for (const completionOrder of ["before effect", "queued before cancellation"]) {
    test(`older ${populated ? "populated" : "pending"} fetch finishing ${completionOrder} cannot take snapshot ownership`, async () => {
      const client = new QueryClient();
      const query = normalizeProductsQuery({});
      const key = productListKey(query);
      const older = pricedPayload(query, 100000, true);
      const fresh = pricedPayload(query, 200000, false);
      if (populated) client.setQueryData(key, older, { updatedAt: Date.now() - 60000 });
      const transport = deferred();
      let requests = 0;
      const queryFn = () => { requests++; return transport.promise; };
      const completion = client.fetchQuery({ queryKey: key, queryFn, staleTime: 0 }).catch((error) => error);
      const options = catalogInitialQueryOptions(query, { query, data: fresh, updatedAt: Date.now() });
      // The hook captures this BEFORE useQuery can apply initialData to a
      // pending prefetch, and keeps it across cache-driven re-renders.
      const adoption = prepareCatalogSnapshot(client, key, options);
      const guarded = catalogSnapshotQueryOptions(client.getQueryState(key), options, adoption.eligible);
      assert.equal(guarded.enabled, false);
      const observer = new QueryObserver(client, { queryKey: key, queryFn, ...guarded });
      const stop = observer.subscribe(() => {});
      try {
        transport.resolve(older);
        if (completionOrder === "before effect") await completion;
        assert.deepEqual(catalogInitialView(observer.getCurrentResult(), guarded, true).data, fresh);
        await commitCatalogSnapshot(client, key, options, adoption);
        await completion;
        observer.setOptions({ queryKey: key, queryFn,
          ...catalogSnapshotQueryOptions(client.getQueryState(key), options) });
        assert.deepEqual(client.getQueryData(key), fresh);
        assert.equal(observer.getCurrentResult().isFetching, false);
        assert.equal(requests, 1);
      } finally {
        transport.resolve(older);
        stop();
        client.clear();
      }
    });
  }
}

test("snapshot cancellation is exact-key, aborts consumed signals and does not surface a cancellation error", async () => {
  const client = new QueryClient();
  const query = normalizeProductsQuery({});
  const key = productListKey(query);
  const otherKey = productListKey({ ...query, page: 2 });
  const old = deferred(), other = deferred();
  let oldSignal, otherSignal;
  const completion = client.fetchQuery({ queryKey: key, queryFn: ({ signal }) => {
    oldSignal = signal;
    return old.promise;
  } }).catch((error) => error);
  const otherCompletion = client.fetchQuery({ queryKey: otherKey, queryFn: ({ signal }) => {
    otherSignal = signal;
    return other.promise;
  } });
  const fresh = pricedPayload(query, 200000, false);
  const options = catalogInitialQueryOptions(query, { query, data: fresh, updatedAt: Date.now() });
  await commitCatalogSnapshot(client, key, options);
  assert.equal(oldSignal.aborted, true);
  assert.equal(otherSignal.aborted, false);
  assert.equal(client.getQueryState(otherKey).fetchStatus, "fetching");
  old.resolve(pricedPayload(query, 100000, true));
  other.resolve(payload({ ...query, page: 2 }, [106]));
  await completion;
  await otherCompletion;
  assert.deepEqual(client.getQueryData(key), fresh);
  assert.equal(client.getQueryData(otherKey).data[0].id, 106);
  assert.equal(client.getQueryState(key).error, null);
  assert.equal(client.getQueryState(key).fetchStatus, "idle");
  client.clear();
});

test("newer client data written during cancellation wins over the incoming snapshot", async () => {
  const client = new QueryClient();
  const query = normalizeProductsQuery({});
  const key = productListKey(query);
  client.setQueryData(key, payload(query), { updatedAt: Date.now() - 60000 });
  const old = deferred();
  const completion = client.fetchQuery({ queryKey: key, queryFn: () => old.promise, staleTime: 0 }).catch((error) => error);
  const now = Date.now();
  const options = catalogInitialQueryOptions(query, { query, data: pricedPayload(query, 200000, false), updatedAt: now });
  const adoption = prepareCatalogSnapshot(client, key, options);
  const committing = commitCatalogSnapshot(client, key, options, adoption);
  const newer = pricedPayload(query, 300000, true);
  client.setQueryData(key, newer, { updatedAt: now + 1000 });
  await committing;
  old.resolve(pricedPayload(query, 100000, true));
  await completion;
  assert.deepEqual(client.getQueryData(key), newer);
  client.clear();
});

test("a newer cache write after the old response finishes is not mistaken for that response", async () => {
  const client = new QueryClient();
  const query = normalizeProductsQuery({});
  const key = productListKey(query);
  const old = deferred();
  const completion = client.fetchQuery({ queryKey: key, queryFn: () => old.promise });
  const now = Date.now();
  const options = catalogInitialQueryOptions(query, { query, data: pricedPayload(query, 200000, false), updatedAt: now });
  const adoption = prepareCatalogSnapshot(client, key, options);
  old.resolve(pricedPayload(query, 100000, true));
  await completion;
  const newer = pricedPayload(query, 300000, true);
  client.setQueryData(key, newer, { updatedAt: now + 1000 });
  await commitCatalogSnapshot(client, key, options, adoption);
  assert.deepEqual(client.getQueryData(key), newer);
  client.clear();
});

test("adoption does not cancel a replacement fetch started after the captured request", async () => {
  const client = new QueryClient();
  const query = normalizeProductsQuery({});
  const key = productListKey(query);
  client.setQueryData(key, payload(query), { updatedAt: Date.now() - 60000 });
  const old = deferred(), newer = deferred();
  let oldSignal, newerSignal;
  const oldCompletion = client.fetchQuery({ queryKey: key, queryFn: ({ signal }) => {
    oldSignal = signal;
    return old.promise;
  }, staleTime: 0 }).catch((error) => error);
  const options = catalogInitialQueryOptions(query, { query, data: pricedPayload(query, 200000, false), updatedAt: Date.now() });
  const adoption = prepareCatalogSnapshot(client, key, options);
  // Supersede using the SDK's normal cancelRefetch path.
  const entry = client.getQueryCache().find({ queryKey: key, exact: true });
  const replacement = entry.fetch({ queryKey: key, queryFn: ({ signal }) => {
    newerSignal = signal;
    return newer.promise;
  } }, { cancelRefetch: true });
  await commitCatalogSnapshot(client, key, options, adoption);
  assert.equal(oldSignal.aborted, true);
  assert.equal(newerSignal.aborted, false);
  assert.equal(client.getQueryData(key).data[0].representativeVariant.price, 200000);
  newer.resolve(pricedPayload(query, 300000, true));
  old.resolve(pricedPayload(query, 100000, true));
  await replacement;
  await oldCompletion;
  assert.equal(client.getQueryData(key).data[0].representativeVariant.price, 300000);
  client.clear();
});

test("overlapping snapshot adoptions cannot restore an older server snapshot", async () => {
  const client = new QueryClient();
  const query = normalizeProductsQuery({});
  const key = productListKey(query);
  const old = deferred();
  const completion = client.fetchQuery({ queryKey: key, queryFn: () => old.promise }).catch((error) => error);
  const now = Date.now();
  const first = catalogInitialQueryOptions(query, { query, data: pricedPayload(query, 200000, false), updatedAt: now });
  const second = catalogInitialQueryOptions(query, { query, data: pricedPayload(query, 300000, true), updatedAt: now + 1000 });
  const firstPlan = prepareCatalogSnapshot(client, key, first);
  const secondPlan = prepareCatalogSnapshot(client, key, second);
  await Promise.all([
    commitCatalogSnapshot(client, key, second, secondPlan),
    commitCatalogSnapshot(client, key, first, firstPlan),
  ]);
  old.resolve(pricedPayload(query, 100000, true));
  await completion;
  assert.equal(client.getQueryData(key).data[0].representativeVariant.price, 300000);
  client.clear();
});

test("absent or older snapshots do not cancel an ongoing legitimate refresh", async () => {
  const client = new QueryClient();
  const query = normalizeProductsQuery({});
  const key = productListKey(query);
  const now = Date.now();
  const fresh = pricedPayload(query, 300000, true);
  client.setQueryData(key, fresh, { updatedAt: now });
  const transport = deferred();
  let signal;
  const completion = client.fetchQuery({ queryKey: key, queryFn: (context) => {
    signal = context.signal;
    return transport.promise;
  }, staleTime: 0 });
  await commitCatalogSnapshot(client, key, catalogInitialQueryOptions(query));
  await commitCatalogSnapshot(client, key, catalogInitialQueryOptions(query, {
    query, data: pricedPayload(query, 200000, false), updatedAt: now - 1000,
  }));
  assert.equal(signal.aborted, false);
  assert.deepEqual(client.getQueryData(key), fresh);
  transport.resolve(pricedPayload(query, 400000, true));
  await completion;
  assert.equal(client.getQueryData(key).data[0].representativeVariant.price, 400000);
  client.clear();
});

test("an abort-aware transport keeps normal cancellation behavior without an error callback or forced refetch", async () => {
  let errors = 0, requests = 0;
  const client = new QueryClient({ queryCache: new QueryCache({ onError: () => { errors++; } }) });
  const query = normalizeProductsQuery({});
  const key = productListKey(query);
  const completion = client.fetchQuery({ queryKey: key, queryFn: ({ signal }) => {
    requests++;
    return new Promise((resolve, reject) => {
      signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    });
  } }).catch((error) => error);
  const fresh = pricedPayload(query, 200000, false);
  const options = catalogInitialQueryOptions(query, { query, data: fresh, updatedAt: Date.now() });
  await commitCatalogSnapshot(client, key, options);
  await completion;
  assert.deepEqual(client.getQueryData(key), fresh);
  assert.equal(client.getQueryState(key).status, "success");
  assert.equal(errors, 0);
  assert.equal(requests, 1);
  let signal;
  await client.fetchQuery({ queryKey: key, staleTime: 0, queryFn: (context) => {
    signal = context.signal;
    requests++;
    return pricedPayload(query, 300000, true);
  } });
  assert.equal(signal.aborted, false, "later explicit refresh remains usable");
  assert.equal(client.getQueryData(key).data[0].representativeVariant.price, 300000);
  assert.equal(requests, 2);
  client.clear();
});

test("shared category adoption retains raw cache shape and active-only selection after a late response", async () => {
  const client = new QueryClient();
  const key = ["categories", "gender"];
  const old = deferred();
  const older = [{ id: 1, slug: "older", isActive: true }];
  const fresh = [{ id: 2, slug: "new", isActive: true }, { id: 3, slug: "inactive", isActive: false }];
  let requests = 0;
  const queryFn = () => { requests++; return old.promise; };
  const completion = client.fetchQuery({ queryKey: key, queryFn }).catch((error) => error);
  const options = categoryInitialQueryOptions({ data: fresh, updatedAt: Date.now() });
  const adoption = prepareCatalogSnapshot(client, key, options);
  const observer = new QueryObserver(client, { queryKey: key, queryFn, select: storefrontCategoryOptions,
    staleTime: 300000, ...catalogSnapshotQueryOptions(client.getQueryState(key), options, true) });
  const stop = observer.subscribe(() => {});
  await commitCatalogSnapshot(client, key, options, adoption);
  old.resolve(older);
  await completion;
  assert.deepEqual(client.getQueryData(key), fresh);
  assert.deepEqual(observer.getCurrentResult().data, [fresh[0]]);
  assert.equal(requests, 1);
  stop();
  client.clear();
});

test("preparing an uncommitted navigation neither cancels nor changes the active query", async () => {
  const client = new QueryClient();
  const query = normalizeProductsQuery({});
  const key = productListKey(query);
  const older = pricedPayload(query, 100000, true);
  client.setQueryData(key, older, { updatedAt: Date.now() - 60000 });
  const transport = deferred();
  let signal;
  const completion = client.fetchQuery({ queryKey: key, staleTime: 0, queryFn: (context) => {
    signal = context.signal;
    return transport.promise;
  } });
  const options = catalogInitialQueryOptions(query, { query, data: pricedPayload(query, 200000, false), updatedAt: Date.now() });
  const adoption = prepareCatalogSnapshot(client, key, options);
  catalogSnapshotQueryOptions(client.getQueryState(key), options, adoption.eligible);
  assert.equal(signal.aborted, false);
  assert.deepEqual(client.getQueryData(key), older);
  // No adoption effect ran (for example, the route transition was aborted).
  transport.resolve(older);
  await completion;
  assert.deepEqual(client.getQueryData(key), older);
  assert.equal(signal.aborted, false);
  client.clear();
});

test("strict listing snapshots propagate HTTP, network and malformed-payload failures", async () => {
  const offline = new Error("synthetic network failure");
  for (const fetchImpl of [
    async () => ({ ok: false, status: 400 }),
    async () => ({ ok: false, status: 503 }),
    async () => { throw offline; },
    async () => reply({ data: [], meta: {} }),
    async () => ({ ok: true, json: async () => { throw new SyntaxError("bad JSON"); } }),
  ]) {
    await assert.rejects(fetchCatalogSnapshot({ apiUrl, query: {}, throwOnError: true, fetchImpl }));
  }
});

test("strict success preserves no-store, anonymous requests and genuine empty result snapshots", async () => {
  let requests = 0;
  const empty = { data: [], meta: { page: 1, limit: 12, total: 0, totalPages: 0 } };
  const snapshot = await fetchCatalogSnapshot({ apiUrl, query: {}, throwOnError: true, fetchImpl: async (_url, options) => {
    requests++;
    assert.equal(options.cache, "no-store");
    assert.equal(options.credentials, "omit");
    assert.equal(options.headers.Cookie, undefined);
    return reply(empty);
  } });
  assert.equal(requests, 1);
  assert.deepEqual(snapshot.products.data, empty);
});
