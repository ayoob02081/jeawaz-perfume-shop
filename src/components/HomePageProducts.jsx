import React from "react";
import GenderType from "../ui/GenderType";

function HomePageProducts({ title, genderType, children, className }) {
  return (
    <div className="flex flex-col items-center py-2 container mx-auto xl:max-w-7xl gap-6 ">
      <div className="flex justify-between items-center w-full px-6">
        <div>{title}</div>
        <div className="flex items-center gap-4">
          {genderType ? <GenderType /> : "Timer"}
          <div className="hidden md:flex items-center justify-between gap-4 ">
            <div>watch all</div>
            <div>icon</div>
          </div>
        </div>
      </div>
      <div
        className={`flex items-center w-full scrollbarX px-10 snap-x gap-4 md:gap-6 ${className}`}
      >
        {children}
      </div>
      {/* <div className="">scrol bar</div> */}
      <div className="flex items-center justify-between gap-4 p-6 md:hidden">
        <div>watch all</div>
        <div>icon</div>
      </div>
    </div>
  );
}

export default HomePageProducts;
