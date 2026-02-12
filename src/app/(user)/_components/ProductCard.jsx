import ImageFrame from "@/components/ImageFrame";
import PriceSection from "@/components/PriceSection";
import { useGetAllCategories } from "@/hooks/useCategories";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function ProductCard({ product }) {
  const router = useRouter();
  const { data } = useGetAllCategories();
  const [volumeMode, setVolumeMode] = useState("sealed");

  const volumes =
    (volumeMode === "decant" && product.modes?.decant.availableVolumes) ||
    (volumeMode === "sealed" &&
      product.modes?.sealed.variants.map((v) => v.volume));

  const defaultVolume = volumes.includes(100)
    ? 100
    : volumes.find((v) => v === 100 || v >= 3);

  const [selectedVolume, setSelectedVolume] = useState(defaultVolume);

  const volumeHandler = (e, type) => {
    const value = e.target.value;
    if (type) {
      setVolumeMode(type);
    } else {
      const selectedItem = volumes?.filter(
        (volume) => volume === Number(value),
      );
      setSelectedVolume(selectedItem[0]);
    }
  };

  useEffect(() => {
    setSelectedVolume(
      volumes.includes(100) ? 100 : volumes.find((v) => v === 100 || v >= 3),
    );
  }, [volumeMode]);

  const decantsPrice = product.modes?.decant.pricePerMl * selectedVolume;

  const sealedPrice = product.modes?.sealed.variants.find(
    (v) => v.volume === selectedVolume,
  );

  const price =
    volumeMode === "decant" ? decantsPrice : sealedPrice?.price || 0;

  const { id, original, enTitle, perTitle, images, categories } = product;

  const productAccords = categories.accords.map((accord) => {
    const accords = data?.find((item) => item.value === accord);
    return accords;
  });

  const productGender = data?.find((item) => item.value === categories.gender);

  console.log(productGender, productAccords, categories);

  return (
    <div className="flex items-center justify-center p-4 min-w-[21.6rem] md:min-w-[19.4rem] h-[13.5rem] md:h-[28.9rem] bg-white rounded-2xl border-[1.5px] border-[#EBEBEB]">
      <div className="flex items-start justify-between gap-4 w-full h-full">
        <div className="flex flex-none md:hidden items-center justify-center h-20 w-[4.5rem]">
          <ImageFrame src={images[0]} alt={images[0]} className="size-full" />
        </div>
        <div className="flex grow flex-col w-full h-full">
          <div className="flex flex-none items-center justify-between max-md:mb-4 mb-1">
            {productAccords?.map((accord) => (
              <CardIconResponsive
                key={accord?.id}
                accord={accord}
                src={accord?.iconUrl||"icon"}
                alt={accord?.iconUrl||"icon"}
                title={accord?.title}
                type={accord?.value}
                className="max-md:h-8 md:h-10"
                hoverWidthMaxMd="w-[6.5rem]"
                hoverWidthMd="w-[8.35rem]"
                size="max-md:size-4 md:size-6"
              />
            ))}
            <CardIconResponsive
              src={productGender?.iconUrl||"icon"}
              alt={productGender?.iconUrl||"icon"}
              title={productGender?.title}
              type={productGender?.value}
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
                {product.categories.brand}
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
              {product.stock >= 3 && (
                <PriceSection
                  volume={selectedVolume}
                  volumeMode={volumeMode}
                  price={price}
                  offValue={product.offValue}
                  OldPricevisibility="block"
                  pricesRow="flex-col-reverse max-md:gap-0"
                  className=""
                  priceClassName="text-[32px]"
                  justify="max-md:justify-end md:justify-start"
                />
              )}

              <div className="text-primary max-md:size-[1.1rem] size-6">
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
  src,
  alt,
  title,
  hoverWidthMd,
  hoverWidthMaxMd,
  type,
}) {
  let bgColor;
  let textStyle;

  switch (type) {
    case "floral":
      bgColor = "bg-orange/10";
      textStyle = "text-orange";
      break;

    case "woody":
      bgColor = "bg-dark-brown/10 text-brown";
      textStyle = "text-dark-brown";
      break;

    case "aromatic":
      bgColor = "bg-success/10";
      textStyle = "text-success";
      break;

    case "citrus":
      bgColor = "bg-orange/10";
      textStyle = "text-orange";
      break;

    case "leather":
      bgColor = "bg-dark-brown/10 text-dark-brown";
      textStyle = "text-dark-brown";
      break;

    case "chypre":
      bgColor = "bg-success/10";
      textStyle = "text-success";
      break;

    case "amber":
      bgColor = "bg-orange/10";
      textStyle = "text-orange";
      break;

    case "men":
      bgColor = "bg-blue/20 text-blue";
      break;

    case "women":
      bgColor = "bg-primary/10 text-primary";
      break;

    case "unisex":
      bgColor = "bg-violet-700/10 text-violet-900 grop-hover:gap-1";
      textStyle = "group-hover:pl-2";
      break;

    case "support":
      bgColor = "bg-primary/10";
      break;

    default:
      break;
  }

  return accord ? (
    <div
      dir="rtl"
      className={`flex items-center group rounded-5xl px-2 md:hover:${hoverWidthMd} max-md:hover:${hoverWidthMaxMd} ${bgColor} ${className} duration-300`}
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
      className={`flex items-center group rounded-5xl px-2 md:hover:${hoverWidthMd} max-md:hover:${hoverWidthMaxMd} ${bgColor} ${className} duration-300`}
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
