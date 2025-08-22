import FilterCard from "@/components/FilterCard";

function FilteredProducts() {
  return (
    <div className="flex flex-col justify-between items-center container mx-auto xl:max-w-7xl py-4 bg-fuchsia-300">
      <div className="flex justify-center items-center w-full px-6">
        filter products
      </div>
      <div className="flex gap-4 justify-between items-center w-full px-16 py-6 scrollbarX ">
        <FilterCard />
        <FilterCard />
        <FilterCard />
      </div>
      <div>scrol bar</div>
    </div>
  );
}

export default FilteredProducts;
