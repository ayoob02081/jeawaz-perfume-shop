"use client";

import {
  ArrowLeftIcon,
  ChevronDownIcon,
  Squares2X2Icon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import ImageFrame from "./ImageFrame";
import Logo from "./Logo";
import { useEffect, useState } from "react";
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
  const { data, isPending, error } = useGetUser();
  // console.log(data, isPending, error);

  const userFullName = data?.firstName + " " + data?.lastName;
  // console.log(userFullName);

  const toggleCategory = () => {
    setCategoryOpen((prevState) => !prevState);
  };

  const toggleSideBar = () => {
    setSidebarOpen((prevState) => !prevState);
  };

  useEffect(() => {
    if (sidebarOpen || categoryOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [sidebarOpen, categoryOpen]);

  return (
    <>
      <DesktopHeader
        toggleCategory={toggleCategory}
        data={data}
        userFullName={userFullName}
      />
      <MobileHeader
        data={data}
        toggleSideBar={toggleSideBar}
        toggleCategory={toggleCategory}
        sidebarOpen={sidebarOpen}
        userFullName={userFullName}
      />
      <CategorySideBar
        toggleCategory={toggleCategory}
        categoryOpen={categoryOpen}
        setCategoryOpen={setCategoryOpen}
      />
    </>
  );
}

export default HeaderLayout;

function DesktopHeader({ toggleCategory, userFullName, data }) {
  const router = useRouter();
  const pathName = usePathname();

  return (
    <nav className="max-md:hidden">
      <ul className="flex flex-col justify-between gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex grow items-center justify-betwee gap-4">
            <div className="flex grow items-center justify-between">
              <li className=" justify-items-center">
                <Link className="block p-2" href="/">
                  <Logo width="w-[5.75rem] h-12" />
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
          <div className="flex flex-none items-center justify-between gap-2 lg:gap-4">
            <li className="w-28 lg:w-36 h-10 lg:h-12 btn btn--secondary py-0">
              <button
                onClick={
                  !data?.email || data?.email === undefined
                    ? () => router.push("/auth/login")
                    : () => router.push("/profile")
                }
                className="size-full"
              >
                <div className="flex items-center justify-center px-1.5 lg:px-4 size-full gap-2">
                  <p className="text-xs lg:text-sm text-nowrap overflow-x-scroll w-full scrollbar-none">
                    {data?.email ? userFullName : "ورود | ثبت نام"}
                  </p>
                  <UserIcon className="size-5" />
                </div>
              </button>
            </li>
            <li>
              <button
                className="flex items-center justify-between w-32 lg:w-[8.8rem]"
                onClick={
                  !userFullName || userFullName === undefined
                    ? () => router.push("/auth/login")
                    : () => router.push("/cart")
                }
              >
                <div className="size-12 px-2 py-2 rounded-full border-4 border-grey bg-[#2F0D0C]">
                  <ImageFrame
                    src="/images/card stroke white.svg"
                    alt="card icon"
                    className="size-6"
                  />
                </div>
                <div className="flex flex-col items-center justify-between gap-1 lg:gap-2 w-[4.5rem] lg:w-[5.3rem]">
                  <p className="text-xs lg:text-sm">سبد خرید شما</p>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 py-0.5 px-2 lg:px-3 rounded-3xl bg-grey">
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
            <li className="w-36 lg:w-44 h-12">
              <button
                className="w-full h-full btn btn--primary flex items-center justify-center size-full gap-2"
                onClick={toggleCategory}
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
                    <ImageFrame
                      src="/images/warranty-check-icon.svg"
                      alt="tag icon"
                      className="size-5"
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
                    <ImageFrame
                      src="/images/two-tag-icon.svg"
                      alt="tag icon"
                      className="size-5"
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
                    <ImageFrame
                      src="/images/special-offer-2-icon.svg"
                      alt="offer icon"
                      className="size-5"
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
function MobileHeader({ toggleSideBar, toggleCategory, sidebarOpen, data }) {
  const router = useRouter();

  return (
    <nav className="md:hidden h-32">
      <ul className="mobileHeader relative">
        <li className="justify-items-start">
          <button
            className="text-2xl focus:outline-none block p-3 rounded-full border-2 border-primary/10"
            onClick={toggleSideBar}
          >
            <ImageFrame
              src="/images/category.svg"
              alt="category icon"
              className="size-6"
            />
          </button>
        </li>
        <li className=" justify-items-center">
          <Link className="block p-2" href="/">
            <Logo width="h-[2.65rem] w-[5.15rem]" />
          </Link>
        </li>
        <li className=" justify-items-end">
          <button
            onClick={
              !data?.email || data?.email === undefined
                ? () => router.push("/auth/login")
                : () => router.push("/cart")
            }
            className="relative block p-3 rounded-full border-2 border-primary/10"
          >
            <ImageFrame
              src="/images/card stroke.svg"
              alt="cart icon"
              className="size-[1.15rem]"
            />
            {data?.email && (
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
