"use client";

import { userStatusConfig } from "@/constants/orderStatus";
import { useGetOrders } from "@/hooks/useOrders";
import OrderStatusButton from "@/ui/OrderStatusButton";
import { useState } from "react";

function ProfileInfoLayout({ className, children }) {
  const { data: orders, isLoading, error } = useGetOrders();
  const [status, setStatus] = useState("");
  return (
    <div
      className={`flex flex-col justify-center gap-4 md:gap-6 pb-28 max-lg:px-4 ${className}`}
    >
      <div className="flex items-center justify-start max-lg:p-6 gap-8 snap-x overflow-x-scroll scrollbar-none max-lg:hidden w-full">
        {userStatusConfig?.map((s) => (
          <OrderStatusButton
            user
            key={s.id}
            statusBtnData={s}
            orders={orders}
            isLoading={isLoading}
            setStatus={setStatus}
            currentStatus={status}
            href={"/profile/orders"}
            redirect={true}
          />
        ))}
      </div>
      {children}
    </div>
  );
}

export default ProfileInfoLayout;
