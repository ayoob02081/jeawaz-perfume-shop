import { cache, Suspense } from "react";
import ProductsLayout from "./_components/ProductsLayout";
import { catalogSearchParams } from "@/lib/storefrontCatalog.mjs";
import { fetchCatalogSnapshot } from "@/lib/storefrontCatalog.server.mjs";
import { productsQueryFromSearchParams } from "@/utils/productFilterContract.mjs";
import { listingSeoMetadata } from "@/lib/listingSeo.mjs";

const metadataFields = {
  title: "محصولات",
  description: "جدیدترین و ترندترین محصولات دنیا",
};

// React cache is request-scoped. A scalar key deduplicates metadata/render reads
// even when Next supplies different searchParams promise objects. No price cache.
const getSnapshot = cache((queryJson) => fetchCatalogSnapshot({
  apiUrl: process.env.NEXT_PUBLIC_API_URL, query: JSON.parse(queryJson), throwOnError: true,
}));

async function loadListing(searchParams) {
  const query = productsQueryFromSearchParams(catalogSearchParams(await searchParams));
  return { query, snapshot: await getSnapshot(JSON.stringify(query)) };
}

export async function generateMetadata({ searchParams }) {
  const { query, snapshot } = await loadListing(searchParams);
  return { ...metadataFields, ...listingSeoMetadata(query, snapshot.products.data) };
}

async function ProductPage({ searchParams }) {
  const { snapshot } = await loadListing(searchParams);
  return (
    <Suspense fallback={null}>
      <ProductsLayout initialSnapshot={snapshot.products} />
    </Suspense>
  );
}

export default ProductPage;
