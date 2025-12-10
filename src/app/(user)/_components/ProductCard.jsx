import ImageFrame from "@/components/ImageFrame";
import PriceSection from "@/components/PriceSection";
import { pickClosestTo } from "@/utils/pickClosestTo";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

function ProductCard({ product }) {
  const router = useRouter();

  const {
    id,
    original,
    enTitle,
    perTitle,
    images,
    accordCategories,
    genderCategories,
    brandCategories,
  } = product;

  const defaultVolume = pickClosestTo(100, product?.volumes);

  return (
    <div className="flex items-center justify-center p-4 min-w-[21.6rem] md:min-w-[19.4rem] h-[13.5rem] md:h-[28.9rem] bg-white rounded-2xl border-[1.5px] border-[#EBEBEB]">
      <div className="flex items-start justify-between gap-4 w-full h-full">
        <div className="flex flex-none md:hidden items-center justify-center h-20 w-[4.5rem]">
          <ImageFrame src={images[0]} alt={images[0]} className="size-full" />
        </div>
        <div className="flex grow flex-col w-full h-full">
          <div className="flex flex-none items-center justify-between max-md:mb-4 mb-1">
            {accordCategories?.map((accord) => (
              <CardIconResponsive
                key={accord.id}
                accord={accord}
                type={accord?.accord}
                className="max-md:h-8 md:h-10"
                hoverWidthMaxMd="w-[6.5rem]"
                hoverWidthMd="w-[8.35rem]"
                size="max-md:size-4 md:size-6"
              />
            ))}
            <CardIconResponsive
              gender={genderCategories[0]}
              type={genderCategories[0]?.gender}
              className="max-md:h-8 md:h-10"
              hoverWidthMaxMd="w-[5.5rem]"
              hoverWidthMd="w-[4.55rem]"
              size="max-md:size-4 md:size-6"
            />
          </div>
          <div className="grow max-md:hidden md:flex items-center justify-center h-[11.7rem] w-[10.65rem] mx-auto">
            <ImageFrame src={images[0]} alt={images[0]} className="size-full" />
          </div>
          <button onClick={() => router.push(`/products/${id}`)}>
            <div className="flex-none flex items-center justify-between mb-2 md:mt-2 h-6">
              <p className="text-text-secondary max-md:text-xs text-base font-bold">
                {brandCategories?.brand}
              </p>
              {original === true && (
                <ImageFrame
                  src="/images/bg-original.svg"
                  alt="orginal icon"
                  className="max-md:w-16 justify-center h-full md:w-[4.815rem]"
                />
              )}
            </div>
            <div className="flex-none flex items-start flex-col gap-1 max-md:pb-5 md:pb-6 font-bold border-b border-[#EBEBEB] ">
              <p className="max-md:text-base text-lg font-bold">{enTitle}</p>
              <p className="max-md:text-sm text-lg font-bold">{perTitle} </p>
            </div>
            <div className="flex flex-none items-center justify-between gap-4 w-full pt-2">
              <PriceSection
                pricePerVolume={product.price}
                offValue={product.offValue}
                volume={defaultVolume}
              />
              <div
                // onClick={() => router.push(`/products/${id}`)}
                className="text-primary max-md:size-[1.1rem] size-6"
              >
                <ArrowLeftIcon />
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;

export function CardIconResponsive({
  size,
  className,
  accord,
  gender,
  hoverWidthMd,
  hoverWidthMaxMd,
  type,
}) {
  let bgColor;
  let src;
  let alt;
  let textStyle;
  let title;

  switch (type) {
    case "floral":
      bgColor = "bg-orange/10";
      textStyle = "text-orange";
      src = accord?.iconUrl;
      alt = accord?.accord;
      title = accord?.title;
      break;

    case "woody":
      bgColor = "bg-dark-brown/10 text-brown";
      textStyle = "text-dark-brown";
      src = accord?.iconUrl;
      alt = accord?.accord;
      title = accord?.title;
      break;

    case "aromatic":
      bgColor = "bg-success/10";
      textStyle = "text-success";
      src = accord?.iconUrl;
      alt = accord?.accord;
      title = accord?.title;
      break;

    case "citrus":
      bgColor = "bg-orange/10";
      textStyle = "text-orange";
      src = accord?.iconUrl;
      alt = accord?.accord;
      title = accord?.title;
      break;

    case "leather":
      bgColor = "bg-dark-brown/10 text-dark-brown";
      textStyle = "text-dark-brown";
      src = accord?.iconUrl;
      alt = accord?.accord;
      title = accord?.title;
      break;

    case "chypre":
      bgColor = "bg-success/10";
      textStyle = "text-success";
      src = accord?.iconUrl;
      alt = accord?.accord;
      title = accord?.title;
      break;

    case "amber":
      bgColor = "bg-orange/10";
      textStyle = "text-orange";
      src = accord?.iconUrl;
      alt = accord?.accord;
      title = accord?.title;
      break;

    case "men":
      bgColor = "bg-blue/20 text-blue";
      src = gender?.iconUrl;
      alt = gender?.gender;
      title = gender?.title;
      break;

    case "women":
      bgColor = "bg-primary/10 text-primary";
      src = gender?.iconUrl;
      alt = gender?.gender;
      title = gender?.title;
      break;

    case "unisex":
      bgColor = "bg-violet-700/10 text-violet-900 grop-hover:gap-1";
      src = gender?.iconUrl;
      alt = gender?.gender;
      title = gender?.title;
      textStyle = "group-hover:pl-2";
      break;

    case "support":
      bgColor = "bg-primary/10";
      src = "/images/call-ringing-4-primary-icon.svg";
      alt = "call-ringing-icon";
      title = "پشتیبانی";
      break;

    default:
      break;
  }

  return accord ? (
    <div
      dir="rtl"
      className={`flex items-center group rounded-[40px] px-2 md:hover:${hoverWidthMd} max-md:hover:${hoverWidthMaxMd} ${bgColor} ${className} duration-300`}
    >
      <ImageFrame src={src} alt={alt} className={`text-nowrap ${size}`} />
      <p
        className={`w-0 transform opacity-0 group-hover:opacity-100 duration-200 group-hover:w-auto text-nowrap max-md:text-xs group-hover:pr-2 md:text-sm font-bold ${textStyle}`}
      >
        {title}
      </p>
    </div>
  ) : (
    <div
      dir="ltr"
      className={`flex items-center group rounded-[40px] px-2 md:hover:${hoverWidthMd} max-md:hover:${hoverWidthMaxMd} ${bgColor} ${className} duration-300`}
    >
      <ImageFrame
        src={src}
        alt={alt}
        className={`text-nowrap justify-end ${size}`}
      />
      <p
        className={`w-0 opacity-0 group-hover:opacity-100 duration-200 group-hover:w-auto text-nowrap max-md:text-xs group-hover:pr-2 md:text-sm font-bold ${textStyle}`}
      >
        {title}
      </p>
    </div>
  );
}
