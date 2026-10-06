"use client";

import { useGetAllProducts } from "@/hooks/useProducts";
import HomePageSortProductsLayout from "./HomePageSortProductsLayout";
import ProductCard from "./ProductCard";
import { ProductCardSkeletons } from "./skeleton/ProductCardSkeletons";
import {
  HOME_SECTION_SKELETON_COUNT,
  homeSectionView,
} from "@/utils/homeProductSection.mjs";
import Error from "@/components/Error";
import { useState } from "react";

function PopularProducts() {
  const [gender, setGender] = useState();
  const { data, isLoading, error } = useGetAllProducts({
    sort: "best_selling",
    inStock: true,
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
  const view = homeSectionView({ isLoading, error });

  if (view === "error") {
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
        " flex-col md:flex-row sm:overflow-x-auto rounded-2xl"
      }
    >
      {view === "loading" ? (
        <ProductCardSkeletons count={HOME_SECTION_SKELETON_COUNT} />
      ) : (
        products?.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))
      )}
    </HomePageSortProductsLayout>
  );
}

export default PopularProducts;
