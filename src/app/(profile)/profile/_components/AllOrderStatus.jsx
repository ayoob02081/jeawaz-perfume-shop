"use client";

import ImageFrame from "@/components/ImageFrame";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { usePathname, useRouter } from "next/navigation";

function AllOrderStatus() {
  return (
    <div className="flex items-center justify-between max-lg:p-6 lg:pl-6 gap-8 w-full snap-x overflow-x-scroll scrollbar-none">
      <Status type="processing" />
      <Status type="delivered" />
      <Status type="returned" />
      <Status type="canceled" />
    </div>
  );
}

export default AllOrderStatus;

function Status({ count, type }) {
  const pathName = usePathname();
  const router = useRouter();

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

  return (
    <button
      onClick={() => router.replace(`/profile/orders/${type}`)}
      className={`flex items-center justify-start gap-4 max-md:p-6 md:p-4 rounded-2xl max-md:max-w-56 md:max-w-52 w-full h-full max-lg:max-h-20 lg:max-h-28
        ${
          pathName.endsWith(type)
            ? "border-[1.5px] border-primary"
            : "border border-stroke-2"
        } snap-center`}
    >
      <div
        className={`flex items-center justify-center rounded-xl ${statusConfig[type].color} size-14`}
      >
        <ImageFrame
          src={statusConfig[type].src}
          alt={statusConfig[type].alt}
          className="size-7"
        />
      </div>
      <span className="flex flex-col items-center justify-start max-md:gap-1 md:gap-2">
        <p className="text-sm text-text-secondary text-nowrap">
          {statusConfig[type].title}
        </p>
        <span className="flex items-center justify-start gap-2">
          <p className="text-2xl">{toPersianNumbers(3)}</p>
          <p>سفارش</p>
        </span>
      </span>
    </button>
  );
}
