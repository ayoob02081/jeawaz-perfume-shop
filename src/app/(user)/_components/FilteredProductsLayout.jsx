"use client";

import ImageFrame from "@/components/ImageFrame";
import Loading from "@/components/Loading";
import { useGetAllAccordCategories } from "@/hooks/useCategories";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

function FilteredProductsLayout() {
  const { data, isLoading, error } = useGetAllAccordCategories();

  return (
    <div className="flex flex-col justify-between items-center container mx-auto xl:max-w-7xl py-4">
      <div className="flex justify-center items-center gap-1 w-full px-6 text-base sm:text-[28px] font-bold">
        <h2 className="text-primary">هر رایحه</h2>
        <ImageFrame
          src="/images/star-8-icon.svg"
          alt="star icon"
          className="max-sm:size-4 text-icon-black sm:size-9"
        />
        <h2 className="text-text-primary">دنیایی متفاوت</h2>
      </div>
      <div className="flex gap-4 justify-between items-center w-full px-16 my-6 scrollbarX rounded-2xl">
        {isLoading ? (
          <Loading />
        ) : (
          data?.map((accord) => (
            <FilterCard
              key={accord.id}
              src={accord.imageUrl}
              alt={accord.imageUrl}
              value={accord.accord}
              label={accord.title}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default FilteredProductsLayout;

function FilterCard({ src, alt, value, label }) {
  const router = useRouter();

  return (
    <div className="snap-center">
      <div className="flex w-72 h-24 sm:h-[7.5rem] justify-centr items-center gap-2 bg-white rounded-2xl border-[1.5px] border-[#EBEBEB] ">
        <div className="grow flex items-center justify-center size-16 sm:size-20 rounded-xl">
          <ImageFrame
            src={src}
            alt={alt}
            className="h-20 grow max-sm:size-[4.5rem] justify-center sm:size-20"
          />
        </div>
        <div className="grow flex flex-col gap-2 py-4 justify-self-start">
          <p className="font-bold text-sm sm:text-base">{label}</p>
          <p className="text-text-secondary text-xs sm:text-sm">
            {toPersianNumbers(value)} محصول
          </p>
        </div>
        <button
          onClick={() => router.push("/products")}
          className="flex-none justify-self-end self-end px-4 pb-6"
        >
          <ArrowLeftIcon className="size-4 sm:size-5 text-black" />
        </button>
      </div>
    </div>
  );
}
