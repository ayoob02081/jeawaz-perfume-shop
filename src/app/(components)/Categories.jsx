import CategoreyCard from "@/components/CategoreyCard";

function Categories() {
  return (
    <div className="flex flex-col justify-between items-center py-4 bg-blue-100">
      <div className="flex justify-center items-center w-full px-6">
        category products
      </div>
      <div className=" mx-6 flex flex-col sm:w-full sm:px-16 sm:flex-row gap-4 sm:gap-6 items-center justify-between py-6 sm:snap-x sm:snap-mandatory sm:overflow-x-scroll">
        <div className="sm:snap-center">
          <CategoreyCard />
        </div>
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
