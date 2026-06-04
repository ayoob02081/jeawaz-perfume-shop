"use client";

import AppImage from "@/components/AppImage";
import { useGetOrders } from "@/hooks/useOrders";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { usePathname, useRouter } from "next/navigation";
import { statusConfig } from "@/constants/orderStatus";
import Loading from "@/components/Loading";

function OrderStatusButton() {
  return (
    <div className="flex items-center justify-start max-lg:p-6 gap-8 snap-x overflow-x-scroll scrollbar-none">
      {statusConfig.map((order) => (
        <Status key={order.id} order={order} />
      ))}
    </div>
  );
}

export default OrderStatusButton;

function Status({ order }) {
  const { data: orders, isLoading, error } = useGetOrders();

  const pathName = usePathname();
  const router = useRouter();

  const ordersByStatus = orders?.filter((o) => o.status === order?.value);
  const statusLength = ordersByStatus ? ordersByStatus.length : 0;

  return (
    <button
      onClick={() => router.replace(`/profile/orders/${order?.label}`)}
      className={`flex items-center justify-start gap-4 max-md:p-6 md:p-4 rounded-2xl max-md:max-w-56 md:max-w-52 w-full h-full max-lg:max-h-20 lg:max-h-28
        ${
          pathName.endsWith(order?.label)
            ? "border-[1.5px] border-primary"
            : "border border-stroke-250"
        } snap-center`}
    >
      <div
        className={`flex items-center justify-center rounded-xl ${order?.color} size-14`}
      >
        <AppImage
          src={order?.src}
          alt={`${order?.label}-icon`}
          width="size-7"
          sizes="20vw"
        />
      </div>
      <span className="flex flex-col items-center justify-start max-md:gap-1 md:gap-2">
        <p className="text-sm text-stroke-600 text-nowrap font-bold">
          {order?.title}
        </p>
        <span className="flex items-center justify-start gap-2 text-stroke-800">
          {isLoading ? (
            <Loading size={4} />
          ) : (
            <p className="text-2xl text-stroke-800">
              {toPersianNumbers(statusLength)}
            </p>
          )}
          <p className="text-stroke-800">سفارش</p>
        </span>
      </span>
    </button>
  );
}
