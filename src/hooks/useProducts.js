import {
  addProductApi,
  getAllProductsApi,
  getProductByIdApi,
  removeProductApi,
  updateProductApi,
} from "@/services/productServices";
import { useQuery } from "@tanstack/react-query";

export const useGetAllProducts = () =>
  useQuery({
    queryKey: ["get-products"],
    queryFn: getAllProductsApi,
    retry: false,
    refetchOnWindowFocus: true,
  });

export const useGetProductsbyID = (id) =>
  useQuery({
    queryKey: ["get-product", id],
    queryFn: () => getProductByIdApi(id),
    retry: false,
    refetchOnWindowFocus: true,
  });

export function useAddProduct() {
  const { isPending, mutateAsync } = useMutation({
    mutationFn: addProductApi,
  });
  return { isPending, mutateAsync };
}

export function useUpdateProduct() {
  const { isPending, mutateAsync } = useMutation({
    mutationFn: updateProductApi,
  });
  return { isPending, mutateAsync };
}

export function useRemoveProduct() {
  const { isPending: isDeleting, mutateAsync: removeProduct } = useMutation({
    mutationFn: removeProductApi,
  });
  return { isDeleting, removeProduct };
}
