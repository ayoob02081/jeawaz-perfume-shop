import {
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";

function PriceSection({
  basePrice = 0,
  unitPrice = 0,
  offValue = 0,

  priceClassName = "max-md:text-xl text-2xl text-stroke-800",
  textClassName = "text-xs text-stroke-800",

  className,
  justify = "justify-start",

  OldPricevisibility = "max-md:hidden",

  pricesRow = "max-md:flex-row-reverse max-md:gap-2",
}) {
  const hasDiscount = offValue > 0 && unitPrice > 0 && basePrice > unitPrice;

  const hasPrice = basePrice > 0;

  const badgeWidth = offValue > 10 ? "text-[10px] md:text-xs" : "";

  if (!hasPrice) {
    return (
      <div
        className={`relative flex ${pricesRow} flex-col justify-center items-center md:h-14`}
      >
        <div className="relative flex items-center justify-start gap-1">
          <p className={`${priceClassName} font-bold`}>قیمت نامشخص</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        className={`relative flex ${pricesRow} flex-col justify-center items-center md:h-14`}
      >
        <div
          className={`flex grow items-center ${justify} gap-1 size-full text-stroke-800`}
        >
          <p className={`${priceClassName} font-bold`}>
            {hasDiscount
              ? toPersianNumbersWithComma(unitPrice)
              : toPersianNumbersWithComma(basePrice)}
          </p>

          <p className={`${textClassName} font-bold`}>تومان</p>
        </div>

        {hasDiscount && (
          <div
            className={`flex grow items-center ${justify} gap-1 size-full text-stroke-600`}
          >
            <div
              className={`absolut badge bg-primary text-white py-0 px-2 ${badgeWidth}`}
            >
              <p className="translate-y-0.5">%</p>

              <p>{toPersianNumbers(offValue)}</p>
            </div>

            <span className={`flex gap-1 strikeThrough ${OldPricevisibility}`}>
              <p className="text-xs font-bold">
                {toPersianNumbersWithComma(basePrice)}
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
