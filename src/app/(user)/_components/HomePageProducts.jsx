import React from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import RadioButton from "@/ui/RadioButton";

function HomePageProducts({
  titleOne,
  titleTwo,
  desc,
  genderType,
  children,
  className,
  bgColor,
  section,
}) {
  return (
    <div
      className={`flex flex-col items-center py-2 container mx-auto xl:max-w-7xl gap-6 ${bgColor}`}
    >
      <div className="flex justify-between items-center w-full px-6">
        <div className="flex flex-col items-center justify-center md:items-start gap-2 px-6">
          <div className="flex items-center gap-1">
            <h2 className="text-lg sm:text-xl md:text-[28px] font-bold text-primary">
              {titleOne}
            </h2>
            <h2 className="text-lg sm:text-xl md:text-[28px] font-bold text-text-primary">
              {titleTwo}
            </h2>
          </div>
          <p className="text-xs sm:text-sm md:text-lg text-text-secondary">
            {desc}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {genderType ? <GenderType section={section} /> : "Timer"}
          <Link
            href={"/"}
            className="hidden md:flex items-center justify-between gap-4 pr-3 border-r-[1.5px] border-stroke"
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

function GenderType({ section }) {
  return (
    <div className="flex items-center justify-between gap-1">
      <RadioButton
        className="btn border-[1.5px] w-20 text-sm border-stroke py-1 px-3 rounded-4xl text-black has-checked:text-primary has-checked:border-primary duration-200"
        id={`man${section}`}
        name={`gender${section}`}
        value="man"
        label="مردانه"
        //   onChange=""
        //   checked=""
      />
      <RadioButton
        className="btn border-[1.5px] w-20 text-sm border-stroke py-1 px-3 rounded-4xl text-black has-checked:text-primary has-checked:border-primary duration-200"
        id={`woman${section}`}
        name={`gender${section}`}
        value="woman"
        label="زنانه"
        //   onChange=""
        //   checked=""
      />
    </div>
  );
}
