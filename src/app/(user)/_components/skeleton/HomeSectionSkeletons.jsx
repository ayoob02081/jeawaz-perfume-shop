import Skeleton from "@/ui/Skeleton";

// Loading placeholders for the Home banner and category sections. Each one
// keeps the real component's outer geometry (height, aspect ratio, radius,
// border) so nothing shifts when the data arrives.

// PrimaryBannerCard inside the one-slide Swiper; the dots and arrows are
// overlays and take no layout space, so they are not drawn.
export function PrimaryBannerSkeleton() {
  return (
    <section className="relative container mx-auto xl:max-w-7xl mt-2 w-full px-2 sm:px-4">
      <Skeleton
        className="w-full banner--primary"
        rounded="rounded-xl md:rounded-3xl"
      />
    </section>
  );
}

export function SecondaryBannerSkeletons({ count }) {
  return (
    <section className="container mx-auto xl:max-w-7xl flex flex-row flex-wrap items-center justify-evenly gap-4">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton
          key={index}
          className="banner--secondary"
          rounded="rounded-2xl xl:rounded-3xl"
        />
      ))}
    </section>
  );
}

// GenderCategoriesLayout's CategoreyCard.
export function GenderCategoryCardSkeletons({ count }) {
  return Array.from({ length: count }, (_, index) => (
    <div key={index} className="sm:snap-center">
      <div className="flex h-24 md:h-35 max-[365px]:aspect-6/2 aspect-7/2 md:aspect-9/3 justify-center items-center justify-items-center bg-stroke-0 dark:bg-stroke-50 rounded-2xl border-[1.5px] border-stroke-250">
        <div className="h-full self-start px-4">
          <Skeleton
            className="aspect-8/10 md:aspect-10/13 w-16 md:w-21"
            rounded="rounded-b-xl"
          />
        </div>
        <div className="grow flex flex-col gap-2 p-4 justify-center items-start">
          <Skeleton className="w-28 sm:w-36 h-5 sm:h-7" />
          <Skeleton className="w-16 sm:w-20 h-4 sm:h-6" />
        </div>
        <div className="self-end p-4">
          <Skeleton className="size-5 sm:size-6" rounded="rounded-full" />
        </div>
      </div>
    </div>
  ));
}

// AccordCategoriesLayout's FilterCard.
export function AccordCategoryCardSkeletons({ count }) {
  return Array.from({ length: count }, (_, index) => (
    <div key={index} className="snap-center">
      <div className="flex h-24 sm:h-30! aspect-9/3 sm:aspect-5/2 justify-between items-center px-3 bg-stroke-0 dark:bg-stroke-50 rounded-2xl border-[1.5px] border-stroke-250">
        <div className="flex items-center justify-center h-full px-4">
          <Skeleton className="aspect-square h-16 md:h-20" rounded="rounded-xl" />
        </div>
        <div className="grow flex flex-col gap-2 p-4 justify-center items-start">
          <Skeleton className="w-24 sm:w-28 h-5 sm:h-6" />
          <Skeleton className="w-16 sm:w-20 h-4 sm:h-6" />
        </div>
        <div className="flex-none self-end px-2 pb-5">
          <Skeleton className="size-5" rounded="rounded-full" />
        </div>
      </div>
    </div>
  ));
}
