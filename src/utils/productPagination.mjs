import { normalizeProductListPage } from "./productFilterContract.mjs";

// Preserve the URL contract, including repeated filters and an omitted search
// sort. Only page changes; page 1 uses the existing base/filter destination.
export function productPageHref(search, page) {
  const params = new URLSearchParams(search.toString());
  const target = normalizeProductListPage(page);
  params.delete("page");
  if (target > 1) params.set("page", String(target));
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

export function productPaginationState(page, totalPages, compact = false) {
  const current = normalizeProductListPage(page);
  const total = Number.isSafeInteger(totalPages) && totalPages > 0 ? totalPages : 0;
  if (!total || (total === 1 && current === 1)) return { items: [], previous: null, next: null };
  // An empty out-of-range page stays empty; offer real in-range recovery links
  // without changing the requested page, API response or cache key.
  const center = Math.min(current, total);
  const siblings = compact && total > 5 ? 1 : 2;
  const start = Math.max(1, center - siblings);
  const end = Math.min(total, center + siblings);
  const items = [];
  if (start > 1) {
    items.push(1);
    if (start > 2) items.push("dots-start");
  }
  for (let item = start; item <= end; item++) items.push(item);
  if (end < total) {
    if (end < total - 1) items.push("dots-end");
    items.push(total);
  }
  return { items, previous: current > 1 ? Math.min(current - 1, total) : null,
    next: current < total ? current + 1 : null };
}
