"use client";

import { useState } from "react";
import Link from "next/link";
import SideBar from "./SideBar";
import CategorySideBar from "./CategorySideBar";
import Logo from "./Logo";
import ImageFrame from "./ImageFrame";

function MobileHeader({}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categoryOpen, setCategooryOpen] = useState(false);
  const toggleCategory = () => {
    setCategooryOpen((prevState) => !prevState);
  };
  const toggleSideBar = () => {
    setSidebarOpen((prevState) => !prevState);
  };
  return (
    <header className="top-0 right-0 left-0 p-2 h-32 container mx-auto xl:max-w-7xl md:hidden">
      <nav>
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
              href="/"
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
          <li className="flex relative grow col-span-3 w-full h-12 rounded-[48px] bg-[#F7F7F7]">
            <input
              className="p-4 outline-0 w-full"
              type="search"
              placeholder="نام ادکلن ، دسته بندی ، برند و ..."
            />
            <div className="absolute left-6 top-1/2 -translate-1/2 bg-white rounded-full p-2">
              <ImageFrame
                src="/images/search.svg"
                alt="search icon"
               className="size-6"
              />
            </div>
          </li>
        </ul>
        <SideBar
          toggleSideBar={toggleSideBar}
          toggleCategory={toggleCategory}
          sidebarOpen={sidebarOpen}
        />
        <CategorySideBar
          toggleCategory={toggleCategory}
          categoryOpen={categoryOpen}
        />
      </nav>
    </header>
  );
}

export default MobileHeader;
