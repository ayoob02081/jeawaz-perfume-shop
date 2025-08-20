import GenderType from "@/components/GenderType";
import ProductCard from "@/components/ProductCard";

function PopularProducts() {
  return (
    <div className=" flex flex-col justify-around items-center bg-amber-400 mx-">
      <div className="flex flex-col justify-between items-center w-full px-6">
        <div className="p-4">popular products</div>
        <GenderType />
      </div>
      <div className="flex flex-col md:flex-row gap-4 snap-x snap-mandatory overflow-x-scroll md:gap-6">
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
      </div>
      <div className="flex items-center justify-between gap-4 p-6">
        <div>watch all</div>
        <div>icon</div>
      </div>
    </div>
  );
}

export default PopularProducts;
