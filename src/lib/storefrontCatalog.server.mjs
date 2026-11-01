import { normalizeProductsQuery } from "../utils/productFilterContract.mjs";

export const CATALOG_SNAPSHOT_TIMEOUT_MS = 5_000;

// Anonymous public reads only. No cookies, auth refresh, persistent cache,
// pagination crawl or per-product detail requests belong in this loader.
export async function fetchCatalogSnapshot({ apiUrl, query, includeCategories = false, includePrimaryBanners = false, throwOnError = false, fetchImpl = fetch }) {
  const normalized = normalizeProductsQuery(query);
  async function read(path, params, validate) {
    try {
      const api = new URL(apiUrl);
      if (!["https:", "http:"].includes(api.protocol) || api.username || api.password || api.search || api.hash) {
        throw new Error("Invalid public API base URL");
      }
      const url = new URL(`${api.href.replace(/\/$/, "")}${path}`);
      // Same repeated-key array contract as httpClient's indexes:null.
      for (const [key, value] of Object.entries(params ?? {})) {
        for (const item of Array.isArray(value) ? value : [value]) {
          if (item !== undefined && item !== null && item !== "") url.searchParams.append(key, String(item));
        }
      }
      const response = await fetchImpl(url, {
        cache: "no-store", credentials: "omit",
        signal: AbortSignal.timeout(CATALOG_SNAPSHOT_TIMEOUT_MS),
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Public API request failed");
      const data = await response.json();
      if (!validate(data)) throw new Error("Invalid public API response");
      return { data, updatedAt: Date.now() };
    } catch (error) {
      if (throwOnError) throw error;
      // Do not turn outages into cached empty successes. Existing client queries
      // retain their loading/error/retry behaviour when no snapshot is available.
      console.warn(`Storefront snapshot unavailable (${path})`);
      return undefined;
    }
  }
  const [products, gender, character, primaryBanners] = await Promise.all([
    read("/products", normalized, (data) =>
      Array.isArray(data?.data) && data.data.length <= normalized.limit &&
      data.meta?.page === normalized.page && data.meta?.limit === normalized.limit &&
      Number.isSafeInteger(data.meta?.total) && data.meta.total >= 0 &&
      data.meta.totalPages === Math.ceil(data.meta.total / normalized.limit)),
    includeCategories ? read("/categories/type/gender", null, Array.isArray) : undefined,
    includeCategories ? read("/categories/type/character", null, Array.isArray) : undefined,
    // The home hero: its first image must be in the server HTML to be found early.
    includePrimaryBanners ? read("/banners/active", { type: "primary" }, (data) =>
      Array.isArray(data) && data.every((banner) => banner !== null && typeof banner === "object")) : undefined,
  ]);
  return {
    ...(products ? { products: { ...products, query: normalized } } : {}),
    ...(gender ? { gender } : {}),
    ...(character ? { character } : {}),
    ...(primaryBanners ? { primaryBanners } : {}),
  };
}
