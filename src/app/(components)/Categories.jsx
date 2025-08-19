import CategoreyCard from "@/components/CategoreyCard";

function Categories() {
  return (
    <div className="flex flex-col justify-between items-center  w-screen py-4 bg-blue-100">
      <div className="flex justify-center items-center w-full px-6">
        category products
      </div>
      <div className=" mx-6 flex flex-col gap-4 items-center justify-between py-6">
        <CategoreyCard />
        <CategoreyCard />
        <CategoreyCard />
      </div>
    </div>
  );
}

export default Categories;
