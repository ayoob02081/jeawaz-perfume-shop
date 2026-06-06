"use client";

import { Address } from "@/app/(profile)/profile/_components/AddressLayout";
import Error from "@/components/Error";
import Loading from "@/components/Loading";
import { useGetAddressesByUserId } from "@/hooks/useAddress";
import React from "react";

function page({ params }) {
  const correctParams = React.use(params);
  const {
    data: addresses,
    isLoading,
    error,
  } = useGetAddressesByUserId(correctParams?.id);

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

  return <div className="flex flex-col items-center justify-center gap-6 max-lg:px-6">

  {addresses?.map((item) => (
    <Address
      key={item.id}
      label={item.label}
      fullName={item.fullName}
      ostan={item.ostan}
      shahr={item.shahr}
      phoneNumber={item.phoneNumber}
      postalCode={item.postalCode}
      addressLine={item.addressLine}
    />
  ))}
  </div>
}

export default page;
