"use client";

import Error from "@/components/Error";
import AppImage from "@/components/AppImage";
import Loading from "@/components/Loading";
import PriceSection from "@/components/PriceSection";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { statusConfig } from "@/constants/orderStatus";
import { useGetOrders } from "@/hooks/useOrders";
import { toLocalDateString } from "@/utils/toLocalDate";

export default function OrderStatusPage({ status }) {
  const { data: orders, isLoading, error } = useGetOrders();
  const currentStatus = statusConfig?.find((s) => s.label === status);
  const ordersByStatus = orders?.filter(
    (o) => o.status === currentStatus?.value,
  );

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
    <div
      className={`flex flex-col items-center justify-center lg:rounded-xl lg:gap-6 `}
    >
      {ordersByStatus?.length === 0 || undefined || null
        ? "سفارشی یافت نشد"
        : ordersByStatus?.map((order) => (
            <StatusOrderCard
              key={order.id}
              id={order.id}
              date={order.orderDate}
              orderItems={order.items}
              orderNumber={order.orderNumber}
              shipping={order.shipping}
              pricing={order.pricing}
              status={order.status}
              currentStatus={currentStatus}
            />
          ))}
    </div>
  );
}

function StatusOrderCard({
  id,
  date,
  orderItems,
  orderNumber,
  shipping,
  pricing,
  status,
  currentStatus,
}) {
  const pathName = usePathname();
  const router = useRouter();
  const { title, label, color, src, des } = currentStatus || {};

  return (
    <div className="flex flex-col justify-between gap-6 w-full max-lg:border-t border-stroke-800/20 dark:border-stroke-800/40 p-6 lg:border lg:rounded-2xl">
      <div
        className={`flex items-center justify-start gap-1 h-11 w-fit px-2 rounded-5xl ${color}`}
      >
        <AppImage src={src} alt={`${label}-icon`} width="size-7" sizes="10vw" />
        <p className="text-xs font-bold text-stroke-800">{title}</p>
      </div>
      <div className="flex max-sm:flex-col sm:flex-row sm:items-end justify-between w-full">
        <div className="flex max-md:flex-col items-start justify-center max-md:gap-2 md:gap-6">
          <span className="flex items-center justify-start gap-1">
            <p className="text-stroke-600">{des}</p>
            <p className="font-bold text-stroke-800">
              {toLocalDateString(date)}
            </p>
          </span>
          <span className="flex items-center justify-start gap-1">
            <p className="text-stroke-600">کد سفارش :</p>
            <p className="font-bold text-stroke-800">
              {toPersianNumbers(orderNumber)}
            </p>
          </span>
        </div>
        <div className="max-sm:w-full flex items-center max-sm:justify-end  sm:justify-center">
          <PriceSection
            basePrice={pricing.payable}
            priceClassName="text-2xl"
            textClassName="text-[10px]"
          />
        </div>
      </div>
      <button
        onClick={() => router.push(pathName + "/" + id)}
        className="flex items-center justify-between p-6 bg-stroke-100 dark:bg-stroke-50 rounded-2xl h-28"
      >
        <div className=" flex items-center justify-start *:not-first:-mr-8">
          {orderItems?.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-center bg-stroke-0 border-6 border-stroke-100 dark:border-stroke-50 size-20 rounded-xl z-10"
            >
              <AppImage
                src={item.imageUrl}
                alt={`${item.enTitle}-icon`}
                className="size-10 "
              />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-primary">
          <p className="text-sm font-bold">جزئیات سفارش</p>
          <ArrowLeftIcon className="size-4" />
        </div>
      </button>
    </div>
  );
}
