import PagesNumber from "@/components/PagesNumber";
import ProductCard from "@/components/ProductCard";
import React from "react";
import FilterSection from "./(components)/FilterSection";

function ProductPage() {
  return (
    <div className=" container mx-auto p-2 px-4">
      <div className="h-[186px] border-y-[1.5px] border-stroke xl:max-w-7xl mx-auto">
        <FilterSection />
      </div>
      <div className=" w-auto flex flex-col md:flex-row md:flex-wrap items-center justify-center gap-6 md:gap-6 py-6 ">
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
