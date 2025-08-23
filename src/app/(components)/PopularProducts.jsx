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
    // <div className=" flex flex-col justify-around items-center bg-amber-400">
    //   <div className="flex flex-col justify-between items-center w-full px-6">
    //     <div className="p-4">popular products</div>
    //     <GenderType />
    //   </div>
    //   <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 scrollbaX">
    //     <div className="snap-center">
    //       <ProductCard />
    //     </div>
    //     <div className="snap-center">
    //       <ProductCard />
    //     </div>
    //     <div className="snap-center">
    //       <ProductCard />
    //     </div>
    //     <div className="snap-center">
    //       <ProductCard />
    //     </div>
    //   </div>
    //   <div className="flex items-center justify-between gap-4 p-6">
    //     <div>watch all</div>
    //     <div>icon</div>
    //   </div>
    // </div>
  );
}

export default PopularProducts;
