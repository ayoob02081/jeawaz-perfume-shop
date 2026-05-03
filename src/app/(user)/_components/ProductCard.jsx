import AppImage from "@/components/AppImage";
import Loading from "@/components/Loading";
import PriceSection from "@/components/PriceSection";
import {
  useGetAllBrandCategories,
  useGetAllCategories,
} from "@/hooks/useCategories";
import { useRouter } from "next/navigation";

function ProductCard({ product }) {
  const router = useRouter();
  const { data: allCategories, isLoading, error } = useGetAllCategories();
  const {
    data: allBrands,
    isLoading: brandsLoading,
    error: brandsError,
  } = useGetAllBrandCategories();
  const { id, original, enTitle, perTitle, stock, images, categories, modes } =
    product || {};

  const minDecant = modes?.decant.availableVolumes[0];
  const pricePerMl = modes?.decant.pricePerMl;
  const isStock = stock > minDecant;

  const productAccords = categories?.accords.map((accord) => {
    const accords = allCategories?.find((item) => item.value === accord);
    return accords;
  });

  const productGender = allCategories?.find(
    (item) => item.value === categories.gender,
  );

  const productBrand = allBrands?.find(
    (brand) => brand.title === categories?.brand,
  );

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Error />;
  }

  return (
    <article
      className={`flex items-center justify-center p-4 max-md:pr-0 h-[13.5rem] md:h-[28.9rem] bg-stroke-0 dark:bg-stroke-50 rounded-2xl border-[1.5px] border-stroke-250 ${isStock ? "" : "opacity-60 dark:opacity-30"} snap-center duration-200`}
    >
      {/* Mobile Mode Base Image */}
      <div className="flex items-start justify-between gap-4 w-full h-full">
        <div className="flex flex-none md:hidden items-center justify-center !h-20 !w-[4.5rem]">
          <AppImage
            src={images[0]}
            alt={"-عکس" + perTitle}
            ratio="aspect-[4/5]"
          />
        </div>
        <div className="flex grow flex-col w-full h-full">
          {/* Categories Icon */}
          <div className="flex flex-none items-center justify-between max-md:mb-4 mb-1">
            {productAccords.map((accord) => (
              <CardIconResponsive
                key={accord.id}
                accord={accord}
                src={accord.iconUrl}
                alt={accord.vlaue + "-icon"}
                title={accord.title}
                type={accord.value}
                className="max-md:h-8 md:h-10"
                size="max-md:size-4 md:size-6"
              />
            ))}
            <CardIconResponsive
              src={productGender.iconUrl}
              alt={productGender.value + "-icon"}
              title={productGender.title}
              type={productGender.value}
              className="max-md:h-8 md:h-10"
              size="max-md:size-4 md:size-6"
            />
          </div>

          {/* Desktop Mode Base Picture */}
          <div className="grow max-md:hidden md:flex items-center justify-center !h-[11.7rem] !w-[10.65rem] mx-auto">
            <AppImage
              src={images[0]}
              alt={"-عکس" + perTitle}
              ratio="aspect-[4/5]"
            />
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
                  ratio="aspect-[6/1]"
                  className="justify-center"
                  width="max-md:w-16 h-full md:w-[4.815rem]"
                  sizes="10vw"
                />
              )}
            </div>

            {/* Products Name */}
            <div className="flex-none flex items-center flex-col gap-1 max-md:pb-3 md:pb-6 font-bold border-b border-stroke-250">
              <span className="flex items-start flex-col max-[366px]:w-52 w-64 md:w-72 text-lg font-bold text-stroke-800 text-start">
                <p className="w-full max-md:text-base truncate">{enTitle}</p>
                <p className="w-full max-md:text-sm truncate">{perTitle}</p>
              </span>
            </div>

            {/* Products Price */}
            <div
              className={`flex flex-none items-center md:items-end gap-4 w-full pt-2 ${isStock ? "justify-between" : "justify-end"}`}
            >
              {product.stock >= 3 && (
                <PriceSection
                  volume={minDecant}
                  pricePerMl={pricePerMl}
                  offValue={product.offValue}
                  OldPricevisibility="block"
                  pricesRow="flex-col-reverse max-md:gap-0"
                  priceClassName="max-md:text-lg md:text-xl lg:text-[32px] text-stroke-800"
                  justify="justify-start"
                />
              )}

              {/* Products Order Button */}
              <div>
                {isStock ? (
                  <p className="btn border border-primary text-primary bg-stroke-50 active:bg-primary active:text-white  rounded-lg md:rounded-xl py-1 px-2 md:p-2 text-wrap duration-200">
                    سفارش
                  </p>
                ) : (
                  <p className="text-wrap w-full text-primary text-xl font-bold">
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
  accord,
  src,
  alt,
  title,
  type,
}) {
  let bgColor;

  switch (type) {
    case "floral":
      bgColor = "bg-primary/10 text-primary dark:bg-primary/5";
      break;

    case "woody":
      bgColor = "bg-dark-orange/10 text-dark-orange dark:bg-dark-orange/5 ";
      break;

    case "aromatic":
      bgColor = "bg-green/10 text-green dark:bg-green/5";
      break;

    case "citrus":
      bgColor = "bg-orange/10 text-red dark:bg-orange/5";
      break;

    case "leather":
      bgColor =
        "bg-stroke-950/10 text-stroke-950 dark:bg-stroke-800/5 dark:text-dark-orange";
      break;

    case "chypre":
      bgColor = "bg-brown/10 text-dark-orange";
      break;

    case "amber":
      bgColor = "bg-warning/20 text-orange dark:bg-warning/5";
      break;

    case "men":
      bgColor =
        "bg-stroke-950/10 text-stroke-950 dark:bg-stroke-800/5 dark:text-stroke-250";
      break;

    case "women":
      bgColor = "bg-primary/10 text-primary dark:bg-primary/5";
      break;

    case "unisex":
      bgColor =
        "bg-orange/10 text-dark-orange dark:bg-warning/5 dark:text-warning";
      break;

    case "support":
      bgColor = "bg-primary/10 text-primary dark:bg-primary/5";
      break;

    default:
      break;
  }

  return accord ? (
    <div
      dir="rtl"
      className={`flex items-center group rounded-5xl px-2 ${bgColor} ${className} duration-300`}
    >
      <AppImage
        src={src}
        alt={alt}
        className="text-nowrap"
        width={size}
        sizes="10vw"
      />
      <p
        className={
          "w-0 opacity-0 group-hover:opacity-100 group-hover:duration-200 group-hover:w-auto text-nowrap max-md:text-xs group-hover:pr-2 md:text-sm font-bold"
        }
      >
        {title}
      </p>
    </div>
  ) : (
    <div
      dir="ltr"
      className={`flex items-center group rounded-5xl px-2 ${bgColor} ${className} duration-300`}
    >
      <AppImage
        src={src}
        alt={alt}
        className="text-nowrap justify-end"
        width={size}
        sizes="10vw"
      />
      <p
        className={
          "w-0 opacity-0 group-hover:opacity-100 group-hover:duration-200 group-hover:w-auto text-nowrap max-md:text-xs group-hover:pl-1 md:text-sm font-bold"
        }
      >
        {title}
      </p>
    </div>
  );
}
