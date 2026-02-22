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
  section,
}) {
  return (
    <div
      className={`flex flex-col items-center py-2 container mx-auto xl:max-w-7xl gap-6 ${bgColor}`}
    >
      <div className="flex justify-between items-center w-full px-6">
        <div className="flex flex-col items-start justify-center md:items-start gap-2 w-full">
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
        <div className="flex items-end gap-4">
          {genderType ? <GenderType /> : "Timer"}
          <Link
            href={"/"}
            className="hidden md:flex items-center justify-between gap-4 pr-3 border-r-[1.5px] border-stroke"
          >
            <div className="text-lg text-primary text-nowrap">مشاهده همه</div>
            <div className="text-primary max-md:size-[1.1rem] size-6">
              <ArrowLeftIcon />
            </div>
          </Link>
        </div>
      </div>
      <div
        className={`flex items-center w-full scroll--x px-10 snap-x gap-4 md:gap-6 ${className}`}
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
    <div className="flex items-center justify-between gap-1">
      {genderCategories.map((gender) => {
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
              className={`btn border-[1.5px] max-sm:w-15 sm:w-20 text-sm py-1 px-3 rounded-4xl duration-200 ${isChecked ? " border-primary text-primary font-bold" : "text-black border-stroke"}`}
            >
              <p className="duration-200">{gender.title}</p>
            </div>
          </RHFRadioButton>
        );
      })}
    </div>
  );
}
