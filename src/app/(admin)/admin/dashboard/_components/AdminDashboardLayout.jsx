"use client";

import AppImage from "@/components/AppImage";
import { useGetAdminDashboard } from "@/hooks/useOrders";
import {
  normalizeIranPhone,
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChevronLeftIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import React from "react";

import {
  AccordSales,
  BrandSalesBarChart,
  GenderSalesPieChart,
  OrderStatusPercentages,
  PurchaseModeStats,
  RevenueChart,
} from "./DashboardCharts";

function AdminDashboardLayout() {
  const { data, isPending, error } = useGetAdminDashboard();

  return (
    <div className="size-full max-lg:pt-4 max-lg:px-2 pb-10 max-lg:rounded-2xl max-lg:border border-stroke-100 max-lg:bg-stroke-100 ">
      <div className="w-full min-h-screen flex flex-col justify-start items-center gap- bg-stroke-100 lg:border border-stroke-200 lg:p-4 lg:rounded-3xl lg:shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-items-stretch w-full ">
          <DataDashboardBox
            href={"/admin/orders"}
            percentValue={data?.summary?.growth?.revenueToday}
            title="فروش امروز"
            isGrow={data?.summary?.growth?.revenueToday > 0 ? true : false}
            value={toPersianNumbersWithComma(data?.summary?.todayRevenue)}
            type="تومان"
          />
          <DataDashboardBox
            href={"/admin/users"}
            percentValue={data?.summary?.growth?.newUsers}
            title="کاربران جدید"
            isGrow={data?.summary?.growth?.newUsers > 0 ? true : false}
            value={toPersianNumbersWithComma(
              data?.summary?.customers?.newUsersToday,
            )}
            type="نفر"
          />
          <DataDashboardBox
            href={"/admin/orders"}
            percentValue={data?.summary?.growth?.ordersToday}
            title="سفارشات امروز"
            isGrow={data?.summary?.growth?.ordersToday > 0 ? true : false}
            value={toPersianNumbersWithComma(data?.summary?.todayOrders)}
            type="سفارش"
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 justify-items-stretch h-full w-full">
          {/* Low Stock */}
          <DashboardCard href="/admin/products" title="موجودی کم">
            {data?.summary?.inventoryAlerts.map((item) => (
              <Link
                href={`/admin/products/edit/${item.id}`}
                key={item.id}
                className="flex flex-col items-center justify-center snap-center gap-2 border rounded-2xl text-stroke-800 p-2 min-w-30"
              >
                <div className="w-full bg-stroke-100 rounded-md p-2">
                  <AppImage src={item?.image} alt={item.title} />
                </div>
                <span className="w-25 text-sm overflow-hidden">
                  <p className="w-full font-bold text-nowrap text-center overflow-auto p-px scrollbar-none">
                    {item?.title}
                  </p>
                </span>
                <span className="badge badge--primary gap-1 font-bold">
                  <p>{toPersianNumbersWithComma(item?.stock)}</p>
                  <p className="">میل</p>
                </span>
              </Link>
            ))}
          </DashboardCard>

          {/* Top Products */}
          <DashboardCard href="/admin/products" title="محصولات پرفروش">
            {data?.topProducts?.map((item) => (
              <Link
                href={`/admin/products/edit/${item.productId}`}
                key={item.productId}
                className="flex flex-col items-center justify-center snap-center gap-2 border rounded-2xl text-stroke-800 p-2 min-w-30"
              >
                <div className="w-full bg-stroke-100 rounded-md p-2">
                  <AppImage src={item?.image} alt={item.title} />
                </div>
                <span className="w-25 text-sm overflow-hidden">
                  <p className="w-full font-bold text-nowrap text-center overflow-auto p-px scrollbar-none">
                    {item?.title}
                  </p>
                </span>
                <span className="badge bg-success/10 text-success gap-1 font-bold">
                  <p>{toPersianNumbersWithComma(item?.soldMl)}</p>
                  <p className="">میل</p>
                </span>
              </Link>
            ))}
          </DashboardCard>

          {/* Top Customers */}
          <DashboardCard href="/admin/users" title="مشتریان برتر">
            {data?.bestCustomers?.map((item) => (
              <Link
                href={`/admin/users/${item.userId}`}
                key={item.userId}
                className="flex flex-col items-center justify-center snap-center gap-2 border rounded-2xl text-stroke-800 p-2 min-w-28"
              >
                <UserCircleIcon className="text-stroke-600 size-20" />
                <span className="flex flex-col items-center justify-start w-25 text-sm overflow-hidden font-bold">
                  <p className="w-full text-nowrap text-center overflow-auto p-px scrollbar-none">
                    {item?.fullName}
                  </p>
                  <p>{normalizeIranPhone(item?.phone)}</p>
                </span>
                <span className="badge bg-success/10 text-success gap-1 font-bold">
                  <p>{toPersianNumbersWithComma(item?.spent)}</p>
                  <p className="text-[10px] text-stroke-40">تومان</p>
                </span>
              </Link>
            ))}
          </DashboardCard>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-2 w-full">
          {/* Revenue Chart */}
          <RevenueChart chartData={data?.salesChart} />

          {/* Gender Sales Pie-Chart */}
          <GenderSalesPieChart genderSales={data?.genderSales} />

          {/*  Purchase Mode Stats Pie-Chart */}
          <PurchaseModeStats purchaseModeStats={data?.purchaseModeStats} />

          {/* Brand Sales Bar-Chart */}
          <BrandSalesBarChart brandSales={data?.brandSales} />

          {/* Order Status Radial-Bar */}
          <OrderStatusPercentages
            orderStatusPercentages={data?.orderStatusPercentages}
          />

          {/* Accord Sales Bar-Chart */}
          <AccordSales accordSales={data?.accordSales} />
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardLayout;

function DashboardCard({ href, title, children }) {
  return (
    <div className="text-stroke-800 h-75 w-full">
      <div className="relative group flex flex-col rounded-2xl border border-stroke-100 shrin grow size-full transition-all duration-200 p-2">
        <div className="bg-stroke-0 rounded-t-2xl p-3 pb-2 text-stroke-600">
          {title}
        </div>
        <div className="flex items-center justify-center size-full px-2 pb-2 bg-stroke-0 rounded-bl-2xl overflow-hidden">
          <div className="flex items-center justify-start gap-4 size-full overflow-auto p-px scrollbar-none rounded-2xl snap-x">
            {children}
          </div>
        </div>
        <div className="flex justify-between">
          <div className="grow flex items-end justify-start gap-1 rounded-b-2xl pb-3 px-3 bg-stroke-0">
            <div className="w-full "></div>
          </div>
          <CardButton href={href}>
            <ChevronLeftIcon className="p-2.5 text-stroke-600 bg-stroke-0 rounded-full size-full shadow" />
          </CardButton>
        </div>
      </div>
    </div>
  );
}

function CardButton({ children, href }) {
  return (
    <Link
      href={href}
      className="flex flex-none items-start justify-start size-11 aspect-square bg-stroke-100 rounded-2xl"
    >
      <div className="size-6 aspect-square bg-stroke-0 "></div>
      <div className="absolute bottom-2 left-2 flex items-center justify-center size-11 bg-stroke-100 pt-1 pr-1 rounded-full">
        {children}
      </div>
    </Link>
  );
}

function DataDashboardBox({ href, title, type, value, percentValue, isGrow }) {
  return (
    <div className="relative group flex flex-col items-stretch rounded-2xl border border-stroke-100 w-full transition-all overflow-hidden duration-200 p-2">
      <p className="flex items-start text-base text-stroke-800 lg:text-stroke-600 p-4 rounded-t-2xl bg-stroke-0">
        {title}
      </p>
      <div className="flex items-end justify-end gap-1 px-4 pb-4 bg-stroke-0 rounded-bl-2xl">
        <p className="font-bold text-2xl text-stroke-800 translate-y-1.5">
          {value}
        </p>
        <p className="text-xs font-bold text-stroke-600">{type}</p>
      </div>
      <div className="flex justify-between">
        <div className="grow flex items-end justify-start gap-1 rounded-b-2xl pb-4 px-4 bg-stroke-0">
          {percentValue === 0 ? (
            <p className="text-stroke-800">بدون رشد</p>
          ) : (
            <>
              <div
                className={`flex items-center justify-center ${isGrow ? "text-success" : "text-error"} font-bold translate-y-px`}
              >
                <p className="">{toPersianNumbers(percentValue)}</p>
                <p className="text-sm">%</p>
              </div>
              <p className="text-stroke-800">
                {isGrow ? "بیشتر" : "کمتر"} نسبت به دیروز
              </p>
            </>
          )}
        </div>
        <CardButton href={href}>
          {percentValue === 0 ? (
            <MinusIcon className="p-2.5 text-error bg-stroke-0 rounded-full size-full shadow" />
          ) : isGrow ? (
            <ArrowTrendingUpIcon className="p-2.5 text-success bg-stroke-0 rounded-full size-full shadow" />
          ) : (
            <ArrowTrendingDownIcon className="p-2.5 text-error bg-stroke-0 rounded-full size-full shadow" />
          )}
        </CardButton>
      </div>
    </div>
  );
}
