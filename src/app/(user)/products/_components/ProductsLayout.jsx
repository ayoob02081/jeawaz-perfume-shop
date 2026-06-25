"use client";

import PagesNumber from "@/components/PagesNumber";
import { useGetAllProducts } from "@/hooks/useProducts";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import FilterSection from "./FilterSection";
import ProductCard from "../../_components/ProductCard";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAllProductsApi } from "@/services/productServices";

function ProductsLayout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const page = useMemo(() => {
    const p = Number(searchParams.get("page"));
    return !p || p < 1 ? 1 : p;
  }, [searchParams]);
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

  const filters = useMemo(() => {
    const brandIds = searchParams
      .getAll("brandIds")
      .map(Number)
      .filter(Boolean);

    const accords = searchParams.getAll("accords").filter(Boolean);
    const volumes = searchParams.getAll("volumes").filter(Boolean);

    return {
      search: searchParams.get("search") || undefined,
      brandIds,
      gender: searchParams.get("gender") || undefined,
      accords,
      volumes,
      inStock: searchParams.get("inStock") || undefined,
      original: searchParams.get("original") || undefined,
      minPrice: searchParams.get("minPrice")
        ? Number(searchParams.get("minPrice"))
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? Number(searchParams.get("maxPrice"))
        : undefined,
      type: searchParams.get("type") || undefined,
      sort: searchParams.get("sort") || "newest",
      page,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 12,
    };
  }, [searchParams]);

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

    const nextPageFilters = {
      ...filters,
      page: page + 1,
    };

    queryClient.prefetchQuery({
      queryKey: ["products", nextPageFilters],
      queryFn: () => getAllProductsApi(nextPageFilters),
      staleTime: 30 * 1000,
    });
  }, [page, totalPages, filters, queryClient]);

  if (isProductsLoading && !data) {
    return <Loading className="h-screen" />;
  }

  if (isProductsError) {
    return <Error className="h-screen" />;
  }

  return (
    <main className="container mx-auto xl:max-w-7xl py-2 px-4 w-full mt-40 md:mt-32">
      <FilterSection />
      <section
        className={`w-auto flex flex-col md:flex-row md:flex-wrap items-center justify-center gap-3 md:gap-6 py-6 transition-opacity duration-200 ${
          isProductsFetching ? "opacity-60 pointer-events-none" : "opacity-100"
        }`}
      >
        {products?.map((product) => (
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
