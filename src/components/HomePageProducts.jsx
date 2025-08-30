import React from "react";
import GenderType from "../ui/GenderType";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

function HomePageProducts({ title, genderType, children, className, bgColor }) {
  return (
    <div
      className={`flex flex-col items-center py-2 container mx-auto xl:max-w-7xl gap-6 ${bgColor}`}
    >
      <div className="flex justify-between items-center w-full px-6">
        <div>{title}</div>
        <div className="flex items-center gap-4">
          {genderType ? <GenderType /> : "Timer"}
          <Link
            href={"/"}
            className="hidden md:flex items-center justify-between gap-4 pr-3 border-r-[1.5px] border-secondary2"
          >
            <div className="text-lg text-primary">مشاهده همه</div>
            <div className="text-primary max-md:size-[1.1rem] size-6">
              <ArrowLeftIcon />
            </div>
          </Link>
        </div>
      </div>
      <div
        className={`flex items-center w-full scrollbarX px-10 snap-x gap-4 md:gap-6 ${className}`}
      >
        {children}
      </div>
      <div className="flex items-center justify-between gap-4 p-6 md:hidden">
        <div className="text-primary">مشاهده همه</div>
        <div className="text-primary max-md:size-[1.1rem] size-6">
          <ArrowLeftIcon />
        </div>
      </div>
    </div>
  );
}

export default HomePageProducts;
