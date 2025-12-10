import {
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";

function PriceSection({
  pricePerVolume,
  volume,
  offValue,
  priceClassName = "max-md:text-xl text-2xl",
  textClassName = "text-xs",
  className,
  justify = "justify-start",
  OldPricevisibility = "max-md:hidden",
  pricesRow = "max-md:flex-row-reverse max-md:gap-2",
}) {
  const price = pricePerVolume * volume;
  const offPrice = Math.round((price - (price * offValue) / 100) / 1000) * 1000;

  return (
    <div className={`${className}`}>
      <div
        className={`relative flex ${pricesRow} flex-col justify-center items-center md:h-14`}
      >
        <div
          className={`flex grow items-center ${justify} gap-1 w-full h-full text-text-primary`}
        >
          <p className={`${priceClassName} font-bold`}>
            {offValue
              ? toPersianNumbersWithComma(offPrice)
              : toPersianNumbersWithComma(price)}
          </p>
          <p className={`${textClassName} font-bold`}>تومان</p>
        </div>
        {offValue > 0 && (
          <div
            className={`flex grow items-center ${justify} gap-1 w-full h-full text-text-secondary`}
          >
            <p className="max-md:absolute -right-7 badge badge--primary bg-primary text-white px-1.5">
              {toPersianNumbers(offValue)}٪
            </p>
            <span className={`flex gap-1 strikeThrough ${OldPricevisibility} `}>
              <p className=" text-xs font-bold">
                {toPersianNumbersWithComma(price)}
              </p>
              <p className="text-[0.625rem] font-bold">تومان</p>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default PriceSection;
