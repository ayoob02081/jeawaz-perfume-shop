"use client";

import SingleOrderPage from "@/components/SingleOrderPage";
import { useGetOrderById } from "@/hooks/useOrders";
import { useParams } from "next/navigation";
import React from "react";

export default function page() {
  const { id } = useParams();
  const { data: order, isLoading: isOrderLoading } = useGetOrderById(id);
  return <SingleOrderPage order={order} isOrderLoading={isOrderLoading} />;
}
