"use client";

import ImageFrame from "@/components/ImageFrame";
import { useGetAllOrdersByStatus } from "@/hooks/useOrders";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";

// async function fetchOrders(status) {
//   // شبیه‌سازی API call
//   await new Promise((r) => setTimeout(r, 300));

//   return [
//     {
//       id: "123445",
//       date: "1404/07/15",
//       price: 1250000,
//       items: [
//         { src: "/images/perfume-1.svg", alt: "perfume image" },
//         { src: "/images/perfume-2.svg", alt: "perfume image" },
//         { src: "/images/perfume-3.svg", alt: "perfume image" },
//       ],
//     },
//     {
//       id: "123446",
//       date: "1404/07/16",
//       price: 1000000,
//       items: [
//         { src: "/images/perfume-1.svg", alt: "perfume image" },
//         { src: "/images/perfume-2.svg", alt: "perfume image" },
//         { src: "/images/perfume-3.svg", alt: "perfume image" },
//       ],
//     },
//     {
//       id: "123447",
//       date: "1404/07/18",
//       price: 1100000,
//       items: [
//         { src: "/images/perfume-1.svg", alt: "perfume image" },
//         { src: "/images/perfume-2.svg", alt: "perfume image" },
//         { src: "/images/perfume-3.svg", alt: "perfume image" },
//       ],
//     },
//     {
//       id: "123448",
//       date: "1404/07/22",
//       price: 1000000,
//       items: [
//         { src: "/images/perfume-1.svg", alt: "perfume image" },
//         { src: "/images/perfume-2.svg", alt: "perfume image" },
//         { src: "/images/perfume-3.svg", alt: "perfume image" },
//       ],
//     },
//     {
//       id: "123449",
//       date: "1404/07/22",
//       price: 1000000,
//       items: [
//         { src: "/images/perfume-1.svg", alt: "perfume image" },
//         { src: "/images/perfume-2.svg", alt: "perfume image" },
//         { src: "/images/perfume-3.svg", alt: "perfume image" },
//       ],
//     },
//     {
//       id: "123450",
//       date: "1404/07/22",
//       price: 1000000,
//       items: [
//         { src: "/images/perfume-1.svg", alt: "perfume image" },
//         { src: "/images/perfume-2.svg", alt: "perfume image" },
//         { src: "/images/perfume-3.svg", alt: "perfume image" },
//       ],
//     },
//     {
//       id: "123451",
//       date: "1404/07/22",
//       price: 1000000,
//       items: [
//         { src: "/images/perfume-1.svg", alt: "perfume image" },
//         { src: "/images/perfume-2.svg", alt: "perfume image" },
//         { src: "/images/perfume-3.svg", alt: "perfume image" },
//       ],
//     },
//   ];
// }

function AllOrderStatus() {
  return (
    <div className="flex items-center justify-between max-lg:p-6 lg:pl-6 gap-8 w-full snap-x overflow-x-scroll scrollbar-none">
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
      onClick={() => router.replace(`/profile/orders/${status}`)}
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
