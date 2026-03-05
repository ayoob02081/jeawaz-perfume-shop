import AppImage from "@/components/AppImage";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const bannerData = [
  {
    id: 1,
    srcLg: "/images/Banner1 xl.jpg",
    srcSm: "/images/Banner1.png",
    url: "/products",
    urlLabel: "مشاهده محصولات",
  },
  {
    id: 2,
    srcLg: "/images/Banner1 xl.jpg",
    srcSm: "/images/Banner1.png",
    url: "/products",
    urlLabel: "مشاهده محصولات",
  },
  {
    id: 3,
    srcLg: "/images/Banner1 xl.jpg",
    srcSm: "/images/Banner1.png",
    url: "/products",
    urlLabel: "مشاهده محصولات",
  },
  {
    id: 4,
    srcLg: "/images/Banner1 xl.jpg",
    srcSm: "/images/Banner1.png",
    url: "/products",
    urlLabel: "مشاهده محصولات",
  },
  {
    id: 5,
    srcLg: "/images/Banner1 xl.jpg",
    srcSm: "/images/Banner1.png",
    url: "/products",
    urlLabel: "مشاهده محصولات",
  },
];

function PrimaryBannerLayout() {
  return (
    <section className="flex items-center justify-center gap-4 mt-6 container mx-auto">
      <div className="flex gap-6 sm:gap-10 px-20 justify-evenly items-center w-full scroll--x rounded-2xl xl:first:pr-[10%] 2xl:first:pr-[20%] xl:last:pl-[10%] 2xl:last:pl-[20%]">
        {bannerData.map((item) => (
          <div key={item.id} className="snap-center">
            <BannerCard
              label={item.label}
              srcLg={item.srcLg}
              srcSm={item.srcSm}
              url={item.url}
              urlLabel={item.urlLabel}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default PrimaryBannerLayout;

function BannerCard({ srcLg, srcSm, url, urlLabel }) {
  return (
    <div className="relative flex items-center justify-center border-2 border-primary/10 rounded-xl md:rounded-3xl overflow-hidden banner--primary--size">
      <AppImage
        src={srcLg}
        alt="Banner-image"
        className="max-sm:hidden"
        objectFit="cover"
        width="size-full"
        loading="eager"
      />
      <AppImage
        src={srcSm}
        alt="Banner-image"
        className=" sm:hidden"
        objectFit="cover"
        width="size-full"
      />
      <div className="absolute bottom-7 md:bottom-9 lg:bottom-12 right-5 md:right-6 lg:right-7 flex items-center justify-start gap-4">
        <Link
          href={url}
          className="h-8 sm:h-[2.03rem] xl:h-[2.6rem] 2xl:h-12 flex items-center justify-between gap-2 px-3.5 sm:px-3 py-2 sm:py-2 text-white bg-primary hover:text-primary hover:bg-white hover:ring-primary ring-4 sm:ring-2 ring-primary/10 rounded-4xl duration-300"
        >
          <p className="text-xs sm:text-[10px] lg:text-xs xl:text-base font-bold">
            {urlLabel}
          </p>
          <div>
            <ArrowLeftIcon className="size-4" />
          </div>
        </Link>
        <Link
          href={"tel:+989180522273"}
          className="flex items-center justify-between gap-2 max-sm:hidden"
        >
          <button className="btn h-8 sm:h-[2.03rem] xl:h-[2.6rem] 2xl:h-12 rounded-full py-1 px-2 xl:px-2.5 2xl:px-3.5 ring-4 sm:ring-2 ring-primary/10 border-0 text-white bg-orange-950 hover:text-orange-950  hover:bg-white hover:ring-orange-950 duration-300">
            <AppImage
              src="/images/headphone-1-white-icon.svg"
              alt="headphone-icon"
              width="max-xl:size-4 xl:size-5"
              sizes="10vw"
            />
          </button>
          <p className="text-xs sm:text-[10px] lg:text-xs xl:text-base text-whie font-bold">
            دریافت مشاوره
          </p>
        </Link>
      </div>
    </div>
  );
}
