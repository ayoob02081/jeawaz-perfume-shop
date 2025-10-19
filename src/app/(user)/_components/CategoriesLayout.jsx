import ImageFrame from "@/components/ImageFrame";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

function CategoriesLayout() {
  return (
    <div className="flex flex-col justify-between items-center py-4 container mx-auto xl:max-w-7xl">
      <div className="flex justify-center items-center gap-1 w-full px-6 mb-6 text-base sm:text-[28px] font-bold">
        <h2 className="text-primary">دسته‌بندی</h2>
        <ImageFrame
          src="/images/star-8-icon.svg"
          alt="star icon"
          className="max-sm:size-4 text-icon-black sm:size-9"
        />
        <h2 className="text-text-primary">محصولات ما</h2>
      </div>
      <div className="mx-6 flex flex-col sm:w-full sm:px-36 md:px-6 md:flex-row gap-4 sm:gap-6 items-center justify-between scrollbarX overflow-hidden sm:overflow-x-auto rounded-2xl">
        <div className="sm:snap-center">
          <CategoreyCard />
        </div>
        <div className="sm:snap-center">
          <CategoreyCard />
        </div>
        <div className="sm:snap-center">
          <CategoreyCard />
        </div>
      </div>
    </div>
  );
}

export default CategoriesLayout;

function CategoreyCard() {
  return (
    <div className="flex gap-2 w-[21.6rem] h-24 md:w-[26.3rem] md:h-36 justify-center items-center justify-items-center bg-white rounded-2xl border-[1.5px] border-[#EBEBEB] ">
      <div className="h-full self-start justify-self-start px-4">
        <div className="flex items-center justify-center h-20 w-16 md:w-[5.25rem] md:h-28 rounded-b-xl bg-grey">
          <ImageFrame
            src="/images/perfume-1.svg"
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
