"use client";

import {
  addBannerApi,
  getActiveBannersApi,
  getAllBannersApi,
  getBannerByIdApi,
  removeBannerApi,
  toggleBannerApi,
  updateBannerApi,
} from "@/services/bannerServices";
import { showApiError } from "@/utils/showApiError";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export const bannerKeys = {
  all: ["banners"],
  lists: () => [...bannerKeys.all, "list"],
  list: (filters = {}) => [...bannerKeys.lists(), filters],
  active: () => [...bannerKeys.all, "active"],
  activeList: (filters = {}) => [...bannerKeys.active(), filters],
  details: () => [...bannerKeys.all, "detail"],
  detail: (id) => [...bannerKeys.details(), id],
};

export const useGetAllBanners = (params = {}) => {
  return useQuery({
    queryKey: bannerKeys.list(params),
    queryFn: () => getAllBannersApi(params),
    retry: false,
    refetchOnWindowFocus: false,
  });
};

export const useGetActiveBanners = (params = {}) => {
  return useQuery({
    queryKey: bannerKeys.activeList(params),
    queryFn: () => getActiveBannersApi(params),
    retry: false,
    refetchOnWindowFocus: false,
  });
};

export const useGetBannerById = (id) => {
  return useQuery({
    queryKey: bannerKeys.detail(id),
    queryFn: () => getBannerByIdApi(id),
    enabled: Boolean(id),
    retry: false,
    refetchOnWindowFocus: false,
  });
};

export function useAddBanner() {
  const queryClient = useQueryClient();

  const router = useRouter();

  const { isPending: isAdding, mutateAsync: addBanner } = useMutation({
    mutationFn: addBannerApi,

    onSuccess: (data) => {
      toast.success(data?.message || "بنر با موفقیت اضافه شد", {
        id: "add-banner-success",
      });

      queryClient.invalidateQueries({
        queryKey: bannerKeys.all,
      });

      router.push("/admin/banners");
    },

    onError: (err) => {
      showApiError(err);
    },
  });

  return {
    isAdding,
    addBanner,
  };
}

export function useEditBanner(bannerId) {
  const queryClient = useQueryClient();

  const router = useRouter();

  const { isPending: isEditing, mutateAsync: editBanner } = useMutation({
    mutationFn: (data) =>
      updateBannerApi({
        bannerId,
        data,
      }),

    onSuccess: (data) => {
      toast.success(data?.message || "بنر با موفقیت ویرایش شد", {
        id: "edit-banner-success",
      });

      queryClient.invalidateQueries({
        queryKey: bannerKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: bannerKeys.detail(bannerId),
      });

      router.refresh();
    },

    onError: (err) => {
      showApiError(err);
    },
  });

  return {
    isEditing,
    editBanner,
  };
}

export function useToggleBanner() {
  const queryClient = useQueryClient();

  const { isPending: isToggling, mutateAsync: toggleBanner } = useMutation({
    mutationFn: toggleBannerApi,

    onSuccess: (data) => {
      toast.success(data?.message || "وضعیت بنر تغییر کرد", {
        id: "toggle-banner-success",
      });

      queryClient.invalidateQueries({
        queryKey: bannerKeys.all,
      });
    },

    onError: (err) => {
      showApiError(err);
    },
  });

  return {
    isToggling,
    toggleBanner,
  };
}

export function useRemoveBanner() {
  const queryClient = useQueryClient();

  const { isPending: isDeleting, mutateAsync: removeBanner } = useMutation({
    mutationFn: removeBannerApi,

    onSuccess: (_, deletedBannerId) => {
      toast.success("بنر با موفقیت حذف شد", {
        id: "remove-banner-success",
      });

      queryClient.invalidateQueries({
        queryKey: bannerKeys.all,
      });

      queryClient.removeQueries({
        queryKey: bannerKeys.detail(deletedBannerId),
        exact: true,
      });
    },

    onError: (err) => {
      showApiError(err);
    },
  });

  return {
    isDeleting,
    removeBanner,
  };
}
