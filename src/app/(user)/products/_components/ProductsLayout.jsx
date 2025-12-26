"use client";

import PagesNumber from "@/components/PagesNumber";
import { useGetAllProducts } from "@/hooks/useProducts";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import FilterSection from "./FilterSection";
import ProductCard from "../../_components/ProductCard";
import { useRouter, useSearchParams } from "next/navigation";
import { useFilters } from "@/hooks/useFilters";
import { useEffect } from "react";
import { parseFiltersFromUrl } from "@/lib/parsFiltersFromUrl";
import { buildFiltersQuery } from "@/lib/buildFiltersQuery";

function ProductsLayout() {
  const { state, dispatch } = useFilters();
  const searchParams = useSearchParams();
  const router = useRouter();

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

  // // hydrate once
  // useEffect(() => {
  //   const fromUrl = parseFiltersFromUrl(searchParams);
  //   dispatch({ type: "HYDRATE", payload: fromUrl });
  // }, []);

  // // applied → URL
  // useEffect(() => {
  //   const query = buildFiltersQuery(state.applied);
  //   if (query !== searchParams.toString()) {
  //     router.replace(query, { scroll: false });
  //   }
  // }, [state.applied]);

  return (
    <div className="container mx-auto xl:max-w-7xl py-2 px-4 w-full mt-40 md:mt-32">
      <FilterSection />
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
