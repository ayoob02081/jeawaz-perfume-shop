import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import ImageFrame from "./ImageFrame";
import CardIconResponsive from "./CardIconResponsive";

function ProductCard() {
  return (
    <div className="flex items-center justify-center p-4 w-[21.6rem] md:w-[19.4rem] h-[13.5rem] md:h-[28.9rem] bg-white rounded-2xl border-[1.5px] border-[#EBEBEB]">
      <div className="flex items-start justify-between gap-4 w-full h-full">
        <div className="flex flex-none md:hidden items-center justify-center h-20 w-[4.5rem]">
          <ImageFrame
            src="/images/perfume2.svg"
            alt="perfume"
            className="size-16"
          />
        </div>
        <div className="flex grow flex-col w-full h-full">
          <div className=" flex flex-none items-center justify-between mb-4">
            <CardIconResponsive
              src="/images/talkh.png"
              alt="raiehe icon"
              className="max-md:h-8 md:h-10 bg-grey"
              hoverWidthMaxMd="w-[6.5rem]"
              hoverWidthMd="w-[8.35rem]"
              justify="start"
              title="رایحه شیرین"
              textStyle="text-black"
              size="max-md:size-4 md:size-6"
            />
            <CardIconResponsive
              src="/images/man1.png"
              alt="man icon"
              className="max-md:h-8 md:h-10 bg-grey"
              hoverWidthMaxMd="w-[5.5rem]"
              hoverWidthMd="w-[4.55rem]"
              hoverWidth="md:w-[5.5rem]"
              justify="end"
              title="مردانه"
              textStyle="text-black"
              dir="ltr"
              size="max-md:size-4 md:size-6"
            />
          </div>
          <div className="grow max-md:hidden md:flex items-center justify-center">
            <ImageFrame
              src="/images/perfume2.svg"
              alt="perfume image"
              className="size-[8.5rem]"
            />
          </div>
          <div className="flex-none flex items-center justify-between mb-2 md:mt-4 h-6">
            <p className="text-text-secondary max-md:text-xs text-base font-bold">
              Channel
            </p>
            <ImageFrame
              src="/images/bg-original.svg"
              alt="orginal icon"
              className="max-md:w-16 justify-center h-full md:w-[4.815rem]"
            />
          </div>
          <div className="flex-none flex flex-col gap-1 max-md:pb-5 md:pb-6 font-bold border-b border-[#EBEBEB] ">
            <p className="max-md:text-base text-lg font-bold">
              Tiziana Terenzi
            </p>
            <p className="max-md:text-sm text-lg font-bold">
              شنل اگویست پلاتینیوم
            </p>
          </div>
          <div className="flex flex-none items-center justify-center gap-4 w-full pt-2">
            <div className="flex grow items-center justify-start gap-2 w-full h-full">
              <p className="max-md:text-lg text-2xl font-bold">۱,۵۵۰,۰۰۰</p>
              <p className="text-xs font-bold">تومان</p>
            </div>
            <div className="text-primary max-md:size-[1.1rem] size-6">
              <ArrowLeftIcon />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
