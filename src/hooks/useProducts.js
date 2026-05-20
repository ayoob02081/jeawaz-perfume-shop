import {
  addProductApi,
  getAllProductsApi,
  getProductByIdApi,
  getProductPriceApi,
  removeProductApi,
  updateProductApi,
} from "@/services/productServices";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetAllProducts = () =>
  useQuery({
    queryKey: ["get-products"],
    queryFn: getAllProductsApi,
    retry: false,
     staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

export const useGetProductsbyId = (id) =>
  useQuery({
    queryKey: ["get-product", id],
    queryFn: () => getProductByIdApi(id),
    retry: false,
     staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

export function useGetProductPrice() {
  const { isPending: isGettingPrice, mutateAsync: getProductPrice } =
    useMutation({
      mutationFn: getProductPriceApi,
    });

  return { isGettingPrice, getProductPrice };
}

export function useRemoveProduct() {
  const { isPending: isDeleting, mutateAsync: removeProduct } = useMutation({
    mutationFn: removeProductApi,
  });
  return { isDeleting, removeProduct };
}
