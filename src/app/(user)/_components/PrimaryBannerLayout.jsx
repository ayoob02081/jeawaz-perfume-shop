"use client";

import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useGetActiveBanners } from "@/hooks/useBanners";
import "swiper/css";
import "swiper/css/pagination";
import Loading from "@/components/Loading";
import { useRef } from "react";
import PrimaryBannerCard from "@/components/PrimaryBannerCard";

function PrimaryBannerLayout() {
  const swiperRef = useRef(null);

  const {
    data: banners,
    isPending,
    isError,
  } = useGetActiveBanners({
    type: "primary",
  });

  if (isPending) {
    return <Loading />;
  }

  if (isError || !banners?.length) {
    return null;
  }

  return (
    <section className="relative container mx-auto xl:max-w-7xl mt-2 w-full px-2 sm:px-4">
      <Swiper
        modules={[Autoplay, Pagination]}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        slidesPerView={1}
        spaceBetween={16}
        centeredSlides
        loop={banners.length > 1}
        speed={700}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{
          clickable: true,
        }}
        className="primary-banner-swiper w-full"
      >
        {banners.map((banner, index) => (
          <SwiperSlide key={banner.id}>
            <PrimaryBannerCard banner={banner} priority={index === 0} />
          </SwiperSlide>
        ))}
      </Swiper>
      
      {/* Desktop navigation */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            aria-label="بنر قبلی"
            onClick={() => swiperRef.current?.slidePrev()}
            className="absolute right-1 top-1/2 z-20 hidden max-lg:size-9 size-11 -translate-y-1/2 items-center justify-center rounded-full
            border border-stroke-200 bg-stroke-0/20 text-white shadow-md backdrop-blur-md duration-200 hover:bg-primary
            hover:text-white active:scale-95 md:flex xl:size-12"
          >
            <ChevronRightIcon className="max-lg:size-4 size-5 xl:size-6" />
          </button>

          <button
            type="button"
            aria-label="بنر بعدی"
            onClick={() => swiperRef.current?.slideNext()}
            className="absolute left-1 top-1/2 z-20 hidden max-lg:size-9 size-11 -translate-y-1/2 items-center justify-center rounded-full
            border border-stroke-200 bg-stroke-0/20 text-white shadow-md backdrop-blur-md duration-200 hover:bg-primary
            hover:text-white active:scale-95 md:flex xl:size-12 "
          >
            <ChevronLeftIcon className="max-lg:size-4 size-5 xl:size-6" />
          </button>
        </>
      )}
    </section>
  );
}

export default PrimaryBannerLayout;
