import { fetchProducts } from "@/services/productServices";
import { useQuery } from "@tanstack/react-query";

export const useGetAllProducts = () =>
  useQuery({
    queryKey: ["get-products"],
    queryFn: fetchProducts,
    retry: false,
    refetchOnWindowFocus: true,
  });
