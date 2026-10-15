"use client";

import ProductPagination from "./ProductPagination";
import { productKeys, useGetAllProducts } from "@/hooks/useProducts";
import Error from "@/components/Error";
import FilterSection from "./FilterSection";
import ProductCard from "../../_components/ProductCard";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAllProductsApi } from "@/services/productServices";
import ProductCardSkeleton from "../../_components/skeleton/ProductCardSkeletons";
import { catalogInitialQueryOptions, catalogInitialView } from "@/lib/storefrontCatalog.mjs";
import { useIsHydrated } from "@/hooks/useIsHydrated";
import { useCatalogSnapshotOptions } from "@/hooks/useCatalogSnapshotOptions";
import {
  normalizeProductsQuery,
  productListView,
  productsQueryFromSearchParams,
} from "@/utils/productFilterContract.mjs";
import NotExisted from "@/components/NotExisted";

function ProductsLayout({ initialSnapshot }) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  // One normalized query drives skeletons, request, query key, pagination and prefetch.
  const filters = useMemo(() => productsQueryFromSearchParams(searchParams), [searchParams]);
  const { page } = filters;

  const initialOptions = useCatalogSnapshotOptions(
    productKeys.list(filters), catalogInitialQueryOptions(filters, initialSnapshot),
  );
  const result = useGetAllProducts(filters, initialOptions);
  const {
    data,
    isLoading: isProductsLoading,
    isFetching: isProductsFetching,
    error: isProductsError,
    refetch: refetchProducts,
  } = catalogInitialView(result, initialOptions, useIsHydrated());

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
  const view = productListView({
    isLoading: isProductsLoading,
    data,
    error: isProductsError,
  });

  return (
    <main className="z-0 container mx-auto xl:max-w-7xl pb-2 px-4 w-full ">
      {/* Filters stay usable on a failed request, so a bad filter can be removed. */}
      <FilterSection />
      {view === "error" ? (
        <Error className="w-full" onRetry={refetchProducts} />
      ) : (
        <>
          <section
            className={`w-auto flex flex-col md:flex-row md:flex-wrap items-center justify-center gap-3 md:gap-6 pb-6 transition-opacity duration-200 ${
              isProductsFetching
                ? "opacity-60 pointer-events-none"
                : "opacity-100"
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
            <ProductPagination
              page={page}
              search={searchParams.toString()}
              totalPages={totalPages}
              isLoading={isProductsFetching}
            />
          </div>
        </>
      )}
    </main>
  );
}

export default ProductsLayout;
