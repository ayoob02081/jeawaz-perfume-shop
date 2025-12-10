"use client";

import { useGetAllProducts } from "@/hooks/useProducts";
import HomePageProducts from "./HomePageProducts";
import ProductCard from "./ProductCard";
import Loading from "@/components/Loading";
import Error from "@/components/Error";

function OffProducts() {
  const { data: products, isLoading, error } = useGetAllProducts();

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Error />;
  }

  return (
    <HomePageProducts
      titleOne={"پرتخفیف ترین"}
      titleTwo={"محصولات"}
      desc={"پرتخفیف ترین رایحه ها ، همین‌جاست."}
      className={""}
      bgColor="bg-[#FFF4F8] rounded-2xl py-6"
    >
      {products?.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </HomePageProducts>
  );
}

export default OffProducts;
