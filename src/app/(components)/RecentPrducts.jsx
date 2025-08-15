import ProductCard from "@/components/ProductCard";

function RecentPrducts() {
  return (
    <div className="flex flex-col justify-around items-center h-96 bg-purple-100">
      <div className="flex justify-between items-center w-full px-6">
        <div>new products</div>
        <div>type</div>
      </div>
      <div>
        <ProductCard />
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
