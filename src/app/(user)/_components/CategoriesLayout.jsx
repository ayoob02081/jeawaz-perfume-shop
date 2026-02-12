"use client";

import Error from "@/components/Error";
import ImageFrame from "@/components/ImageFrame";
import Loading from "@/components/Loading";
import { useGetAllCategories } from "@/hooks/useCategories";
import { useGetAllProducts } from "@/hooks/useProducts";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

function CategoriesLayout() {
  const { data, isLoading, error } = useGetAllCategories();

  const genders = data?.filter((item) => item.type === "gender");

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Error />;
  }

  return (
    <div className="flex flex-col justify-between items-center py-4 container mx-auto xl:max-w-7xl">
      <div className="flex justify-center items-center gap-1 w-full px-6 mb-6 text-base sm:text-[28px] font-bold">
        <h2 className="text-primary">دسته‌بندی</h2>
        <ImageFrame
          src="/images/star-8-icon.svg"
          alt="star icon"
          className="max-sm:size-4 text-icon-black sm:size-9"
        />
        <h2 className="text-text-primary">محصولات ما</h2>
      </div>
      <div className="mx-6 flex flex-col sm:w-full sm:px-36 md:px-6 md:flex-row gap-4 sm:gap-6 items-center justify-between scroll--x overflow-hidden sm:overflow-x-auto rounded-2xl">
        {isLoading ? (
          <Loading />
        ) : (
          genders?.map((category) => (
            <div key={category.id} className="sm:snap-center">
              <CategoreyCard
                src={category.imageUrl}
                alt={category.imageUrl}
                value={category.value}
                label={category.description}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CategoriesLayout;

function CategoreyCard({ src, alt, value, label }) {
  const { data, isLoading, error } = useGetAllProducts();

  const router = useRouter();
  const product = data?.filter((p) => p.categories.gender === value);

  const quantity = product?.length || 0;

  return (
    <div className="flex gap-2 w-[21.6rem] h-24 md:w-[26.3rem] md:h-36 justify-center items-center justify-items-center bg-white rounded-2xl border-[1.5px] border-[#EBEBEB] ">
      <div className="h-full self-start justify-self-start px-4">
        <div className="flex items-center justify-center h-20 w-16 md:w-[5.25rem] md:h-28 rounded-b-xl bg-grey">
          <ImageFrame
            src={src}
            alt={alt}
            className="h-14 w-9 grow max-md:size-9 justify-center md:size-14"
          />
        </div>
      </div>
      <div className="grow flex flex-col gap-1 p-4">
        <p className="font-bold text-sm sm:text-xl">{label}</p>
        <p className="text-text-secondary text-sm sm:text-xl">
          {toPersianNumbers(quantity)} محصول
        </p>
      </div>
      <button
        onClick={() => router.push("/products")}
        className="justify-self-end self-end p-4"
      >
        <ArrowLeftIcon className="size-4 sm:size-5 text-primary" />
      </button>
    </div>
  );
}
