import {
  fetchProducts,
  getAllProductsApi,
  getProductByIdApi,
} from "@/services/productServices";
import { useQuery } from "@tanstack/react-query";

export const useGetAllProducts = () =>
  useQuery({
    queryKey: ["get-products"],
    queryFn: fetchProducts,
    retry: false,
    refetchOnWindowFocus: true,
  });

// export const useGetAllProducts = () =>
//   useQuery({
//     queryKey: ["get-products"],
//     queryFn: getAllProductsApi,
//     retry: false,
//     refetchOnWindowFocus: true,
//   });

export const useGetProductsbyID = (id) =>
  useQuery({
    queryKey: ["get-product", id],
    queryFn: () => getProductByIdApi(id),
    retry: false,
    refetchOnWindowFocus: true,
  });
