"use client";

import Error from "@/components/Error";
import AppImage from "@/components/AppImage";
import Loading from "@/components/Loading";
import { useGetAllCategories } from "@/hooks/useCategories";
import { useGetAllProducts } from "@/hooks/useProducts";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

function AccordCategoriesLayout() {
  const { data: categories, isLoading, error } = useGetAllCategories();
  const accordCategories = categories?.filter((c) => c.type === "accord");

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Error />;
  }

  return (
    <section className="flex flex-col justify-between items-center container mx-auto xl:max-w-7xl py-4">
      <div className="flex justify-center items-center gap-1 w-full px-6 text-base sm:text-[28px] font-bold">
        <h2 className="text-primary">هر رایحه</h2>
        <AppImage
          src="/images/star-8-icon.svg"
          alt="star-icon"
          className="dark:invert"
          width="max-sm:size-4 sm:size-9"
          sizes="10vw"
        />
        <h2 className="text-stroke-800">دنیایی متفاوت</h2>
      </div>
      <div className="flex gap-4 justify-between items-center w-full px-16 my-6 scroll--x rounded-2xl">
        {isLoading ? (
          <Loading />
        ) : (
          accordCategories.map((accord) => (
            <FilterCard
              key={accord.id}
              src={accord.imageUrl}
              alt={accord.value + "-image"}
              value={accord.value}
              label={accord.title}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default AccordCategoriesLayout;

function FilterCard({ src, alt, value, label }) {
  const { data, isLoading, error } = useGetAllProducts();

  const router = useRouter();
  const product = data?.filter((p) => p.categories.accords.includes(value));

  const quantity = product?.length || 0;

  return (
    <div className="snap-center">
      <div className="flex h-24 sm:!h-[7.5rem] aspect-[9/3] sm:aspect-[5/2] justify-between items-center px-3 bg-stroke-0 dark:bg-stroke-50 rounded-2xl border-[1.5px] border-stroke-250 ">
        <div className="relative flex items-center justify-center h-full px-4">
          <div className=" flex items-center justify-center aspect-square h-16 md:h-20 rounded-xl">
            <AppImage
              src={src}
              alt={alt}
              className=" justify-center -rotate-12 z-10"
              objectFit="cover"
              sizes="10vw"
            />
          </div>
          <div className="absolute bottom-1/6 blur-[10px] w-1/2 h-1 sm:h-1.5 bg-stroke-600 rounded-full"></div>
        </div>
        <div className="grow flex flex-col gap-2 py-4 justify-self-start">
          <span className="flex items-center justify-start gap-1">
            <p className="text-stroke-600 text-xs sm:text-sm">رایحه</p>
            <p className="font-bold text-stroke-800 text-base sm:text-lg">
              {label}
            </p>
          </span>
          <p className="text-stroke-600 text-xs sm:text-sm">
            {toPersianNumbers(quantity)} محصول
          </p>
        </div>
        <button
          onClick={() => router.push("/products")}
          className="flex-none justify-self-end self-end px-2 pb-5"
        >
          <ArrowLeftIcon className="size-5 text-stroke-800" />
        </button>
      </div>
    </div>
  );
}
