import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import ImageFrame from "./ImageFrame";

function FilterCard() {
  return (
    <div className="snap-center">
      <div className="flex w-72 h-24 sm:h-[7.5rem] justify-centr items-center gap-2 bg-white rounded-2xl border-[1.5px] border-[#EBEBEB] ">
        <div className="grow flex items-center justify-center size-16 sm:size-20 rounded-xl">
          <ImageFrame
            src="/images/perfume-1.svg"
            alt="perfume image"
            className="h-20 grow max-sm:size-[4.5rem] justify-center sm:size-20"
          />
        </div>
        <div className="grow flex flex-col gap-2 py-4 justify-self-start">
          <p className="font-bold text-sm sm:text-base">رایحه تلخ</p>
          <p className="text-text-secondary text-xs sm:text-sm">۲۳۰ محصول</p>
        </div>
        <div className="flex-none justify-self-end self-end px-4 pb-6">
          <ArrowLeftIcon className="size-4 sm:size-5 text-black" />
        </div>
      </div>
    </div>
  );
}

export default FilterCard;
