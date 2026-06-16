"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import { toPersianNumbers } from "@/utils/toPersianNumbers";

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
      className={`flex items-center justify-start gap-4 
        max-md:p-6 md:p-4 rounded-2xl 
        max-md:max-w-56 md:max-w-52 w-full h-full 
        max-lg:max-h-20 lg:max-h-28
        transition-all duration-200
        ${isActive ? "border-[1.5px] border-primary" : "border border-stroke-250"}
        ${isLoading ? "opacity-70 cursor-not-allowed" : "hover:shadow-sm"}
        snap-center`}
    >
      {/* Icon Box */}
      <div
        className={`flex items-center justify-center rounded-xl ${statusBtnData?.color} size-14`}
      >
        {Icon && <Icon className={`size-7 ${statusBtnData?.textColor}`} />}
      </div>

      {/* Content */}
      <span className="flex flex-col items-start max-md:gap-1 md:gap-2">
        <p className="text-sm text-stroke-600 text-nowrap font-bold">
          {statusBtnData?.title}
        </p>

        <span className="flex items-center gap-2 text-stroke-800">
          {isLoading ? (
            <Loading size={4} />
          ) : (
            <p className="text-2xl  text-stroke-800">
              {toPersianNumbers(statusLength)}
            </p>
          )}
          <p>سفارش</p>
        </span>
      </span>
    </button>
  );
}

export default OrderStatusButton;
