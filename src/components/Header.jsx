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
import { useState } from "react";
import CategorySideBar from "./CategorySideBar";
import SideBar from "./SideBar";
import BackDropLogin from "./BackDropLogin";
import Login from "./Login";
import SearchSection from "./SearchSection";

function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categoryOpen, setCategooryOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const toggleCategory = () => {
    setCategooryOpen((prevState) => !prevState);
  };
  const toggleSideBar = () => {
    setSidebarOpen((prevState) => !prevState);
  };
  const toggleLoginOpen = () => {
    setLoginOpen((prevState) => !prevState);
  };
  return (
    <header className="container mx-auto xl:max-w-7xl p-2">
      <nav className="max-md:hidden">
        <ul className="flex flex-col justify-between gap-6">
          <div className="flex items-center justify-between gap-10">
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
                {/* <li className="">
                  <p className="text-xs lg:text-sm">مطالب آموزشی</p>
                </li> */}
                <li className="">
                  <Link
                    href={"/"}
                    className="text-text-primary hover:text-primary duration-200"
                  >
                    <p className="text-xs lg:text-sm">درباره ما</p>
                  </Link>
                </li>
                <li className="">
                  <Link
                    href={"/"}
                    className="text-text-primary hover:text-primary duration-200"
                  >
                    <p className="text-xs lg:text-sm">تماس با ما</p>
                  </Link>
                </li>
              </div>
            </div>
            <div className="flex flex-none items-center justify-between gap-2 lg:gap-4">
              <li className="w-28 lg:w-36 h-10 lg:h-12 btn btn-secondary">
                <button onClick={toggleLoginOpen} className="size-full">
                  <div className="flex items-center justify-center px-1.5 lg:px-4 size-full gap-2">
                    <p className="text-xs lg:text-sm">ورود | ثبت نام</p>
                    <UserIcon className="size-5" />
                  </div>
                </button>
              </li>
              <li>
                <Link
                  className="flex items-center justify-between w-32 lg:w-[8.8rem]"
                  href={"/card"}
                >
                  <div className="size-12 px-2 py-2 rounded-full border-4 border-secondary-2 bg-[#2F0D0C]">
                    <ImageFrame
                      src="/images/card stroke white.svg"
                      alt="card icon"
                      className="size-6"
                    />
                  </div>
                  <div className="flex flex-col items-center justify-between gap-1 lg:gap-2 w-[4.5rem] lg:w-[5.3rem]">
                    <p className="text-xs lg:text-sm">سبد خرید شما</p>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 py-0.5 px-2 lg:px-3 rounded-3xl bg-secondary-2">
                        <p className="text-xs lg:text-sm">۴</p>
                        <p className="text-xs lg:text-sm">کالا</p>
                      </div>
                      <ArrowLeftIcon className=" size-3 lg:size-4" />
                    </div>
                  </div>
                </Link>
              </li>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between gap-4">
              <li className="w-36 lg:w-44 h-12">
                <button
                  className="w-full h-full btn btn-primary flex items-center justify-center size-full gap-2"
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
                    href={"/"}
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
                    href={"/"}
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
                    href={"/"}
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
            <div className="flex items-center justify-between gap-4">
              <li className="w-[8.18rem] flex items-center justify-center">
                <p className="md:text-base">09180522273</p>
              </li>
              <li className="w-24 lg:w-[7.62rem] h-10 btn btn-primary">
                <Link href={"/"}>
                  <div className="flex items-center justify-center px-4 size-full gap-2 ">
                    <ImageFrame
                      src="/images/call-ringing-4-wihte-icon.svg"
                      alt="call ringing icon"
                      className="size-5 "
                    />
                    <p className="text-sm">پشتیبانی</p>
                  </div>
                </Link>
              </li>
            </div>
          </div>
        </ul>
      </nav>
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
            <Link
              className="relative block p-3 rounded-full border-2 border-primary/10"
              href="/card"
            >
              <ImageFrame
                src="/images/card stroke.svg"
                alt="card icon"
                className="size-[1.15rem]"
              />
              <p className="absolute -top-1 -right-1 px-1.5 pt-[1.5px] rounded-full bg-primary text-white text-[12px]">
                ۴
              </p>
            </Link>
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
      <CategorySideBar
        toggleCategory={toggleCategory}
        categoryOpen={categoryOpen}
      />
      <BackDropLogin toggleOpen={loginOpen}>
        <Login toggleLoginOpen={toggleLoginOpen} />
      </BackDropLogin>
    </header>
  );
}

export default Header;
