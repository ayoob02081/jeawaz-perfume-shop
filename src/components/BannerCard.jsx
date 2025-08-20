import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

function BannerCard() {
  return (
    <div className="relative flex items-center justify-center w-[21.5rem] sm:w-xl lg:w-4xl xl:w-6xl h-56 sm:h-[13.65rem] md:h-[16.35rem] lg:h-[21.8rem] xl:h-[27.2rem] border-2 border-primary-10 rounded-2xl snap-center">
      <Image
        src="/images/Banner1 xl.jpg"
        alt="Banner"
        layout="fill"
        objectFit="cover"
        quality={100}
      />
      <button className="absolute bottom-7 right-5 flex items-center justify-between gap-2 px-3.5 py-2 text-xs text-white bg-primary hover:text-primary hover:bg-white ring-4 ring-primary-10 rounded-4xl duration-200">
        <p className="">watch products</p>
        <div>
          <ArrowLeftIcon className=" size-4" />
        </div>
      </button>
    </div>
  );
}

export default BannerCard;
