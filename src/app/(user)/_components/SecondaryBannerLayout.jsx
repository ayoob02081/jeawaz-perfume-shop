"use client";

import Link from "next/link";
import { ArrowLeftIcon, PencilIcon } from "@heroicons/react/24/outline";
import AppImage from "@/components/AppImage";
import { useGetActiveBanners } from "@/hooks/useBanners";
import {
  homeBannerView,
  SECONDARY_BANNER_SKELETON_COUNT,
} from "@/utils/homeSectionView.mjs";
import { SecondaryBannerSkeletons } from "./skeleton/HomeSectionSkeletons";
import { useAuth } from "@/contexts/auth/AuthContext";
import { useRouter } from "next/navigation";

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
            />

            <div className="absolute z-10 bottom-8 right-5 group flex items-center banner--btn--secondary duration-200">
              <p className="flex items-center bg-white text-stroke-950 group-hover:text-primary justify-center rounded-4xl px-1.5 lg:px-2.5 py-1 group-hover:ml-2 h-full duration-200 ">
                مشاهده محصولات
              </p>
              <div className="flex items-center justify-center text-white group-hover:text-primary group-hover:bg-white -z-10 rounded-full size-5 sm:size-6 xl:size-8 duration-200">
                <ArrowLeftIcon className="size-2 sm:size-3 xl:size-4 group-hover:size-2.5 sm:group-hover:size-3.5 xl:group-hover:size-4.5" />
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
                  <PencilIcon className="text-primary size-3 md:size-4" />
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
