"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import { toPersianNumbersWithComma } from "@/utils/toPersianNumbers";

function OrderStatusButton({
  orders,
  isLoading,
  setStatus,
  currentStatus,
  href,
  redirect = false,
  statusBtnData,
}) {
  const router = useRouter();

  const statusLength = useMemo(() => {
    if (!orders) return 0;

    if (statusBtnData?.value) {
      return orders?.statusCounts?.[statusBtnData.value] ?? 0;
    }
    if (!statusBtnData.value) {
      return orders?.statusCounts?.ALL ?? 0;
    }

    return orders?.meta?.total ?? 0;
  }, [orders, statusBtnData?.value]);

  const Icon = statusBtnData?.icon;

  const handleClick = useCallback(() => {
    if (isLoading) return;

    if (!redirect) {
      setStatus?.(statusBtnData?.value);
    } else if (href) {
      router.push(href);
    }
  }, [isLoading, redirect, href, router, setStatus, statusBtnData?.value]);

  const isActive = statusBtnData?.value === currentStatus;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`flex max-sm:flex-col items-center justify-start max-sm:gap-2 gap-4 
        max-md:p-2 md:p-4 rounded-2xl max-sm:min-w-28 max-md:max-w-56 md:max-w-52 w-full h-full 
        max-lg:max-h- lg:max-h-28 transition-all duration-200 bg-stroke-0 shadow-sm
        ${isActive ? "border-[1.5px] border-primary" : "border border-stroke-250"}
        ${isLoading ? "opacity-70 cursor-not-allowed" : "hover:shadow-md"}
        snap-center`}
    >
      {/* Icon Box */}
      <div
        className={`flex items-center justify-center rounded-xl ${statusBtnData?.color} size-14`}
      >
        {Icon && <Icon className={`size-7 ${statusBtnData?.textColor}`} />}
      </div>

      {/* Content */}
      <span className="flex flex-col max-sm:items-center items-start max-md:gap-1 md:gap-2">
        <p className="text-sm text-stroke-600 text-nowrap font-bold">
          {statusBtnData?.title}
        </p>

        {isLoading ? (
          <Loading size={7} className="h-fit" />
        ) : (
          <span className="flex items-center gap-2 text-stroke-800">
            <p className="text-2xl max-sm:text-xl text-stroke-800">
              {statusLength >= 9999
                ? toPersianNumbersWithComma(9999) + "+"
                : toPersianNumbersWithComma(statusLength)}
            </p>
            <p className="max-sm:text-sm">سفارش</p>
          </span>
        )}
      </span>
    </button>
  );
}

export default OrderStatusButton;
