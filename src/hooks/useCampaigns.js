"use client";

import {
  addCampaignApi,
  getAllCampaignsApi,
  getCampaignByIdApi,
  updateCampaignApi,
} from "@/services/campaignServices";
import { showApiError } from "@/utils/showApiError";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export const campaignKeys = {
  all: ["campaigns"],
  lists: () => [...campaignKeys.all, "list"],
  list: (filters = {}) => [...campaignKeys.lists(), filters],
  details: () => [...campaignKeys.all, "detail"],
  detail: (id) => [...campaignKeys.details(), id],
};

const normalizeCampaignsQuery = (query = {}) => ({
  page: query.page || 1,
  limit: query.limit || 12,
  search: query.search || undefined,
  isActive:
    typeof query.isActive === "boolean"
      ? query.isActive
      : query.isActive || undefined,
});

export const useGetAllCampaigns = (query = {}) => {
  const normalizedQuery = normalizeCampaignsQuery(query);

  return useQuery({
    queryKey: campaignKeys.list(normalizedQuery),
    queryFn: () => getAllCampaignsApi(normalizedQuery),
    retry: false,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
};

export const useGetCampaignById = (id) =>
  useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => getCampaignByIdApi(id),
    enabled: Boolean(id),
    retry: false,
    refetchOnWindowFocus: false,
  });

export function useAddCampaign() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { isPending: isAdding, mutate: addCampaign } = useMutation({
    mutationFn: addCampaignApi,

    onSuccess: (data) => {
      toast.success(data.message || "کمپین با موفقیت ایجاد شد", {
        id: "add-campaign-success",
      });
      queryClient.invalidateQueries({
        queryKey: campaignKeys.all,
      });
      router.push("/admin/campaigns");
    },

    onError: showApiError,
  });

  return {
    isAdding,
    addCampaign,
  };
}

export function useEditCampaign(campaignId) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { isPending: isEditing, mutate: editCampaign } = useMutation({
    mutationFn: (data) =>
      updateCampaignApi({
        campaignId,
        data,
      }),

    onSuccess: (data) => {
      toast.success(data.message || "کمپین با موفقیت ویرایش شد", {
        id: "edit-campaign-success",
      });

      queryClient.setQueryData(campaignKeys.detail(campaignId), (oldData) => {
        if (!oldData) return data;

        return {
          ...oldData,
          ...(data.campaign || data),
        };
      });

      queryClient.invalidateQueries({
        queryKey: campaignKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: campaignKeys.detail(campaignId),
      });

      router.refresh();
      router.back();
    },

    onError: showApiError,
  });

  return {
    isEditing,
    editCampaign,
  };
}
