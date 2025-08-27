import CategoreyCard from "@/components/CategoreyCard";

function Categories() {
  return (
    <div className="flex flex-col justify-between items-center py-4 container mx-auto xl:max-w-7xl">
      <div className="flex justify-center items-center w-full px-6">
        category products
      </div>
      <div className="mx-6 flex flex-col sm:w-full sm:px-36 sm:flex-row gap-4 sm:gap-6 items-center justify-between py-6 scrollbarX overflow-hidden xl:overflow-hidden sm:overflow-x-auto">
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
