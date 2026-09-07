"use client";

import Error from "@/components/Error";
import Loading from "@/components/Loading";
import { StatusOrderCard } from "@/app/(profile)/profile/orders/_components/OrderStatusPage";
import { adminStatusConfig } from "@/constants/orderStatus";
import { useGetOrdersByUserId } from "@/hooks/useOrders";
import React from "react";

function page({ params }) {
  const correctParams = React.use(params);

  const {
    data: orders,
    isLoading,
    error,
  } = useGetOrdersByUserId({ userId: correctParams?.id });

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
    <div className="flex flex-col items-center justify-center lg:rounded-xl lg:gap-6 w-full px-6">
      {orders?.data?.map((order) => {
        const currentStatus = adminStatusConfig?.find(
          (s) => s.value === order?.status,
        );

        return (
          <StatusOrderCard
            key={order.id}
            id={order.id}
            date={order.orderDate}
            orderItems={order.items}
            orderNumber={order.orderNumber}
            shipping={order.shipping}
            pricing={order.pricing}
            status={order.status}
            currentStatusData={currentStatus}
          />
        );
      })}
    </div>
  );
}

export default page;
