import React from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useGetAllCategories } from "@/hooks/useCategories";
import RHFRadioButton from "@/ui/RHFRadioButton";
import { useForm } from "react-hook-form";

function HomePageProducts({
  titleOne,
  titleTwo,
  desc,
  genderType,
  children,
  className,
  bgColor,
}) {
  return (
    <section
      className={`flex flex-col items-center py-2 container mx-auto xl:max-w-7xl gap-6 snap-x ${bgColor}`}
    >
      {/* Info */}
      <section className="flex justify-between items-center gap-2 w-full px-6">
        {/* Title */}
        <div className="flex flex-col items-start justify-center md:items-start gap-2 w-full text-nowrap">
          <div className="flex items-center gap-1">
            <h2 className="text-lg sm:text-xl md:text-[28px] font-bold text-primary">
              {titleOne}
            </h2>
            <h2 className="text-lg sm:text-xl md:text-[28px] font-bold text-stroke-800">
              {titleTwo}
            </h2>
          </div>
          <p className="text-xs sm:text-sm md:text-lg text-stroke-600">
            {desc}
          </p>
        </div>

        {/* Gender Type */}
        <div className="flex items-end gap-4 max-sm:overflow-x-scroll scrollbar-none max-sm:w-full">
          {genderType ? <GenderType /> : "Timer"}
          <Link
            href="/products"
            className="hidden md:flex items-center justify-between gap-4 pr-3 border-r-[1.5px] border-stroke-200 text-primary hover:text-primary/70 active:text-primary/70 duration-200"
          >
            <p className="text-lg text-nowrap">مشاهده همه</p>
            <ArrowLeftIcon className=" max-md:size-[1.1rem] size-6" />
          </Link>
        </div>
      </section>

      {/* Products */}
      <section
        className={`flex items-center w-full scroll--x px-10 snap-x gap-4 md:gap-6 ${className}`}
      >
        {children}
      </section>

      <Link
        href="/products"
        className="flex items-center justify-between gap-4 p-6 text-primary md:hidden hover:text-primary/70 active:text-primary/70 duration-200"
      >
        <p>مشاهده همه</p>
        <ArrowLeftIcon className="max-md:size-[1.1rem] size-6" />
      </Link>
    </section>
  );
}

export default HomePageProducts;

function GenderType() {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
  } = useForm({ genderId: null });

  const { data: categories, isPending, error } = useGetAllCategories();
  const genderCategories = categories?.filter((c) => c.type === "gender");

  return (
    <div className="flex items-center max-[432px]:justify-between justify-end gap-1 max-sm:w-full">
      {genderCategories?.map((gender) => {
        const isChecked =
          Number(watch("genderId")) === gender.id ? true : false;
        return (
          <RHFRadioButton
            key={gender.id}
            className=""
            checked={isChecked}
            value={gender.id}
            name="genderId"
            register={register}
          >
            <div
              className={`btn border-[1.5px] max-sm:w-15 sm:w-20 text-sm py-1 px-3 rounded-4xl hover:opacity-70 duration-200 ${isChecked ? " border-primary text-primary font-bold" : "text-stroke-800 border-stroke-200"}`}
            >
              <p className="duration-200">{gender.title}</p>
            </div>
          </RHFRadioButton>
        );
      })}
    </div>
  );
}
