"use client";

import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
  UserIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import {
  MoonIcon as MoonSolidIcon,
  SunIcon as SunSolidIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import AppImage from "./AppImage";
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
  const { data: user, isPending, error } = useGetUser();
  const [dark, setDark] = useState(false);

  const userFullName = user?.firstName + " " + user?.lastName;
  const toggleTheme = () => {
    setDark((prev) => !prev);
  };

  const toggleCategory = () => {
    setCategoryOpen((prevState) => !prevState);
  };

  const toggleSideBar = () => {
    setSidebarOpen((prevState) => !prevState);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <>
      <DesktopHeader
        toggleCategory={toggleCategory}
        user={user}
        userFullName={userFullName}
        isPending={isPending}
        toggleTheme={toggleTheme}
        dark={dark}
      />
      <MobileHeader
        user={user}
        toggleSideBar={toggleSideBar}
        toggleCategory={toggleCategory}
        sidebarOpen={sidebarOpen}
        userFullName={userFullName}
        categoryOpen={categoryOpen}
        toggleTheme={toggleTheme}
        dark={dark}
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
  toggleTheme,
  dark,
}) {
  const router = useRouter();
  const pathName = usePathname();

  return (
    <nav className="max-md:hidden md:fixed inset-0 top-0 right-0 left-0 h-fit container mx-auto xl:max-w-7xl p-4 rounded-b-4xl z-90 bg-stroke-0 shadow-md duration-200">
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
            <li>
              <button
                type="button"
                onClick={toggleTheme}
                className="relative flex items-center justify-center gap-2 bg-stroke-200 dark:bg-stroke-50 rounded-full px-1 py-0.5 w-12 h-6"
              >
                <div
                  className={`absolute flex items-center justify-center h-full aspect-square from-yellow-400 to-yellow-700 dark:from-blue-700 dark:to-blue-950 bg-gradient-to-r rounded-full ${
                    !dark ? "right-0" : "right-0 -translate-x-full"
                  } shadow duration-200`}
                >
                  {!!dark ? (
                    <div className="text-stroke-800" />
                  ) : (
                    <div className="text-stroke-800" />
                  )}
                </div>
                <div className="flex items-center justify-between w-full">
                  <div className="text-stroke-800 z-10">
                    {!!dark ? (
                      <SunIcon className="size-4 text-warning" />
                    ) : (
                      <SunSolidIcon className="size-4 text-white" />
                    )}
                  </div>
                  <div className="text-stroke-800 z-10">
                    {!dark ? (
                      <MoonIcon className="size-4 text-blue-900" />
                    ) : (
                      <MoonSolidIcon className="size-4 text-white" />
                    )}
                  </div>
                </div>
              </button>
            </li>
            <div className="flex flex-none items-center justify-between gap-4">
              <li className="relative flex items-center justify-center max-lg:hidden">
                <Link
                  href={"/page/terms"}
                  className={`duration-200 ${
                    pathName.endsWith("/terms")
                      ? "text-primary font-bold"
                      : "text-stroke-800 hover:text-primary "
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
                      : "text-stroke-800 hover:text-primary "
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
                      : "text-stroke-800 hover:text-primary"
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
              className={`w-fit group max-w-36 h-10 lg:h-12 btn bg-stroke-0 active:bg-stroke-900 dark:active:bg-stroke-150 py-0 pl-1 pr-2 ${user?.email ? "border-0 ring-1 ring-stroke-900/10 dark:ring-stroke-800/10" : "border border-stroke-250"} duration-200`}
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
                  className={`flex flex-row-reverse items-center gap-1 size-full${user?.email ? "justify-between text-stroke-900 dark:text-stroke-800 font-bold " : "justify-center text-stroke-800"}`}
                >
                  <div
                    className={`${user?.email && "bg-stroke-900 dark:bg-stroke-50 text-stroke-400"} rounded-full p-2`}
                  >
                    <UserIcon className="size-4 stroke-2" />
                  </div>
                  <p className=" text-xs lg:text-sm text-nowrap overflow-x-scroll scrollbar-none size-full group-active:text-stroke-0 dark:group-active:text-stroke-800">
                    {user?.email ? userFullName : "ورود | ثبت نام"}
                  </p>
                </span>
              </button>
            </li>
            <li>
              <button
                className="flex items-center justify-between gap-2 group"
                onClick={
                  !userFullName || userFullName === undefined
                    ? () => router.push("/auth/login")
                    : () => router.push("/cart")
                }
              >
                <div className="flex items-center justify-center size-8 lg:size-10 p-1 rounded-full ring-4 ring-stroke-900/10 bg-stroke-900 group-active:bg-stroke-0 group-active:ring-stroke-900/20 dark:bg-stroke-50 dark:ring-stroke-800/5 dark:group-active:ring-stroke-800/5 duration-200">
                  <AppImage
                    src="/images/bag-stroke-sec-icon.svg"
                    alt="shopping-bag-icon"
                    className="invert"
                    width="size-6"
                    sizes="10vw"
                  />
                </div>
                <div className="flex flex-col items-center justify-between gap-1 lg:gap-2 w-[4.5rem] lg:w-[5.3rem] text-xs lg:text-sm text-stroke-800">
                  <p>سبد خرید شما</p>
                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-2 pt-0.5 px-2 lg:px-3 rounded-3xl bg-stroke-900/10 dark:bg-stroke-800/5 text-xs lg:text-sm text-stroke-800">
                      <p>۴</p>
                      <p>کالا</p>
                    </span>
                    <ArrowLeftIcon className="text-stroke-800 group-active:text-stroke-800/70 size-3 lg:size-4" />
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
                  className="text-stroke-800 hover:text-primary duration-200"
                >
                  <div className="flex items-center justify-center gap-2 ">
                    <AppImage
                      src="/images/warranty-check-icon.svg"
                      alt="popular-icon"
                      width="size-5"
                      sizes="10vw"
                      className="dark:saturate-150 dark:brightness-200"
                    />
                    <p className="text-sm">پرفروش ترین ها</p>
                  </div>
                </Link>
              </li>
              <li className="">
                <Link
                  href={"/products"}
                  className="text-stroke-800 hover:text-primary duration-200"
                >
                  <div className="flex items-center justify-center gap-2 ">
                    <AppImage
                      src="/images/two-tag-icon.svg"
                      alt="tag-icon"
                      width="size-5"
                      sizes="10vw"
                      className="dark:saturate-150 dark:brightness-200"
                    />
                    <p className="text-sm">جدیدترین ها</p>
                  </div>
                </Link>
              </li>
              <li className="">
                <Link
                  href={"/products"}
                  className="text-stroke-800 hover:text-primary duration-200"
                >
                  <div className="flex items-center justify-center gap-2 ">
                    <AppImage
                      src="/images/special-offer-2-icon.svg"
                      alt="offer-icon"
                      width="size-5"
                      sizes="10vw"
                      className="dark:saturate-150 dark:brightness-200"
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
              <div className="flex items-center justify-center text-xl pl-4 border-l-[1.5px] border-stroke-200">
                <p className="text-stroke-800 ">{toPersianNumbers("2273")}</p>
                <p className="text-stroke-800 ">{toPersianNumbers("052")}</p>
                <p className="text-primary ">{toPersianNumbers("0918")}</p>
              </div>
              <CardIconResponsive
                src="/images/call-ringing-4-primary-icon.svg"
                alt="call-ringing-icon"
                title="پشتیبانی"
                type="support"
                className="max-md:h-8 md:h-10"
                size="max-md:size-4 md:size-6"
              />
            </Link>
          </li>
        </div>
      </ul>
    </nav>
  );
}
function MobileHeader({
  toggleSideBar,
  toggleCategory,
  sidebarOpen,
  user,
  toggleTheme,
  dark,
}) {
  const router = useRouter();

  return (
    <nav className="md:hidden fixed inset-0 top-0 right-0 left-0 h-fit container mx-auto xl:max-w-7xl p-4 rounded-b-4xl z-50 bg-stroke-0 shadow-md duration-200">
      <ul className="mobileHeader relative">
        <li className="justify-items-start">
          <button
            type="button"
            className="text-2xl aspect-square w-14 flex items-center justify-center rounded-full border-2 border-primary/10 active:bg-stroke-50 dark:bg-stroke-50 active:border-stroke-900/20 dark:border-stroke-800/5 dark:active:border-stroke-800/5 text-primary active:text-primary/80 dark:text-stroke-800 dark:active:text-stroke-800/70 duration-200"
            onClick={toggleSideBar}
          >
            <AppImage
              src="/images/category.svg"
              alt="shopping-bag-icon"
              width="size-8"
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
            className="relative aspect-square w-14 flex items-center justify-center rounded-full border-2 border-primary/10 active:bg-stroke-50 active:border-stroke-900/20 dark:bg-stroke-50 dark:border-stroke-800/5 dark:active:border-stroke-800/5 text-stroke-800 active:text-stroke-800/70 duration-200"
          >
            <AppImage
              src="/images/bag-stroke-sec-icon.svg"
              alt="shopping-bag-icon"
              className="dark:invert"
              width="size-8"
              sizes="10vw"
            />
            {user?.email && (
              <p className="absolute -top-1 -right-1 flex items-center justify-center w-5 aspect-square rounded-full bg-primary text-white text-xs">
                {toPersianNumbers(4)}
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
        toggleTheme={toggleTheme}
        dark={dark}
      />
    </nav>
  );
}
