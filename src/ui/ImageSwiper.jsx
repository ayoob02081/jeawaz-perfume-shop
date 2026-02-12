"use client";

import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { scrollTo } from "@/utils/scrollTo";
import ImageFrame from "@/components/ImageFrame";

export default function ImageSwiper({ images }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

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
      inline: "center",
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

  return (
    <div
      dir="ltr"
      className="flex flex-col lg:flex-row lg:aspect-6/5 lg:py-4 lg:pr-4 gap-4 max-sm:rounded-2xl max-md:rounded-3xl max-md:mx-4 max-md:bg-secondary overflow-hidden"
    >
      {/* MAIN */}
      <div className="flex-1">
        <div ref={mainRef} className="relative overflow-hidden md:rounded-2xl">
          <div className="flex">
            {images?.map((src, i) => (
              <div
                key={i}
                className="flex-[0_0_100%] relative aspect-square md:bg-secondary"
              >
                <Image
                  src={src}
                  alt={src}
                  fill
                  loading="eager"
                  priority={i < 2}
                  className="object-contain size-full"
                />
              </div>
            ))}
          </div>

          <div className="absolute flex items-center gap-1 top-5 max-md:left-3 md:right-3 max-md:z-50">
            <button className="flex items-center justify-center aspect-square size-12 sm:size-16 md:size-10 xl:size-12 rounded-full bg-white">
              <ImageFrame 
                src="/images/share-icon.svg"
                alt="share-icon"
                className="size-5 sm:size-6 md:size-5 xl:size-6"
              />
            </button>
          </div>

          <div className="max-md:hidden absolute flex items-center gap-1 bottom-5 right-3">
            <button
              onClick={scrollPrev}
              disabled={selectedIndex === 0 ? true : false}
              className="flex items-center justify-center aspect-square md:w-8 xl:w-10 rounded-full bg-white disabled:opacity-60"
            >
              <ChevronLeftIcon className="size-4 stroke-2" />
            </button>
            <button
              onClick={scrollNext}
              disabled={selectedIndex === images.length - 1 ? true : false}
              className="flex items-center justify-center aspect-square md:w-8 xl:w-10 rounded-full bg-white disabled:opacity-60"
            >
              <ChevronRightIcon className="size-4 stroke-2" />
            </button>
          </div>
        </div>
      </div>

      {/* THUMBNAILS */}
      <div className="flex flex-col max-md:px-4 lg:justify-between">
        <div
          ref={thumbRef}
          className="max-sm:p-4 max-md:p-6 max-lg:h-full lg:w-24 overflow-auto scrollbar-none"
        >
          <div className="flex max-lg:justify-start lg:justify-center lg:flex-col gap-3 max-lg:px-2">
            {images?.map((src, i) => (
              <button
                key={i}
                ref={(el) => (thumbRefs.current[i] = el)}
                onClick={() => onThumbClick(i)}
                className={clsx(
                  "relative aspect-square max-[30rem]:size-18 max-md:size-26 md:size-20 lg:size-full *:rounded-xl rounded-xl lg:overflow-hidden border transition",
                  selectedIndex === i
                    ? "border-primary *:bg-white"
                    : "border-stroke-2 opacity-60 hover:opacity-100"
                )}
              >
                <Image
                  src={src}
                  alt={src}
                  fill
                  className="object-contain bg-white md:bg-secondary"
                />
              </button>
            ))}
          </div>
        </div>
        <div className="max-lg:hidden lg:h-28 lg:w-full lg:flex lg:flex-col lg:gap-1 lg:items-center lg:pt-4 lg:justify-start">
          <button
            onClick={() => scrollTo(thumbRef, "y", -100)}
            className="lg:flex lg:items-center lg:justify-center lg:bg-grey lg:size-8 xl:size-10 lg:rounded-full"
          >
            <ChevronUpIcon className="size-4 stroke-2 text-text-primary " />
          </button>{" "}
          <button
            onClick={() => scrollTo(thumbRef, "y", 100)}
            className="lg:flex lg:items-center lg:justify-center lg:bg-grey lg:size-8 xl:size-10 lg:rounded-full"
          >
            <ChevronDownIcon className="size-4 stroke-2 text-text-primary " />
          </button>
        </div>
      </div>
    </div>
  );
}
