"use client";

import { useGetAllProducts } from "@/hooks/useProducts";
import HomePageProducts from "./HomePageProducts";
import ProductCard from "./ProductCard";
import Loading from "@/components/Loading";
import Error from "@/components/Error";

function OffProducts() {
  const { data, isLoading, error } = useGetAllProducts({
    sort: "most_discounted",
    page: 1,
    limit: 8,
  });

  const getFullHrefParams = () => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", "12");
    params.set("sort", "most_discounted");
    return params;
  };

  const products = data?.data || [];

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Error />;
  }
  return (
    <HomePageProducts
      params={getFullHrefParams()}
      titleOne={"پرتخفیف ترین"}
      titleTwo={"محصولات"}
      desc={"پرتخفیف ترین رایحه ها ، همین‌جاست."}
      className={""}
      bgColor="bg-stroke-50 dark:bg-stroke-50/50 rounded-2xl py-6"
    >
      {products?.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </HomePageProducts>
  );
}

export default OffProducts;
