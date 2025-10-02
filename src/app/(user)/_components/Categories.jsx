import ImageFrame from "@/components/ImageFrame";
import CategoreyCard from "./CategoreyCard";

function Categories() {
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

export default Categories;
