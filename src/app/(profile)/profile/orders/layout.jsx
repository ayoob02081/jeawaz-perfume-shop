"use client";

import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function OrdersPageLayout({ children }) {
  const pathName = usePathname();
  const [openOrders, setOpenOrders] = useState(false);

  if (pathName.startsWith("/profile/orders") && openOrders === false) {
    setOpenOrders(true);
  }

  return (
    <AdaptiveOverlayPage
      isOpen={openOrders}
      label="سفارش های من"
      side="right"
      className="size-4"
      fontStyle="text-base font-normal"
      justify="between"
      max="true"
      min="true"
    >
      {children}
    </AdaptiveOverlayPage>
  );
}
