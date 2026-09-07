"use client";

import Error from "@/components/Error";
import Loading from "@/components/Loading";
import SingleOrderPage from "@/components/SingleOrderPage";
import { useGetAdminOrderById } from "@/hooks/useOrders";
import React from "react";

function page({ params }) {
  const correctParams = React.use(params);
  const {
    data: order,
    isLoading,
    error,
  } = useGetAdminOrderById(correctParams?.purchaseId);

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
    <SingleOrderPage order={order} isOrderLoading={isLoading} admin={true} />
  );
}

export default page;
