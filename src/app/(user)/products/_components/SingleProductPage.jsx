"use client";

import Loading from "@/components/Loading";
import Error from "@/components/Error";
import { useGetAllProducts } from "@/hooks/useProducts";
import ImageFrame from "@/components/ImageFrame";
import CardEvents from "@/components/CardEvents";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import RadioButton from "@/ui/RadioButton";
import PriceSection from "@/components/PriceSection";
import Accordion from "@/ui/Accordion";

import { useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Thumbs, Zoom } from "swiper/modules";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { pickClosestTo } from "@/utils/pickClosestTo";

function SingleProductPage({ slug }) {
  const { data, isLoading, error } = useGetAllProducts();

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Error />;
  }
  const currentSlug = data?.find((product) => product.id === Number(slug));

  const productAccords = currentSlug.accordCategories.map(
    (accord) => accord.title
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 h-full gap-6 md:gap-x-6 lg:gap-6 w-ful md:p-6 container mx-auto xl:max-w-7xl md:mt-40">
      <ProductImage currentSlug={currentSlug} />
      <ProductDes currentSlug={currentSlug} />
      <ProductOptions
        currentSlug={currentSlug}
        productAccords={productAccords}
      />
      <ProductDetails currentSlug={currentSlug} />
    </div>
  );
}

export default SingleProductPage;

function ProductImage({ currentSlug }) {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [open, setOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  return (
    <div className="relative items-center justify-start w-full max-md:p-4 h-fit">
      {/* Custom Navigation Buttons */}
      <div className="max-md:hidden md:absolute -translate-y-1/2 md:top-7/10 right-4 flex flex-row-reverse gap-2 items-center justify-between z-30">
        <button className="custom-next flex items-center justify-center  ">
          <ChevronLeftIcon
            className={`${
              currentSlide !== currentSlug.images.length - 1
                ? "text-dark-brown bg-white"
                : "text-dark-brown/40 bg-white/50"
            } 
             rounded-full size-10 md:px-3 lg:px-2.5
          `}
          />
        </button>
        <button className="custom-prev flex items-center justify-center">
          <ChevronRightIcon
            className={`${
              currentSlide !== 0
                ? "text-dark-brown bg-white"
                : "text-dark-brown/40 bg-white/50"
            } 
           rounded-full size-10 md:px-3 lg:px-2.5
          `}
          />
        </button>
      </div>

      {/* Pagination Number */}
      <div className="absolute max-md:top-5 md:top-9/12 right-1/2 translate-x-1/2 -translate-y-1/2 bg-white/70 rounded-sm px-2 py-1  text-xs mt-2 z-30">
        <span>
          {toPersianNumbers(currentSlide + 1)} /{" "}
          {toPersianNumbers(currentSlug.images.length)}
        </span>
      </div>

      {/* MAIN SLIDER  ==> اسلایدر اصلی */}
      <div className=" max-md:bg-secondary max-md:p-6 rounded-2.5xl">
        <Swiper
          modules={[Navigation, Thumbs, Zoom]}
          zoom={true}
          navigation={{
            nextEl: ".custom-next",
            prevEl: ".custom-prev",
          }}
          thumbs={{
            swiper:
              thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
          }}
          spaceBetween={10}
          className=" bg-secondary rounded-2xl overflow-hidden"
          onSlideChange={(s) => setCurrentSlide(s.activeIndex)}
        >
          {currentSlug.images.map((img, i) => (
            <SwiperSlide key={i}>
              <div
                className="cursor-pointer active:scale-[0.98] transition"
                onClick={() => {
                  setCurrentSlide(currentSlide);
                  setOpen(true);
                }}
              >
                <Image
                  src={img}
                  width={900}
                  height={900}
                  alt={`product-${i}`}
                  className="object-cover w-full"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* THUMBNAILS ==> تصاویر کوچک */}
        <Swiper
          modules={[Thumbs]}
          onSwiper={setThumbsSwiper}
          watchSlidesProgress
          spaceBetween={8}
          slidesPerView={4}
          className="mt-4"
        >
          {currentSlug.images.map((img, i) => (
            <SwiperSlide key={i}>
              <Image
                src={img}
                width={120}
                height={120}
                alt={`thumb-${i}`}
                className=" w-full h-full max-md:bg-white md:bg-secondary rounded-2xl object-cover active:opacity-75 transition cursor-pointer max-md:border border-stroke-2"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* LIGHTBOX */}
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={currentSlide}
        plugins={[Thumbnails]}
        thumbnails={{ width: 120, height: 120 }}
        slides={currentSlug.images.map((img) => ({ src: img }))}
        on={{ view: ({ index }) => setCurrentSlide(index) }}
        render={{
          slide: ({ slide }) => (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <img
                src={slide.src}
                alt="perfume-image"
                className="size-full object-contain"
              />
              <span className="absolute bottom-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-white/70 rounded-sm px-2 py-1  text-xs mt-2 z-50">
                {toPersianNumbers(currentSlide + 1)} /{" "}
                {toPersianNumbers(currentSlug.images.length)}
              </span>
            </div>
          ),
        }}
      />
    </div>
  );
}

function ProductDes({ currentSlug }) {
  const defaultVolume = pickClosestTo(100, currentSlug?.volumes);
  const [selectedVolume, setSelectedVolume] = useState(defaultVolume);
  const OnChange = (e) => {
    const value = e.target.value;

    const selectedItem = currentSlug.volumes?.filter(
      (volume) => volume === Number(value)
    );
    setSelectedVolume(selectedItem[0]);
  };

  return (
    <div className="grid grid-cols-1 w-full gap-y-4 xl:gap-y-10 max-md:p-6 h-fit justify-items-start">
      <div className="flex flex-col gap-2 items-start justify-start w-full">
        <span className="flex items-start max-md:justify-between gap-2 md:justify-start w-full">
          <p className="font-bold lg:text-[28px]">{currentSlug.perTitle}</p>
          <p className="md:hidden">{currentSlug.brandCategories[0].brand}</p>
        </span>
        <p className="text-xs lg:text-lg text-text-secondary">
          {currentSlug.enTitle}
        </p>
      </div>
      <div className="flex flex-col items-star justify-between gap-2 w-full max-md:border-t border-stroke-2 pt-4 md:row-start-3 h-full overflow-hidden">
        <p className="md:hidden">انتخاب حجم:</p>
        <div className="flex items-center justify-start gap-2 w-full overflow-auto scrollbar-none snap-x bg-transparent">
          {currentSlug.stock >= 3 &&
            currentSlug.volumes?.map((volume, index) => (
              <RadioButton
                key={index}
                id={index}
                name={`single-product-volume` + currentSlug.id}
                value={volume}
                onChange={OnChange}
                checked={selectedVolume === volume ? true : false}
                className=" badge badge--secondary--2 hover:bg-dark-brown/30 has-checked:bg-dark-brown has-checked:text-white duration-200 "
              >
                <p className="text-nowrap">{toPersianNumbers(volume)} میل</p>
              </RadioButton>
            ))}
        </div>
      </div>
      <div className="flex items-center md:justify-between max-md:justify-end w-full md:row-start-2">
        {currentSlug.stock >= 3 && (
          <PriceSection
            volume={selectedVolume}
            pricePerVolume={currentSlug.price}
            offValue={currentSlug.offValue}
            OldPricevisibility="block"
            pricesRow="flex-col-reverse max-md:gap-0"
            className=""
            priceClassName="text-[32px]"
            justify="max-md:justify-end md:justify-start"
          />
        )}
        <p className="max-md:hidden">{currentSlug.brandCategories[0].brand}</p>
      </div>
      <div className="flex items-center justify-between w-full gap-4">
        {currentSlug.stock >= 3 ? (
          <button className=" btn btn--success w-full h-12 px-2">
            افزودن به سبد خرید
          </button>
        ) : (
          <p className="text-primary font-bold max-md: md: text-3xl">
            ناموجود!
          </p>
        )}
        <div className=" flex-none">
          {currentSlug.stock >= 3 && (
            <CardEvents
              btnStyle="max-lg:size-8 lg:size-12 not-active:bg-grey "
              quantityStyle="max-lg:size-12 lg:size-12 max-lg:text-lg lg:text-lg"
            />
          )}
        </div>
      </div>
      <Accordion
        titleStyle="font-bold"
        className="max-md:hidden md:flex  "
        label="توضیحات تکمیلی"
      >
        <p className="text-text-secondary text-sm pt-4 border-t border-stroke leading-8 ">
          {currentSlug.discription}
        </p>
      </Accordion>
    </div>
  );
}

function ProductOptions({ currentSlug, productAccords }) {
  const { detailes } = currentSlug;

  return (
    <div className="grow flex flex-col items-center justify-start gap-6 w-full max-md:border-t-[1.5px] md:border-[1.5px] md:rounded-2xl max-md:p-6 md:p-4 border-stroke-2 ">
      <span className="flex items-center justify-start gap-2 w-full">
        <ImageFrame
          src="/images/menu-icon.svg"
          alt="menu-icon"
          className="size-6"
        />
        <p className="font-bold">ویژگی های محصول</p>
      </span>
      <div className="grid max-sm:grid-cols-3 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-3 gap-x-4 w-full px-2">
        <ProductOption title="کشور تولید کننده" value={detailes.madeIn} />
        <ProductOption title="پخش بو" value={detailes.smelling} />
        <ProductOption title="ماندگاری" value={detailes.longevity} />
        <ProductOption
          title="حجم شیشه پلمپ"
          volumes
          data={detailes.originalVolume}
        />
        <ProductOption title="عطر ساز" value={detailes.designedIn} />
        <ProductOption
          title="گروه‌‌بندی رایحه"
          value="رایحه شیرین"
          data={productAccords}
          accords
        />
        <ProductOption title="مناسب برای فصل" data={detailes.seasons} accords />
      </div>
    </div>
  );
}

function ProductOption({ title, value, data, accords, volumes }) {
  return (
    <>
      <p className="text-nowrap col-span-1 text-sm text-text-secondary py-3">
        {title}
      </p>
      {!data ? (
        <p className="text-nowrap max-sm:col-span-2 sm:col-span-3 md:col-span-1 lg:col-span-2 text-sm text-text font-bold w-full border-b border-stroke py-3">
          {value}
        </p>
      ) : (
        <span className="flex items-start gap-2 text-nowrap max-sm:col-span-2 sm:col-span-3 md:col-span-1 lg:col-span-2 text-sm text-text font-bold w-full border-b border-stroke py-3">
          {data.map((item) =>
            volumes ? (
              <p key={item}>
                {toPersianNumbers(item)} میل
                {data.length >= 2 && " - "}
              </p>
            ) : (
              <p key={item}>
                {accords && item}
                {data.length >= 2 && " - "}
              </p>
            )
          )}
        </span>
      )}
    </>
  );
}

function ProductDetails({ currentSlug }) {
  const { notes } = currentSlug;

  return (
    <div className="grow flex flex-col items-center justify-between gap-6 w-full max-md:row-start-3 max-md:border-t-[1.5px] md:border-[1.5px] md:rounded-2xl p-6 border-stroke-2  ">
      <div className="flex flex-col items-start justify-between gap-2">
        <span className="flex items-center justify-start gap-2">
          <ImageFrame
            src="/images/square-list-icon.svg"
            alt="square-list-icon"
            className="size-6"
          />
          <p className="font-bold">ترکیبات محصول</p>
        </span>
        <p className="text-xs">
          لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با
          استفاده از طراحان گرافیک است،.
        </p>
      </div>
      <div className="flex flex-col items-center justify-between gap-2 size-full">
        {notes?.map((items, index) => (
          <Notes key={index} items={items} />
        ))}
      </div>
    </div>
  );
}

function Notes({ items }) {
  const { firstNotes, middleNotes, finalNotes } = items;

  return (
    <div className="relative flex flex-col items-center justify-center gap-2 text-nowrap whitespace-nowrap">
      <ImageFrame
        src={`/images/scent-background-${
          firstNotes ? "1" : middleNotes ? "2" : "3"
        }.svg`}
        alt="shape background"
        className={
          firstNotes
            ? "w-[60px] h-[53.3px]"
            : middleNotes
            ? "w-[152.46px] h-[66.02px]"
            : "w-[310px] h-[134.23px]"
        }
      />
      <span className="absolute flex flex-col items-center justify-center gap-1 z-20">
        <p className="text-xs text-text font-bold">
          {firstNotes
            ? "نت‌های آغازین"
            : middleNotes
            ? "نت‌های میانی"
            : "نت‌های پایانی"}
        </p>
        {items && (
          <div className="flex items-center justify-between gap-2">
            {firstNotes &&
              firstNotes?.map((s, index) => (
                <p key={s + index} className="**:text-xs text-text-secondary ">
                  {firstNotes && firstNotes.length > 1 ? s + " - " : s}
                </p>
              ))}
            {middleNotes &&
              middleNotes?.map((s, index) => (
                <p key={s + index} className="**:text-xs text-text-secondary ">
                  {middleNotes && middleNotes.length > 1 ? s + " - " : s}
                </p>
              ))}
            {finalNotes &&
              finalNotes?.map((s, index) => (
                <p key={s + index} className="**:text-xs text-text-secondary ">
                  {finalNotes && finalNotes.length > 1 ? s + " - " : s}
                </p>
              ))}
          </div>
        )}
      </span>
    </div>
  );
}
