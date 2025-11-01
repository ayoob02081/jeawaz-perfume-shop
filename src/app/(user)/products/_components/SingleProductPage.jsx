"use client";

import Loading from "@/components/Loading";
import Error from "@/components/Error";
import { useGetAllProducts } from "@/hooks/useProducts";
import ImageFrame from "@/components/ImageFrame";
import CardEvents from "@/components/CardEvents";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import RadioButton from "@/ui/RadioButton";
import PriceSection from "@/components/PriceSection";

const volumes = [
  { id: "volume-5", label: "۵ میل" },
  { id: "volume-10", label: "۱۰ میل" },
  { id: "volume-20", label: "۲۰ میل" },
  { id: "volume-50", label: "۵۰ میل" },
  { id: "volume-75", label: "۷۵ میل" },
  { id: "volume-100", label: "۱۰۰ میل" },
];

function SingleProductPage({ slug }) {
  const { data, isLoading, error } = useGetAllProducts();

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Error />;
  }
  const currentSlug = data?.find((product) => product.id === slug);

  return (
    <div className="grid max-md:grid-cols-1 md:grid-cols-2 min-h-screen h-full gap-6 w-full md:p-6">
      <ProductImage currentSlug={currentSlug} />
      <ProductDes currentSlug={currentSlug} />
      <ProductOptions currentSlug={currentSlug} />
      <ProductDetails currentSlug={currentSlug} />
    </div>
  );
}

export default SingleProductPage;

function ProductImage({ currentSlug }) {
  return (
    <div className="w-full max-md:px-6 max-md:py-2">
      <div
        className="flex max-md:flex-col md:flex-row-reverse max-md:justify-center md:justify-start max-md:gap-6
    md:gap-4 w-full max-md:rounded-[20px] max-md:bg-secondary max-md:p-6 md:overflow-hidden max-h-[28rem]"
      >
        <div className="flex md:grow items-center justify-center w-full md:bg-secondary md:rounded-[20px] md:p-6">
          <ImageFrame
            src={currentSlug.src}
            alt={currentSlug.alt}
            className="max-md:size-64 md:size-full"
          />
        </div>
        <div className="flex md:flex-none md:flex-col flex-nowra items-center justify-between gap-4 max-md:overflow-x-scroll snap-x md:overflow-y-scroll scrollbar-none">
          {currentSlug.images.map((imgSrc, index) => (
            <div
              key={imgSrc + index}
              className="flex items-center justify-center max-md:bg-white md:bg-secondary max-md:border border-stroke-2 rounded-lg snap-center"
            >
              <ImageFrame
                src={imgSrc}
                alt={imgSrc}
                className="max-md:size-[4.35rem] md:size-[88px]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductDes({ currentSlug }) {
  return (
    <div className="grid grid-cols-1 w-full gap-y-4 max-md:p-6">
      <div className="flex flex-col gap-2 items-start justify-start w-full">
        <span className="flex items-start max-md:justify-between gap-2 md:justify-start w-full">
          <p className="font-bold md:text-[28px]">
            جیونچی آنجئو دمون له پارفیوم اند آکورد ایلیسیت
          </p>
          <p className="md:hidden">brand</p>
        </span>
        <p className="text-xs md:text-lg text-text-secondary">
          GIVENCHY - Ange ou Demon Le Parfum & Accord Illicit
        </p>
      </div>
      <div className="flex flex-col items-start max-md:justify-between max-md:gap-2 w-full max-md:border-t border-stroke-2 pt-4 md:row-start-3">
        <p className="md:hidden">انتخاب حجم:</p>
        <div className="flex items-center justify-start gap-2 w-full overflow-x-auto scrollbar-none snap-x">
          {volumes.map((volume) => (
            <RadioButton
              key={volume.id + currentSlug.id}
              label={volume.label}
              id={volume.id + currentSlug.id}
              name={`single-product-volume` + currentSlug.id}
              value={volume.id}
              className="btn btn--secondar badge badge--secondary--2 hover:bg-dark-brown/30 has-checked:bg-dark-brown has-checked:text-white text-nowrap snap-center duration-200 "
            />
          ))}
        </div>
      </div>
      <div className="flex items-center md:justify-between max-md:justify-end w-full md:row-start-2">
        <PriceSection
          price={currentSlug.price}
          offValue={currentSlug.offValue}
          OldPricevisibility="block"
          pricesRow="flex-col-reverse max-md:gap-0"
          className=""
          priceClassName="text-[32px]"
          justify="max-md:justify-end md:justify-start"
        />
        <p className="max-md:hidden">brand</p>
      </div>
      <div className="flex items-center justify-between w-full gap-4">
        <button className="grow btn btn--success w-full h-12 px-2">
          افزودن به سبد خرید
        </button>
        <div className=" flex-none">
          <CardEvents BtnBackgroundColor="bg-grey" />
        </div>
      </div>
      <div className="flex flex-col justify-between gap-4 w-full max-md:hidden border-[1.5px] border-stroke-2 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-4 border-b border-secondary pb-4">
          <p className="font-bold">توضیحات تکمیلی </p>
          <ChevronDownIcon className="size-5" />
        </div>
        <p className="text-text-secondary text-sm">
          لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با
          استفاده از طراحان گرافیک است، چاپگرها و متون بلکه روزنامه و مجله در
          ستون و سطرآنچنان که لازم است، و برای شرایط فعلی تکنولوژی مورد نیاز، و
          کاربردهای متنوع با هدف بهبود ابزارهای کاربردی . ، و برای شرایط فعلی
          چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است،
        </p>
      </div>
    </div>
  );
}

function ProductOptions() {
  return (
    <div className="flex flex-col items-center justify-start gap-6 w-full max-md:border-t-[1.5px] md:border-[1.5px] md:rounded-2xl max-md:p-6 md:p-4 border-stroke-2 ">
      <span className="flex items-center justify-start gap-2 w-full">
        <ImageFrame
          src="/images/menu-icon.svg"
          alt="menu-icon"
          className="size-6"
        />
        <p className="font-bold">ویژگی های محصول</p>
      </span>
      <div className="grid max-sm:grid-cols-3 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-3 gap-x-4 w-full px-2">
        <ProductOption textOne="کشور تولید کننده" textTwo="امارات" />
        <ProductOption textOne="پخش بو" textTwo="قوی" />
        <ProductOption textOne="حجم" textTwo="۱۰۵ میلی لیتر" />
        <ProductOption textOne="عطر ساز" textTwo="فرانسه" />
        <ProductOption textOne="ساختار رایحه" textTwo="رایحه شیرین" />
        <ProductOption textOne="ساختار نت ها" textTwo="ادویه - گل - میوه" />
        <ProductOption
          textOne="مناسب برای فصل"
          textTwo="بهار - تابستان - پاییز"
        />
      </div>
    </div>
  );
}

function ProductOption({ textOne, textTwo }) {
  return (
    <>
      <p className="text-nowrap col-span-1 text-sm text-text-secondary py-3">
        {textOne}
      </p>
      <p className="text-nowrap max-sm:col-span-2 sm:col-span-3 md:col-span-1 lg:col-span-2 text-sm text-text font-bold w-full border-b border-stroke py-3">
        {textTwo}
      </p>
    </>
  );
}

function ProductDetails() {
  return (
    <div className="flex flex-col items-center justify-between gap-6 w-full max-md:row-start-3 max-md:border-t-[1.5px] md:border-[1.5px] md:rounded-2xl p-6 border-stroke-2 ">
      <div className="flex flex-col items-start justify-between gap-2">
        <span className="flex items-center justify-start gap-2">
          <ImageFrame
            src="/images/square-list-icon.svg"
            alt="square-list-icon"
            className="size-6"
          />
          <p className="font-bold">ترکیبات محصول</p>
        </span>
        <p className="text-xs">
          لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با
          استفاده از طراحان گرافیک است،.
        </p>
      </div>
      <div className="flex flex-col items-center justify-between gap-2 size-full">
        <Scents
          src="/images/scent-background-1.svg"
          alt="shape background"
          className="w-[60px] h-[53.3px]"
          textOne="نت آغازین"
          scents={["انگور سیاه"]}
        />
        <Scents
          src="/images/scent-background-2.svg"
          alt="shape background"
          className="w-[152.46px] h-[66.02px]"
          textOne="نت های میانی"
          scents={["گل یاسمن"]}
        />
        <Scents
          src="/images/scent-background-3.svg"
          alt="shape background"
          className="w-[310px] h-[134.23px]"
          textOne="نت های پایانی"
          scents={["وانیل", "عنبر", "مشک", "نعناع هندی"]}
        />
      </div>
    </div>
  );
}

function Scents({ src, alt, className, textOne, scents }) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-2 text-nowrap whitespace-nowrap">
      <ImageFrame src={src} alt={alt} className={className} />
      <span className="absolute flex flex-col items-center justify-center gap-1 z-20">
        <p className="text-xs text-text font-bold">{textOne}</p>
        {scents && (
          <div className="flex items-center justify-between gap-2">
            {scents?.map((s, index) => (
              <p key={s + index} className="text-xs text-text-secondary ">
                {scents.length > 1 ? s + " - " : s}
              </p>
            ))}
          </div>
        )}
      </span>
    </div>
  );
}
