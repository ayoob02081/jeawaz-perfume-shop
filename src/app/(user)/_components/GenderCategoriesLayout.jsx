"use client";

import Error from "@/components/Error";
import AppImage from "@/components/AppImage";
import Loading from "@/components/Loading";
import { useGetAllCategories } from "@/hooks/useCategories";
import { useGetAllProducts } from "@/hooks/useProducts";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

function GenderCategoriesLayout() {
  const { data, isLoading, error } = useGetAllCategories();

  const genders = data?.filter((item) => item.type === "gender");

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Error />;
  }

  return (
    <section className="flex flex-col justify-between items-center py-4 container mx-auto xl:max-w-7xl">
      <div className="flex justify-center items-center gap-1 w-full px-6 mb-6 text-base sm:text-[28px] font-bold">
        <h2 className="text-primary">دسته‌بندی</h2>
        <AppImage
          src="/images/star-8-icon.svg"
          alt="star-icon"
          className="text-icon-black"
          width="max-sm:size-4 sm:size-9"
          sizes="10vw"
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
                alt={category.value + "-image"}
                value={category.value}
                label={category.title}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default GenderCategoriesLayout;

function CategoreyCard({ src, alt, value, label }) {
  const { data, isLoading, error } = useGetAllProducts();

  const router = useRouter();
  const product = data?.filter((p) => p.categories.gender === value);

  const quantity = product?.length || 0;

  return (
    <div className="flex h-24 md:h-[140px] aspect-[7/2] md:aspect-[9/3] justify-center items-center justify-items-center bg-white rounded-2xl border-[1.5px] border-[#EBEBEB] ">
      <div className="h-full self-start justify-self-start px-4">
        <div className="relative flex items-center justify-center aspect-[8/10] md:aspect-[10/13] w-16 md:w-[5.25rem] p-3 rounded-b-xl bg-grey">
          <AppImage
            src={src}
            alt={alt}
            className="grow justify-center -rotate-12"
            objectFit="cover"
            sizes="10vw"
          />
          <div className="absolute bottom-1/6 blur-md w-2/3 h-1 md:h-1.5 bg-text-secondary rounded-full"></div>
        </div>
      </div>
      <div className="grow flex flex-col gap-1 p-4">
        <span className="flex items-center justify-start gap-1 font-bold text-sm sm:text-xl">
          <p className="text-text">عطرهای</p>
          <p className="text-primary">{label}</p>
        </span>
        <p className="text-text-secondary text-sm sm:text-lg md:font-bold">
          {toPersianNumbers(quantity)} محصول
        </p>
      </div>
      <button
        onClick={() => router.push("/products")}
        className="justify-self-end self-end p-4"
      >
        <ArrowLeftIcon className="size-5 sm:size-6 text-primary" />
      </button>
    </div>
  );
}
