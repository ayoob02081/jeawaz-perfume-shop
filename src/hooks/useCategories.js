import { fetchCategories } from "@/services/categoriesServices";
import { useQuery } from "@tanstack/react-query";

export const useGetAllCategories = () =>
  useQuery({
    queryKey: ["get-categories"],
    queryFn: fetchCategories,
    retry: false,
    refetchOnWindowFocus: true,
  });