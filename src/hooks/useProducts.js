"use client";

import {
  addProductApi,
  getAllProductsApi,
  getProductByIdApi,
  getProductPriceApi,
  getProductSuggestionsApi,
  getProductVolumeOptionsApi,
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
import { normalizeProductsQuery, productListKey } from "@/utils/productFilterContract.mjs";

export const productKeys = {
  all: ["products"],
  lists: () => [...productKeys.all, "list"],
  list: productListKey,
  volumeOptions: () => [...productKeys.all, "filter-options", "volumes"],
  details: () => [...productKeys.all, "detail"],
  detail: (id) => [...productKeys.details(), id],
  suggestions: (search, limit = 5) => [
    ...productKeys.all,
    "suggestions",
    search,
    limit,
  ],
};


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

export const useGetProductVolumeOptions = (enabled = true) => useQuery({
  queryKey: productKeys.volumeOptions(),
  queryFn: getProductVolumeOptionsApi,
  enabled,
  retry: false,
  staleTime: 5 * 60 * 1000,
});

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
      toast.success("محصول با موفقیت حذف شد", { id: "remove-product" });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.removeQueries({
        queryKey: productKeys.detail(deletedProductId),
        exact: true,
      });
    },

    onError: (err) => {
      const msg = err?.response?.data?.message || "خطا در حذف محصول";
      toast.error(msg, { id: "remove-product-error" });
    },
  });

  return { isDeleting, removeProduct };
}
