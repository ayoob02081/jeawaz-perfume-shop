import { normalizePrice } from "@/utils/priceCalculator";
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
   const finalPrice =
    basePrice && offValue > 0
      ? normalizePrice(basePrice - (basePrice * offValue) / 100)
      : basePrice;

    return normalizePrice(finalPrice);
  };

  const baseStartingPrice = pricePerMl && volume ? pricePerMl * volume : 0;
  const startingPrice =
    pricePerMl && volume
      ? calculateDecantPrice(pricePerMl, volume, offValue)
      : 0;

  const badgeWidth = offValue > 10 ? "text-[10px] md:text-xs" : "";

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
              className={`absolut badge aspect-square bg-primary text-white py-0 px-1 w-6 md:w-7 ${badgeWidth}`}
            >
              {toPersianNumbers(offValue)}٪
            </p>
            <span className={`flex gap-1 strikeThrough ${OldPricevisibility} `}>
              <p className=" text-xs font-bold">
                {toPersianNumbersWithComma(basePrice)}
              </p>
              <p className="text-[10px] font-bold">تومان</p>
            </span>
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
            className={`absolut badge aspect-square bg-primary text-white py-0 px-1 w-6 md:w-7 ${badgeWidth}`}
          >
            {toPersianNumbers(offValue)}٪
          </p>
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
