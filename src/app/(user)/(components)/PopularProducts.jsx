import GenderType from "@/components/GenderType";
import HomePageProducts from "@/components/HomePageProducts";
import ProductCard from "@/components/ProductCard";

function PopularProducts() {
  return (
    <HomePageProducts
      genderType="true"
      title={"پر فروش ترین"}
      title2={"محصولات ما"}
      desc={"رایحه هایی که همیشه می درخشن"}
      className={
        " flex-col md:flex-row overflow-hidden sm:overflow-x-auto rounded-2xl"
      }
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
