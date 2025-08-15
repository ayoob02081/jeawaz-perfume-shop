import CategoreyCard from "@/components/CategoreyCard";

function Categories() {
  return (
    <div className="h-80 bg-blue-100 mx-6 flex flex-col gap-4 items-center justify-between">
      <CategoreyCard />
      <CategoreyCard />
      <CategoreyCard />
    </div>
  );
}

export default Categories;
