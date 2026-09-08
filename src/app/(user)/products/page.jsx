import { Suspense } from "react";
import ProductsLayout from "./_components/ProductsLayout";

export const metadata = {
  title: "محصولات",
  description: "جدیدترین و ترندترین محصولات دنیا",
};

function ProductPage() {
  return (
    <Suspense fallback={null}>
      <ProductsLayout />
    </Suspense>
  );
}

export default ProductPage;
