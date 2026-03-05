"use client";

import {
  ArrowLeftIcon,
  ChevronDownIcon,
  Squares2X2Icon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import AppImage from "./AppImage";
import { useState } from "react";
import SearchSection from "./SearchSection";
import CategorySideBar from "@/app/(user)/_components/CategorySideBar";
import SideBar from "./SideBar";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { CardIconResponsive } from "@/app/(user)/_components/ProductCard";
import { usePathname, useRouter } from "next/navigation";
import { useGetUser } from "@/hooks/useUsers";

function HeaderLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const { data: user, isPending, error } = useGetUser();

  const userFullName = user?.firstName + " " + user?.lastName;

  const toggleCategory = () => {
    setCategoryOpen((prevState) => !prevState);
  };

  const toggleSideBar = () => {
    setSidebarOpen((prevState) => !prevState);
  };

  return (
    <>
      <DesktopHeader
        toggleCategory={toggleCategory}
        user={user}
        userFullName={userFullName}
        isPending={isPending}
      />
      <MobileHeader
        user={user}
        toggleSideBar={toggleSideBar}
        toggleCategory={toggleCategory}
        sidebarOpen={sidebarOpen}
        userFullName={userFullName}
        categoryOpen={categoryOpen}
      />
      <CategorySideBar
        toggleCategory={toggleCategory}
        categoryOpen={categoryOpen}
        setCategoryOpen={setCategoryOpen}
        onClose={() => setCategoryOpen(false)}
      />
    </>
  );
}

export default HeaderLayout;

function DesktopHeader({
  toggleCategory,
  userFullName,
  user,
  isPending,
  categoryOpen,
}) {
  const router = useRouter();
  const pathName = usePathname();

  return (
    <nav className="max-md:hidden md:fixed inset-0 top-0 right-0 left-0 h-fit container mx-auto xl:max-w-7xl p-4 rounded-b-4xl z-90 bg-white shadow-md">
      <ul className="flex flex-col justify-between gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex grow items-center justify-betwee gap-4">
            <div className="flex grow items-center justify-between">
              <li className=" justify-items-center">
                <Link className="block p-2" href="/">
                  <AppImage
                    src="/images/Jeaawaz-Logo-red-v5.0.webp"
                    alt="jeawaz-brand-icon"
                    width="w-18 h-10"
                    sizes="20vw"
                  />
                </Link>
              </li>
              <li className="flex relative grow col-span-3 ">
                <SearchSection placeholder="نام ادکلن ، دسته بندی ، برند و ..." />
              </li>
            </div>
            <div className="flex flex-none items-center justify-between gap-4">
              <li className="relative flex items-center justify-center">
                <Link
                  href={"/page/terms"}
                  className={`duration-200 ${
                    pathName.endsWith("/terms")
                      ? "text-primary font-bold"
                      : "text-text-primary hover:text-primary "
                  }`}
                >
                  <p className="text-xs lg:text-sm">قوانین و مقررات</p>
                </Link>
                {pathName.endsWith("/terms") && (
                  <div className="absolute -bottom-3 size-2 rounded-full bg-primary"></div>
                )}
              </li>
              <li className="relative flex items-center justify-center">
                <Link
                  href={"/page/about-us"}
                  className={`duration-200 ${
                    pathName.endsWith("/about-us")
                      ? "text-primary font-bold"
                      : "text-text-primary hover:text-primary "
                  }`}
                >
                  <p className="text-xs lg:text-sm">درباره ما</p>
                </Link>
                {pathName.endsWith("/about-us") && (
                  <div className="absolute -bottom-3 size-2 rounded-full bg-primary"></div>
                )}
              </li>
              <li className="relative flex items-center justify-center">
                <Link
                  href={"/page/contact-us"}
                  className={`duration-200 ${
                    pathName.endsWith("/contact-us")
                      ? "text-primary font-bold"
                      : "text-text-primary hover:text-primary"
                  }`}
                >
                  <p className="text-xs lg:text-sm">تماس با ما</p>
                </Link>
                {pathName.endsWith("/contact-us") && (
                  <div className="absolute -bottom-3 size-2 rounded-full bg-primary"></div>
                )}
              </li>
            </div>
          </div>
          <div className="flex flex-none items-center justify-between gap-3">
            <li
              className={`w-fit lg: max-w-36 h-10 lg:h-12 btn bg-white active:bg-dark-brown py-0 pl-1 pr-2 ${user?.email && "border-0 ring-1 ring-dark-brown/10"} duration-200`}
            >
              <button
                onClick={
                  !user?.email || user?.email === undefined
                    ? () => router.push("/auth/login")
                    : () => router.push("/profile")
                }
                disabled={isPending ? true : false}
                className={`size-full ${isPending && "blur-x opacity-50"} duration-200`}
              >
                <span
                  className={`flex flex-row-reverse items-center gap-1 size-full${user?.email ? "justify-between text-dark-brown font-bold " : "justify-center"}`}
                >
                  <div
                    className={`${user?.email && "bg-dark-brown text-white"} rounded-full p-2`}
                  >
                    <UserIcon className="size-4 stroke-2" />
                  </div>
                  <p className=" text-xs lg:text-sm text-nowrap overflow-x-scroll scrollbar-none size-full active:text-white">
                    {user?.email ? userFullName : "ورود | ثبت نام"}
                  </p>
                </span>
              </button>
            </li>
            <li>
              <button
                className="flex items-center justify-between gap-2"
                onClick={
                  !userFullName || userFullName === undefined
                    ? () => router.push("/auth/login")
                    : () => router.push("/cart")
                }
              >
                <div className="flex items-center justify-center size-8 lg:size-10 p-1 rounded-full ring-4 ring-dark-brown/10 bg-dark-brown">
                  <AppImage
                    src="/images/card stroke white.svg"
                    alt="card-icon"
                    width="size-6"
                    sizes="10vw"
                  />
                </div>
                <div className="flex flex-col items-center justify-between gap-1 lg:gap-2 w-[4.5rem] lg:w-[5.3rem]">
                  <p className="text-xs lg:text-sm">سبد خرید شما</p>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 py-0.5 px-2 lg:px-3 rounded-3xl bg-dark-brown/10">
                      <p className="text-xs lg:text-sm">۴</p>
                      <p className="text-xs lg:text-sm">کالا</p>
                    </div>
                    <ArrowLeftIcon className=" size-3 lg:size-4" />
                  </div>
                </div>
              </button>
            </li>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-between gap-4">
            <li className="relative w-36 lg:w-44 h-12 cursor-not-allowed">
              <button
                className="w-full h-full btn btn--primary flex items-center justify-center size-full gap-2"
                onClick={toggleCategory}
                disabled={categoryOpen ? true : false}
              >
                <Squares2X2Icon className="size-6" />
                <p className="text-xs lg:text-sm">دسته بندی ها</p>
                <ChevronDownIcon className="size-4" />
              </button>
            </li>
            <div className="flex items-center justify-start gap-4">
              <li className="">
                <Link
                  href={"/products"}
                  className="text-text-primary hover:text-primary duration-200"
                >
                  <div className="flex items-center justify-center gap-2 ">
                    <AppImage
                      src="/images/warranty-check-icon.svg"
                      alt="popular-icon"
                      width="size-5"
                      sizes="10vw"
                    />
                    <p className="text-sm">پرفروش ترین ها</p>
                  </div>
                </Link>
              </li>
              <li className="">
                <Link
                  href={"/products"}
                  className="text-text-primary hover:text-primary duration-200"
                >
                  <div className="flex items-center justify-center gap-2 ">
                    <AppImage
                      src="/images/two-tag-icon.svg"
                      alt="tag-icon"
                      width="size-5"
                      sizes="10vw"
                    />
                    <p className="text-sm">جدیدترین ها</p>
                  </div>
                </Link>
              </li>
              <li className="">
                <Link
                  href={"/products"}
                  className="text-text-primary hover:text-primary duration-200"
                >
                  <div className="flex items-center justify-center gap-2 ">
                    <AppImage
                      src="/images/special-offer-2-icon.svg"
                      alt="offer-icon"
                      width="size-5"
                      sizes="10vw"
                    />
                    <p className="text-sm">تخفیف دار</p>
                  </div>
                </Link>
              </li>
            </div>
          </div>
          <li className="flex items-center justify-between gap-4">
            <Link
              href={"tel:+989180522273"}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center justify-center text-xl pl-4 border-l-[1.5px] border-stroke">
                <p className="text-text ">{toPersianNumbers("2273")}</p>
                <p className="text-text ">{toPersianNumbers("052")}</p>
                <p className="text-primary ">{toPersianNumbers("0918")}</p>
              </div>
              <CardIconResponsive
                src="/images/call-ringing-4-primary-icon.svg"
                alt="call-ringing-icon"
                title="پشتیبانی"
                type="support"
                className="max-md:h-8 md:h-10"
                hoverWidthMaxMd="w-[7.62rem]"
                hoverWidthMd="w-24"
                size="max-md:size-4 md:size-6"
              />
            </Link>
          </li>
        </div>
      </ul>
    </nav>
  );
}
function MobileHeader({ toggleSideBar, toggleCategory, sidebarOpen, user }) {
  const router = useRouter();

  return (
    <nav className="md:hidden fixed inset-0 top-0 right-0 left-0 h-fit container mx-auto xl:max-w-7xl p-4 rounded-b-4xl z-50 bg-white shadow-md">
      <ul className="mobileHeader relative">
        <li className="justify-items-start">
          <button
            className="text-2xl focus:outline-none block p-3 rounded-full border-2 border-primary/10"
            onClick={toggleSideBar}
          >
            <AppImage
              src="/images/category.svg"
              alt="category icon"
              width="size-6"
              sizes="10vw"
            />
          </button>
        </li>
        <li className=" justify-items-center">
          <Link className="block p-2" href="/">
            <AppImage
              src="/images/Jeaawaz-Logo-red-v5.0.webp"
              alt="jeawaz-brand-icon"
              width="h-[2.65rem] w-[5.15rem]"
              sizes="20vw"
            />
          </Link>
        </li>
        <li className=" justify-items-end">
          <button
            onClick={
              !user?.email || user?.email === undefined
                ? () => router.push("/auth/login")
                : () => router.push("/cart")
            }
            className="relative block p-3 rounded-full border-2 border-dark-brown/10"
          >
            <AppImage
              src="/images/card stroke.svg"
              alt="cart-icon"
              width="size-[1.15rem]"
              sizes="10vw"
            />
            {user?.email && (
              <p className="absolute -top-1 -right-1 px-1.5 pt-[1.5px] rounded-full bg-primary text-white text-[12px]">
                ۴
              </p>
            )}
          </button>
        </li>
        <li className="flex relative grow col-span-3 w-full h-12">
          <SearchSection placeholder="نام ادکلن ، دسته بندی ، برند و ..." />
        </li>
      </ul>
      <SideBar
        toggleSideBar={toggleSideBar}
        toggleCategory={toggleCategory}
        sidebarOpen={sidebarOpen}
      />
    </nav>
  );
}
