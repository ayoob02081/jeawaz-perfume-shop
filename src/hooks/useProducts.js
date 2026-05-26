import {
  getAllProductsApi,
  getProductByIdApi,
  getProductPriceApi,
  removeProductApi,
} from "@/services/productServices";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useGetAllProducts = () =>
  useQuery({
    queryKey: ["products"],
    queryFn: getAllProductsApi,
    retry: false,
    refetchOnWindowFocus: false,
  });

export const useGetProductsbyId = (id) =>
  useQuery({
    queryKey: ["get-product", id],
    queryFn: () => getProductByIdApi(id),
    enabled: !!id,
    retry: false,
    refetchOnWindowFocus: false,
  });

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

export function useRemoveProduct() {
  const queryClient = useQueryClient();

  const { isPending: isDeleting, mutateAsync: removeProduct } = useMutation({
    mutationFn: removeProductApi,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"], exact: true });
      queryClient.invalidateQueries({
        queryKey: ["product", variables?.id],
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
