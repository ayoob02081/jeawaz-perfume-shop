import PagesNumber from "@/components/PagesNumber";
import ProductCard from "@/components/ProductCard";
import React from "react";
import FilterSection from "./(components)/FilterSection";
import SortSection from "@/components/SortSection";

function ProductPage() {
  return (
    <div className=" container mx-auto p-2 px-4">
      <div className="md:h-56 border-b md:border-y-[1.5px] border-[#FCF5F4] md:border-stroke xl:max-w-7xl mx-auto">
        <FilterSection />
      </div>
      <div className="w-full flex items-center justify-between py-6">
        <div className=" flex items-center justify-center gap-2">
          <div className="bg-primary h-3 w-[3px] rounded-full"></div>
          <p className="text-xl font-bold">عطر های مردانه</p>
        </div>
        <div>
          <SortSection />
        </div>
      </div>
      <div className=" w-auto flex flex-col md:flex-row md:flex-wrap items-center justify-center gap-3 md:gap-6 py-6 ">
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
      </div>
      <div className="flex items-center justify-center h-20">
        <PagesNumber />
      </div>
    </div>
  );
}

export default ProductPage;
