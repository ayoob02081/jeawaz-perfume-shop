"use client";

import PagesNumber from "@/components/PagesNumber";
import { productKeys, useGetAllProducts } from "@/hooks/useProducts";
import Error from "@/components/Error";
import FilterSection from "./FilterSection";
import ProductCard from "../../_components/ProductCard";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAllProductsApi } from "@/services/productServices";
import ProductCardSkeleton from "../../_components/skeleton/ProductCardSkeletons";
import { getFiltersFromSearchParams } from "@/utils/queryFilters";
import {
  normalizeProductsQuery,
  productListView,
} from "@/utils/productFilterContract.mjs";
import NotExisted from "@/components/NotExisted";

function ProductsLayout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const updateParams = useCallback(
    (updates) => {
      const params = new URLSearchParams(search);

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null) params.delete(key);
        else params.set(key, String(value));
      });

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, search],
  );

  const setPage = useCallback(
    (newPage) => {
      updateParams({ page: newPage });
    },
    [updateParams],
  );

  // One normalized query drives skeletons, request, query key, pagination and prefetch.
  const filters = useMemo(() => {
    const applied = getFiltersFromSearchParams(searchParams);
    return normalizeProductsQuery({
      search: searchParams.get("search") || undefined,
      brandIds: applied.brandIds,
      gender: applied.gender,
      fragranceFamilies: applied.fragranceFamilies,
      volumes: applied.volumes,
      minVolume: applied.minVolume,
      maxVolume: applied.maxVolume,
      inStock: applied.inStock,
      original: applied.original,
      discounted: searchParams.get("discounted") === "true" ? true : undefined,
      minPrice: applied.priceRange[0],
      maxPrice: applied.priceRange[1],
      type: applied.type,
      sort: applied.sort || "newest",
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });
  }, [searchParams]);
  const { page } = filters;

  const {
    data,
    isLoading: isProductsLoading,
    isFetching: isProductsFetching,
    error: isProductsError,
  } = useGetAllProducts(filters);

  const products = data?.data || [];
  const meta = data?.meta;

  const totalPages = isProductsLoading ? 0 : (meta?.totalPages ?? 1);
  useEffect(() => {
    if (!totalPages || page >= totalPages) return;

    const nextPageFilters = normalizeProductsQuery({
      ...filters,
      page: page + 1,
    });

    queryClient.prefetchQuery({
      queryKey: productKeys.list(nextPageFilters),
      queryFn: () => getAllProductsApi(nextPageFilters),
      staleTime: 30 * 1000,
    });
  }, [page, totalPages, filters, queryClient]);

  const skeletonCount = filters.limit;
  const view = productListView({ isLoading: isProductsLoading, data });

  if (isProductsError) {
    return <Error className="h-dvh" />;
  }

  return (
    <main className="z-0 container mx-auto xl:max-w-7xl pb-2 px-4 w-full ">
      <FilterSection />
      <section
        className={`w-auto flex flex-col md:flex-row md:flex-wrap items-center justify-center gap-3 md:gap-6 pb-6 transition-opacity duration-200 ${
          isProductsFetching ? "opacity-60 pointer-events-none" : "opacity-100"
        }`}
      >
        {view === "loading" &&
          Array.from({ length: skeletonCount }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        {view === "empty" && (
          <NotExisted className="h-40">
            محصولی با این مشخصات یافت نشد.
          </NotExisted>
        )}
        {view === "products" &&
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
      </section>
      <div className="flex items-center justify-center h-20">
        <PagesNumber
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          isLoading={isProductsFetching}
        />
      </div>
    </main>
  );
}

export default ProductsLayout;
