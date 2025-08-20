import {  ArrowLeftIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

function CategoreyCard() {
  return (
    <div className="flex gap-2 w-[21.6rem] h-24 justify-center items-center justify-items-center bg-white rounded-2xl border-[1.5px] border-[#EBEBEB] ">
      <div className="h-full self-start justify-self-start px-4">
        <div className="flex items-center justify-center bg-amber-300 h-20 w-16 rounded-b-xl">
          image
        </div>
      </div>
      <div className="grow bg-blue-100 flex flex-col gap-1 p-4 border-b border-[#EBEBEB] ">
        <p className="font-bold text-sm sm:text-xl">عطر های مردانه</p>
        <p className="text-text-secondary text-sm sm:text-[18px]">۱۸۰ محصول</p>
      </div>
      <div className="justify-self-end self-end p-4">
        <ArrowLeftIcon className="size-4 sm:size-5 text-primary"/>
      </div>
    </div>
  );
}

export default CategoreyCard;
