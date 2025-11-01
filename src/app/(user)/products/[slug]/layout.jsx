"use client";

import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";
import Error from "@/components/Error";
import Loading from "@/components/Loading";
import { useGetAllProducts } from "@/hooks/useProducts";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function ProductSinglePageLayout({ children }) {
  const pathName = usePathname();
  const [productPage, setProductPage] = useState(false);
  const { data, isLoading, error } = useGetAllProducts();

  if (pathName.startsWith("/products/") && productPage === false) {
    setProductPage(true);
  }

  const currentProductSlug = pathName.split("/")[2];

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Error />;
  }

  const currentProduct = data?.find(
    (product) => product.id === currentProductSlug
  );

  return (
    <AdaptiveOverlayPage
      isOpen={productPage}
      label={currentProduct.perTitle}
      side="right"
      className="size-6"
      justify="between"
      overflow="overflow-y-auto overflow-x-hidden"
    >
      {children}
    </AdaptiveOverlayPage>
  );
}
