import AppImage from "@/components/AppImage";
import PrimaryBannerCard from "@/components/PrimaryBannerCard";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

function SingleBanner({ banner }) {
  return (
    <div className="flex items-center justify-center px-4 size-full">
      {banner?.type === "primary" ? (
        <PrimaryBannerCard banner={banner} />
      ) : (
        <div className="relative rounded-2xl xl:rounded-3xl overflow-hidden banner--secondary">
          <AppImage
            src={banner?.mobileImageUrl || banner?.imageUrl}
            alt="banner-image"
            objectFit="cover"
            width="size-full"
          />

          <Link
            href={banner?.link}
            className="absolute z-10 bottom-8 right-5 group flex items-center banner--btn--secondary duration-200"
          >
            <p className="flex items-center bg-white text-stroke-950 group-hover:text-primary justify-center rounded-4xl px-1.5 lg:px-2.5 py-1 group-hover:ml-2 h-full duration-200 ">
              مشاهده محصولات
            </p>
            <div className="flex items-center justify-center text-white group-hover:text-primary group-hover:bg-white -z-10 rounded-full size-5 sm:size-6 xl:size-8 duration-200">
              <ArrowLeftIcon className="size-2 sm:size-3 xl:size-4 group-hover:size-2.5 sm:group-hover:size-3.5 xl:group-hover:size-4.5" />
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

export default SingleBanner;
