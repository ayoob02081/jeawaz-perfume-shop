"use client";

import Loading from "@/components/Loading";
import Error from "@/components/Error";
import { useGetAllProducts } from "@/hooks/useProducts";
import ImageFrame from "@/components/ImageFrame";
import CardEvents from "@/components/CardEvents";
import RadioButton from "@/ui/RadioButton";
import PriceSection from "@/components/PriceSection";
import Accordion from "@/ui/Accordion";
import { useEffect, useState } from "react";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import ImageSwiper from "@/ui/ImageSwiper";
import { useGetAllCategories } from "@/hooks/useCategories";

function SingleProductPage({ slug }) {
  const { data, isLoading, error } = useGetAllProducts();
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useGetAllCategories();

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Error />;
  }
  const currentSlug = data?.find((product) => product.id === Number(slug));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 h-full gap-6 md:gap-x-6 lg:gap-6 w-ful md:p-6 container mx-auto xl:max-w-7xl md:mt-40">
      <ImageSwiper images={currentSlug.images} />
      <ProductDes currentSlug={currentSlug} />
      <ProductOptions currentSlug={currentSlug} categories={categories} />
      <ProductDetails currentSlug={currentSlug} />
    </div>
  );
}

export default SingleProductPage;

function ProductDes({ currentSlug }) {
  const productBrand = currentSlug.categories.brand;

  const [volumeMode, setVolumeMode] = useState("sealed");

  const volumes =
    (volumeMode === "decant" && currentSlug.modes?.decant.availableVolumes) ||
    (volumeMode === "sealed" &&
      currentSlug.modes?.sealed.variants.map((v) => v.volume));

  const defaultVolume = volumes.includes(100)
    ? 100
    : volumes.find((v) => v === 100 || v >= 3);

  const [selectedVolume, setSelectedVolume] = useState(defaultVolume);

  const volumeHandler = (e, type) => {
    const value = e.target.value;
    if (type) {
      setVolumeMode(type);
    } else {
      const selectedItem = volumes?.filter(
        (volume) => volume === Number(value),
      );
      setSelectedVolume(selectedItem[0]);
    }
  };

  useEffect(() => {
    setSelectedVolume(
      volumes.includes(100) ? 100 : volumes.find((v) => v === 100 || v >= 3),
    );
  }, [volumeMode]);

  const decantsPrice = currentSlug.modes?.decant.pricePerMl * selectedVolume;

  const sealedPrice = currentSlug.modes?.sealed.variants.find(
    (v) => v.volume === selectedVolume,
  );

  const price =
    volumeMode === "decant" ? decantsPrice : sealedPrice?.price || 0;

  return (
    <div className="grid grid-cols-1 w-full gap-y-4 xl:gap-y-10 max-md:p-6 h-fit justify-items-start">
      <div className="flex flex-col gap-2 items-start justify-start w-full">
        <span className="flex items-start max-md:justify-between gap-2 md:justify-start w-full">
          <p className="font-bold lg:text-[28px]">{currentSlug.perTitle}</p>
          <p className="md:hidden">{productBrand}</p>
        </span>
        <p className="text-xs lg:text-lg text-text-secondary">
          {currentSlug.enTitle}
        </p>
      </div>
      <div className="flex flex-col items-star justify-between gap-2 w-full max-md:border-t border-stroke-2 pt-4 md:row-start-3 h-full overflow-hidden">
        <div className="flex flex-col items-start justify-start gap-3">
          <p className="">نوع محصول:</p>
          <div className="flex items-center justify-start gap-2 w-full overflow-auto scrollbar-none snap-x bg-transparent">
            <RadioButton
              id="productVolumeModeDecant"
              name="productVolumeMode"
              value="decant"
              onChange={(e) => volumeHandler(e, "decant")}
              checked={volumeMode === "decant"}
              className=" badge badge--secondary--2 hover:bg-dark-brown/30 has-checked:bg-dark-brown has-checked:text-white duration-200 "
            >
              <p className="text-nowrap">دکانت</p>
            </RadioButton>
            <RadioButton
              id="productVolumeModeSealed"
              name="productVolumeMode"
              value="sealed"
              onChange={(e) => volumeHandler(e, "sealed")}
              checked={volumeMode === "sealed"}
              className=" badge badge--secondary--2 hover:bg-dark-brown/30 has-checked:bg-dark-brown has-checked:text-white duration-200 "
            >
              <p className="text-nowrap">شیشه پلمپ</p>
            </RadioButton>
          </div>
        </div>
        <div className="flex flex-col items-start justify-start gap-3">
          <p className="">انتخاب حجم:</p>
          <div className="flex items-center justify-start gap-2 w-full overflow-auto scrollbar-none snap-x bg-transparent">
            {volumes?.map((volume, index) => {
              const isDisabled = currentSlug.stock >= volume ? false : true;
              return (
                <RadioButton
                  key={volumeMode + index}
                  id={volumeMode + index}
                  name={`single-product-volume` + currentSlug.id}
                  value={volume}
                  disabled={isDisabled}
                  onChange={volumeHandler}
                  checked={selectedVolume === volume}
                  className={` badge badge--secondary--2  ${
                    isDisabled
                      ? "opacity-60 !cursor-not-allowed"
                      : "hover:bg-dark-brown/30 has-checked:bg-dark-brown has-checked:text-white"
                  } duration-200`}
                >
                  <p className="text-nowrap">{toPersianNumbers(volume)} میل</p>
                </RadioButton>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex items-center md:justify-between max-md:justify-end w-full md:row-start-2">
        {currentSlug.stock >= 3 && (
          <PriceSection
            volume={selectedVolume}
            volumeMode={volumeMode}
            price={price}
            offValue={currentSlug.offValue}
            OldPricevisibility="block"
            pricesRow="flex-col-reverse max-md:gap-0"
            className=""
            priceClassName="text-[32px]"
            justify="max-md:justify-end md:justify-start"
          />
        )}
        <p className="max-md:hidden">{productBrand}</p>
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
          {currentSlug.description}
        </p>
      </Accordion>
    </div>
  );
}

function ProductOptions({ currentSlug, categories }) {
  const productAccords = currentSlug.categories.accords.map((accord) => {
    const accords = categories?.find((item) => item.value === accord);
    return accords?.title;
  });

  const { details, modes } = currentSlug;

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
        <ProductOption title="کشور تولید کننده" value={details.madeIn} />
        <ProductOption title="عطر ساز" value={details.designedIn} />
        <ProductOption title="پخش بو" value={details.smelling} />
        <ProductOption title="ماندگاری" value={details.longevity} />
        <ProductOption
          title="حجم شیشه پلمپ"
          volumes
          data={modes.sealed.variants}
        />
        <ProductOption title="گروه‌‌بندی رایحه" data={productAccords} accords />
        <ProductOption title="مناسب برای فصل" data={details.seasons} accords />
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
          {data.map((item, index) =>
            volumes ? (
              <p key={index}>
                {toPersianNumbers(item.volume)} میل
                {data.length >= 2 && " - "}
              </p>
            ) : (
              <p key={index}>
                {accords && item}
                {data.length >= 2 && " - "}
              </p>
            ),
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
        <Notes type={notes.base} base />
        <Notes type={notes.middle} middle />
        <Notes type={notes.top} top />
      </div>
    </div>
  );
}

function Notes({ type, top, middle, base }) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-2 text-nowrap whitespace-nowrap">
      <ImageFrame
        src={`/images/scent-background-${base ? "1" : middle ? "2" : "3"}.svg`}
        alt="shape background"
        className={
          base
            ? "w-[60px] h-[53.3px]"
            : middle
              ? "w-[152.46px] h-[66.02px]"
              : "w-[310px] h-[134.23px]"
        }
      />
      <span className="absolute flex flex-col items-center justify-center gap-1 z-20">
        <p className="text-xs text-text font-bold">
          {base ? "نت‌های آغازین" : middle ? "نت‌های میانی" : "نت‌های پایانی"}
        </p>
        <div className="flex items-center justify-between gap-2">
          {base &&
            type?.map((s, index) => (
              <p key={s + index} className="**:text-xs text-text-secondary ">
                {type.length > 1 ? s + " - " : s}
              </p>
            ))}
          {middle &&
            type?.map((s, index) => (
              <p key={s + index} className="**:text-xs text-text-secondary ">
                {type.length > 1 ? s + " - " : s}
              </p>
            ))}
          {top &&
            type?.map((s, index) => (
              <p key={s + index} className="**:text-xs text-text-secondary ">
                {type.length > 1 ? s + " - " : s}
              </p>
            ))}
        </div>
      </span>
    </div>
  );
}
