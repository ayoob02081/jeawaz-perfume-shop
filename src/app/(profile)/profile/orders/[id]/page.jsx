"use client";

import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";
import SingleOrderPage from "@/components/SingleOrderPage";
import { useGetOrderById } from "@/hooks/useOrders";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";

export default function page() {
  const pathName = usePathname();
  const { id } = useParams();
  const { data: order, isLoading: isOrderLoading } = useGetOrderById(id);
  const [openOrderPage, setOpenOrderPage] = useState(false);

  if (pathName.startsWith(`/profile/orders/${id}`) && openOrderPage === false) {
    setOpenOrderPage(true);
  }

  return (
    <AdaptiveOverlayPage
      isOpen={openOrderPage}
      side="right"
      label="جزئیات سفارش"
      className="size-4"
      fontStyle="text-lg sm:text-2xl font-bold"
      justify="between"
      overflow="overflow-y-auto"
      max={false}
      cart
    >
      <SingleOrderPage order={order} isOrderLoading={isOrderLoading} />
    </AdaptiveOverlayPage>
  );
}
