"use client";

import PagesNumber from "@/components/PagesNumber";
import SortSection from "@/components/SortSection";
import { useGetAllProducts } from "@/hooks/useProducts";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import FilterSection from "./FilterSection";
import ProductCard from "../../_components/ProductCard";

function ProductsLayout() {
  const {
    data: products,
    isLoading: isproductsLoading,
    error: isProductsError,
  } = useGetAllProducts();

  if (isproductsLoading) {
    return <Loading className="h-screen" />;
  }

  if (isProductsError) {
    return <Error className="h-screen" />;
  }

  return (
    <div className="container mx-auto xl:max-w-7xl py-2 px-4 w-full">
      <FilterSection />
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
        {products?.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <div className="flex items-center justify-center h-20">
        <PagesNumber />
      </div>
    </div>
  );
}

export default ProductsLayout;
