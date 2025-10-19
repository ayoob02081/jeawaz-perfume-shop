"use client";

import PagesNumber from "@/components/PagesNumber";
import React from "react";
import SortSection from "@/components/SortSection";
import FilterSection from "./_components/FilterSection";
import ProductCard from "../_components/ProductCard";
import { useGetAllProducts } from "@/hooks/useProducts";
import Loading from "@/components/Loading";
import Error from "@/components/Error";

function ProductPage() {
  const { data, isLoading, error } = useGetAllProducts();

  if (isLoading) {
    return <Loading className="h-screen" />;
  }

  if (error) {
    return <Error className="h-screen" />;
  }

  return (
    <div className=" container mx-auto p-2 px-4">
      <div className="md:h-56 border-b border-stroke xl:max-w-7xl mx-auto">
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
        {data &&
          data.map((product) => (
            <ProductCard
              key={product.id}
              src={product.src}
              alt={product.alt}
              gender={product.gender}
              scent={product.scent}
              brand={product.brand}
              enTitle={product.enTitle}
              perTitle={product.perTitle}
              offValue={product.offValue}
              price={product.price}
              original
            />
          ))}
      </div>
      <div className="flex items-center justify-center h-20">
        <PagesNumber />
      </div>
    </div>
  );
}

export default ProductPage;
