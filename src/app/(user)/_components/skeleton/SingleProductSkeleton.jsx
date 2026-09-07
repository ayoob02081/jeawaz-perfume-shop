"use client";

import Skeleton from "@/ui/Skeleton";

function SingleProductSkeleton() {
  return (
    <main className="md:container md:mx-auto xl:max-w-7xl h-full">
      {/* ================= BREADCRUMB ================= */}{" "}
      <article className="max-md:hidden">
        {" "}
        <div className="flex items-center gap-3 py-4">
          {" "}
          <Skeleton className="w-16 h-4" />{" "}
          <Skeleton className="size-3 rounded-full" />{" "}
          <Skeleton className="w-20 h-4" />{" "}
          <Skeleton className="size-3 rounded-full" />{" "}
          <Skeleton className="w-40 h-4" />{" "}
        </div>{" "}
      </article>
      <article className="grid grid-cols-1 md:grid-cols-2 h-full gap-6 md:gap-x-6 lg:gap-6 w-full md:p-6">
        {/* ================= IMAGE SWIPER ================= */}
        <section
          dir="ltr"
          className="relative flex flex-col lg:flex-row lg:aspect-6/5 lg:pr-4 gap-4 max-sm:rounded-2xl max-md:rounded-3xl max-md:bg-stroke-150 max-md:dark:bg-stroke-50"
        >
          {/* Main Image */}
          <div className="lg:flex-1">
            <div className="relative overflow-hidden aspect-square md:rounded-2xl md:bg-stroke-150 md:dark:bg-stroke-50">
              {/* Main product image */}
              <div className="flex items-center justify-center size-full">
                <Skeleton className="w-3/5 h-4/5 max-md:w-3/4 rounded-2xl" />
              </div>

              {/* Share Button */}
              <Skeleton className="absolute top-5 max-md:left-3 md:right-3 size-12 md:size-10 xl:size-12 rounded-full" />

              {/* Edit button placeholder */}
              <Skeleton className="absolute top-5 max-md:right-3 md:left-3 size-12 md:size-10 xl:size-12 rounded-full" />

              {/* Desktop navigation */}
              <div className="max-md:hidden absolute flex items-center gap-1 bottom-5 right-3">
                <Skeleton className="md:size-8 xl:size-10 rounded-full" />
                <Skeleton className="md:size-8 xl:size-10 rounded-full" />
              </div>
            </div>
          </div>

          {/* ================= THUMBNAILS ================= */}
          <div className="flex flex-col max-md:px-4 lg:justify-start">
            <div className="max-sm:p-4 max-md:p-6 max-lg:h-full lg:w-24 overflow-hidden">
              <div className="flex max-lg:justify-start lg:justify-center lg:flex-col gap-3 max-lg:px-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton
                    key={index}
                    className="relative aspect-square max-[30rem]:size-18 max-md:size-26 md:size-20 lg:size-full rounded-xl"
                  />
                ))}
              </div>
            </div>

            {/* Desktop thumbnail controls */}
            <div className="max-lg:hidden lg:h-28 lg:w-full lg:flex lg:flex-col lg:gap-1 lg:items-center lg:pt-4">
              <Skeleton className="lg:size-8 xl:size-10 rounded-full" />
              <Skeleton className="lg:size-8 xl:size-10 rounded-full" />
            </div>
          </div>
        </section>

        {/* ================= PRODUCT DESCRIPTION ================= */}
        <section className="grid grid-cols-1 w-full gap-y-4 xl:gap-y-10 max-md:py-6 h-fit justify-items-start">
          {/* Product Name */}
          <div className="flex flex-col gap-2 items-start justify-start w-full">
            <div className="flex items-center max-md:justify-between gap-2 md:justify-start w-full">
              <Skeleton className="w-3/4 md:w-2/3 h-9 rounded-lg" />

              {/* Mobile Brand */}
              <Skeleton className="md:hidden w-20 h-10 rounded-lg" />
            </div>

            <Skeleton className="w-1/2 h-5" />
          </div>

          {/* ================= PRODUCT TYPE ================= */}
          <section className="flex items-center justify-between w-full max-md:border-t border-stroke-250 pt-4">
            <div className="flex flex-col justify-between gap-5 w-full md:row-start-3 h-full overflow-hidden">
              {/* Type */}
              <div className="flex flex-col items-start justify-start gap-3">
                <Skeleton className="w-24 h-5" />

                <div className="flex items-center justify-start gap-2">
                  <Skeleton className="w-20 h-10 rounded-full" />
                  <Skeleton className="w-28 h-10 rounded-full" />
                </div>
              </div>

              {/* Volume */}
              <div className="flex flex-col items-start justify-start gap-3">
                <Skeleton className="w-24 h-5" />

                <div className="flex items-center justify-start gap-2 w-full">
                  <Skeleton className="w-16 h-10 rounded-full" />
                  <Skeleton className="w-16 h-10 rounded-full" />
                  <Skeleton className="w-16 h-10 rounded-full" />
                  <Skeleton className="w-16 h-10 rounded-full" />
                </div>
              </div>
            </div>
          </section>

          {/* ================= PRICE ================= */}
          <div className="flex items-center md:justify-between max-md:justify-end w-full md:row-start-2">
            <div className="flex flex-col gap-2">
              {/* Old price */}
              <Skeleton className="w-24 h-4" />

              {/* Main price */}
              <Skeleton className="w-44 h-10 rounded-lg" />
            </div>

            {/* Desktop brand */}
            <Skeleton className="max-md:hidden w-24 xl:w-28 h-10 rounded-lg" />
          </div>

          {/* ================= CART BUTTON ================= */}
          <div className="flex items-center justify-between w-full gap-4">
            <Skeleton className="grow h-12 rounded-xl" />
          </div>

          {/* ================= DESCRIPTION ACCORDION ================= */}
          <div className="max-md:hidden flex flex-col gap-4 w-full">
            <Skeleton className="w-full h-px" />

            <div className="flex items-center justify-between">
              <Skeleton className="w-36 h-6" />
              <Skeleton className="size-5 rounded-full" />
            </div>
          </div>
        </section>

        {/* ================= PRODUCT OPTIONS ================= */}
        <section className="grow w-full max-md:border-t-[1.5px] md:border-[1.5px] md:rounded-2xl max-md:pt-6 md:p-4 border-stroke-250">
          <section className="flex flex-col items-center justify-start gap-6 w-full">
            {/* Header */}
            <div className="flex items-center justify-start gap-2 w-full">
              <Skeleton className="size-6 rounded-md" />
              <Skeleton className="w-32 h-5" />
            </div>

            {/* Options */}
            <div className="grid max-sm:grid-cols-3 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-3 gap-x-4 w-full px-2">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="contents">
                  {/* Label */}
                  <Skeleton className="col-span-1 w-20 h-4 self-center" />

                  {/* Value */}
                  <Skeleton className="max-sm:col-span-2 sm:col-span-3 md:col-span-1 lg:col-span-2 w-full h-4 mb-3" />
                </div>
              ))}
            </div>
          </section>
        </section>

        {/* ================= PRODUCT NOTES ================= */}
        <section className="grow flex flex-col items-center justify-between gap-6 size-full md:px-4 max-md:row-start-3 max-md:border-t-[1.5px] md:border-[1.5px] md:rounded-2xl py-6 border-stroke-250">
          {/* Header */}
          <div className="flex flex-col items-start justify-between gap-2 w-full">
            <div className="flex items-center justify-start gap-2">
              <Skeleton className="size-6 rounded-md" />
              <Skeleton className="w-28 h-5" />
            </div>

            <Skeleton className="w-3/4 h-4" />
          </div>

          {/* Notes pyramid */}
          <div className="flex flex-col items-center justify-end gap-2 size-full max-md:min-h-[28vh]">
            {/* Base note */}
            <div className="flex flex-col items-center justify-center gap-2 w-full h-1/5">
              <Skeleton className="w-1/2 h-4" />
              <Skeleton className="w-2/3 h-3" />
            </div>

            {/* Middle note */}
            <div className="flex flex-col items-center justify-center gap-2 w-full h-1/4">
              <Skeleton className="w-2/3 h-4" />
              <Skeleton className="w-4/5 h-3" />
            </div>

            {/* Top note */}
            <div className="flex flex-col items-center justify-center gap-2 w-full h-1/2">
              <Skeleton className="w-3/4 h-4" />
              <Skeleton className="w-full h-3" />
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}

export default SingleProductSkeleton;
