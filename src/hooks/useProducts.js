"use client";

import {
  addProductApi,
  getAllProductsApi,
  getProductByIdApi,
  getProductPriceApi,
  getProductSuggestionsApi,
  removeProductApi,
  updateProductApi,
} from "@/services/productServices";
import { showApiError } from "@/utils/showApiError";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export const productKeys = {
  all: ["products"],
  lists: () => [...productKeys.all, "list"],
  list: (filters = {}) => [...productKeys.lists(), filters],
  details: () => [...productKeys.all, "detail"],
  detail: (id) => [...productKeys.details(), id],
  suggestions: (search, limit = 5) => [
    ...productKeys.all,
    "suggestions",
    search,
    limit,
  ],
};

const normalizeProductsQuery = (query = {}) => ({
  search: query.search || undefined,
  brandIds: query.brandIds?.length ? query.brandIds : undefined,
  original:
    typeof query.original === "boolean"
      ? query.original
      : query.original || undefined,
  inStock:
    typeof query.inStock === "boolean"
      ? query.inStock
      : query.inStock || undefined,
  volumes: query.volumes?.length ? query.volumes : undefined,
  gender: query.gender || undefined,
  accords: query.accords?.length ? query.accords : undefined,
  minPrice: query.minPrice || undefined,
  maxPrice: query.maxPrice || undefined,
  minVolume: query.minVolume || undefined,
  maxVolume: query.maxVolume || undefined,
  type: query.type || undefined,
  sort: query.sort || "newest",
  page: query.page || 1,
  limit: query.limit || 12,
});

export const useGetAllProducts = (query = {}) => {
  const normalizedQuery = normalizeProductsQuery(query);

  return useQuery({
    queryKey: productKeys.list(normalizedQuery),
    queryFn: () => getAllProductsApi(normalizedQuery),
    retry: false,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
};

export const useGetProductSuggestions = ({ search, limit = 5 } = {}) => {
  const normalizedSearch = search?.trim() || "";

  return useQuery({
    queryKey: productKeys.suggestions(normalizedSearch, limit),
    queryFn: () =>
      getProductSuggestionsApi({
        search: normalizedSearch,
        limit,
      }),
    enabled: normalizedSearch.length >= 3,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });
};

export const useGetProductById = (id) =>
  useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => getProductByIdApi(id),
    enabled: Boolean(id),
    retry: false,
    refetchOnWindowFocus: false,
  });

export function useAddProduct() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { isPending: isAdding, mutate: addProduct } = useMutation({
    mutationFn: addProductApi,

    onSuccess: (data) => {
      toast.success(data.message || "محصول با موفقیت اضافه شد", {
        id: "add-product-success",
      });

      queryClient.invalidateQueries({ queryKey: productKeys.all });
      router.push("/admin/products");
    },

    onError: showApiError,
  });

  return { isAdding, addProduct };
}

export function useGetProductPrice() {
  const { isPending: isGettingPrice, mutateAsync: getProductPrice } =
    useMutation({
      mutationFn: getProductPriceApi,
      onError: (err) => {
        const msg = err?.response?.data?.message || "خطا در دریافت قیمت محصول";
        toast.error(msg, { id: "get-price-error" });
      },
    });

  return { isGettingPrice, getProductPrice };
}

export function useEditProduct(productId) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { isPending: isEditing, mutate: editProduct } = useMutation({
    mutationFn: (data) => updateProductApi({ productId, data }),
    onSuccess: (data) => {
      toast.success(data.message || "محصول با موفقیت ویرایش شد", {
        id: "edit-product-success",
      });

      queryClient.setQueryData(productKeys.detail(productId), (oldData) => {
        if (!oldData) return data;

        return {
          ...oldData,
          ...(data.product || data),
        };
      });

      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(productId),
      });

      router.refresh();
      router.back();
    },
    onError: (err) => showApiError(err),
  });

  return { isEditing, editProduct };
}

export function useRemoveProduct() {
  const queryClient = useQueryClient();

  const { isPending: isDeleting, mutateAsync: removeProduct } = useMutation({
    mutationFn: removeProductApi,

    onSuccess: (_, deletedProductId) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });

      queryClient.removeQueries({
        queryKey: productKeys.detail(deletedProductId),
        exact: true,
      });

      toast.success("محصول با موفقیت حذف شد", { id: "remove-product" });
    },

    onError: (err) => {
      const msg = err?.response?.data?.message || "خطا در حذف محصول";
      toast.error(msg, { id: "remove-product-error" });
    },
  });

  return { isDeleting, removeProduct };
}
