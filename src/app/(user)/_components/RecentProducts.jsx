"use client";

import Loading from "@/components/Loading";
import HomePageProducts from "./HomePageProducts";
import ProductCard from "./ProductCard";
import { useGetAllProducts } from "@/hooks/useProducts";
import Error from "@/components/Error";
import { useState } from "react";

function RecentProducts() {
  const [gender, setGender] = useState();
  const { data, isLoading, error } = useGetAllProducts({
    sort: "newest",
    page: 1,
    limit: 8,
    gender: gender || undefined,
  });

  const getFullHrefParams = () => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", "12");
    params.set("sort", "newest");
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
    <HomePageProducts
      onGenderClick={(val) =>
        setGender((prev) => (prev === val ? undefined : val))
      }
      gender={gender}
      params={getFullHrefParams()}
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
