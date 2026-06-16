"use client";

import Error from "@/components/Error";
import Loading from "@/components/Loading";
import { Order } from "@/components/SingleOrderPage";
import { adminStatusConfig } from "@/constants/orderStatus";
import { useGetAdminOrders, useGetOrderById } from "@/hooks/useOrders";
import React from "react";

function page({ params }) {
  const correctParams = React.use(params);
  const {
    data: order,
    isLoading,
    error,
  } = useGetOrderById(correctParams?.purchaseId);
  const { data: orders } = useGetAdminOrders({
    userId: correctParams?.id,
    status: order?.status,
  });
  const numOfOrder = orders?.data?.findIndex((o) => o.id === order?.id);
  const currentStatus = adminStatusConfig?.find((s) => s.value === order?.status);

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-500 mx-6">
        <Loading />
      </div>
    );

  if (error)
    return (
      <div className="text-center text-red-600 mx-6">
        <Error />
      </div>
    );

  return (
    <Order
      order={order}
      orders={orders?.data}
      numOfOrder={numOfOrder}
      currentStatus={currentStatus}
    />
  );
}

export default page;
