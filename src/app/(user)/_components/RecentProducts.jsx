"use client";

import HomePageSortProductsLayout from "./HomePageSortProductsLayout";
import ProductCard from "./ProductCard";
import { ProductCardSkeletons } from "./skeleton/ProductCardSkeletons";
import {
  HOME_SECTION_SKELETON_COUNT,
  homeSectionView,
} from "@/utils/homeProductSection.mjs";
import { useGetAllProducts } from "@/hooks/useProducts";
import Error from "@/components/Error";
import { useState } from "react";
import {
  catalogInitialQueryOptions,
  catalogInitialView,
} from "@/lib/storefrontCatalog.mjs";
import { useIsHydrated } from "@/hooks/useIsHydrated";
import { useCatalogSnapshotOptions } from "@/hooks/useCatalogSnapshotOptions";
import { productListKey } from "@/utils/productFilterContract.mjs";

function RecentProducts({ initialSnapshot }) {
  const [gender, setGender] = useState();
  const query = {
    sort: "newest",
    inStock: true,
    page: 1,
    limit: 8,
    gender: gender || undefined,
  };
  const initialOptions = useCatalogSnapshotOptions(
    productListKey(query),
    catalogInitialQueryOptions(query, initialSnapshot),
  );
  const result = useGetAllProducts(query, initialOptions);
  const { data, isLoading, error } = catalogInitialView(
    result,
    initialOptions,
    useIsHydrated(),
  );

  const getFullHrefParams = () => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", "12");
    params.set("sort", "newest");
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
      section={"recent"}
      title={"جدید ترین "}
      des={"محصولات ما"}
      desc={"ترندهای رایحه، همین‌جاست."}
      className={"overflow-x-auto"}
    >
      <div></div>
      {view === "loading" ? (
        <ProductCardSkeletons count={HOME_SECTION_SKELETON_COUNT} />
      ) : (
        products?.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            imagePriority={false}
          />
        ))
      )}
    </HomePageSortProductsLayout>
  );
}

export default RecentProducts;
