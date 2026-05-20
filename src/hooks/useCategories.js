import {
  getAllBrandsApi,
  getAllCategoriesApi,
  getBrandByIdApi,
  getCategoryByIdApi,
  removeBrandApi,
  removeCategoryApi,
} from "@/services/categoriesServices";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetAllCategories = () =>
  useQuery({
    queryKey: ["get-categories"],
    queryFn: getAllCategoriesApi,
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

export const useGetAllBrandCategories = () =>
  useQuery({
    queryKey: ["get-brands"],
    queryFn: getAllBrandsApi,
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

export const useGetCategorybyID = (id) =>
  useQuery({
    queryKey: ["get-category", id],
    queryFn: () => getCategoryByIdApi(id),
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

export const useGetBrandbyID = (id) =>
  useQuery({
    queryKey: ["get-brand", id],
    queryFn: () => getBrandByIdApi(id),
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

export function useRemoveCategory() {
  const { isPending: isDeleting, mutateAsync: removeCategory } = useMutation({
    mutationFn: removeCategoryApi,
  });
  return { isDeleting, removeCategory };
}

export function useRemoveBrand() {
  const { isPending: isDeleting, mutateAsync: removeBrand } = useMutation({
    mutationFn: removeBrandApi,
  });
  return { isDeleting, removeBrand };
}
