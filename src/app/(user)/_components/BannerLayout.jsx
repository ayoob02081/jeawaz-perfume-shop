import ImageFrame from "@/components/ImageFrame";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

function BannerLayout() {
  return (
    <div className="flex items-center justify-center gap-4 mt-6 container mx-auto">
      <div className="flex gap-6 sm:gap-10 px-20 justify-evenly items-center w-full scroll--x rounded-2xl xl:first:pr-[10%] 2xl:first:pr-[20%] xl:last:pl-[10%] 2xl:last:pl-[20%]">
        <div className="snap-center">
          <BannerCard />
        </div>
        <div className="snap-center">
          <BannerCard />
        </div>
        <div className="snap-center">
          <BannerCard />
        </div>
      </div>
    </div>
  );
}

export default BannerLayout;

function BannerCard() {
  return (
    <div className="relative flex items-center justify-center bannerSize border-2 border-primary/10 rounded-xl md:rounded-3xl overflow-hidden ">
      <ImageFrame
        src="/images/Banner1 xl.jpg"
        alt="Banner"
        className="size-full max-sm:hidden"
        objectFit="cover"
      />
      <ImageFrame
        src="/images/Banner1.png"
        alt="Banner"
        className="size-full sm:hidden"
        objectFit="cover"
      />
      <div className="absolute bottom-7 md:bottom-9 lg:bottom-12 right-5 md:right-6 lg:right-7 flex items-center justify-start gap-4">
        <Link
          href={"/products"}
          className="h-8 sm:h-[2.03rem] xl:h-[2.6rem] 2xl:h-12 flex items-center justify-between gap-2 px-3.5 sm:px-3 py-2 sm:py-2 text-white bg-primary hover:text-primary hover:bg-white hover:ring-primary ring-4 sm:ring-2 ring-primary/10 rounded-4xl duration-300"
        >
          <p className="text-xs sm:text-[10px] lg:text-xs xl:text-base font-bold">
            مشاهده محصولات
          </p>
          <div>
            <ArrowLeftIcon className="size-4" />
          </div>
        </Link>
        <div className="flex items-center justify-between gap-2 max-sm:hidden">
          <button className="btn h-8 sm:h-[2.03rem] xl:h-[2.6rem] 2xl:h-12 rounded-full py-1 px-2 xl:px-2.5 2xl:px-3.5 ring-4 sm:ring-2 ring-primary/10 border-0 text-white bg-orange-950 hover:text-orange-950  hover:bg-white hover:ring-orange-950 duration-300">
            <ImageFrame
              src="/images/headphone-1-white-icon.svg"
              alt="headphone icon"
              className="max-xl:size-4 xl:size-5"
            />
          </button>
          <p className="text-xs sm:text-[10px] lg:text-xs xl:text-base text-whie font-bold">
            دریافت مشاوره
          </p>
        </div>
      </div>
    </div>
  );
}
