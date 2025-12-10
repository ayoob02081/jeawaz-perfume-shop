"use client";

import { useGetAllProducts } from "@/hooks/useProducts";
import HomePageProducts from "./HomePageProducts";
import ProductCard from "./ProductCard";
import Loading from "@/components/Loading";
import Error from "@/components/Error";

function PopularProducts() {
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
      section={"popular"}
      titleOne={"پر فروش ترین"}
      titleTwo={"محصولات ما"}
      desc={"رایحه هایی که همیشه می درخشن"}
      className={
        " flex-col md:flex-row overflow-hidden sm:overflow-x-auto rounded-2xl"
      }
    >
      {products?.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </HomePageProducts>
  );
}

export default PopularProducts;
