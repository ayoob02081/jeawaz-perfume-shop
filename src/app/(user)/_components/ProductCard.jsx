"use client";

import ImageFrame from "@/components/ImageFrame";
import PriceSection from "@/components/PriceSection";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

function ProductCard({
  src,
  alt,
  scent,
  gender,
  brand,
  enTitle,
  perTitle,
  price,
  offValue,
  original,
  productId,
}) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center p-4 w-[21.6rem] md:w-[19.4rem] h-[13.5rem] md:h-[28.9rem] bg-white rounded-2xl border-[1.5px] border-[#EBEBEB]">
      <div className="flex items-start justify-between gap-4 w-full h-full">
        <div className="flex flex-none md:hidden items-center justify-center h-20 w-[4.5rem]">
          <ImageFrame src={src} alt={alt} className="size-full" />
        </div>
        <div className="flex grow flex-col w-full h-full">
          <div className="flex flex-none items-center justify-between max-md:mb-4 mb-1">
            <CardIconResponsive
              type={scent}
              className="max-md:h-8 md:h-10"
              hoverWidthMaxMd="w-[6.5rem]"
              hoverWidthMd="w-[8.35rem]"
              size="max-md:size-4 md:size-6"
            />
            <CardIconResponsive
              type={gender}
              className="max-md:h-8 md:h-10"
              hoverWidthMaxMd="w-[5.5rem]"
              hoverWidthMd="w-[4.55rem]"
              size="max-md:size-4 md:size-6"
            />
          </div>
          <div className="grow max-md:hidden md:flex items-center justify-center h-[11.7rem] w-[10.65rem] mx-auto">
            <ImageFrame src={src} alt={alt} className="size-full" />
          </div>
          <div className="flex-none flex items-center justify-between mb-2 md:mt-2 h-6">
            <p className="text-text-secondary max-md:text-xs text-base font-bold">
              {brand}
            </p>
            {original === true && (
              <ImageFrame
                src="/images/bg-original.svg"
                alt="orginal icon"
                className="max-md:w-16 justify-center h-full md:w-[4.815rem]"
              />
            )}
          </div>
          <div className="flex-none flex flex-col gap-1 max-md:pb-5 md:pb-6 font-bold border-b border-[#EBEBEB] ">
            <p className="max-md:text-base text-lg font-bold">{enTitle}</p>
            <p className="max-md:text-sm text-lg font-bold">{perTitle} </p>
          </div>
          <div className="flex flex-none items-center justify-between gap-4 w-full pt-2">
            <PriceSection price={price} offValue={offValue} />
            <button
              onClick={() => router.push(`/products/${productId}`)}
              className="text-primary max-md:size-[1.1rem] size-6"
            >
              <ArrowLeftIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;

export function CardIconResponsive({
  size,
  className,
  hoverWidthMd,
  hoverWidthMaxMd,
  type,
}) {
  let bgColor;
  let src;
  let alt;
  let textStyle;
  let justify;
  let title;
  let dir;

  switch (type) {
    case "sweet":
      bgColor = "bg-orange/10";
      src = "/images/beach-icon.svg";
      alt = "beach-icon";
      textStyle = "text-orange";
      justify = "start";
      title = "رایحه شیرین";
      dir = "rtl";
      break;

    case "bitter":
      bgColor = "bg-dark-brown/10";
      src = "/images/frozen-icon.svg";
      alt = "frozen-icon";
      textStyle = "text-dark-brown";
      justify = "start";
      title = "رایحه تلخ";
      dir = "rtl";
      break;

    case "spicy":
      bgColor = "bg-success/10";
      src = "/images/dropwaters-icon.svg";
      alt = "dropwaters-icon";
      textStyle = "text-success";
      justify = "start";
      title = "رایحه تند";
      dir = "rtl";
      break;

    case "man":
      bgColor = "bg-grey";
      src = "/images/man-icon.svg";
      alt = "man-icon";
      justify = "end";
      title = "مردانه";
      dir = "ltr";
      break;

    case "woman":
      bgColor = "bg-grey";
      src = "/images/woman-icon.svg";
      alt = "woman-icon";
      justify = "end";
      title = "زنانه";
      dir = "ltr";
      break;

    case "support":
      bgColor = "bg-primary/10";
      src = "/images/call-ringing-4-primary-icon.svg";
      alt = "call-ringing-icon";
      justify = "end";
      title = "پشتیبانی";
      dir = "ltr";
      break;

    default:
      break;
  }

  return (
    <div
      dir={dir}
      className={`flex items-center group rounded-[40px] px-2 md:hover:${hoverWidthMd} max-md:hover:${hoverWidthMaxMd} ${bgColor} ${className} duration-300`}
    >
      <ImageFrame
        src={src}
        alt={alt}
        className={`text-nowrap justify-${justify} ${size}`}
      />
      <p
        className={`w-0 opacity-0 group-hover:opacity-100 duration-200 group-hover:w-auto text-nowrap max-md:text-xs group-hover:pr-2 md:text-sm font-bold ${textStyle}`}
      >
        {title}
      </p>
    </div>
  );
}
