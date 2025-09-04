"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import SideBar from "./SideBar";
import CategorySideBar from "./CategorySideBar";
import Logo from "./Logo";

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
          <li className=" justify-items-start">
            <button
              className="text-2xl focus:outline-none block p-3 rounded-full border-2 border-primary/10"
              onClick={toggleSideBar}
            >
              <Image
                src="/images/category.svg"
                alt="category icon"
                width={24}
                height={24}
              />
            </button>
          </li>
          <li className=" justify-items-center">
            <Link className="block p-2" href="/">
              <Logo width={82} />
            </Link>
          </li>
          <li className=" justify-items-end">
            <Link
              className="relative block p-3 rounded-full border-2 border-primary/10"
              href="/"
            >
              <Image
                src="/images/card stroke.svg"
                alt="card icon"
                width={18.5}
                height={18.5}
              />
              <p className="absolute -top-1 -right-1 px-1.5 pt-[1.5px] rounded-full bg-primary text-white text-[12px]">
                4
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
              <Image
                src="/images/search.svg"
                alt="search icon"
                width={24}
                height={24}
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
