import ImageFrame from "@/components/ImageFrame";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

function FilteredProductsLayout() {
  return (
    <div className="flex flex-col justify-between items-center container mx-auto xl:max-w-7xl py-4">
      <div className="flex justify-center items-center gap-1 w-full px-6 text-base sm:text-[28px] font-bold">
        <h2 className="text-primary">هر رایحه</h2>
        <ImageFrame
          src="/images/star-8-icon.svg"
          alt="star icon"
          className="max-sm:size-4 text-icon-black sm:size-9"
        />
        <h2 className="text-text-primary">دنیایی متفاوت</h2>
      </div>
      <div className="flex gap-4 justify-between items-center w-full px-16 my-6 scrollbarX rounded-2xl">
        <FilterCard />
        <FilterCard />
        <FilterCard />
        <FilterCard />
      </div>
    </div>
  );
}

export default FilteredProductsLayout;

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
