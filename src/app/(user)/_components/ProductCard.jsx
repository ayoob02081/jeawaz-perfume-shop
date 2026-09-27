import AppImage from "@/components/AppImage";
import Error from "@/components/Error";
import Loading from "@/components/Loading";
import PriceSection from "@/components/PriceSection";
import { getProductCardPresentation } from "@/utils/priceCalculator";
import { useRouter } from "next/navigation";

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
      className={`relative hover:*:*:last:*:first:*:last:scale-105 *:*:last:*:first:*:last:duration-300 flex items-center justify-center max-md:p-3 p-4 max-md:pr-0 h-54 md:h-115.5 aspect-2/3 max-md:min-w-78 bg-stroke-0 dark:bg-stroke-50 rounded-2xl border-[1.5px] border-stroke-250 ${inStock ? "" : "opacity-80 dark:opacity-60"} snap-center duration-200 overflow-hidden`}
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
              {productCharacters?.map(
                (character, index) =>
                  index >= 1 && (
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
                  ),
              )}
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
                {productBrand?.value}
              </p>
              {original === true && (
                <AppImage
                  src="/images/bg-original.svg"
                  alt="original-icon"
                  ratio="aspect-6/1"
                  className="justify-center"
                  width="max-md:w-16 h-full md:w-[4.815rem]"
                  sizes="10vw"
                />
              )}
            </div>

            {/* Products Name */}
            <div className="flex-none flex items-start justify-start flex-col gap-1 max-md:pb-3 md:pb-6 font-bold border-b border-stroke-250 overflow-hidden">
              <span className="flex items-start justify-start flex-col w-full text-lg font-bold text-stroke-800 text-nowrap text-start overflow-x-auto scrollbar-none max-md:max-w-55">
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
  // "button" (focus reveals the title on mobile) or a plain "div" inside an
  // existing link, which must not contain another interactive element.
  as: Wrapper = "button",
}) {
  let bgColor;

  switch (type) {
    case "spicy-character":
      bgColor = "bg-rose-500/10 text-rose-500 dark:bg-rose-500/5";
      break;

    case "sweet":
      bgColor = "bg-dark-orange/10 text-dark-orange dark:bg-dark-orange/5 ";
      break;

    case "sour":
      bgColor = "bg-dark-orange/10 text-amber-300 dark:bg-dark-orange/5 ";
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

  return (
    <Wrapper
      {...(Wrapper === "button" && { type: "button" })}
      dir={category ? "rtl" : "ltr"}
      className={`overflow-hidden flex items-center justify-center group rounded-5xl max-md:focus:aspect-auto max-md:focus:px-2 md:hover:px-2 md:hover:aspect-auto aspect-square ${bgColor} ${className} duration-300`}
    >
      <AppImage
        src={src}
        alt={alt}
        className={`text-nowrap z-10 ${category ? "" : "justify-end"}`}
        width={size}
        sizes="10vw"
      />
      <p
        className={`w-0 opacity-0 max-md:group-focus:opacity-100 md:group-hover:opacity-100 max-md:group-focus:duration-300 md:group-hover:duration-300 max-md:group-focus:w-auto md:group-hover:w-auto text-nowrap ${category ? "translate-x-full max-md:group-focus:pr-1 md:group-hover:pr-1" : "-translate-x-full max-md:group-focus:pl-1 md:group-hover:pl-1"} max-md:group-focus:translate-x-0 md:group-hover:translate-x-0 translate-y-px max-md:text-xs md:text-sm font-bold transition-all
        `}
      >
        {title}
      </p>
    </Wrapper>
  );
}
