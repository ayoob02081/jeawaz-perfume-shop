import { fetchCatalogSnapshot } from "./storefrontCatalog.server.mjs";
import { rankRelatedProducts, relatedProductQueries } from "./relatedProducts.mjs";

// At most two anonymous public list reads, in parallel. A failed or invalid
// read only removes its candidates; with none left the section is not shown.
export async function fetchRelatedProducts({ apiUrl, product, fetchImpl = fetch }) {
  const queries = relatedProductQueries(product);
  if (!queries.length) return [];
  const snapshots = await Promise.all(queries.map((query) =>
    fetchCatalogSnapshot({ apiUrl, query, fetchImpl })));
  return rankRelatedProducts(product, snapshots.map((snapshot) => snapshot.products?.data?.data ?? []));
}
