"use client";

import Loading from "@/components/Loading";
import Error from "@/components/Error";
import { useGetProductPrice, useGetProductsbyId } from "@/hooks/useProducts";
import AppImage from "@/components/AppImage";
import CardEvents from "@/components/CardEvents";
import RadioButton from "@/ui/RadioButton";
import PriceSection from "@/components/PriceSection";
import Accordion from "@/ui/Accordion";
import { useEffect, useState } from "react";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import ImageSwiper from "@/ui/ImageSwiper";
import {
  useGetAllBrandCategories,
  useGetAllCategories,
} from "@/hooks/useCategories";
import BreadCrumbBase from "@/ui/BreadCrumbBase";
import BreadCrumb from "@/ui/BreadCrumb";

import { useRouter } from "next/navigation";
import { useQuantityHandler } from "@/hooks/useQuantityHandler";

function SingleProductPage({ slug }) {
  const { data: product = [], isLoading, error } = useGetProductsbyId(slug);

  const { data: categories } = useGetAllCategories();

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Error />;
  }

  return (
    <main className=" container mx-auto xl:max-w-7xl md:mt-40">
      <article className="px-6">
        <section className="max-md:hidden">
          {isLoading ? (
            <Loading />
          ) : (
            <BreadCrumbBase>
              <BreadCrumb href={"/"} label={"فروشگاه"} />
              <BreadCrumb href={"/products"} label={"محصولات"} chevron />
              <BreadCrumb
                href={`/products/${product?.id}`}
                label={product?.perTitle}
                className="!text-primary font-bold"
                chevron
              />
            </BreadCrumbBase>
          )}
        </section>
      </article>
      <article className="grid grid-cols-1 md:grid-cols-2 h-full gap-6 md:gap-x-6 lg:gap-6 w-ful md:p-6">
        <ImageSwiper images={product?.images} product={product} />
        <ProductDes product={product} />
        <ProductOptions product={product} categories={categories} />
        <ProductDetails product={product} />
      </article>
    </main>
  );
}

export default SingleProductPage;

function ProductDes({ product }) {
  const [basePrice, setBasePrice] = useState();
  const [finalPrice, setFinalPrice] = useState();
  const { isGettingPrice, getProductPrice } = useGetProductPrice();
  const router = useRouter();

  const { data: allBrands } = useGetAllBrandCategories();
  const productBrand = allBrands?.find(
    (brand) => brand.title === product?.categories.brand,
  );

  const [volumeMode, setVolumeMode] = useState("decant");
  const volumes =
    (volumeMode === "sealed" &&
      product.modes?.sealed.variants.map((v) => v.volume)) ||
    (volumeMode === "decant" && product.modes?.decant.availableVolumes);

  const defaultVolume = volumes[0];

  const {
    AddToCartHandler,
    RemoveFromCartHandler,
    selectedVolume,
    setSelectedVolume,
    quantity,
    setQuantity,
    defaultQuantity,
  } = useQuantityHandler(product, defaultVolume, volumeMode);

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
    setSelectedVolume(defaultVolume);
  }, [volumeMode]);

  useEffect(() => {
    async function fetchPrice() {
      const data = await getProductPrice({
        id: product.id,
        mode: volumeMode,
        volume: selectedVolume,
      });

      const { basePrice, finalPrice } = data;
      setBasePrice(basePrice);
      setFinalPrice(finalPrice);
    }

    fetchPrice();
  }, [selectedVolume]);

  useEffect(() => {
    if (defaultQuantity?.quantity && defaultQuantity?.quantity !== undefined) {
      setQuantity(defaultQuantity?.quantity);
    } else {
      setQuantity(0);
    }
  }, [defaultQuantity]);

  return (
    <article className="grid grid-cols-1 w-full gap-y-4 xl:gap-y-10 max-md:p-6 h-fit justify-items-start">
      {/* Product Name */}
      <section className="flex flex-col gap-2 items-start justify-start w-full">
        <span className="flex items-center max-md:justify-between gap-2 md:justify-start w-full">
          <p className="font-bold text-wrap text-[28px] w-full text-stroke-800">
            {product.perTitle}
          </p>
          <div className="md:hidden p-2">
            <AppImage
              src={productBrand.iconUrl}
              alt={productBrand.value + "-icon"}
              className="justify-center h-full dark:invert"
              width="max-md:w-20 md:w-[4.815rem]"
              ratio="aspect-[6/2]"
              sizes="20vw"
            />
          </div>
        </span>
        <p className="text-base text-wrap text-stroke-600 w-full">
          {product.enTitle}
        </p>
      </section>

      {/* Product Type */}
      <section className="flex items-center justify-between w-full max-md:border-t border-stroke-250 pt-4 ">
        <div className="flex flex-col justify-between gap-2 w-full md:row-start-3 h-full overflow-hidden">
          <div className="flex justify-between">
            <div className="flex flex-col items-start justify-start gap-3">
              <p className="text-stroke-800">نوع محصول:</p>
              <div className="flex items-center justify-start gap-2 w-full overflow-auto scrollbar-none snap-x bg-transparent">
                <RadioButton
                  id="productVolumeModeDecant"
                  name="productVolumeMode"
                  value="decant"
                  onChange={(e) => volumeHandler(e, "decant")}
                  checked={volumeMode === "decant"}
                  className="badge btn--type duration-200 "
                >
                  <p className="text-nowrap">دکانت</p>
                </RadioButton>
                <RadioButton
                  id="productVolumeModeSealed"
                  name="productVolumeMode"
                  value="sealed"
                  onChange={(e) => volumeHandler(e, "sealed")}
                  checked={volumeMode === "sealed"}
                  className="badge btn--type duration-200 "
                >
                  <p className="text-nowrap">شیشه پلمپ</p>
                </RadioButton>
              </div>
            </div>
            {product.original === true && (
              <AppImage
                src="/images/bg-original.svg"
                alt="original-icon"
                ratio="aspect-[5/2]"
                width="w-32"
                sizes="10vw"
                className="self-end"
              />
            )}
          </div>
          <div className="flex flex-col items-start justify-start gap-3">
            <p className="text-stroke-800">انتخاب حجم:</p>
            <div className="flex items-center justify-start gap-2 w-full overflow-auto scrollbar-none snap-x bg-transparent">
              {volumes?.map((volume, index) => {
                const isDisabled = product.stock >= volume ? false : true;
                return (
                  <RadioButton
                    key={volumeMode + index}
                    id={volumeMode + index}
                    name={`single-product-volume` + product.id}
                    value={volume}
                    disabled={isDisabled}
                    onChange={volumeHandler}
                    checked={selectedVolume === volume}
                    className={`badge ${
                      isDisabled
                        ? "opacity-60 dark:opacity-40 !cursor-not-allowed"
                        : "btn--type"
                    } duration-200`}
                  >
                    <p className="text-nowrap">
                      {toPersianNumbers(volume)} میل
                    </p>
                  </RadioButton>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Price Section */}
      <div className="flex items-center md:justify-between max-md:justify-end w-full md:row-start-2 duration-200">
        {product.stock >= selectedVolume ? (
          <PriceSection
            volume={selectedVolume}
            basePrice={basePrice}
            unitPrice={finalPrice}
            offValue={product.offValue}
            OldPricevisibility="block"
            pricesRow="flex-col-reverse max-md:gap-0"
            className=""
            priceClassName="text-[32px]"
            justify="max-md:justify-end md:justify-start"
          />
        ) : (
          <p className="text-primary font-bold max-md: md: text-3xl">
            ناموجود!
          </p>
        )}
        <div className="max-md:hidden p-2">
          <AppImage
            src={productBrand.iconUrl}
            alt={productBrand.value + "-icon"}
            className="justify-center h-full dark:invert"
            width="max-md:w-16 md:w-20 xl:w-28 "
            ratio="aspect-[4/1]"
            sizes="20vw"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between w-full gap-4 duration-200">
        {product?.stock >= selectedVolume && (
          <button
            onClick={
              !quantity > 0 ? AddToCartHandler : () => router.push("/cart")
            }
            className={`btn ${!quantity > 0 ? "btn--success" : "bg-stroke-0 text-success font-bold border border-success"} w-full h-12 px-2 transition-all ease-in-out duration-200`}
          >
            {!quantity > 0 ? "افزودن به سبد خرید" : "نهایی کردن سبد خرید"}
          </button>
        )}
        <div className=" flex-none">
          {quantity > 0 && (
            <CardEvents
              RemoveFromCartHandler={RemoveFromCartHandler}
              AddToCartHandler={AddToCartHandler}
              quantity={quantity}
              btnStyle="max-lg:size-8 lg:size-12 not-active:bg-stroke-100 dark:not-active:bg-stroke-50"
              quantityStyle="max-lg:size-12 lg:size-12 max-lg:text-lg lg:text-lg"
            />
          )}
        </div>
      </div>

      {/* Description */}
      <Accordion
        titleStyle="font-bold text-stroke-800"
        className="max-md:hidden md:flex  "
        label="توضیحات تکمیلی"
      >
        <p className="text-stroke-600 text-sm pt-4 border-t border-stroke-200 leading-8 ">
          {product?.description}
        </p>
      </Accordion>
    </article>
  );
}

function ProductOptions({ product, categories }) {
  const productAccords = product.categories.accords.map((accord) => {
    const accords = categories?.find((item) => item.value === accord);
    return accords?.title;
  });

  const { details, modes } = product;

  return (
    <article className="grow w-full  max-md:border-t-[1.5px] md:border-[1.5px] md:rounded-2xl max-md:p-6 md:p-4 border-stroke-250 ">
      <section className=" flex flex-col items-center justify-start gap-6 w-full">
        <span className="flex items-center justify-start gap-2 w-full">
          <AppImage
            src="/images/menu-icon.svg"
            alt="menu-icon"
            width="size-6"
            sizes="10vw"
          />
          <p className="font-bold text-stroke-800">ویژگی های محصول</p>
        </span>
        <div className="grid max-sm:grid-cols-3 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-3 gap-x-4 w-full px-2">
          <ProductOption title="کشور تولید کننده" value={details.madeIn} />
          <ProductOption title="عطر ساز" value={details.designedIn} />
          <ProductOption title="پخش بو" value={details.smelling} />
          <ProductOption title="ماندگاری" value={details.longevity} />
          <ProductOption
            title="حجم شیشه پلمپ"
            volumes
            data={modes?.sealed.variants}
          />
          <ProductOption
            title="گروه‌‌بندی رایحه"
            data={productAccords}
            accords
          />
          <ProductOption
            title="مناسب برای فصل"
            data={details.seasons}
            accords
          />
        </div>
      </section>
    </article>
  );
}

function ProductOption({ title, value, data, accords, volumes }) {
  return (
    <>
      <p className="text-nowrap col-span-1 text-sm text-stroke-600 py-3">
        {title}
      </p>
      {!data ? (
        <p className="text-nowrap max-sm:col-span-2 sm:col-span-3 md:col-span-1 lg:col-span-2 text-sm text-stroke-800 font-bold w-full border-b border-stroke-200 py-3">
          {value}
        </p>
      ) : (
        <span className="flex items-start gap-2 text-nowrap max-sm:col-span-2 sm:col-span-3 md:col-span-1 lg:col-span-2 text-sm text-stroke-800 font-bold w-full border-b border-stroke-200 py-3">
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

function ProductDetails({ product }) {
  const { notes } = product;

  return (
    <div className="grow flex flex-col items-center justify-between gap-6 w-full max-md:row-start-3 max-md:border-t-[1.5px] md:border-[1.5px] md:rounded-2xl p-6 border-stroke-250  ">
      <div className="flex flex-col items-start justify-between gap-2 w-full">
        <span className="flex items-center justify-start gap-2">
          <AppImage
            src="/images/square-list-icon.svg"
            alt="square-list-icon"
            width="size-6"
            sizes="10vw"
          />
          <p className="font-bold text-stroke-800">ترکیبات محصول</p>
        </span>
        <p className="text-xs text-stroke-800">
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
    <div className="relative flex flex-col items-center justify-start gap-2 text-nowrap whitespace-nowrap w-full">
      <AppImage
        src={`/images/scent-background-${base ? "1" : middle ? "2" : "3"}.svg`}
        alt="shape-background"
        className="dark:mix-blend-overlay"
        width={
          base
            ? "!w-[60px] !h-[53.3px]"
            : middle
              ? "!w-[152.46px] !h-[66.02px]"
              : "!w-[310px] !h-[134.23px]"
        }
      />
      <span className="absolute flex flex-col items-center justify-center gap-1 z-20 w-4/5">
        <p className="text-xs text-stroke-800 font-bold">
          {base ? "نت‌های آغازین" : middle ? "نت‌های میانی" : "نت‌های پایانی"}
        </p>
        <div className="flex items-center justify-center gap-2 w-full text-wrap">
          {base &&
            type?.map((s, index) => (
              <p key={s + index} className="text-xs text-stroke-600 text-wrap">
                {type.length > 1 ? s + " - " : s}
              </p>
            ))}
          {middle &&
            type?.map((s, index) => (
              <p key={s + index} className="text-xs text-stroke-600 text-wrap">
                {type.length > 1 ? s + " - " : s}
              </p>
            ))}
          {top &&
            type?.map((s, index) => (
              <p key={s + index} className="text-xs text-stroke-600 text-wrap">
                {type.length > 1 ? s + " - " : s}
              </p>
            ))}
        </div>
      </span>
    </div>
  );
}
