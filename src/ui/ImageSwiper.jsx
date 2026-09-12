"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import AppImage from "@/components/AppImage";
import Link from "next/link";
import { useAuth } from "@/contexts/auth/AuthContext";

export default function ImageSwiper({ product, images = [] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const { user } = useAuth();

  const [mainRef, mainApi] = useEmblaCarousel({
    loop: false,
    draggable: true,
  });

  const thumbRefs = useRef([]);
  const thumbRef = useRef(null);

  const onSelect = useCallback(() => {
    if (!mainApi) return;

    const index = mainApi.selectedScrollSnap();
    setSelectedIndex(index);

    thumbRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
  }, [mainApi]);

  useEffect(() => {
    if (!mainApi) return;
    onSelect();
    mainApi.on("select", onSelect);
    return () => mainApi.off("select", onSelect);
  }, [mainApi, onSelect]);

  const onThumbClick = (index) => {
    if (!mainApi) return;
    mainApi.scrollTo(index);
  };

  const scrollPrev = () => {
    if (mainApi) mainApi.scrollPrev();
  };

  const scrollNext = () => {
    if (mainApi) mainApi.scrollNext();
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const handleLightboxKeyDown = useCallback(
    (e) => {
      if (!isLightboxOpen) return;

      if (e.key === "Escape") {
        closeLightbox();
      }

      if (e.key === "ArrowLeft") {
        mainApi?.scrollPrev();
      }

      if (e.key === "ArrowRight") {
        mainApi?.scrollNext();
      }
    },
    [isLightboxOpen, mainApi],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleLightboxKeyDown);

    return () => {
      window.removeEventListener("keydown", handleLightboxKeyDown);
    };
  }, [handleLightboxKeyDown]);

  return (
    <div
      dir="ltr"
      className="relative flex flex-col lg:flex-row lg:aspect-6/5 lg:pr-4 gap-4 max-sm:rounded-2xl max-md:rounded-3xl max-md:bg-stroke-150 max-md:dark:bg-stroke-50"
    >
      {/* MAIN */}
      <div className="lg:flex-1">
        <div ref={mainRef} className="relative overflow-hidden md:rounded-2xl">
          {/* Images */}
          <div
            className="flex md:cursor-zoom-in"
            onClick={() => setIsLightboxOpen(true)}
          >
            {images?.map((src, i) => (
              <div
                key={i}
                className="flex-[0_0_100%] relative aspect-square md:bg-stroke-150 md:dark:bg-stroke-50"
              >
                <AppImage
                  src={src}
                  alt={`${product?.enTitle || "product"}-image-${i}`}
                  priority={i < 2}
                  objectFit="object-contain"
                  className="size-full"
                />
              </div>
            ))}
          </div>

          {/* Share Btn */}
          <div className="absolute flex items-center gap-1 top-5 max-md:left-3 md:right-3 max-md:z-50">
            <button className="flex items-center justify-center aspect-square size-12 sm:size-16 md:size-10 xl:size-12 rounded-full bg-stroke-0 shadow-sm">
              <AppImage
                src="/images/share-icon.svg"
                alt="share-icon"
                className="dark:invert"
                width="size-5 sm:size-6 md:size-5 xl:size-6"
                sizes="10vw"
              />
            </button>
          </div>

          {/* Edit Btn */}
          {user?.role === "admin" && (
            <div className="absolute flex items-center gap-1 top-5 max-md:right-3 md:left-3 max-md:z-50">
              <Link
                href={`/admin/products/edit/${product?.id}`}
                className="flex items-center justify-center aspect-square size-12 sm:size-16 md:size-10 xl:size-12 rounded-full bg-stroke-0 shadow-md"
              >
                <PencilIcon className="text-primary size-5 sm:size-6 md:size-5 xl:size-6" />
              </Link>
            </div>
          )}

          {/* Swiper Btn */}
          <div className="max-md:hidden absolute flex items-center gap-1 bottom-5 right-3">
            <button
              onClick={scrollPrev}
              disabled={selectedIndex === 0}
              className="flex items-center justify-center aspect-square md:w-8 xl:w-10 rounded-full bg-stroke-0 disabled:opacity-60 shadow-sm"
            >
              <ChevronLeftIcon className="size-4 stroke-2 text-stroke-800" />
            </button>
            <button
              onClick={scrollNext}
              disabled={selectedIndex === images?.length - 1}
              className="flex items-center justify-center aspect-square md:w-8 xl:w-10 rounded-full bg-stroke-0 disabled:opacity-60 shadow-sm"
            >
              <ChevronRightIcon className="size-4 stroke-2 text-stroke-800" />
            </button>
          </div>
        </div>
      </div>

      {/* THUMBNAILS */}
      <div className="flex flex-col max-md:px-4 lg:justify-start">
        <div
          ref={thumbRef}
          className="max-sm:p-4 max-md:p-6 max-lg:h-full lg:w-24 overflow-auto scrollbar-none"
        >
          <div className="flex max-lg:justify-start lg:justify-center lg:flex-col gap-3 max-lg:px-2">
            {images?.map((imgSrc, i) => (
              <button
                key={i}
                ref={(el) => {
                  thumbRefs.current[i] = el;
                }}
                onClick={() => onThumbClick(i)}
                className={clsx(
                  "relative aspect-square max-[30rem]:size-18 max-md:size-26 md:size-20 lg:size-full *:rounded-xl rounded-xl lg:overflow-hidden border transition duration-200",
                  selectedIndex === i
                    ? "border-primary md:*:bg-stroke-0 *:dark:bg-stroke-50 shadow-md scale-95"
                    : "border-stroke-250 opacity-60 dark:opacity-30 hover:opacity-100 bg-stroke-0 md:bg-stroke-150 md:dark:bg-stroke-100",
                )}
              >
                <AppImage
                  src={imgSrc}
                  alt={`${product?.enTitle || "product"}-thumb-${i}`}
                  priority={i < 2}
                  objectFit="object-contain"
                  className="size-full"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Swiper Btn (Desktop Only) */}
        <div className="max-lg:hidden lg:h-28 lg:w-full lg:flex lg:flex-col lg:gap-1 lg:items-center lg:pt-4 lg:justify-start">
          <button
            onClick={scrollPrev}
            disabled={selectedIndex === 0}
            className={clsx(
              "lg:flex lg:items-center lg:justify-center lg:size-8 xl:size-10 lg:rounded-full transition duration-200",
              selectedIndex === 0
                ? "bg-transparent opacity-0 pointer-events-none"
                : "lg:bg-stroke-100",
            )}
          >
            <ChevronUpIcon className="size-4 stroke-2 text-stroke-800" />
          </button>
          <button
            onClick={scrollNext}
            disabled={selectedIndex === images?.length - 1}
            className={clsx(
              "lg:flex lg:items-center lg:justify-center lg:size-8 xl:size-10 lg:rounded-full transition duration-200",
              selectedIndex === images?.length - 1
                ? "bg-transparent opacity-0 pointer-events-none"
                : "lg:bg-stroke-100",
            )}
          >
            <ChevronDownIcon className="size-4 stroke-2 text-stroke-800" />
          </button>
        </div>
      </div>
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-99 flex items-center justify-center bg-black/90 p-4 max-md:hidden"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
            aria-label="بستن"
          >
            <span className="text-2xl leading-none">×</span>
          </button>

          {/* Previous */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              scrollPrev();
            }}
            disabled={selectedIndex === 0}
            className="absolute left-4 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 disabled:pointer-events-none disabled:opacity-30"
            aria-label="تصویر قبلی"
          >
            <ChevronLeftIcon className="size-6" />
          </button>

          {/* Image */}
          <div
            className="relative flex h-full w-full items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <AppImage
              src={images[selectedIndex]}
              alt={`${product?.enTitle || "product"}-fullscreen-${selectedIndex}`}
              objectFit="object-contain"
              className="max-h-[90vh] max-w-[90vw]"
              sizes="100vw"
              priority
            />
          </div>

          {/* Next */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              scrollNext();
            }}
            disabled={selectedIndex === images.length - 1}
            className="absolute right-4 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 disabled:pointer-events-none disabled:opacity-30"
            aria-label="تصویر بعدی"
          >
            <ChevronRightIcon className="size-6" />
          </button>

          {/* Counter */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
