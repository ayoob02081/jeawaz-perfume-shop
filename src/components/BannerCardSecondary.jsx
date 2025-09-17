import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

function BannerCardSecondary() {
  return (
    <div className="relative bannerSecondarySize rounded-2xl from-30% via-40 bg-linear-to-r to-[#211E1A] border   ">
      <div className="flex items-center justify-center text-white">
        <img
          src="/images/banner2 md.png"
          alt="banner image"
          className="size-full"
        />
      </div>

      <Link
        href={"/products"}
        className="absolute bottom-8 sm:bottom-12 xl:bottom-14 bg-white/10 backdrop-blur-md text-text-primary hover:**:bg-transparent hover:**:text-text-primary right-5 sm:right-7 xl:right-9 font-bold text-[8px] sm:text-[10px] xl:text-xs 2xl:text-sm rounded-4xl duration-200 hover:**:duration-200"
      >
        <div className=" flex items-center h-5 sm:h-6 xl:h-8 2xl:h-8 ">
          <p className=" px-1.5 lg:px-2.5 py-1 h-full flex items-center bg-white justify-center rounded-4xl duration-200 ">
            مشاهده محصولات
          </p>
          <div className="pl-1.5 pr-1 py-1 text-white duration-200">
            <ArrowLeftIcon className="size-2 sm:size-3 xl:size-4" />
          </div>
        </div>
      </Link>
    </div>
  );
}

export default BannerCardSecondary;
