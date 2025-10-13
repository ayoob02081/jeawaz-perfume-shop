"use client";

import ImageFrame from "@/components/ImageFrame";
import PriceSection from "@/components/PriceSection";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

const statusConfig = {
  processing: {
    title: "در حال پردازش",
    color: "bg-blue/10 text-blue",
    src: "/images/processing-icon.svg",
    alt: "processing-icon",
  },
  delivered: {
    title: "تحویل شده",
    color: "bg-green/10 text-green",
    src: "/images/delivered-icon.svg",
    alt: "delivered-icon",
  },
  returned: {
    title: "مرجوعی",
    color: "bg-text/10 text-text",
    src: "/images/returned-icon.svg",
    alt: "returned-icon",
  },
  canceled: {
    title: "لغو شده",
    color: "bg-red/10 text-red",
    src: "/images/canceled-icon.svg",
    alt: "canceled-icon",
  },
};

async function fetchOrders(status) {
  // شبیه‌سازی API call
  await new Promise((r) => setTimeout(r, 800));

  return [
    {
      id: "123445",
      date: "1404/07/15",
      price: 1250000,
      items: [
        { src: "/images/perfume-1.svg", alt: "perfume image" },
        { src: "/images/perfume-2.svg", alt: "perfume image" },
        { src: "/images/perfume-3.svg", alt: "perfume image" },
      ],
    },
    {
      id: "123446",
      date: "1404/07/16",
      price: 1000000,
      items: [
        { src: "/images/perfume-1.svg", alt: "perfume image" },
        { src: "/images/perfume-2.svg", alt: "perfume image" },
        { src: "/images/perfume-3.svg", alt: "perfume image" },
      ],
    },
    {
      id: "123447",
      date: "1404/07/18",
      price: 1100000,
      items: [
        { src: "/images/perfume-1.svg", alt: "perfume image" },
        { src: "/images/perfume-2.svg", alt: "perfume image" },
        { src: "/images/perfume-3.svg", alt: "perfume image" },
      ],
    },
    {
      id: "123448",
      date: "1404/07/22",
      price: 1000000,
      items: [
        { src: "/images/perfume-1.svg", alt: "perfume image" },
        { src: "/images/perfume-2.svg", alt: "perfume image" },
        { src: "/images/perfume-3.svg", alt: "perfume image" },
      ],
    },
    {
      id: "123449",
      date: "1404/07/22",
      price: 1000000,
      items: [
        { src: "/images/perfume-1.svg", alt: "perfume image" },
        { src: "/images/perfume-2.svg", alt: "perfume image" },
        { src: "/images/perfume-3.svg", alt: "perfume image" },
      ],
    },
    {
      id: "123450",
      date: "1404/07/22",
      price: 1000000,
      items: [
        { src: "/images/perfume-1.svg", alt: "perfume image" },
        { src: "/images/perfume-2.svg", alt: "perfume image" },
        { src: "/images/perfume-3.svg", alt: "perfume image" },
      ],
    },
    {
      id: "123451",
      date: "1404/07/22",
      price: 1000000,
      items: [
        { src: "/images/perfume-1.svg", alt: "perfume image" },
        { src: "/images/perfume-2.svg", alt: "perfume image" },
        { src: "/images/perfume-3.svg", alt: "perfume image" },
      ],
    },
  ];
}

export default function OrderStatusPage({ status }) {
  const { title, color, src, alt } = statusConfig[status.status] || {};

  const { data, isLoading, error } = useQuery({
    queryKey: ["orders", status.status],
    queryFn: () => fetchOrders(status.status),
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-500 mx-6">
        در حال بارگذاری...
      </div>
    );

  if (error)
    return (
      <div className="text-center text-red-600 mx-6">
        خطا در دریافت اطلاعات.
      </div>
    );

  return (
    <div
      className={`flex flex-col items-center justify-center lg:rounded-xl lg:ml-6 lg:gap-6 `}
    >
      {data ? (
        data.map((order) => (
          <StatusOrderCard
            order={order}
            title={title}
            color={color}
            src={src}
            alt={alt}
            key={order.id}
          />
        ))
      ) : (
        <div>no data</div>
      )}
    </div>
  );
}

function StatusOrderCard({ order, title, color, src, alt }) {
  const pathName = usePathname();
  const router = useRouter();

  return (
    <div className="flex flex-col justify-between gap-6 w-full max-lg:border-t border-text/10 p-6 lg:border lg:rounded-2xl">
      <div
        className={`flex items-center justify-center gap-1 h-11 w-36 rounded-[40px] ${color}`}
      >
        <ImageFrame src={src} alt={alt} className="size-7" />
        <p className="text-xs font-bold">{title}</p>
      </div>
      <div className="flex max-sm:flex-col sm:flex-row sm:items-end justify-between w-full">
        <div className="flex max-md:flex-col items-start justify-center max-md:gap-2 md:gap-6">
          <span className="flex items-center justify-start gap-1">
            <p className="text-gray-600">تاریخ تحویل سفارش :</p>
            <p className="font-bold">{order.date}</p>
          </span>
          <span className="flex items-center justify-start gap-1">
            <p className="text-gray-600">کد سفارش :</p>
            <p className="font-bold">{toPersianNumbers(order.id)}</p>
          </span>
        </div>
        <div className="max-sm:w-full flex items-center max-sm:justify-end  sm:justify-center">
          <PriceSection
            price={order.price}
            priceClassName="text-2xl"
            textClassName="text-[10px]"
          />
        </div>
      </div>
      <button
        onClick={() => router.push(pathName + "/" + order.id)}
        className="flex items-center justify-between p-6 bg-grey rounded-2xl h-28"
      >
        <div className=" flex items-center justify-start *:not-first:-mr-8">
          {order.items.map((item) => (
            <div
              className="flex items-center justify-center bg-white border-6 border-grey size-20 rounded-xl z-10"
              key={item.src}
            >
              <ImageFrame src={item.src} alt={item.alt} className="size-10 " />
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
