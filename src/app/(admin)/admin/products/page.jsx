import { Suspense } from "react";
import Loading from "@/components/Loading";
import ProductsLayout from "./_components/ProductsLayout";

// The list state lives in the URL (useSearchParams needs a Suspense boundary).
function ProductsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProductsLayout />
    </Suspense>
  );
}

export default ProductsPage;
