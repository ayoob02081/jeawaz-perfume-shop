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
    queryKey: ["get-allCategories"],
    queryFn: getAllCategoriesApi,
    retry: false,
    refetchOnWindowFocus: true,
  });

export const useGetAllBrandCategories = () =>
  useQuery({
    queryKey: ["get-brandCategories"],
    queryFn: getAllBrandsApi,
    retry: false,
    refetchOnWindowFocus: true,
  });

export const useGetCategorybyID = (id) =>
  useQuery({
    queryKey: ["get-category", id],
    queryFn: () => getCategoryByIdApi(id),
    retry: false,
    refetchOnWindowFocus: true,
  });

export const useGetBrandbyID = (id) =>
  useQuery({
    queryKey: ["get-brand", id],
    queryFn: () => getBrandByIdApi(id),
    retry: false,
    refetchOnWindowFocus: true,
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
