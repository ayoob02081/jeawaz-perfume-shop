"use client";

import Link from "next/link";
import { PencilSquareIcon } from "@heroicons/react/24/solid";
import AppImage from "@/components/AppImage";
import { useGetActiveBanners } from "@/hooks/useBanners";
import {
  homeBannerView,
  SECONDARY_BANNER_SKELETON_COUNT,
} from "@/utils/homeSectionView.mjs";
import { SecondaryBannerSkeletons } from "./skeleton/HomeSectionSkeletons";
import { useAuth } from "@/contexts/auth/AuthContext";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

function SecondaryBannerLayout() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    data: banners,
    isPending,
    isError,
  } = useGetActiveBanners({
    type: "secondary",
  });

  const view = homeBannerView({ isPending, isError, banners });

  if (view === "loading") {
    return <SecondaryBannerSkeletons count={SECONDARY_BANNER_SKELETON_COUNT} />;
  }

  if (view === "hidden") {
    return null;
  }

  return (
    <section className="container mx-auto xl:max-w-7xl flex flex-row flex-wrap items-center justify-evenly gap-4">
      {banners?.map((item, index) => {
        if (index > 1) return;

        return (
          <Link
            href={item.link}
            key={item.id}
            className="relative group hover:*:first:*:scale-105 *:first:*:duration-300 rounded-2xl xl:rounded-3xl overflow-hidden banner--secondary "
          >
            <AppImage
              src={item.mobileImageUrl || item.imageUrl}
              alt="banner-image"
              objectFit="cover"
              width="size-full"
              sizes="(min-width: 80rem) 629px, (min-width: 40rem) 491px, 344px"
            />

            <div className="absolute z-10 bottom-8 right-5 group flex items-center banner--btn--secondary duration-200">
              <p className="flex items-center bg-white text-stroke-950 group-hover:text-primary group-active:text-primary justify-center rounded-4xl px-2 lg:px-2.5 py-1 group-hover:ml-2 group-active:ml-2 h-full duration-200 ">
                مشاهده محصولات
              </p>
              <div className="flex items-center justify-center text-white group-hover:text-primary group-active:text-primary group-hover:bg-white group-active:bg-white -z-10 rounded-full size-6 sm:size-7 xl:size-8 duration-200">
                <ArrowLeftIcon className="stroke-2 size-2.5 sm:size-3.5 xl:size-4 group-hover:size-2.5 group-active:size-2.5 sm:group-hover:size-3.5 sm:group-active:size-3.5 xl:group-hover:size-4.5 xl:group-active:size-4.5" />
              </div>
            </div>
            {/* Edit Button */}
            {user?.role === "admin" && (
              <div className="absolute z-20 flex items-center gap-1 top-3 left-3 max-md:z-50">
                <button
                  type="button"
                  onClick={(event) => {
                    // The whole banner is a Link; keep its navigation out.
                    event.preventDefault();
                    router.push(`/admin/banners/edit/${item?.id}`);
                  }}
                  aria-label="ویرایش بنر"
                  className="flex items-center justify-center aspect-square size-8 md:size-10 rounded-full bg-stroke-0 shadow-md"
                >
                  <PencilSquareIcon className="text-primary size-4" />
                </button>
              </div>
            )}
          </Link>
        );
      })}
    </section>
  );
}

export default SecondaryBannerLayout;
