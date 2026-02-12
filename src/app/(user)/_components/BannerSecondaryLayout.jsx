import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

function BannerSecondaryLayout() {
  return (
    <div className="container mx-auto xl:max-w-7xl flex flex-row flex-wrap items-center justify-evenly gap-4 scroll--x">
      <div className="snap-center">
        <BannerCardSecondary />
      </div>
      <div className="snap-center ">
        <BannerCardSecondary />
      </div>
    </div>
  );
}

export default BannerSecondaryLayout;

function BannerCardSecondary() {
  return (
    <div className="relative rounded-2xl xl:rounded-3xl overflow-hidden banner--secondary--size">
      <div className="absolute size-full from-banner-gradient/0 bg-linear-to-r to-banner-gradient"></div>
      <div className="flex flex-col items-center justify-center text-white">
        <img
          src="/images/banner-secondary-2.svg"
          alt="banner image"
          className="size-full"
        />
      </div>
      <div className="absolute bottom-8 sm:bottom-12 xl:bottom-14 right-5 sm:right-7 xl:right-9 flex flex-col items-start justify-center gap-5">
        <span className="flex flex-col items-start justify-center sm:gap-1 bg-transparent text-white">
          <h2 className=" text-base sm:text-2xl xl:text-3xl font-bold">
            هر لحظه، با عطری تازه
          </h2>
          <p className=" text-xs md:text-sm xl:font-bold">
            جدیدترین عطرهای روز دنیا، مخصوص سلیقه‌ی خاص تو.
          </p>
        </span>
        <Link
          href={"/products"}
          className=" flex items-center banner--btn--secondary hover:*:last:absolute hover:*:last:-left-7 sm:hover:*:last:-left-8 xl:hover:*:last:-left-9 2xl:hover:*:last:-left-10 hover:*:last:*:size-3 sm:hover:*:last:*:size-4 xl:hover:*:last:*:size-5 hover:*:last:bg-white hover:*:last:text-primary hover:**:duration-200"
        >
          <p className=" px-1.5 lg:px-2.5 py-1 h-full flex items-center bg-white justify-center rounded-4xl duration-200 ">
            مشاهده محصولات
          </p>
          <div className="-left-5 sm:-left-6 xl:-left-7 2xl:-left-8 flex items-center justify-center text-white -z-10 rounded-full size-5 sm:size-6 xl:size-8 duration-200">
            <ArrowLeftIcon className="size-2 sm:size-3 xl:size-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}
