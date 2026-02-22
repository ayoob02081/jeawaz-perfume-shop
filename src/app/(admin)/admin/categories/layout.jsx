"use client";

import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function RootLayout({ children }) {
  const pathName = usePathname();
  const [openCategories, setOpenCategories] = useState(false);

  if (pathName.startsWith("/admin/categories") && openCategories === false) {
    setOpenCategories(true);
  }

  return (
    <AdaptiveOverlayPage
      isOpen={openCategories}
      label="دسته‌بندی‌ها"
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
