import {
  addProductApi,
  getAllProductsApi,
  getProductByIdApi,
  removeProductApi,
  updateProductApi,
} from "@/services/productServices";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetAllProducts = () =>
  useQuery({
    queryKey: ["get-products"],
    queryFn: getAllProductsApi,
    retry: false,
    refetchOnWindowFocus: true,
  });

export const useGetProductsbyId = (id) =>
  useQuery({
    queryKey: ["get-product", id],
    queryFn: () => getProductByIdApi(id),
    retry: false,
    refetchOnWindowFocus: true,
  });

export function useRemoveProduct() {
  const { isPending: isDeleting, mutateAsync: removeProduct } = useMutation({
    mutationFn: removeProductApi,
  });
  return { isDeleting, removeProduct };
}
