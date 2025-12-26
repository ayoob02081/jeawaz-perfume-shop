"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";

function SelectOptionGroup({ children, className, onClick, dropOpen }) {
  return (
    <div className="relative md:w-56 ">
      <button
        className="flex justify-between items-center w-full md:h-12 gap-3 md:bg-grey focus-within:bg-white focus-within:border-[1.5px] border-stroke rounded-4xl outline-0 border-0 duration-200 px-3 md:px-8 py-1"
        onClick={onClick}
      >
        <p className="text-xs md:text-sm">مرتب سازی</p>
        <ChevronDownIcon
          className={`size-4 ${dropOpen && "rotate-180"} duration-200`}
        />
      </button>

      {dropOpen && (
        <ul
          className={`absolute w-full top-9 md:top-14 flex flex-col justify-start items-start gap-2 md:gap-1 text-nowrap text-xs md:text-sm px-1 py-1 border-[1.5px] border-stroke shadow-xs rounded-xl text-text-secondary z-20 bg-white  duration-200
        `}
        >
          {children}
        </ul>
      )}
    </div>
  );
}

export default SelectOptionGroup;
