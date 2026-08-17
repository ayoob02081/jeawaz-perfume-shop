import React from "react";
import AppImage from "./AppImage";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

export function PrimaryBannerCard({ banner, priority = false }) {
  const { title, imageUrl, mobileImageUrl, link } = banner;

  return (
    <div className="relative flex w-full items-center justify-center overflow-hidden rounded-xl md:rounded-3xl banner--primary ">
      {/* Desktop */}
      <AppImage
        src={imageUrl}
        alt={title || "بنر"}
        className="hidden sm:block"
        objectFit="cover"
        width="size-full"
        loading={priority ? "eager" : "lazy"}
        sizes="(max-width: 640px) 100vw, 90vw"
      />

      {/* Mobile */}
      <AppImage
        src={mobileImageUrl || imageUrl}
        alt={title || "بنر"}
        className="block sm:hidden"
        objectFit="cover"
        width="size-full"
        loading={priority ? "eager" : "lazy"}
        sizes="100vw"
      />

      {/* Actions */}

      <div className="absolute bottom-5 right-4 flex items-center justify-start gap-3 md:bottom-7 md:right-6 lg:bottom-10 lg:right-7 ">
        {link && (
          <Link
            href={link}
            className=" flex h-9 items-center justify-between gap-2 rounded-4xl bg-primary px-3.5 py-2 text-white ring-2 ring-primary/10 duration-300
             hover:bg-white hover:text-primary hover:ring-primary active:bg-white active:text-primary active:ring-primary sm:h-9 sm:px-3 lg:h-10 lg:px-4 xl:h-12 xl:px-5 "
          >
            <span className="text-[10px] font-bold sm:text-[10px] lg:text-xs xl:text-base">
              مشاهده محصولات
            </span>

            <ArrowLeftIcon className="size-4 xl:size-5" />
          </Link>
        )}

        {/* Support */}
        <div className="overflow-hidden">
          <Link
            href="tel:+989302125151"
            className="flex items-center justify-between hover:gap-1 max-sm:hidden group hover:bg-white/50 active:bg-white/50 backdrop-blur-md rounded-full max-xl:h-8 xl:h-10 2xl:h-12 hover:pl-2 transition-all duration-200"
          >
            <button
              className="btn rounded-full h-full sm:border-2 border-primary/10 text-white bg-stroke-900 group-hover:text-stroke-900 group-hover:bg-white backdrop-blur-md group-hover:border-stroke-900
            group-active:text-stroke-900 group-active:bg-white group-active:border-stroke-900 aspect-square z-10 transition-all duration-200"
            >
              <ChatBubbleLeftRightIcon className="max-xl:size-4 xl:size-6" />
            </button>
            <p className="max-lg:text-[10px] max-xl:text-xs font-bold text-nowrap translate-x-20 group-hover:translate-x-0 w-0 opacity-0 group-hover:opacity-100 group-hover:w-fit text-stroke-950 group-hover:text-stroke-900 group-active:text-stroke-900 transition-all duration-200">
              دریافت مشاوره
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PrimaryBannerCard;
