import GenderType from "@/components/GenderType";
import ProductCard from "@/components/ProductCard";

function PopularProducts() {
  return (
    <div className="flex flex-col justify-around items-center h-[65rem] bg-amber-400 mx-6">
      <div className="flex flex-col gap-4 justify-between items-center w-full px-6">
        <div>popular products</div>
        <GenderType />
      </div>
      <div className="flex flex-col gap-4 items-center justify-between">
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>watch all</div>
        <div>icon</div>
      </div>
    </div>
  );
}

export default PopularProducts;
