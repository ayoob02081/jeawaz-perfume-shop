import Skeleton from "@/ui/Skeleton";

function ProductCardSkeleton() {
  return (
    <article className="flex items-center justify-center p-4 max-md:pr-0 h-54 md:h-115.5 aspect-2/3 max-md:min-w-78 bg-stroke-0 dark:bg-stroke-50 rounded-2xl border-[1.5px] border-stroke-250 animate-pulse">
      <div className="flex items-start justify-between size-full">
        {/* Mobile Image */}
        <div className="flex flex-none md:hidden items-center justify-center p-2 h-25 aspect-4/5">
          <Skeleton className="size-full rounded-xl" />
        </div>
        <div className="flex grow flex-col justify-between size-full">
          {/* Top */}
          <div className="flex flex-col justify-center size-full">
            {/* Category Icons */}
            <div className="flex flex-none items-center justify-between max-md:mb-4 mb-1">
              <div className="flex gap-2">
                <Skeleton className="max-md:size-8 md:size-10 rounded-full" />
                <Skeleton className="max-md:size-8 md:size-10 rounded-full" />
                <Skeleton className="max-md:size-8 md:size-10 rounded-full" />
              </div>
              <Skeleton className="max-md:size-8 md:size-10 rounded-full" />
            </div>

            {/* Desktop Image */}
            <div className="grow max-md:hidden md:flex items-center justify-center">
              <Skeleton className="w-3/4 h-3/4 rounded-2xl" />
            </div>
          </div>

          {/* Product Description */}
          <div>
            {/* Brand */}
            <div className="flex items-center justify-between mb-2 md:mt-2 h-6">
              <Skeleton className="w-20 h-4" />
              <Skeleton className="w-16 h-5 rounded-md" />
            </div>

            {/* Name */}
            <div className="flex flex-col gap-2 max-md:pb-3 md:pb-6 border-b border-stroke-250">
              <Skeleton className="w-3/4 h-5" />
              <Skeleton className="w-1/2 h-4" />
            </div>

            {/* Price */}
            <div className="flex items-center justify-between gap-4 w-full pt-2">
              <div className="flex flex-col gap-2">
                <Skeleton className="w-20 h-4" />
                <Skeleton className="w-28 h-5 md:h-7" />
              </div>
              <Skeleton className="w-16 h-9 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default ProductCardSkeleton;
