import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import ImageFrame from "./ImageFrame";

function CategoreyCard() {
  return (
    <div className="flex gap-2 w-[21.6rem] h-24 md:w-[26.3rem] md:h-36 justify-center items-center justify-items-center bg-white rounded-2xl border-[1.5px] border-[#EBEBEB] ">
      <div className="h-full self-start justify-self-start px-4">
        <div className="flex items-center justify-center h-20 w-16 md:w-[5.25rem] md:h-28 rounded-b-xl bg-secondary2">
          <ImageFrame
            src="/images/perfume2.svg"
            alt="perfume image"
            className="h-14 w-9 grow max-md:size-9 justify-center md:size-14"
          />
        </div>
      </div>
      <div className="grow flex flex-col gap-1 p-4">
        <p className="font-bold text-sm sm:text-xl">عطر های مردانه</p>
        <p className="text-text-secondary text-sm sm:text-xl">۱۸۰ محصول</p>
      </div>
      <div className="justify-self-end self-end p-4">
        <ArrowLeftIcon className="size-4 sm:size-5 text-primary" />
      </div>
    </div>
  );
}

export default CategoreyCard;
