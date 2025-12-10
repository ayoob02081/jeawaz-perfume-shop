"use client";

import Loading from "@/components/Loading";
import HomePageProducts from "./HomePageProducts";
import ProductCard from "./ProductCard";
import { useGetAllProducts } from "@/hooks/useProducts";
import Error from "@/components/Error";

function RecentProducts() {
  const { data: products, isLoading, error } = useGetAllProducts();

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Error />;
  }
  return (
    <HomePageProducts
      genderType="true"
      section={"recent"}
      titleOne={"جدید ترین "}
      titleTwo={"محصولات ما"}
      desc={"ترندهای رایحه، همین‌جاست."}
      className={"rounded-2xl"}
    >
      <div></div>
      {products?.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </HomePageProducts>
  );
}

export default RecentProducts;
