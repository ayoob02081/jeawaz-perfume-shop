"use client";

import ImageFrame from "@/components/ImageFrame";
import { useGetAllOrdersByStatus } from "@/hooks/useOrders";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { usePathname, useRouter } from "next/navigation";

function AllOrderStatus() {
  return (
    <div className="flex items-center justify-between max-lg:p-6 gap-8 snap-x overflow-x-scroll scrollbar-none">
      <Status status="processing" />
      <Status status="delivered" />
      <Status status="returned" />
      <Status status="canceled" />
    </div>
  );
}

export default AllOrderStatus;

function Status({ count, status }) {
  const pathName = usePathname();
  const router = useRouter();
  const { data, isLoading, error } = useGetAllOrdersByStatus(status);

  const statusConfig = {
    processing: {
      title: "در حال پردازش",
      color: "bg-blue/15",
      src: "/images/processing-icon.svg",
      alt: "processing-icon",
    },
    delivered: {
      title: "تحویل شده",
      color: "bg-green/10",
      src: "/images/delivered-icon.svg",
      alt: "delivered-icon",
    },
    returned: {
      title: "مرجوعی",
      color: "bg-text/10",
      src: "/images/returned-icon.svg",
      alt: "returned-icon",
    },
    canceled: {
      title: "لغو شده",
      color: "bg-red/10",
      src: "/images/canceled-icon.svg",
      alt: "canceled-icon",
    },
  };

  const allOrdersLength = (data && data.length) || (!data && 0);

  return (
    <button
      onClick={() =>
        router.replace(
          `/${
            (pathName.startsWith("/profile") && "profile") ||
            (pathName.startsWith("/admin") && "admin")
          }/orders/${status}`
        )
      }
      className={`flex items-center justify-start gap-4 max-md:p-6 md:p-4 rounded-2xl max-md:max-w-56 md:max-w-52 w-full h-full max-lg:max-h-20 lg:max-h-28
        ${
          pathName.endsWith(status)
            ? "border-[1.5px] border-primary"
            : "border border-stroke-2"
        } snap-center`}
    >
      <div
        className={`flex items-center justify-center rounded-xl ${statusConfig[status].color} size-14`}
      >
        <ImageFrame
          src={statusConfig[status].src}
          alt={statusConfig[status].alt}
          className="size-7"
        />
      </div>
      <span className="flex flex-col items-center justify-start max-md:gap-1 md:gap-2">
        <p className="text-sm text-text-secondary text-nowrap font-bold">
          {statusConfig[status].title}
        </p>
        <span className="flex items-center justify-start gap-2">
          <p className="text-2xl">{toPersianNumbers(allOrdersLength)}</p>
          <p>سفارش</p>
        </span>
      </span>
    </button>
  );
}
