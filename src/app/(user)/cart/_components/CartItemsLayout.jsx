"use client";

import CardEvents from "@/components/CardEvents";
import AppImage from "@/components/AppImage";
import PriceSection from "@/components/PriceSection";
import Table from "@/ui/Table";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { useQuantityHandler } from "@/hooks/useQuantityHandler";
import Link from "next/link";

function CartItemsLayout() {}

export default CartItemsLayout;

function Title({
  enTitle,
  perTitle,
  FirstClassName = "text-base",
  SecondClassName = "text-sm",
  brand,
  volume,
  type,
  location = "public",
}) {
  return (
    <div className="size-full">
      {location === "public" && (
        <div className="flex items-start justify-between size-full flex-col gap-1">
          {brand && <p className="text-stroke-600 text-xs">Versace</p>}
          <p
            className={`text-stroke-800 ${FirstClassName} font-bold truncate w-44`}
          >
            {enTitle}
          </p>
          <p
            className={`text-stroke-800 ${SecondClassName} font-semibold truncate w-44`}
          >
            {perTitle}
          </p>
        </div>
      )}
      {location === "summeryCardTwo" && (
        <div className="flex items-start justify-between size-full flex-col gap-1">
          <div className="flex items-start justify-between size-full">
            <span className="flex flex-col items-start gap-2">
              <p className="text-stroke-800 text-sm font-bold">{enTitle}</p>
              <p className="text-stroke-800 text-xs font-semibold">
                {perTitle}
              </p>
            </span>
            <div className="flex flex-col items-center gap-2 ">
              <p className="badge badge--primary w-fit">
                {type === "decant" ? "دکانت" : "پلمپ"}
              </p>
              <span className="flex items-center justify-end gap-0.5">
                <p className="text-stroke-800">{toPersianNumbers(volume)}</p>
                <p className="text-stroke-600 text-sm">میل</p>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileCartLayout({ cartItem }) {
  const {
    id,
    mode,
    product,
    quantity,
    volume,
    unitPrice,
    basePrice,
    lineTotal,
  } = cartItem;
  const imageSrc = product.images[0];
  const defaultVolume = volume;
  const volumeMode = mode;
  const { AddToCartHandler, RemoveFromCartHandler } = useQuantityHandler(
    product,
    defaultVolume,
    volumeMode,
    cartItem,
  );
  return (
    <div className="flex items-center justify-center p-3 gap-4 border-[0.094rem] border-stroke-200 shadow-xs rounded-2xl w-full ">
      <div className="flex items-center justify-start gap-4 size-full">
        <div className="flex items-start justify-center h-full">
          <AppImage
            src={imageSrc}
            alt={product.enTitle + "-image"}
            width="size-16"
            sizes="30vw"
          />
        </div>
        <div className="flex flex-col gap-3 size-full">
          <Title
            enTitle={product.enTitle}
            perTitle={product.perTitle}
            brand
            volume={volume}
            type={mode}
          />
          <div className="badge badge--secondary w-max h-6">
            {toPersianNumbers(volume)} میل
          </div>
          <div className="max-sm:relative flex flex-co max-sm:justify-end items-center justify-between size-full">
            <div className="max-sm:absolute -right-11">
              <PriceSection
                offValue={product.offValue}
                basePrice={basePrice * quantity}
                unitPrice={lineTotal}
              />
            </div>
            <div className="flex items-center justify-center">
              <CardEvents
                RemoveFromCartHandler={RemoveFromCartHandler}
                AddToCartHandler={AddToCartHandler}
                quantity={quantity}
                BtnBackgroundColor="bg-stroke-100 dark:bg-stroke-50"
                className="lg:*:*:size-5 *:*:size-4"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopCartLayout({ cartItem }) {
  const {
    id,
    mode,
    product,
    quantity,
    volume,
    unitPrice,
    basePrice,
    lineTotal,
  } = cartItem;
  const imageSrc = product.images[0];
  const defaultVolume = volume;
  const volumeMode = mode;
  const { AddToCartHandler, RemoveFromCartHandler } = useQuantityHandler(
    product,
    defaultVolume,
    volumeMode,
    cartItem,
  );
  return (
    <Table.Row border className="*:py-6">
      <td className="text-right">
        <Link
          href={`/products/${cartItem?.product.id}`}
          className="tdBase justify-start"
        >
          <div className="flex items-start justify-center h-full">
            <AppImage
              src={imageSrc}
              alt={product.enTitle + "-image"}
              width="size-[5.65rem]"
              sizes="30vw"
            />
          </div>
          <Title
            enTitle={product.enTitle}
            perTitle={product.perTitle}
            volume={volume}
            type={mode}
          />
        </Link>
      </td>
      <td className="flex flex-col gap-2 items-center justify-center size-full text-stroke-800">
        <p className="badge badge--primary w-fit">
          {mode === "decant" ? "دکانت" : "پلمپ"}
        </p>
        <p className="badge badge--secondary w-fit">
          {toPersianNumbers(volume)} میل
        </p>
      </td>
      <td className="text-center">
        <CardEvents
          RemoveFromCartHandler={RemoveFromCartHandler}
          AddToCartHandler={AddToCartHandler}
          quantity={quantity}
          BtnBackgroundColor="bg-stroke-100 dark:bg-stroke-50"
        />
      </td>
      <td className="text-center">
        <PriceSection
          offValue={product.offValue}
          basePrice={basePrice * quantity}
          unitPrice={lineTotal}
          className="w-full"
          justify="justify-end"
        />
      </td>
    </Table.Row>
  );
}

function SuccessedOrderCard({ cartItem }) {
  const {
    id,
    mode,
    product,
    quantity,
    volume,
    unitPrice,
    basePrice,
    lineTotal,
  } = cartItem;
  const imageSrc = product.images[0];
  return (
    <div
      className={`flex items-center justify-between w-full sm:max-w-max sm:min-w-96 max-md:p-3 md:p-4 !pr-0 max-md:gap-4 md:gap-5 max-md:border md:border-[1.5px] border-stroke-300 shadow-xs rounded-2xl`}
    >
      <DeskSuccessedCartItem cartItem={cartItem} />
      <div className="max-md:flex md:hidden items-center justify-start gap-4 size-full">
        <div className="flex items-start justify-center h-full">
          <AppImage
            src={imageSrc}
            alt={product.enTitle + "-image"}
            width="size-16"
            sizes="20vw"
          />
        </div>
        <div className="flex flex-col gap-3 size-full">
          <Title
            enTitle={product.enTitle}
            perTitle={product.perTitle}
            volume={volume}
            type={mode}
          />
          <div className="flex items-center justify-between size-full">
            <div className="badge badge--secondary w-max h-6">
              {toPersianNumbers(volume)} میل
            </div>
            <PriceSection
              offValue={product.offValue}
              basePrice={basePrice * quantity}
              unitPrice={lineTotal}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DeskSuccessedCartItem({ cartItem }) {
  const {
    id,
    mode,
    product,
    quantity,
    volume,
    unitPrice,
    basePrice,
    lineTotal,
  } = cartItem;
  const imageSrc = product.images[0];
  return (
    <div className="md:flex max-md:hidden items-center justify-between gap-1 w-full">
      <div className="flex items-start justify-center h-full">
        <AppImage
          src={imageSrc}
          alt={product.enTitle + "-image"}
          width="size-24"
        />
      </div>
      <div className="flex flex-col gap-3 size-full">
        <Title
          enTitle={product.enTitle}
          perTitle={product.perTitle}
          volume={volume}
          type={mode}
        />
        <div className="flex items-center justify-between size-full gap-4 text-stroke-800">
          <div className="flex items-center justify-between gap-1 text-sm">
            <p className="text-stroke-600">تعداد:</p>
            <span className="flex items-center justify-between">
              <p>{toPersianNumbers(quantity)}</p>
              <p>عدد</p>
            </span>
          </div>
          <div className="flex items-center justify-between gap-1 text-sm">
            <p className="text-stroke-600">حجم:</p>
            <span className="flex items-center justify-between">
              <p>{toPersianNumbers(volume)}</p>
              <p>میل</p>
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end justify-center gap-4 size-full">
        <p className="text-sm text-stroke-600">مبلغ پرداختی</p>
        <PriceSection
          offValue={product.offValue}
          basePrice={basePrice * quantity}
          unitPrice={lineTotal}
        />
      </div>
    </div>
  );
}

function SummeryCard({ cartItem }) {
  const {
    id,
    mode,
    product,
    quantity,
    volume,
    unitPrice,
    basePrice,
    lineTotal,
  } = cartItem;
  const defaultVolume = volume;
  const volumeMode = mode;
  const { AddToCartHandler, RemoveFromCartHandler } = useQuantityHandler(
    product,
    defaultVolume,
    volumeMode,
    cartItem,
  );
  const imageSrc = product.images[0];
  return (
    <div className="flex items-center justify-center p-3 gap-4 border-t border-stroke-200 shadow-xs w-full h-fit">
      <div className="flex items-center justify-center md:gap-2 lg:gap-4 size-full">
        <div className="flex items-start h-36">
          <div className="flex items-center justify-center md:h-auto lg:h-full aspect-square rounded-xl bg-stroke-0">
            <AppImage
              src={imageSrc}
              alt={product.enTitle + "-image"}
              width="max-lg:size-20 lg:size-[5.65rem]"
              sizes="20vw"
            />
          </div>
        </div>
        <div className="flex flex-col gap-3 size-full">
          <Title
            enTitle={product.enTitle}
            perTitle={product.perTitle}
            location="summeryCardTwo"
            volume={volume}
            type={mode}
          />

          <div className="flex items-center justify-between size-full">
            <PriceSection
              offValue={product.offValue}
              basePrice={basePrice * quantity}
              unitPrice={lineTotal}
              priceClassName="text-xl"
              textClassName="text-[10px]"
            />
            <div className="flex items-center justify-center">
              <CardEvents
                RemoveFromCartHandler={RemoveFromCartHandler}
                AddToCartHandler={AddToCartHandler}
                quantity={quantity}
                BtnBackgroundColor="bg-stroke-0"
                className="lg:*:*:size-5 *:*:size-4 h-10"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

CartItemsLayout.Mobile = MobileCartLayout;
CartItemsLayout.Desktop = DesktopCartLayout;
CartItemsLayout.Summery = SummeryCard;
CartItemsLayout.Success = SuccessedOrderCard;
