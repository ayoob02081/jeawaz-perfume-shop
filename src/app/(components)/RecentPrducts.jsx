import GenderType from "@/components/GenderType";
import ProductCard from "@/components/ProductCard";

function RecentPrducts() {
  return (
    <div className="flex flex-col justify-around items-center h-96 container mx-auto xl:max-w-7xl bg-purple-100">
      <div className="flex justify-between items-center w-full px-6">
        <div>new products</div>
       <GenderType/>
      </div>
      <div className="flex gap-6 justify-between items-center w-full px-7 snap-x snap-mandatory overflow-x-scroll">
        <div className="snap-center">
          <ProductCard />
        </div>
        <div className="snap-center">
          <ProductCard />
        </div>
        <div className="snap-center">
          <ProductCard />
        </div>
      </div>
      <div>scrol bar</div>
      <div className="flex items-center justify-between gap-4">
        <div>watch all</div>
        <div>icon</div>
      </div>
    </div>
  );
}

export default RecentPrducts;
