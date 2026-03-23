import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import AppImage from "@/components/AppImage";

const bannerData = [
  {
    id: 1,
    srcLg: "/images/banner-secondary-2.svg",
    url: "/products",
    urlLabel: "مشاهده محصولات",
    label: "هر لحظه، با عطری تازه",
    description: "جدیدترین عطرهای روز دنیا، مخصوص سلیقه‌ی خاص تو.",
  },
  {
    id: 2,
    srcLg: "/images/banner-secondary-2.svg",
    url: "/products",
    urlLabel: "مشاهده محصولات",
    label: "هر لحظه، با عطری تازه",
    description: "جدیدترین عطرهای روز دنیا، مخصوص سلیقه‌ی خاص تو.",
  },
];

function SecondaryBannerLayout() {
  return (
    <section className="container mx-auto xl:max-w-7xl flex flex-row flex-wrap items-center justify-evenly gap-4 scroll--x">
      {bannerData.map((item) => (
        <div key={item.id} className="snap-center">
          <BannerCardSecondary
            srcLg={item.srcLg}
            url={item.url}
            urlLabel={item.urlLabel}
            label={item.label}
            description={item.description}
          />
        </div>
      ))}
    </section>
  );
}

export default SecondaryBannerLayout;

function BannerCardSecondary({ srcLg, url, urlLabel, label, description }) {
  return (
    <div className="relative rounded-2xl xl:rounded-3xl overflow-hidden banner--secondary--size">
      <div className="absolute size-full from-stroke-950/0 bg-linear-to-r to-stroke-950 z-10"></div>
      <AppImage
        src={srcLg}
        alt="banner-image"
        objectFit="cover"
        width="size-full"
      />
      <div className="absolute bottom-8 sm:bottom-12 xl:bottom-14 right-5 sm:right-7 xl:right-9 flex flex-col items-start justify-center gap-5 z-20">
        <span className="flex flex-col items-start justify-center sm:gap-1 bg-transparent text-white">
          <h2 className=" text-base sm:text-2xl xl:text-3xl font-bold">
            {label}
          </h2>
          <p className=" text-xs md:text-sm xl:font-bold">{description}</p>
        </span>
        <Link
          href={url}
          className="group flex items-center banner--btn--secondary duration-200"
        >
          <p className="flex items-center bg-white text-stroke-950 group-hover:text-primary justify-center rounded-4xl px-1.5 lg:px-2.5 py-1 group-hover:ml-2 h-full duration-200 ">
            {urlLabel}
          </p>
          <div className="flex items-center justify-center text-white group-hover:text-primary group-hover:bg-white -z-10 rounded-full size-5 sm:size-6 xl:size-8 duration-200">
            <ArrowLeftIcon className="size-2 sm:size-3 xl:size-4 group-hover:size-2.5 sm:group-hover:size-3.5 xl:group-hover:size-[18px]" />
          </div>
        </Link>
      </div>
    </div>
  );
}
