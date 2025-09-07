import FilterCard from "@/components/FilterCard";
import ImageFrame from "@/components/ImageFrame";

function FilteredProducts() {
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

export default FilteredProducts;
