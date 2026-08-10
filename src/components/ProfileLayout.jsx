"use client";

import { userStatusConfig } from "@/constants/orderStatus";
import { useGetOrders } from "@/hooks/useOrders";
import OrderStatusButton from "@/ui/OrderStatusButton";
import { useState } from "react";

function ProfileLayout({ className, children }) {
  const { data: orders, isLoading, error } = useGetOrders();
  const [status, setStatus] = useState("");
  return (
    <div className="size-full px-4">
    <div
      className="flex flex-col justify-center gap-4 md:gap-6 px-4 w-full overflow-y-auto py-6 rounded-3xl bg-stroke-100 border border-stroke-200 shadow-xl"
    >
      <div className="flex items-center justify-start gap-8 snap-x overflow-x-scroll scrollbar-none w-full rounded-2xl px-px">
        {userStatusConfig?.map((s) => (
          <OrderStatusButton
            user
            key={s.id}
            statusBtnData={s}
            orders={orders}
            isLoading={isLoading}
            setStatus={setStatus}
            currentStatus={status}
            href={`/profile/orders?status=${s.value}&page=1`}
            redirect={true}
          />
        ))}
      </div>
      {children}
    </div>
    </div>
  );
}

export default ProfileLayout;
