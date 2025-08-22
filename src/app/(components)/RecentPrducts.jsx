// import GenderType from "@/components/GenderType";
import HomePageProducts from "@/components/HomePageProducts";
import ProductCard from "@/components/ProductCard";

function RecentPrducts() {
  return (
    <HomePageProducts genderType="true" title={"new products"} className={""}>
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
    // <div className="flex flex-col justify-around items-center py-2 xl:max-w-7xl gap-6 bg-purple-100">
    //   <div className="flex justify-between items-center w-full px-6">
    //     <div>new products</div>
    //     <div className="flex items-center gap-4">
    //       <GenderType />
    //       <div className="hidden md:flex items-center justify-between gap-4 ">
    //         <div>watch all</div>
    //         <div>icon</div>
    //       </div>
    //     </div>
    //   </div>
    //   <div className="flex gap-6 justify-between items-center w-full px-7 scrollbarX">
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
    //   <div className="">scrol bar</div>
    //   <div className="flex items-center justify-between gap-4 p-6">
    //     <div>watch all</div>
    //     <div>icon</div>
    //   </div>
    // </div>
  );
}

export default RecentPrducts;
