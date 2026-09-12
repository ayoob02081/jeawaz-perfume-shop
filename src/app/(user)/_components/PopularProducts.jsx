"use client";

import { useGetAllProducts } from "@/hooks/useProducts";
import HomePageSortProductsLayout from "./HomePageSortProductsLayout";
import ProductCard from "./ProductCard";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import { useState } from "react";

function PopularProducts() {
  const [gender, setGender] = useState();
  const { data, isLoading, error } = useGetAllProducts({
    sort: "best_selling",
    page: 1,
    limit: 8,
    gender: gender || undefined,
  });

  const getFullHrefParams = () => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", "12");
    params.set("sort", "best_selling");
    if (gender) params.set("gender", gender);
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
    <HomePageSortProductsLayout
      onGenderClick={(val) =>
        setGender((prev) => (prev === val ? undefined : val))
      }
      gender={gender}
      params={getFullHrefParams()}
      genderType="true"
      section={"popular"}
      title={"پرفروش ترین"}
      des={"محصولات ما"}
      desc={"رایحه هایی که همیشه می درخشن"}
      className={
        " flex-col md:flex-row overflow-hidden sm:overflow-x-auto rounded-2xl"
      }
    >
      {products?.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </HomePageSortProductsLayout>
  );
}

export default PopularProducts;
