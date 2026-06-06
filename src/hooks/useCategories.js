import {
  getAllBrandsApi,
  getAllCategoriesApi,
  getBrandByIdApi,
  getCategoryByIdApi,
  removeBrandApi,
  removeCategoryApi,
  addCategoryApi,
  addBrandApi,
  updateCategoryApi,
  updateBrandApi,
} from "@/services/categoriesServices";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

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
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

export const useGetBrandbyID = (id) =>
  useQuery({
    queryKey: ["get-brand", id],
    queryFn: () => getBrandByIdApi(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

export function useAddCategory() {
  const queryClient = useQueryClient();

  const { isPending: isAdding, mutate: addCategory } = useMutation({
    mutationFn: addCategoryApi,
    onSuccess: (data) => {
      toast.success(data?.message || "دسته‌بندی اضافه شد");
      queryClient.invalidateQueries({ queryKey: ["get-categories"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "خطا در افزودن دسته‌بندی");
    },
  });

  return { isAdding, addCategory };
}

export function useAddBrand() {
  const queryClient = useQueryClient();

  const { isPending: isAdding, mutate: addBrand } = useMutation({
    mutationFn: addBrandApi,
    onSuccess: (data) => {
      toast.success(data?.message || "برند اضافه شد");
      queryClient.invalidateQueries({ queryKey: ["get-brands"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "خطا در افزودن برند");
    },
  });

  return { isAdding, addBrand };
}

export function useEditCategory(categoryId) {
  const queryClient = useQueryClient();

  const { isPending: isEditing, mutate: editCategory } = useMutation({
    mutationFn: (data) => updateCategoryApi({ categoryId, data }),
    onSuccess: (data) => {
      toast.success(data?.message || "دسته‌بندی ویرایش شد");

      queryClient.invalidateQueries({ queryKey: ["get-categories"] });
      queryClient.invalidateQueries({
        queryKey: ["get-category", categoryId],
      });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "خطا در ویرایش دسته‌بندی");
    },
  });

  return { isEditing, editCategory };
}

export function useEditBrand(brandId) {
  const queryClient = useQueryClient();

  const { isPending: isEditing, mutate: editBrand } = useMutation({
    mutationFn: (data) => updateBrandApi({ brandId, data }),
    onSuccess: (data) => {
      toast.success(data?.message || "برند ویرایش شد");

      queryClient.invalidateQueries({ queryKey: ["get-brands"] });
      queryClient.invalidateQueries({
        queryKey: ["get-brand", brandId],
      });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "خطا در ویرایش برند");
    },
  });

  return { isEditing, editBrand };
}

export function useRemoveCategory() {
  const queryClient = useQueryClient();

  const { isPending: isDeleting, mutateAsync: removeCategory } = useMutation({
    mutationFn: removeCategoryApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get-categories"] });
      toast.success("دسته‌بندی حذف شد");
    },
    onError: () => {
      toast.error("حذف دسته‌بندی با خطا مواجه شد");
    },
  });

  return { isDeleting, removeCategory };
}

export function useRemoveBrand() {
  const queryClient = useQueryClient();

  const { isPending: isDeleting, mutateAsync: removeBrand } = useMutation({
    mutationFn: removeBrandApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get-brands"] });
      toast.success("برند حذف شد");
    },
    onError: () => {
      toast.error("حذف برند با خطا مواجه شد");
    },
  });

  return { isDeleting, removeBrand };
}
