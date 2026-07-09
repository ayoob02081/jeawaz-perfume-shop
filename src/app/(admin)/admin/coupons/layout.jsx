"use client";

import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function CouponsPageLayout({ children }) {
  const pathName = usePathname();
  const [openCoupons, setOCoupons] = useState(false);

  if (pathName.startsWith("/admin/coupons") && openCoupons === false) {
    setOCoupons(true);
  }

  return (
    <AdaptiveOverlayPage
      isOpen={openCoupons}
      label="کوپن‌ها"
      side="right"
      className="size-4"
      fontStyle="text-base font-bold"
      justify="between"
      overflow="overflow-y-auto"
    >
      {children}
    </AdaptiveOverlayPage>
  );
}
