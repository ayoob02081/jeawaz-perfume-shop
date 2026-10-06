import AppImage from "@/components/AppImage";
import Error from "@/components/Error";
import Loading from "@/components/Loading";
import PriceSection from "@/components/PriceSection";
import { getProductCardPresentation } from "@/utils/priceCalculator";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function ProductCard({ product, isPending, error }) {
  const router = useRouter();
  const {
    id,
    original,
    enTitle,
    perTitle,
    stock,
    images,
    categories,
    brand: productBrand,
  } = product || {};

  const { representativeVariant, cardPrice, cardLabel } =
    getProductCardPresentation(product);
  const inStock =
    !!representativeVariant &&
    Number(stock) >= Number(representativeVariant.volume);
  const productTemperature = categories?.temperature;
  const productCharacters = categories?.characters;
  const productGender = categories?.gender;

  if (isPending) {
    return <Loading />;
  }

  if (error) {
    return <Error />;
  }
  if (!product) return null;

  return (
    <article
      className={`relative hover:*:*:last:*:first:*:last:scale-105 *:*:last:*:first:*:last:duration-300 flex items-center justify-center max-md:p-3 p-4 max-md:pr-0 h-54 md:h-115.5 aspect-2/3 max-md:min-w-78 bg-stroke-0 dark:bg-stroke-50 rounded-2xl border-[1.5px] border-stroke-250 ${inStock ? "" : "opacity-80 dark:opacity-60"} snap-center duration-200`}
    >
      {/* Mobile Mode Base Image */}
      <div className="flex items-start justify-between size-full">
        <div className="flex flex-none md:hidden items-center justify-center p-2 h-25 aspect-4/5">
          <AppImage
            src={images?.[0]}
            alt={"-عکس" + perTitle}
            priority={true}
            ratio="aspect-4/5"
          />
        </div>
        <div className="flex grow flex-col justify-between size-full">
          <div className="flex flex-col justify-start size-full">
            {/* Categories Icon */}
            <div className="absolute top-3 left-3 max-md:right-18 right-3 z-10 flex items-center justify-between max-md:mb-4 mb-1">
              <CardIconResponsive
                category={true}
                src={productTemperature?.iconUrl}
                alt={productTemperature?.value + "-icon"}
                title={productTemperature?.title}
                type={productTemperature?.value}
                className="max-md:h-8 md:h-10"
                size="max-md:size-5 md:size-6"
              />
              {productCharacters?.slice(0, 2).map((character) => (
                <CardIconResponsive
                  key={character?.id}
                  category={true}
                  src={character?.iconUrl}
                  alt={character?.value + "-icon"}
                  title={character?.title}
                  type={character?.value}
                  className="max-md:h-8 md:h-10"
                  size="max-md:size-5 md:size-6"
                />
              ))}
              <CardIconResponsive
                src={productGender?.iconUrl}
                alt={productGender?.value + "-icon"}
                title={productGender?.title}
                type={productGender?.value}
                className="max-md:h-8 md:h-10"
                size="max-md:size-5 md:size-6"
              />
            </div>

            {/* Desktop Mode Base Picture */}
            <div className="grow max-md:hidden md:flex items-center justify-center pt-11 pb-5">
              <AppImage
                src={images?.[0]}
                alt={"-عکس" + perTitle}
                priority={true}
                className="w-auto! h-full"
              />
            </div>
          </div>

          {/* Product Des */}
          <button onClick={() => router.push(`/products/${id}`)}>
            {/* Products Brand */}
            <div className="flex-none flex items-center justify-between mb-2 md:mt-2 h-6">
              <p className="text-stroke-600 text-sm md:text-base md:font-bold">
                {productBrand?.value?.toUpperCase()}
              </p>
              {original === true ? (
                <AppImage
                  src="/images/bg-original.svg"
                  alt="original-icon"
                  ratio="aspect-6/1"
                  className="justify-center"
                  width="max-md:w-16 h-full md:w-[4.815rem]"
                  sizes="10vw"
                />
              ) : (
                <span className="inline-flex items-center rounded-full border border-stroke-200 bg-stroke-200 px-2 py-1.5 text-[10px] font-bold text-stroke-500">
                  سوپر مستر
                </span>
              )}
            </div>

            {/* Products Name */}
            <div className="flex-none flex items-start justify-start flex-col gap-1 max-md:pb-3 md:pb-6 font-bold border-b border-stroke-250">
              <span className="flex items-start justify-start flex-col w-full text-lg font-bold text-stroke-800 text-nowrap overflow-hidden *:overflow-x-auto *:scrollbar-none *:py-[0.5px] text-start max-md:max-w-55 md:max-w-68">
                <p className="w-full max-md:text-base">{enTitle}</p>
                <p className="w-full max-md:text-sm">{perTitle}</p>
              </span>
            </div>

            {/* Products Price */}
            <div
              className={`relative flex flex-none items-center md:items-end gap-4 w-full pt-2 ${inStock ? "justify-between" : "justify-end"}`}
            >
              {representativeVariant && inStock && (
                <div className="flex flex-col items-start gap-0.5">
                  <PriceSection
                    basePrice={cardPrice.basePrice}
                    unitPrice={cardPrice.finalPrice}
                    offValue={cardPrice.offValue}
                    OldPricevisibility="block"
                    pricesRow="flex-col-reverse max-md:gap-0"
                    priceClassName="max-md:text-lg md:text-xl lg:text-[32px]"
                    justify="justify-start"
                  />
                  <span className="max-md:absolute -right-18 bottom-0 text-xs md:text-sm text-stroke-600">
                    {cardLabel}
                  </span>
                </div>
              )}

              {/* Products Order Button */}
              <div>
                {inStock ? (
                  <p className="btn border border-primary text-primary bg-stroke-50 backdrop-blur-md active:bg-primary active:text-white md:hover:bg-primary md:hover:text-white rounded-lg md:rounded-xl py-1 px-2 md:p-2 text-wrap duration-200">
                    مشاهده
                  </p>
                ) : (
                  <p className="text-wrap w-full text-primary text-xl font-bold  py-1 px-2 md:p-2 md:h-20">
                    ناموجود!
                  </p>
                )}
              </div>
            </div>
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;

export function CardIconResponsive({
  size,
  className,
  category,
  src,
  alt,
  title,
  type,
  as: Wrapper = "button",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  let bgColor;

  switch (type) {
    case "spicy-character":
      bgColor = "bg-rose-500/10 text-rose-500 dark:bg-rose-500/5";
      break;

    case "sweet":
      bgColor = "bg-dark-orange/10 text-dark-orange dark:bg-dark-orange/5";
      break;

    case "sour":
      bgColor = "bg-dark-orange/10 text-amber-300 dark:bg-dark-orange/5";
      break;

    case "moderate":
      bgColor = "bg-green/10 text-green dark:bg-green/5";
      break;

    case "warm":
      bgColor = "bg-orange/10 text-red dark:bg-orange/5";
      break;

    case "bitter":
      bgColor =
        "bg-stroke-900/10 text-stroke-900 dark:bg-stroke-800/5 dark:text-dark-orange";
      break;

    case "cool":
      bgColor = "bg-blue/10 text-blue";
      break;

    case "male":
      bgColor =
        "bg-stroke-950/10 text-stroke-950 dark:bg-stroke-800/5 dark:text-stroke-250";
      break;

    case "women":
      bgColor = "bg-rose-500/10 text-rose-500 dark:bg-rose-500/5";
      break;

    case "unisex":
      bgColor =
        "bg-orange/10 text-dark-orange dark:bg-warning/5 dark:text-warning";
      break;

    case "support":
      bgColor = "bg-primary/10 text-primary dark:bg-primary/5";
      break;

    default:
      bgColor = "bg-primary/10 text-primary dark:bg-primary/5";
      break;
  }

  useEffect(() => {
    if (Wrapper !== "button") return;

    const handlePointerDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [Wrapper]);

  const canToggle = Wrapper === "button";

  return (
    <Wrapper
      ref={wrapperRef}
      {...(canToggle && {
        type: "button",
        onClick: () => setIsOpen((prev) => !prev),
      })}
      dir={category ? "rtl" : "ltr"}
      className={`
        group flex aspect-square items-center justify-center
        overflow-hidden rounded-5xl
        duration-300

        ${canToggle && isOpen ? "max-md:aspect-auto max-md:px-2" : ""}

        md:hover:aspect-auto
        md:hover:px-2

        ${bgColor}
        ${className}
      `}
    >
      <AppImage
        src={src}
        alt={alt}
        className={`z-10 text-nowrap ${category ? "" : "justify-end"}`}
        width={size}
        sizes="10vw"
      />

      <p
        className={`
          w-0 translate-y-px whitespace-nowrap
          opacity-0 transition-all
          max-md:text-xs md:text-sm
          font-bold

          ${
            category
              ? `translate-x-full ${
                  isOpen
                    ? "max-md:w-auto max-md:translate-x-0 max-md:pr-1 max-md:opacity-100 max-md:duration-300"
                    : ""
                } md:group-hover:w-auto md:group-hover:translate-x-0 md:group-hover:pr-1 md:group-hover:opacity-100 md:group-hover:duration-300`
              : `-translate-x-full ${
                  isOpen
                    ? "max-md:w-auto max-md:translate-x-0 max-md:pl-1 max-md:opacity-100 max-md:duration-300"
                    : ""
                } md:group-hover:w-auto md:group-hover:translate-x-0 md:group-hover:pl-1 md:group-hover:opacity-100 md:group-hover:duration-300`
          }
        `}
      >
        {title}
      </p>
    </Wrapper>
  );
}
