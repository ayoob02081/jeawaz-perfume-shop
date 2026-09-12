"use client";

import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";
import SingleOrderPage from "@/components/SingleOrderPage";
import { useGetAdminOrderById } from "@/hooks/useOrders";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";

export default function page() {
  const pathName = usePathname();
  const { id } = useParams();
  const { data: order, isLoading: isOrderLoading } = useGetAdminOrderById(id);
  const [openOrderPage, setOpenOrderPage] = useState(false);

  if (pathName.startsWith(`/admin/orders/${id}`) && openOrderPage === false) {
    setOpenOrderPage(true);
  }

  return (
    <AdaptiveOverlayPage
      isOpen={openOrderPage}
      side="right"
      label="جزئیات سفارش"
      className="size-5.5"
      fontStyle="text-lg sm:text-2xl font-bold"
      justify="between"
      overflow="overflow-y-auto"
      max={false}
      cart
    >
      <SingleOrderPage order={order} isOrderLoading={isOrderLoading} admin />
    </AdaptiveOverlayPage>
  );
}
