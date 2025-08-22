import HomePageProducts from "@/components/HomePageProducts";
import ProductCard from "@/components/ProductCard";

function OffProducts() {
  return (
    <HomePageProducts
      // genderType="true"
      title={"off products"}
      className={""}
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
    // <div className="container mx-auto xl:max-w-7xl bg-cyan-200">
    //   <div className="flex flex-col justify-around items-center py-4 gap-4">
    //     <div className="flex justify-between items-center w-full px-6">
    //       <div>off products</div>
    //       <div>time</div>
    //     </div>
    //     <div className="flex gap-6 justify-between items-center w-full px-7 scrollbarX">
    //       <div className="snap-center">
    //         <ProductCard />
    //       </div>
    //       <div className="snap-center">
    //         <ProductCard />
    //       </div>
    //       <div className="snap-center">
    //         <ProductCard />
    //       </div>
    //     </div>
    //     <div>scrol bar</div>
    //     <div className="flex items-center justify-between gap-4">
    //       <div>watch all</div>
    //       <div>icon</div>
    //     </div>
    //   </div>
    // </div>
  );
}

export default OffProducts;
