import {
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";

function PriceSection({
  price,
  offValue,
  priceClassName = "max-md:text-xl text-2xl",
  textClassName = "text-xs",
  className,
  justify = "justify-start",
  OldPricevisibility = "max-md:hidden",
  pricesRow = "max-md:flex-row-reverse max-md:gap-2",
}) {
  const offPrice = Math.round((price - (price * offValue) / 100) / 1000) * 1000;
  console.log(offValue, offValue < 10);

  return (
    <div className={`${className}`}>
      <div
        className={`relative flex ${pricesRow} flex-col justify-center items-center md:h-14`}
      >
        <div
          className={`flex grow items-center ${justify} gap-1 size-full text-stroke-800`}
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
                {toPersianNumbersWithComma(price)}
              </p>
              <p className="text-[10px] font-bold">تومان</p>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default PriceSection;
