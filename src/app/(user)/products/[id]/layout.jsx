"use client";

import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";
import { useGetProductById } from "@/hooks/useProducts";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function ProductSinglePageLayout({ children }) {
  const pathName = usePathname();
  const currentProductSlug = pathName.split("/")[2];
  const [productPage, setProductPage] = useState(false);
  const {
    data: product,
    isLoading,
    error,
  } = useGetProductById(currentProductSlug);

  if (pathName.startsWith("/products/") && productPage === false) {
    setProductPage(true);
  }

  return (
    <AdaptiveOverlayPage
      isOpen={productPage}
      label={product?.perTitle}
      side="right"
      className="size-6"
      justify="between"
      overflow="overflow-y-auto overflow-x-hidden"
      max={false}
      product
    >
      {children}
    </AdaptiveOverlayPage>
  );
}
