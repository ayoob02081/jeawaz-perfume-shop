import { cache, Suspense } from "react";
import { notFound } from "next/navigation";
import ProductsLayout from "./_components/ProductsLayout";
import { catalogSearchParams } from "@/lib/storefrontCatalog.mjs";
import { fetchCatalogSnapshot } from "@/lib/storefrontCatalog.server.mjs";
import { productsQueryFromSearchParams } from "@/utils/productFilterContract.mjs";
import { listingSeoMetadata } from "@/lib/listingSeo.mjs";
import { socialMetadata } from "@/lib/seo.mjs";

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
  const snapshot = await getSnapshot(JSON.stringify(query));
  // Only a validated successful response establishes the pagination boundary.
  // An empty first page remains a valid searchable/filterable collection.
  if (query.page > 1 && query.page > snapshot.products.data.meta.totalPages) notFound();
  return { query, snapshot };
}

const listingMetadata = (query, snapshot) =>
  ({ ...metadataFields, ...listingSeoMetadata(query, snapshot.products.data) });

export async function generateMetadata({ searchParams }) {
  const { query, snapshot } = await loadListing(searchParams);
  const metadata = listingMetadata(query, snapshot);
  const canonical = metadata.alternates?.canonical;
  // Share previews only for the indexable states, with their own canonical.
  if (!canonical) return metadata;
  return {
    ...metadata,
    ...socialMetadata({ title: metadata.title, description: metadata.description, url: canonical }),
  };
}

async function ProductPage({ searchParams }) {
  const { query, snapshot } = await loadListing(searchParams);
  return (
    <>
      {/* The listing has no visible title: the page's own title as its main
          heading, for assistive technology and document structure. */}
      <h1 className="sr-only">{listingMetadata(query, snapshot).title}</h1>
      <Suspense fallback={null}>
        <ProductsLayout initialSnapshot={snapshot.products} />
      </Suspense>
    </>
  );
}

export default ProductPage;
