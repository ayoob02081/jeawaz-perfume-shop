import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import CardIconResponsive from "./CardIconResponsive";

function ProductCard() {
  return (
    <div className="flex items-center justify-center p-4 w-[21.6rem] md:w-[19.4rem] h-[13.5rem] md:h-[28.9rem] bg-white rounded-2xl border-[1.5px] border-[#EBEBEB]">
      <div className="flex items-start justify-between gap-4 w-full h-full">
        <div className="flex flex-none md:hidden items-center justify-center h-20 w-[4.5rem]">
          <div className="size-16">
            <Image
              src="/images/perfume1.png"
              alt="Perfume"
              width={100}
              height={100}
              objectFit="cover"
              quality={100}
            />
          </div>
        </div>
        <div className="flex grow flex-col w-full h-full">
          <div className=" flex flex-none items-center justify-between mb-4">
            <CardIconResponsive
              src="/images/talkh.png"
              alt="raiehe icon"
              className="max-md:hidden h-10 w-10 bg-secondary2 rounded-full hover:w-[8.35rem] duration-200"
              width={24}
            >
              {/* <p className=" opacity-100 hidden hover:flex max-md:text-xs md:text-sm hover:text-black duration-200 ">
                رایحه شیرین
              </p> */}
            </CardIconResponsive>
            <CardIconResponsive
              src="/images/man1.png"
              alt="man icon"
              className="max-md:hidden h-10 w-10 bg-secondary2 rounded-full hover:w-28 duration-200"
              width={24}
            />
            <CardIconResponsive
              src="/images/talkh.png"
              alt="raiehe icon"
              className="md:hidden h-8 w-8 bg-secondary2 rounded-full hover:w-[6.5rem] duration-200"
              width={17}
            />
            <CardIconResponsive
              src="/images/man1.png"
              alt="man icon"
              className="md:hidden h-8 w-8 bg-secondary2 rounded-full hover:w-20 duration-200"
              width={17}
            />
          </div>
          <CardIconResponsive
            src="/images/perfume1.png"
            alt="perfume image"
            className="w-full grow max-md:hidden size-44"
            width={136}
          />
          <div className="flex-none flex items-center justify-between mb-2">
            <p className="text-text-secondary max-md:text-xs text-base font-bold">
              Channel
            </p>
            <CardIconResponsive
              src="/images/bg-orginal.png"
              alt="orginal icon"
              className="max-md:hidden"
              width={77}
            />
            <CardIconResponsive
              src="/images/bg-orginal.png"
              alt="orginal icon"
              className="md:hidden"
              width={64}
            />
          </div>
          <div className="flex-none flex flex-col gap-1 pb-6 font-bold border-b border-[#EBEBEB] ">
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
