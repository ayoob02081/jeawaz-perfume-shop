import { Suspense } from "react";
import ProductsLayout from "./_components/ProductsLayout";
import { catalogSearchParams } from "@/lib/storefrontCatalog.mjs";
import { fetchCatalogSnapshot } from "@/lib/storefrontCatalog.server.mjs";
import { productsQueryFromSearchParams } from "@/utils/productFilterContract.mjs";

export const metadata = {
  title: "محصولات",
  description: "جدیدترین و ترندترین محصولات دنیا",
};

async function ProductPage({ searchParams }) {
  const query = productsQueryFromSearchParams(catalogSearchParams(await searchParams));
  const snapshot = await fetchCatalogSnapshot({
    apiUrl: process.env.NEXT_PUBLIC_API_URL, query,
  });
  return (
    <Suspense fallback={null}>
      <ProductsLayout initialSnapshot={snapshot.products} />
    </Suspense>
  );
}

export default ProductPage;
