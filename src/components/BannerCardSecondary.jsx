import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import ImageFrame from "./ImageFrame";

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

      <button className="absolute bottom-8 sm:bottom-12 xl:bottom-14 right-5 sm:right-7 xl:right-9 font-bold text-[8px] sm:text-[10px] xl:text-xs 2xl:text-sm text-text-primary bg-white-10 backdrop-blur-md rounded-4xl">
        <div className=" flex items-center h-5 sm:h-6 xl:h-8 2xl:h-8 ">
          <p className=" px-1.5 lg:px-2.5 py-1 h-full flex items-center justify-center bg-white hover:bg-white-10 hover:backdrop-blur-md text-black hover:text-white rounded-4xl duration-200 ">
            مشاهده محصولات
          </p>
          <div className="pl-1.5 pr-1 py-1 text-white">
            <ArrowLeftIcon className="size-2 sm:size-3 xl:size-4" />
          </div>
        </div>
      </button>
    </div>
  );
}

export default BannerCardSecondary;
