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
      <button className="absolute bottom-6 right-5 text-xs text-text-primary bg-white-10 backdrop-blur-md rounded-4xl">
        <div className=" flex items-center ">
          <p className="w-[4.9rem] h-5 px-1.5 py-1 text-[8px] bg-white hover:bg-white-10 hover:backdrop-blur-md text-black hover:text-white rounded-4xl duration-200 ">
            watch products
          </p>
          <div className=" px-2 py-1 text-white">
            <ArrowLeftIcon className="size-2" />
          </div>
        </div>
      </button>
    </div>
  );
}

export default BannerCardSecondary;
