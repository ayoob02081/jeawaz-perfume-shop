import {
  fetchAccordCategories,
  fetchGenderCategories,
  getAllBrandsApi,
  getAllCategoriesApi,
} from "@/services/categoriesServices";
import { useQuery } from "@tanstack/react-query";

export const useGetAllCategories = () =>
  useQuery({
    queryKey: ["get-allCategories"],
    queryFn: getAllCategoriesApi,
    retry: false,
    refetchOnWindowFocus: true,
  });

export const useGetAllGenderCategories = () =>
  useQuery({
    queryKey: ["get-genderCategories"],
    queryFn: fetchGenderCategories,
    retry: false,
    refetchOnWindowFocus: true,
  });

export const useGetAllAccordCategories = () =>
  useQuery({
    queryKey: ["get-accordCategories"],
    queryFn: fetchAccordCategories,
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
