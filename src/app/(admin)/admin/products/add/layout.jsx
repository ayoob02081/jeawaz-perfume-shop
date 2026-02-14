"use client";

import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function RootLayout({ children }) {
  const pathName = usePathname();
  const [openAddProduct, setOpenAddProduct] = useState(false);

  if (pathName.startsWith("/admin/products/add") && openAddProduct === false) {
    setOpenAddProduct(true);
  }

  return (
    <AdaptiveOverlayPage
      isOpen={openAddProduct}
      label="اضافه کردن محصول"
      side="right"
      className="size-4"
      fontStyle="text-base font-normal"
      justify="between"
      overflow="overflow-y-auto"
      max="true"
      min="true"
    >
      {children}
    </AdaptiveOverlayPage>
  );
}
