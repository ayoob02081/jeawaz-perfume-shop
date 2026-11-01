import React from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useGetCategoriesByType } from "@/hooks/useCategories";

function HomePageSortProductsLayout({
  gender,
  params,
  onGenderClick,
  title,
  des,
  desc,
  genderType,
  timer,
  children,
  className,
  bgColor,
}) {
  return (
    <section
      className={`flex flex-col items-center py-2 container mx-auto xl:max-w-7xl gap-6 snap-x ${bgColor}`}
    >
      {/* Info */}
      <section className="flex justify-between items-center gap-2 w-full px-4 z-10">
        {/* Title */}
        <div className="flex flex-col items-start justify-center md:items-start gap-2 w-full text-nowrap">
          <div className="flex items-center gap-1 text-nowrap">
            <h2 className="text-lg sm:text-xl md:text-[28px] font-bold text-primary">
              {title}
            </h2>
            <h2 className="text-lg sm:text-xl md:text-[28px] font-bold text-stroke-800">
              {des}
            </h2>
          </div>
          <p className="text-xs sm:text-sm md:text-lg text-stroke-600">
            {desc}
          </p>
        </div>

        {/* Gender Type */}
        <div className="flex justify-end gap-4 max-sm:overflow-x-scroll scrollbar-none max-sm:w-full">
          {genderType ? (
            <GenderType gender={gender} onClick={onGenderClick} />
          ) : (
            timer
          )}
          <Link
            href={`/products?${params.toString()}`}
            className="hidden md:flex items-center justify-between gap-4 pr-3 border-r-[1.5px] border-stroke-200 text-primary hover:text-primary/70 active:text-primary/70 duration-200 z-10"
          >
            <p className="text-lg text-nowrap">مشاهده همه</p>
            <ArrowLeftIcon className=" max-md:size-[1.1rem] size-6" />
          </Link>
        </div>
      </section>

      {/* Products */}
      <section
        className={`flex items-center w-full overflow-hidden scrollbar-none px-10 snap-x gap-4 md:gap-6 ${className}`}
      >
        {children}
      </section>

      <Link
        href={`/products?${params.toString()}`}
        className="flex items-center justify-between gap-4 p-6 text-primary md:hidden hover:text-primary/70 active:text-primary/70 duration-200 z-10"
      >
        <p>مشاهده همه</p>
        <ArrowLeftIcon className="max-md:size-[1.1rem] size-6" />
      </Link>
    </section>
  );
}

export default HomePageSortProductsLayout;

function GenderType({ onClick, gender }) {
  const {
    data: categories,
    isPending,
    error,
  } = useGetCategoriesByType("gender");

  return (
    <div className="flex items-center max-[24.5rem]:justify-start justify-end gap-1 max-sm:w-full">
      {categories?.map((g) => (
        <button
          key={g.id}
          onClick={() => onClick(g?.slug)}
          className={`btn border-[1.5px] text-sm py-1 max-[30rem]:px-2 px-3 rounded-4xl
            duration-200 md:hover:border-primary md:hover:text-primary ${g.slug === gender ? "border-primary text-primary font-bold" : "text-stroke-800 border-stroke-200"}`}
        >
          <p className="duration-200">{g.title}</p>
        </button>
      ))}
    </div>
  );
}
