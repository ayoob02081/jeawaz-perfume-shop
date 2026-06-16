"use client";

import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";
import AppImage from "@/components/AppImage";
import Loading from "@/components/Loading";
import PriceSection from "@/components/PriceSection";
import {
  adminStatusConfig,
  renderUserStatuses,
  userStatusConfig,
} from "@/constants/orderStatus";
import GoBack from "@/ui/GoBack";
import { toLocalDateString } from "@/utils/toLocalDate";
import {
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

function SingleOrderPage({ order, isOrderLoading, admin }) {
  const pathName = usePathname();
  const [openOrder, setOpenOrder] = useState(false);

  if (isOrderLoading) return <Loading />;

  if (pathName.endsWith(order?.id) && openOrder === false) {
    setOpenOrder(true);
  }

  const currentStatus = admin
    ? adminStatusConfig?.find((s) => s.value === order?.status)
    : userStatusConfig.find(
        (s) => s.value === renderUserStatuses(order?.status),
      );

  return (
    <AdaptiveOverlayPage
      isOpen={openOrder}
      label="جزئیات سفارش"
      side="right"
      className="size-4"
      fontStyle="text-base font-bold"
      justify="between"
      overflow="overflow-y-auto"
      max="true"
      min="true"
    >
      <Order order={order} currentStatus={currentStatus} />
    </AdaptiveOverlayPage>
  );
}

export default SingleOrderPage;

function OrderDetail({ label, title, children }) {
  return (
    <span className="flex items-start justify-start gap-1">
      <p className="text-stroke-600 text-nowrap">{label}</p>
      {title && <p className="font-bold text-stroke-800">{title}</p>}
      {children}
    </span>
  );
}

export function Order({ order, currentStatus }) {
  const { orderNumber, items, orderDate, pricing, shipping } = order || {};
  const { title, textColor, icon: Icon, des } = currentStatus || {};

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
          <OrderDetail
            label="تاریخ ثبت سفارش :"
            title={toLocalDateString(orderDate)}
          />
          <OrderDetail
            label="کد پیگیری سفارش :"
            title={toPersianNumbers(orderNumber)}
          />
        </div>
        <div className="flex w-full flex-wrap py-6 border-t border-stroke-250 max-md:gap-4 md:gap-6">
          <div className="flex max-md:flex-col items-start justify-center max-md:gap-4 md:gap-6">
            <OrderDetail label="تحویل گیرنده :" title={shipping?.receiver} />
            <OrderDetail
              label="شماره تماس :"
              title={toPersianNumbers(shipping?.phone)}
            />
          </div>
          <OrderDetail label="آدرس ارسال مرسوله :" title={shipping?.address} />
          <OrderDetail label="کد پستی :" title={toPersianNumbers(shipping?.postalCode)} />
        </div>
        <div className="flex w-full flex-wrap py-6 border-(ttoPersianNumbers border-s)troke-250 max-md:gap-4 md:gap-6">
          <OrderDetail
            label="مبلغ کل :"
            title={
              toPersianNumbersWithComma(pricing?.subtotal + pricing?.shipping) +
              " تومان"
            }
          />
          <OrderDetail label="وضعیت پرداخت :">
            <div className="flex items-center justify-center gap-1 text-success ">
              <AppImage
                src="/images/success-stroke-icon.svg"
                alt="success icon"
                width="size-5"
                sizes="10vw"
              />
              <p className="font-bold text-stroke-800">موفق</p>
            </div>
          </OrderDetail>
          <OrderDetail
            label="هزینه بسته بندی و ارسال :"
            title={toPersianNumbersWithComma(pricing?.shipping) + " تومان"}
          />
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
                <p className="text-stroke-600 text-xs">مرسوله ۱ از ۱</p>
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
                <OrderDetail label="زمان ارسال مرسوله :" title="۱ روز کاری" />
                <OrderDetail
                  label="کد پیگیری سفارش :"
                  title={toPersianNumbers(orderNumber)}
                />

                <OrderDetail label="وضعیت مرسوله :">
                  <div
                    className={`flex items-center justify-center gap-1 ${textColor} `}
                  >
                    <Icon className="size-6" />
                    <p className="font-bold ">{title}</p>
                  </div>
                </OrderDetail>
                <OrderDetail
                  label="کد رهگیری مرسوله :"
                  title={
                    "پس از ارسال مرسوله، کد رهگیری به شماره " +
                    toPersianNumbers(shipping?.phone) +
                    " .پیامک میشود"
                  }
                />
              </div>
              {/* </div> */}
              <OrderDetail
                label="مبلغ مرسوله :"
                title={toPersianNumbersWithComma(pricing?.subtotal) + " تومان"}
              />
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
            <div className="flex items-center flex-wrap justify-start p-6 mt-6 bg-warning/20 dark:bg-stroke-900 rounded-xl text-start text-stroke-800">
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
