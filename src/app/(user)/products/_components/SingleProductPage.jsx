"use client";

import AppImage from "@/components/AppImage";
import CardEvents from "@/components/CardEvents";
import RadioButton from "@/ui/RadioButton";
import PriceSection from "@/components/PriceSection";
import Accordion from "@/ui/Accordion";
import { useCallback, useEffect, useRef, useState } from "react";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import ImageSwiper from "@/ui/ImageSwiper";
import BreadCrumbBase from "@/ui/BreadCrumbBase";
import BreadCrumb from "@/ui/BreadCrumb";
import { useRouter } from "next/navigation";
import { useQuantityHandler } from "@/hooks/useQuantityHandler";
import {
  calculateProductPrice,
  getMatchingVariant,
  getVariantsByType,
} from "@/utils/priceCalculator";
import SingleProductSkeleton from "../../_components/skeleton/SingleProductSkeleton";
import { showAddToCartSuccessToast } from "@/hooks/useCart";
import {
  CART_ROUTE,
  closeAddedItem,
  initialAddedToCartState,
  isDesktopViewport,
  resolveAddSuccessFeedback,
  showAddedItem,
} from "@/utils/addedToCartContract.mjs";
import AddedToCartModal from "./AddedToCartModal";

function SingleProductPage({ product }) {
  if (!product) {
    return (
      <main className=" container mx-auto xl:max-w-7xl">
        <SingleProductSkeleton />
      </main>
    );
  }

  return (
    <main className=" md:container md:mx-auto xl:max-w-7xl h-full">
      <article className="max-md:hidden">
        <BreadCrumbBase>
          <BreadCrumb href={"/"} label={"فروشگاه"} />
          <BreadCrumb href={"/products"} label={"محصولات"} chevron />
          <BreadCrumb
            href={`/products/${product?.id}`}
            label={product?.perTitle}
            className="text-primary! font-bold"
            chevron
          />
        </BreadCrumbBase>
      </article>
      <article className="grid grid-cols-1 md:grid-cols-2 h-full gap-6 md:gap-x-6 lg:gap-6 md:p-6 max-md:pb-24">
        <ImageSwiper images={product?.images} product={product} />
        <ProductDes key={product.id} product={product} />
        <ProductOptions product={product} />
        <ProductDetails product={product} />
        <Accordion
          titleStyle="font-bold text-stroke-800"
          className="max-md:flex md:hidden"
          label="توضیحات تکمیلی"
        >
          <p className="text-stroke-600 text-sm pt-4 border-t border-stroke-200 leading-8">
            {product?.description}
          </p>
        </Accordion>
      </article>
    </main>
  );
}

export default SingleProductPage;

function ProductDes({ product }) {
  const router = useRouter();

  const productBrand = product?.brand;

  const decantVariants = getVariantsByType(product, "decant");
  const sealedVariants = getVariantsByType(product, "sealed");
  const preferredMode = decantVariants.length
    ? "decant"
    : sealedVariants.length
      ? "sealed"
      : null;
  const [volumeMode, setVolumeMode] = useState(preferredMode);
  const activeMode =
    volumeMode === "decant" && decantVariants.length
      ? "decant"
      : volumeMode === "sealed" && sealedVariants.length
        ? "sealed"
        : preferredMode;
  const variantsForMode =
    activeMode === "decant"
      ? decantVariants
      : activeMode === "sealed"
        ? sealedVariants
        : [];
  const defaultVolume = Number(variantsForMode[0]?.volume ?? 0);

  // A new cart line: mobile shows the confirmation modal from the returned
  // line; desktop, or a line that cannot be identified, keeps the toast.
  const addButtonRef = useRef(null);
  const [addedToCart, setAddedToCart] = useState(initialAddedToCartState);
  const handleAdded = (data, variables) => {
    const feedback = resolveAddSuccessFeedback({
      cart: data,
      variables,
      isDesktop: isDesktopViewport(window),
    });
    if (feedback.kind === "modal") {
      setAddedToCart((state) => showAddedItem(state, feedback.item));
    } else {
      showAddToCartSuccessToast(data);
    }
  };
  const closeAddedToCart = useCallback(
    () => setAddedToCart(closeAddedItem),
    [],
  );
  const goToCart = () => {
    closeAddedToCart();
    router.push(CART_ROUTE);
  };

  const {
    AddToCartHandler,
    RemoveFromCartHandler,
    selectedVolume,
    setSelectedVolume,
    quantity,
  } = useQuantityHandler(product, defaultVolume, activeMode, undefined, {
    onAdded: handleAdded,
  });

  useEffect(() => {
    if (!getMatchingVariant(product, activeMode, selectedVolume)) {
      setSelectedVolume(defaultVolume);
    }
  }, [product, activeMode, selectedVolume, defaultVolume, setSelectedVolume]);

  const selectedVariant = getMatchingVariant(
    product,
    activeMode,
    selectedVolume,
  );
  const price = calculateProductPrice(
    product,
    selectedVariant?.type,
    selectedVariant?.volume,
  );
  const canPurchase =
    !!selectedVariant &&
    Number(product.stock) >= Number(selectedVariant.volume);

  const selectMode = (type) => {
    setVolumeMode(type);
    setSelectedVolume(Number(getVariantsByType(product, type)[0]?.volume ?? 0));
  };

  return (
    <article className="grid grid-cols-1 w-full gap-y-4 xl:gap-y-10 max-md:py-6 h-fit justify-items-start">
      {/* Product Name */}
      <section className="flex flex-col gap-2 items-start justify-start w-full">
        <span className="flex items-center max-md:justify-between gap-2 md:justify-start w-full">
          <p className="font-bold text-wrap text-[28px] w-full text-stroke-800">
            {product.perTitle}
          </p>

          <div className="md:hidden p-2">
            <AppImage
              src={productBrand?.iconUrl}
              alt={productBrand?.value + "-icon"}
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
      <section className="flex items-center justify-between w-full max-md:border-t border-stroke-250 pt-4">
        <div className="flex flex-col justify-between gap-2 w-full md:row-start-3 h-full overflow-hidden">
          <div className="flex justify-between">
            <div className="flex flex-col items-start justify-start gap-3">
              <p className="text-stroke-800">نوع محصول:</p>

              <div className="flex items-center justify-start gap-2 w-full overflow-auto scrollbar-none snap-x bg-transparent">
                {decantVariants.length > 0 && (
                  <RadioButton
                    id="productVolumeModeDecant"
                    name="productVolumeMode"
                    value="decant"
                    onChange={() => selectMode("decant")}
                    checked={activeMode === "decant"}
                    className="badge badge--secondary btn--type duration-200"
                  >
                    <p className="text-nowrap">دکانت</p>
                  </RadioButton>
                )}

                {sealedVariants.length > 0 && (
                  <RadioButton
                    id="productVolumeModeSealed"
                    name="productVolumeMode"
                    value="sealed"
                    onChange={() => selectMode("sealed")}
                    checked={activeMode === "sealed"}
                    className="badge badge--secondary btn--type duration-200"
                  >
                    <p className="text-nowrap">شیشه پلمپ</p>
                  </RadioButton>
                )}
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
              {variantsForMode.map((variant) => {
                const volume = Number(variant.volume);
                const isDisabled = product.stock < volume;

                return (
                  <RadioButton
                    key={variant.id ?? `${activeMode}-${volume}`}
                    id={`${activeMode}-${variant.id ?? volume}`}
                    name={`single-product-volume${product.id}`}
                    value={volume}
                    disabled={isDisabled}
                    onChange={() => setSelectedVolume(volume)}
                    checked={Number(selectedVolume) === volume}
                    className={`badge badge--secondary ${
                      isDisabled
                        ? "opacity-60 dark:opacity-40 cursor-not-allowed! strikeThrough border-red"
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
        {canPurchase ? (
          <PriceSection
            volume={selectedVolume}
            basePrice={price.basePrice}
            unitPrice={price.finalPrice}
            offValue={price.offValue}
            OldPricevisibility="block"
            pricesRow="flex-col-reverse max-md:gap-0"
            className=""
            priceClassName="text-[32px]"
            justify="max-md:justify-end md:justify-start"
          />
        ) : (
          <p className="text-primary font-bold max-md: md:text-3xl">
            {selectedVariant ? "ناموجود!" : "گزینه‌ای برای خرید موجود نیست"}
          </p>
        )}

        <div className="max-md:hidden p-2">
          <AppImage
            src={productBrand?.iconUrl}
            alt={productBrand?.value + "-icon"}
            className="justify-center h-full dark:invert"
            width="max-md:w-16 md:w-20 xl:w-28"
            ratio="aspect-[4/1]"
            sizes="20vw"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between w-full gap-4 duration-200">
        {canPurchase && (
          <button
            ref={addButtonRef}
            onClick={
              quantity === 0 ? AddToCartHandler : () => router.push("/cart")
            }
            className={`btn ${
              quantity === 0 ? "btn--success" : "btn--primary font-bold border"
            } w-full h-12 px-2 transition-all ease-in-out duration-200`}
          >
            {quantity === 0 ? "افزودن به سبد خرید" : "مشاهده سبد خرید"}
          </button>
        )}

        <div className="flex-none">
          {selectedVariant && quantity > 0 && (
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
        className="max-md:hidden md:flex"
        label="توضیحات تکمیلی"
      >
        <p className="text-stroke-600 text-sm pt-4 border-t border-stroke-200 leading-8">
          {product?.description}
        </p>
      </Accordion>

      <AddedToCartModal
        open={addedToCart.open}
        item={addedToCart.item}
        seq={addedToCart.seq}
        onClose={closeAddedToCart}
        onGoToCart={goToCart}
        returnFocusRef={addButtonRef}
      />
    </article>
  );
}

function ProductOptions({ product }) {
  const categories = product?.categories ?? {};
  const performance = product?.performance;
  const longevity = performance?.longevity;
  const hasHourRange =
    longevity?.minHours != null && longevity?.maxHours != null;
  const longevityValue = longevity?.level
    ? `${longevityLabels[longevity.level] ?? longevity.level}${
        hasHourRange
          ? ` (${toPersianNumbers(longevity.minHours)} تا ${toPersianNumbers(longevity.maxHours)} ساعت)`
          : ""
      }`
    : null;
  const categoryTitles = (items) =>
    (items ?? []).map((category) => category?.title).filter(Boolean);

  return (
    <article className="grow w-full max-md:border-t-[1.5px] md:border-[1.5px] md:rounded-2xl max-md:pt-6 md:p-4 border-stroke-250 ">
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
        <div className="grid max-sm:grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-3 gap-x-4 w-full px-2 overflow-hidden">
          <ProductOption title="کشور تولید کننده" value={product.country} />
          <ProductOption title="عطرساز" value={product.perfumer} />
          <ProductOption
            title="سال عرضه"
            value={
              product.releaseYear == null
                ? null
                : toPersianNumbers(product.releaseYear)
            }
          />
          <ProductOption
            title="غلظت"
            value={
              product.concentration
                ? (concentrationLabels[product.concentration] ??
                  product.concentration)
                : null
            }
          />
          <ProductOption title="ماندگاری" value={longevityValue} />
          <ProductOption
            title="پخش بو"
            value={
              performance?.projection
                ? (projectionLabels[performance.projection] ??
                  performance.projection)
                : null
            }
          />
          <ProductOption
            title="رد بو"
            value={
              performance?.sillage
                ? (sillageLabels[performance.sillage] ?? performance.sillage)
                : null
            }
          />
          <ProductOption
            title="نسخه‌های پلمپ"
            volumes
            data={getVariantsByType(product, "sealed")}
          />
          <ProductOption title="جنسیت" value={categories.gender?.title} />
          <ProductOption
            title="گروه‌‌بندی رایحه"
            data={categoryTitles(categories.fragranceFamilies)}
          />
          <ProductOption
            title="فصل استفاده"
            data={categoryTitles(categories.seasons)}
          />
          <ProductOption title="طبع" value={categories.temperature?.title} />
          <ProductOption
            title="شخصیت رایحه"
            data={categoryTitles(categories.characters)}
          />
          <ProductOption
            title="موقعیت استفاده"
            data={categoryTitles(categories.occasions)}
          />
        </div>
      </section>
    </article>
  );
}

const longevityLabels = {
  LOW: "کم",
  MODERATE: "متوسط",
  HIGH: "زیاد",
  VERY_HIGH: "خیلی زیاد",
};
const projectionLabels = {
  WEAK: "ضعیف",
  MODERATE: "متوسط",
  STRONG: "قوی",
  VERY_STRONG: "خیلی قوی",
};
const sillageLabels = {
  LOW: "کم",
  MODERATE: "متوسط",
  HIGH: "زیاد",
  VERY_HIGH: "خیلی زیاد",
};
const concentrationLabels = {
  PARFUM: "پارفوم",
  EXTRAIT_DE_PARFUM: "اکستریت د پارفوم",
  EAU_DE_PARFUM: "ادو پرفیوم",
  EAU_DE_TOILETTE: "ادو تویلت",
  EAU_DE_COLOGNE: "ادو کلن",
  PERFUME_OIL: "روغن عطر",
  BODY_MIST: "بادی میست",
  OTHER: "سایر",
};

function ProductOption({ title, value, data, volumes = false }) {
  if ((value == null || value === "") && !data?.length) return null;

  return (
    <>
      <p className="text-nowrap col-span-1 text-sm text-stroke-600 py-3">
        {title}
      </p>
      {!data?.length ? (
        <p className="text-nowrap max-sm:col-span-2 sm:col-span-3 md:col-span-2 lg:col-span-2 text-sm text-stroke-800 font-bold w-full border-b border-stroke-200 py-3">
          {value}
        </p>
      ) : (
        <span className="flex items-start gap-1 text-nowrap flex-wrap max-sm:col-span-2 sm:col-span-3 md:col-span-2 lg:col-span-2 text-sm text-stroke-800 font-bold w-full border-b border-stroke-200 py-3">
          {data.map((item, index) => (
            <span className="flex items-center justify-start gap-1" key={index}>
              {index > 0 && " - "}
              <p>{volumes ? toPersianNumbers(item.volume) + " میل" : item}</p>
            </span>
          ))}
        </span>
      )}
    </>
  );
}

function ProductDetails({ product }) {
  const { notes } = product;

  return (
    <div className="grow flex flex-col items-center justify-between gap-6 size-full md:px-4 max-md:row-start-3 max-md:border-t-[1.5px] md:border-[1.5px] md:rounded-2xl py-6 border-stroke-250  ">
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
        <p className="text-xs text-stroke-800 leading-6">
          {product?.notesDescription}
        </p>
      </div>
      <div className="flex flex-col items-center justify-end gap-2 size-full max-md:min-h-[28vh] md:max-h-80">
        <Notes type={notes?.base} base />
        <Notes type={notes?.middle} middle />
        <Notes type={notes?.top} top />
      </div>
    </div>
  );
}

function Notes({ type, top, middle, base }) {
  return (
    <div
      className={`relative flex flex-col items-center justify-start gap-2 text-nowrap whitespace-nowrap w-full ${base ? "h-1/5" : middle ? "h-1/4" : "h-1/2"}`}
    >
      <AppImage
        src={`/images/scent-background-${base ? "1" : middle ? "2" : "3"}.svg`}
        alt="shape-background"
        className="dark:mix-blend-overlay"
        width={`max-md:h-full ${
          base ? "md:h-[53.3px]" : middle ? "md:h-[66.02px]" : "md:h-[134.23px]"
        }`}
        ratio={base ? "aspect-4/3" : middle ? "aspect-4/2" : "aspect-4/1"}
      />
      <span className="absolute flex flex-col items-center justify-center gap-1 z-20 w-4/5">
        <p className="text-xs text-stroke-800 font-bold">
          {base ? "نت‌های آغازین" : middle ? "نت‌های میانی" : "نت‌های پایانی"}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1 w-full text-wrap text-center leading-px">
          {type?.map((s, index) => (
            <span
              className="flex items-center justify-start gap-1 text-wrap"
              key={index}
            >
              {index > 0 && " - "}
              <p className="text-xs text-stroke-600 text-nowrap">{s}</p>
            </span>
          ))}
        </div>
      </span>
    </div>
  );
}
