"use client";

import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function RootLayout({ children }) {
  const pathName = usePathname();
  const [openProducts, setOpenProducts] = useState(false);

  if (pathName.startsWith("/admin/products") && openProducts === false) {
    setOpenProducts(true);
  }

  return (
    <AdaptiveOverlayPage
      isOpen={openProducts}
      label="محصولات"
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
