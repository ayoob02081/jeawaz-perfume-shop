import HomePageProducts from "@/components/HomePageProducts";
import ProductCard from "@/components/ProductCard";

function OffProducts() {
  return (
    <HomePageProducts
      title={"off products"}
      className={""}
      bgColor="bg-[#FFF4F8]"
    >
      <div className="snap-center pb-6">
        <ProductCard />
      </div>
      <div className="snap-center pb-6">
        <ProductCard />
      </div>
      <div className="snap-center pb-6">
        <ProductCard />
      </div>
      <div className="snap-center pb-6">
        <ProductCard />
      </div>
      <div className="snap-center pb-6">
        <ProductCard />
      </div>
      <div className="snap-center pb-6">
        <ProductCard />
      </div>
    </HomePageProducts>
  );
}

export default OffProducts;
