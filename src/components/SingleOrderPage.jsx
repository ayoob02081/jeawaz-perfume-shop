"use client";

import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";
import AppImage from "@/components/AppImage";
import Loading from "@/components/Loading";
import PriceSection from "@/components/PriceSection";
import { statusConfig } from "@/constants/orderStatus";
import { useGetOrderById, useGetOrders } from "@/hooks/useOrders";
import GoBack from "@/ui/GoBack";
import { toLocalDateString } from "@/utils/toLocalDate";
import {
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

function SingleOrderPage({ correctParams }) {
  const pathName = usePathname();
  const [openOrder, setOpenOrder] = useState(false);
  const { data: orders, isLoading: isOrdersLoading } = useGetOrders();
  const { data: order, isLoading: isOrderLoading } = useGetOrderById(
    correctParams?.singleOrder,
  );

  const filterOrdersByStatus = orders?.filter(
    (o) => o.status === correctParams?.status,
  );

  if (isOrdersLoading || isOrderLoading) return <Loading />;

  if (pathName.endsWith(order?.id) && openOrder === false) {
    setOpenOrder(true);
  }

  const numOfOrder = orders?.findIndex((o) => o.id === order?.id);
  const currentStatus = statusConfig?.find(
    (s) => s.label === correctParams.status,
  );

  return (
    <AdaptiveOverlayPage
      isOpen={openOrder}
      label="جزئیات سفارش"
      side="right"
      className="size-4"
      fontStyle="text-base font-normal"
      justify="between"
      overflow="overflow-y-auto"
      max="true"
      min="true"
    >
      <Order
        order={order}
        orders={filterOrdersByStatus}
        numOfOrder={numOfOrder}
        currentStatus={currentStatus}
      />
    </AdaptiveOverlayPage>
  );
}

export default SingleOrderPage;

export function Order({ order, orders, numOfOrder, currentStatus }) {
  const { title, label, textColor, src, des } = currentStatus || {};

  const { id, orderNumber, items, orderDate, pricing, shipping } = order || {};

  return (
    <div className="max-lg:px-4 lg:p-6 flex flex-col items-start justify-start lg:border border-stroke-200 lg:rounded-2.5xl">
      <div className="max-lg:hidden">
        <GoBack
          label="جزئیات سفارش"
          side="right"
          className="size-6 text-stroke-800"
          fontStyle="text-xl font-bold"
          justify="between"
        />
      </div>

      {/* Order Details */}
      <div className="flex flex-col justify-center items-start w-full max-lg:p-4 max-lg:border-[1.5px] border-stroke-200 max-lg:rounded-2.5xl">
        <div className="flex flex-wrap w-full max-md:gap-4 md:gap-6 py-6">
          <span className="flex items-center justify-start gap-1">
            <p className="text-stroke-600">{des}</p>
            <p className="font-bold text-stroke-800">
              {toLocalDateString(orderDate)}
            </p>
          </span>
          <span className="flex items-center justify-start gap-1">
            <p className="text-stroke-600">کد پیگیری سفارش :</p>
            <p className="font-bold text-stroke-800">
              {toPersianNumbers(orderNumber)}
            </p>
          </span>
        </div>
        <div className="flex w-full flex-wrap py-6 border-t border-stroke-250 max-md:gap-4 md:gap-6">
          <div className="flex max-md:flex-col items-start justify-center max-md:gap-4 md:gap-6">
            <span className="flex items-center justify-start gap-1">
              <p className="text-stroke-600">تحویل گیرنده :</p>
              <p className="font-bold text-stroke-800">{shipping?.receiver}</p>
            </span>
            <span className="flex items-center justify-start gap-1">
              <p className="text-stroke-600">شماره تماس :</p>
              <p className="font-bold text-stroke-800">
                {toPersianNumbers(shipping?.phone)}
              </p>
            </span>
          </div>
          <span className="flex items-center justify-start gap-1">
            <p className="text-stroke-600">آدرس ارسال مرسوله :</p>
            <p className="font-bold text-stroke-800">{shipping?.address}</p>
          </span>
        </div>
        <div className="flex w-full flex-wrap py-6 border-t border-stroke-250 max-md:gap-4 md:gap-6">
          <div className="flex max-sm:flex-col items-start justify-center max-md:gap-4 md:gap-6">
            <span className="flex items-center justify-start gap-1">
              <p className="text-stroke-600">مبلغ کل :</p>
              <p className="font-bold text-stroke-800">
                {toPersianNumbersWithComma(pricing.subtotal + pricing.shipping)}{" "}
                تومان
              </p>
            </span>
            <span className="flex items-center justify-start gap-1">
              <p className="text-stroke-600">وضعیت پرداخت :</p>
              <div className="flex items-center justify-center gap-1 text-success ">
                <AppImage
                  src="/images/success-stroke-icon.svg"
                  alt="success icon"
                  width="size-5"
                  sizes="10vw"
                />
                <p className="font-bold text-stroke-800">موفق</p>
              </div>
            </span>
          </div>
          <span className="flex items-center justify-start gap-1">
            <p className="text-stroke-600">هزینه بسته بندی و ارسال :</p>
            <p className="font-bold text-stroke-800">
              {toPersianNumbersWithComma(pricing.shipping)} تومان
            </p>
          </span>
        </div>

        {/* Factor */}
        <div className="bg-stroke-100 dark:bg-stroke-50 rounded-2xl p-4 md:p-5 w-full">
          <div className="w-full">
            <div className="flex items-start justify-between w-full mb-5">
              <div className="flex flex-wrap items-center justify-start gap-4">
                <div className="flex items-center justify-center gap-2">
                  <AppImage
                    src="/images/fast-deliver-icon.svg"
                    alt="deliver icon"
                    width="size-5"
                    sizes="10vw"
                    className="dark:invert"
                  />
                  <p className="text-sm md:text-base font-bold text-stroke-800">
                    مشخصات مرسوله
                  </p>
                </div>
                <p className="text-stroke-600 text-xs">
                  مرسوله {toPersianNumbers(numOfOrder + 1)} از{" "}
                  {toPersianNumbers(orders?.length)}
                </p>
              </div>
              <button className="flex items-center justify-end gap-2 text-nowrap">
                <AppImage
                  src="/images/factor-icon.svg"
                  alt="recipt icon"
                  width="size-5"
                  sizes="10vw"
                />
                <p className="text-sm md:text-base font-bold text-primary">
                  مشاهده فاکتور
                </p>
              </button>
            </div>
            <div className="w-full mb-4">
              <div className="flex flex-wrap max-md:items-start justify-start gap-4 w-full mb-4">
                <span className="flex items-center justify-start gap-1">
                  <p className="text-stroke-600">زمان ارسال مرسوله :</p>
                  <p className="font-bold text-stroke-800">۱ روز کاری</p>
                </span>
                <span className="flex items-center justify-start gap-1">
                  <p className="text-stroke-600">کد پیگیری سفارش :</p>
                  <p className="font-bold text-stroke-800">
                    {toPersianNumbers(orderNumber)}
                  </p>
                </span>
                <span className="flex items-center justify-start gap-1">
                  <p className="text-stroke-600">وضعیت مرسوله :</p>
                  <div
                    className={`flex items-center justify-center gap-1 ${textColor} `}
                  >
                    <AppImage
                      src={src}
                      alt={`${label}-icon`}
                      width="size-5"
                      sizes="10vw"
                    />
                    <p className="font-bold ">{title}</p>
                  </div>
                </span>
                <span className="flex items-center justify-start gap-1">
                  <p className="text-stroke-600">کد رهگیری مرسوله :</p>
                  <p className="font-bold text-stroke-800">
                    کد رهگیری مرسوله پس از ارسال به شماره{" "}
                    {toPersianNumbers(shipping?.phone)} پیامک میشود
                  </p>
                </span>
              </div>
              {/* </div> */}
              <span className="flex items-center justify-start gap-1">
                <p className="text-stroke-600">مبلغ مرسوله :</p>
                <p className="font-bold text-stroke-800">
                  {toPersianNumbersWithComma(pricing.subtotal)} تومان
                </p>
              </span>
            </div>
            <div className="w-full flex flex-col justify-center max-lg:gap-4">
              {items?.map((item) => (
                <div
                  className="flex items-center justify-between gap-1 lg:border-t border-stroke-200 max-lg:bg-stroke-0 p-4 max-lg:rounded-xl"
                  key={item.id}
                >
                  <div className="flex items-center justify-start gap-2 md:gap-4">
                    <div className="flex items-center justify-center max-lg:h-16 lg:size-16 lg:rounded-xl lg:bg-stroke-0 ">
                      <AppImage
                        src={item.imageUrl}
                        alt={`${item.title}-image`}
                        width="max-lg:size-11 lg:size-9"
                        sizes="30vw"
                      />
                    </div>
                    <div className="flex flex-col items-start justify-center gap-2">
                      <p className="max-md:text-base text-lg font-bold text-stroke-800">
                        {item.enTitle}
                      </p>
                      <p className="max-md:text-sm text-lg font-bold text-stroke-800">
                        {item.perTitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-start gap-2">
                    <PriceSection
                      basePrice={item.price}
                      priceClassName="text-2xl"
                      textClassName="text-[10px]"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center flex-wrap justify-start p-6 max-md:mt-6 bg-warning/20 dark:bg-stroke-900 rounded-xl text-start text-stroke-800">
              در صورت عدم دریافت پیامک کد رهگیری مرسوله، لطفا به شماره{" "}
              {
                <Link
                  className="px-1 text-primary font-bold"
                  href="tel:+989302125151"
                >
                  ۰۹۳۰۲۱۲۵۱۵۱
                </Link>
              }
              در واتساپ یا روبیکا پیام دهید.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
