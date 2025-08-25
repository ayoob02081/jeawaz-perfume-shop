import GenderType from "@/ui/GenderType";
import HomePageProducts from "@/components/HomePageProducts";
import ProductCard from "@/components/ProductCard";

function PopularProducts() {
  return (
    <HomePageProducts
      genderType="true"
      title={"popular products"}
      className={" flex-col md:flex-row overflow-hidden sm:overflow-x-auto"}
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

export default PopularProducts;
