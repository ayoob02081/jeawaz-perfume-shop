import {
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";

function PriceSection({
  price,
  offPrice,
  offValue,
  priceClassName = "max-md:text-lg text-2xl",
  textClassName = "text-xs",
  className,
  justify = "start",
}) {
  return (
    <div className={`${className}`}>
      <div className="flex flex-col justify-center items-center">
        <div
          className={`flex grow items-center justify-${justify} gap-2 w-full h-full text-text-primary`}
        >
          <p className={`${priceClassName} font-bold`}>
            {toPersianNumbersWithComma(price)}
          </p>
          <p className={`${textClassName} font-bold`}>تومان</p>
        </div>
        {offValue > 0 && (
          <div
            className={`flex grow items-center justify-${justify} gap-2 w-full h-full text-text-secondary max-md:hidden`}
          >
            <p className="badge badge--primary bg-primary text-white">
              {toPersianNumbers(offValue)}٪
            </p>
            <p className="max-md:text-lg text-xs font-bold">
              {toPersianNumbersWithComma(offPrice)}
            </p>
            <p className="text-[0.625rem] font-bold">تومان</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PriceSection;
