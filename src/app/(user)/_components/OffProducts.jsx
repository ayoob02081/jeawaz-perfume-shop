import HomePageProducts from "./HomePageProducts";
import ProductCard from "./ProductCard";


function OffProducts() {
  return (
    <HomePageProducts
      title={"پرتخفیف ترین"}
      title2={"محصولات"}
      desc={"پرتخفیف ترین رایحه ها ، همین‌جاست."}
      className={""}
      bgColor="bg-[#FFF4F8] rounded-2xl py-6"
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
