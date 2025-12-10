import {
  fetchAccordCategories,
  fetchBrandCategories,
  fetchGenderCategories,
  getAllCategoriesApi,
} from "@/services/categoriesServices";
import { useQuery } from "@tanstack/react-query";

export const useGetAllGenderCategories = () =>
  useQuery({
    queryKey: ["get-genderCategories"],
    queryFn: fetchGenderCategories,
    // queryFn: getAllCategoriesApi,
    retry: false,
    refetchOnWindowFocus: true,
  });

export const useGetAllAccordCategories = () =>
  useQuery({
    queryKey: ["get-accordCategories"],
    queryFn: fetchAccordCategories,
    // queryFn: getAllCategoriesApi,
    retry: false,
    refetchOnWindowFocus: true,
  });

export const useGetAllBrandCategories = () =>
  useQuery({
    queryKey: ["get-brandCategories"],
    queryFn: fetchBrandCategories,
    // queryFn: getAllCategoriesApi,
    retry: false,
    refetchOnWindowFocus: true,
  });
