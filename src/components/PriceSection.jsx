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
  justify = "start",
}) {
  const offPrice = Math.round(price - (price * offValue) / 100);

  return (
    <div className={`${className}`}>
      <div className="flex max-md:flex-row-reverse max-md:gap-2 flex-col justify-center items-center max-md:h- md:h-14">
        <div
          className={`flex grow items-center justify-${justify} gap-1 w-full h-full text-text-primary`}
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
            className={`flex grow items-center justify-${justify} gap-1 w-full h-full text-text-secondary max-md:hidde`}
          >
            <p className="badge badge--primary bg-primary text-white px-1.5">
              {toPersianNumbers(offValue)}٪
            </p>
            <span className="flex gap-1 strikeThrough max-md:hidden">
              <p className="max-md:text- text-xs font-bold">
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
