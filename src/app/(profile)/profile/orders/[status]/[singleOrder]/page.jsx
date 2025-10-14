"use client";

import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";
import ImageFrame from "@/components/ImageFrame";
import PriceSection from "@/components/PriceSection";
import { useGetAllOrdersByStatus } from "@/hooks/useOrders";
import GoBack from "@/ui/GoBack";
import {
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

function SingleOrderPage({ params }) {
  const pathName = usePathname();
  const correctParams = React.use(params);
  const [openOrder, setOpenOrder] = useState(false);

  const { data, isLoading, error } = useGetAllOrdersByStatus(
    correctParams.status
  );

  const correntOrder =
    data?.filter((order) => {
      const filteredOrder = order.id == correctParams.singleOrder;
      return filteredOrder;
    }) || {};

  if (pathName.endsWith(correntOrder[0].id) && openOrder === false) {
    setOpenOrder(true);
  }

  return (
    <AdaptiveOverlayPage
      isOpen={openOrder}
      label="جزئیات سفارش"
      side="right"
      className="size-4"
      fontStyle="text-base font-normal"
      justify="between"
      max="true"
      min="true"
    >
      <Order order={correntOrder[0]} status={correctParams.status} />
    </AdaptiveOverlayPage>
  );
}

export default SingleOrderPage;

function Order({ order, status }) {
  const { id, date, price, items } = order;
  const statusConfig = {
    processing: {
      title: "در حال پردازش",
      color: "text-blue",
      src: "/images/processing-icon.svg",
      alt: "processing-icon",
    },
    delivered: {
      title: "تحویل شده",
      color: "text-green",
      src: "/images/delivered-icon.svg",
      alt: "delivered-icon",
    },
    returned: {
      title: "مرجوع شده",
      color: "text-text",
      src: "/images/returned-icon.svg",
      alt: "returned-icon",
    },
    canceled: {
      title: "لغو شده",
      color: "text-red",
      src: "/images/canceled-icon.svg",
      alt: "canceled-icon",
    },
  };

  return (
    <div className="max-lg:px-4 lg:p-6 flex flex-col items-start justify-start lg:border border-stroke lg:rounded-[20px]">
      <div className="max-lg:hidden">
        <GoBack
          label="جزئیات سفارش"
          side="right"
          className="size-6"
          fontStyle="text-xl font-bold"
          justify="between"
        />
      </div>
      <div className="flex flex-col justify-center items-start w-full max-lg:p-4 max-lg:border-[1.5px] border-stroke max-lg:rounded-[20px]">
        <div className="flex flex-wrap w-full max-md:gap-4 md:gap-6 py-6">
          <span className="flex items-center justify-start gap-1">
            <p className="text-gray-600">تاریخ تحویل سفارش :</p>
            <p className="font-bold">{date}</p>
          </span>
          <span className="flex items-center justify-start gap-1">
            <p className="text-gray-600">کد پیگیری سفارش :</p>
            <p className="font-bold">{toPersianNumbers(id)}</p>
          </span>
        </div>
        <div className="flex w-full flex-wrap py-6 border-t border-stroke-2 max-md:gap-4 md:gap-6">
          <div className="flex max-md:flex-col items-start justify-center max-md:gap-4 md:gap-6">
            <span className="flex items-center justify-start gap-1">
              <p className="text-gray-600">تحویل گیرنده :</p>
              <p className="font-bold">احمد رضایی</p>
            </span>
            <span className="flex items-center justify-start gap-1">
              <p className="text-gray-600">شماره تماس :</p>
              <p className="font-bold">{toPersianNumbers(912345789)}</p>
            </span>
          </div>
          <span className="flex items-center justify-start gap-1">
            <p className="text-gray-600">آدرس ارسال مرسوله :</p>
            <p className="font-bold">
              تهران، خیابان ولیعصر، منطقه ۱۲، بلوار کاوه، کوچه ابوذر، پلاک ۱۵
            </p>
          </span>
        </div>
        <div className="flex w-full flex-wrap py-6 border-t border-stroke-2 max-md:gap-4 md:gap-6">
          <div className="flex max-sm:flex-col items-start justify-center max-md:gap-4 md:gap-6">
            <span className="flex items-center justify-start gap-1">
              <p className="text-gray-600">مبلغ کل :</p>
              <p className="font-bold">
                {toPersianNumbersWithComma(1450000)} تومان
              </p>
            </span>
            <span className="flex items-center justify-start gap-1">
              <p className="text-gray-600">وضعیت پرداخت :</p>
              <div className="flex items-center justify-center gap-1 text-success ">
                <ImageFrame
                  src="/images/success-stroke-icon.svg"
                  alt="success icon"
                  className="size-5"
                />
                <p className="font-bold">موفق</p>
              </div>
            </span>
          </div>
          <span className="flex items-center justify-start gap-1">
            <p className="text-gray-600">هزینه بسته بندی و ارسال :</p>
            <p className="font-bold">
              {toPersianNumbersWithComma(50000)} تومان
            </p>
          </span>
        </div>
        <div className="bg-grey rounded-2xl p-4 md:p-5 w-full">
          <div className="w-full">
            <div className="flex items-start justify-between w-full mb-5">
              <div className="flex flex-wrap items-center justify-start gap-4">
                <div className="flex items-center justify-center gap-2">
                  <ImageFrame
                    src="/images/fast-deliver-icon.svg"
                    alt="deliver icon"
                    className="size-5"
                  />
                  <p className="text-sm md:text-base font-bold">
                    مشخصات مرسوله
                  </p>
                </div>
                <p className="text-gray-600 text-xs">مرسوله 1 از 1</p>
              </div>
              <button className="flex items-center justify-end gap-2 text-nowrap">
                <ImageFrame
                  src="/images/factor-icon.svg"
                  alt="recipt icon"
                  className="size-5"
                />
                <p className="text-sm md:text-base font-bold text-primary">
                  مشاهده فاکتور
                </p>
              </button>
            </div>
            <div className="w-full mb-4">
              <div className="flex flex-wrap max-md:items-start justify-start gap-4 w-full mb-4">
                <span className="flex items-center justify-start gap-1">
                  <p className="text-gray-600">زمان ارسال مرسوله :</p>
                  <p className="font-bold">
                    یکشنبه ، 1403/05/24 ، ساعت 15 تا 18
                  </p>
                </span>
                <div className="flex max-sm:flex-col xl:flex-row items-start justify-center md:justify-start gap-4">
                  <span className="flex items-center justify-start gap-1">
                    <p className="text-gray-600">کد پیگیری سفارش :</p>
                    <p className="font-bold">{toPersianNumbers(id)}</p>
                  </span>
                  <span className="flex items-center justify-start gap-1">
                    <p className="text-gray-600">وضعیت مرسوله :</p>
                    <div
                      className={`flex items-center justify-center gap-1 ${statusConfig[status].color} `}
                    >
                      <ImageFrame
                        src={statusConfig[status].src}
                        alt={statusConfig[status].alt}
                        className="size-5"
                      />
                      <p className="font-bold"> {statusConfig[status].title}</p>
                    </div>
                  </span>
                </div>
              </div>
              <span className="flex items-center justify-start gap-1">
                <p className="text-gray-600">مبلغ مرسوله :</p>
                <p className="font-bold">
                  {toPersianNumbersWithComma(5000000)} تومان
                </p>
              </span>
            </div>
            <div className="w-full flex flex-col justify-center max-lg:gap-4">
              {items?.map((item) => (
                <div
                  className="flex items-center justify-between gap-1 lg:border-t border-[#D1D1D1] max-lg:bg-white p-4 max-lg:rounded-xl"
                  key={item.src}
                >
                  <div className="flex items-center justify-start gap-2 md:gap-4">
                    <div className="flex items-center justify-center max-lg:h-16 lg:size-16 lg:rounded-xl lg:bg-white ">
                      <ImageFrame
                        src={item.src}
                        alt={item.alt}
                        className="max-lg:size-11 lg:size-9"
                      />
                    </div>
                    <div className="flex flex-col items-start justify-center gap-2">
                      <p className="max-md:text-base text-lg font-bold">
                        Tiziana Terenzi
                      </p>
                      <p className="max-md:text-sm text-lg font-bold">
                        شنل اگویست پلاتینیوم
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-start gap-2">
                    <PriceSection price={2000000} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
