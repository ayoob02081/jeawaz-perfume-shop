import { productListKey } from "../utils/productFilterContract.mjs";

export const HOME_CATALOG_QUERY = Object.freeze({
  sort: "newest", inStock: true, page: 1, limit: 8,
});

// Matches the listing's existing next-page prefetch freshness window. This is
// browser query freshness only; server snapshots are always requested no-store.
export const STOREFRONT_CATALOG_STALE_TIME = 30_000;

export function catalogInitialQueryOptions(query, snapshot) {
  const matches = snapshot?.data &&
    JSON.stringify(productListKey(query)) === JSON.stringify(productListKey(snapshot.query));
  return {
    staleTime: STOREFRONT_CATALOG_STALE_TIME,
    ...(matches ? { initialData: snapshot.data, initialDataUpdatedAt: snapshot.updatedAt } : {}),
  };
}

export function categoryInitialQueryOptions(snapshot) {
  return snapshot ? { initialData: snapshot.data, initialDataUpdatedAt: snapshot.updatedAt } : {};
}

// A sibling can populate the shared cache before this subtree hydrates. Its
// first render must still match its own server snapshot (or server skeleton).
// Once hydrated, query results, errors and background refreshes take over.
export function catalogInitialView(result, options, isHydrated, select = (data) => data) {
  if (isHydrated && options.enabled !== false) return result;
  const pending = options.initialData === undefined;
  return {
    ...result,
    data: pending ? undefined : select(options.initialData),
    error: null,
    isPending: pending,
    isLoading: pending,
    isFetching: pending,
  };
}

const snapshotIsNewer = (state, options) => options.initialData !== undefined &&
  (state?.data === undefined || state.dataUpdatedAt < options.initialDataUpdatedAt);

export function catalogSnapshotQueryOptions(state, options, adopting = false) {
  // initialData fills missing queries, but does not replace an existing cache.
  // Pause an older populated query until the commit effect seeds the snapshot.
  return adopting || (state?.data !== undefined && snapshotIsNewer(state, options))
    ? { ...options, enabled: false }
    : options;
}

export function prepareCatalogSnapshot(client, queryKey, options) {
  const query = client.getQueryCache().find({ queryKey, exact: true });
  const state = query?.state;
  const eligible = snapshotIsNewer(state, options) ||
    (options.initialData !== undefined && state?.data === options.initialData &&
      state.dataUpdatedAt === options.initialDataUpdatedAt &&
      state.fetchStatus !== "idle");
  const request = eligible ? query?.promise : undefined;
  // Capture which cache write belongs to this request if it finishes between
  // render and the adoption effect. Response-arrival timestamps alone cannot
  // distinguish that older response from genuinely newer client data.
  const settled = request?.then(() => ({
    dataUpdateCount: query.state.dataUpdateCount,
    dataUpdatedAt: query.state.dataUpdatedAt,
  }), () => undefined);
  return { eligible, queryKey, options, query, request, settled };
}

export async function commitCatalogSnapshot(client, queryKey, options,
  adoption = prepareCatalogSnapshot(client, queryKey, options)) {
  if (!adoption.eligible) return;
  const cache = client.getQueryCache();
  const query = cache.find({ queryKey, exact: true });
  if (adoption.request && query === adoption.query && query.promise === adoption.request) {
    // Disabling an observer does not cancel a shared fetch/prefetch. Await the
    // exact-key cancellation before seeding, including already queued results.
    await client.cancelQueries({ queryKey, exact: true });
  }
  const settled = adoption.settled ? await adoption.settled : undefined;
  const state = client.getQueryState(queryKey);
  const olderResponse = settled && cache.find({ queryKey, exact: true }) === adoption.query &&
    state?.dataUpdateCount === settled.dataUpdateCount && state.dataUpdatedAt === settled.dataUpdatedAt;
  if (snapshotIsNewer(state, options) || olderResponse) {
    client.setQueryData(queryKey, options.initialData, { updatedAt: options.initialDataUpdatedAt });
  }
}

// On home, the page seeds these same category keys. Don't start a duplicate
// sidebar read while that streamed snapshot is still arriving. Opening the
// panel early can fetch normally; all other routes keep their existing reads.
export const sidebarCategoryQueryEnabled = (pathname, isCategoryOpen) =>
  pathname !== "/" || Boolean(isCategoryOpen);

// Next page searchParams is a record, while the existing UI consumes the
// URLSearchParams interface. Preserve repeated values and their order.
export function catalogSearchParams(record = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (typeof item === "string") params.append(key, item);
    }
  }
  return params;
}
