import FilterCard from "@/components/FilterCard";

function FilteredProducts() {
  return (
    <div className="flex flex-col justify-between items-center h-56 w-screen py-4 bg-fuchsia-300">
      <div className="flex justify-center items-center w-full px-6">
        filter products
      </div>
      <div className="flex gap-4 justify-between items-center w-full px-16 snap-x snap-mandatory overflow-x-scroll">
        <FilterCard />
        <FilterCard />
        <FilterCard />
      </div>
      <div>scrol bar</div>
    </div>
  );
}

export default FilteredProducts;
