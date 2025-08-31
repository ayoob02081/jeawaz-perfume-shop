// import GenderType from "@/components/GenderType";
import HomePageProducts from "@/components/HomePageProducts";
import ProductCard from "@/components/ProductCard";

function RecentPrducts() {
  return (
    <HomePageProducts
      genderType="true"
      title={"جدید ترین "}
      title2={"محصولات ما"}
      desc={"ترندهای رایحه، همین‌جاست."}
      className={"rounded-2xl"}
    >
      <div></div>
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

export default RecentPrducts;
