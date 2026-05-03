"use client";

import {
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";

function PriceSection({
  basePrice,
  unitPrice,
  offValue = 0,
  pricePerMl,
  volume,
  priceClassName = "max-md:text-xl text-2xl text-stroke-800",
  textClassName = "text-xs text-stroke-800",
  className,
  justify = "justify-start",
  OldPricevisibility = "max-md:hidden",
  pricesRow = "max-md:flex-row-reverse max-md:gap-2",
}) {
  const calculateDecantPrice = (pricePerMl, volume, offValue = 0) => {
    const basePrice = pricePerMl * volume;
    const unitPrice = basePrice * (1 - offValue / 100);
    return Math.round(unitPrice);
  };

  const baseStartingPrice = pricePerMl * volume;
  const startingPrice = calculateDecantPrice(pricePerMl, volume, offValue);

  return basePrice ? (
    <div className={`${className}`}>
      <div
        className={`relative flex ${pricesRow} flex-col justify-center items-center md:h-14`}
      >
        <div
          className={`flex grow items-center ${justify} gap-1 size-full text-stroke-800`}
        >
          <p className={`${priceClassName} font-bold`}>
            {offValue
              ? toPersianNumbersWithComma(unitPrice)
              : toPersianNumbersWithComma(basePrice)}
          </p>
          <p className={`${textClassName} font-bold`}>تومان</p>
        </div>
        {offValue > 0 && (
          <div
            className={`flex grow items-center ${justify} gap-1 size-full text-stroke-600`}
          >
            <p
              className={`absolute badge aspect-square bg-primary text-white p-0 ${offValue < 10 ? "w-6 md:w-7" : "w-7 md:w-8"}`}
            >
              {toPersianNumbers(offValue)}٪
            </p>
            <div className={offValue < 10 ? "w-6 md:w-7" : "w-7 md:w-8"}></div>
            <span className={`flex gap-1 strikeThrough ${OldPricevisibility} `}>
              <p className=" text-xs font-bold">
                {toPersianNumbersWithComma(basePrice)}
              </p>
              <p className="text-[10px] font-bold">تومان</p>
            </span>
            <div
              className={` ${offValue < 10 ? "w-6 md:w-7" : "w-7 md:w-8"}`}
            ></div>
          </div>
        )}
      </div>
    </div>
  ) : (
    <div
      className={`relative flex ${pricesRow} flex-col justify-center items-center md:h-14`}
    >
      <div className="relative flex items-center justify-start gap-1 ">
        <p className={`${priceClassName} font-bold`}>از</p>
        <p className={`max-md:text-xl text-2xl ${priceClassName} font-bold`}>
          {toPersianNumbersWithComma(startingPrice)}
        </p>
        <p className={`${textClassName} font-bold`}>تومان</p>
      </div>
      {offValue > 0 && (
        <div
          className={`flex grow items-center ${justify} gap-1 size-full text-stroke-600`}
        >
          <p
            className={`absolute badge aspect-square bg-primary text-white p-0 ${offValue < 10 ? "w-6 md:w-7" : "w-7 md:w-8"}`}
          >
            {toPersianNumbers(offValue)}٪
          </p>
          <div className={offValue < 10 ? "w-6 md:w-7" : "w-7 md:w-8"}></div>
          <span className={`flex gap-1 strikeThrough ${OldPricevisibility} `}>
            <p className="text-[10px] font-bold">از</p>
            <p className=" text-xs font-bold">
              {toPersianNumbersWithComma(baseStartingPrice)}
            </p>
            <p className="text-[10px] font-bold">تومان</p>
          </span>
        </div>
      )}
    </div>
  );
}

export default PriceSection;
