"use client";

import {
  getAllUsersApi,
  getUserByIdApi,
  searchAdminUsersApi,
  listAdminUsersApi,
  setUserBanApi,
} from "@/services/usersServices";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/auth/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getSafeApiErrorMessage } from "@/utils/profileFormContract.mjs";
import { getNextUserCursor } from "@/utils/entityPickerContract.mjs";
import { sessionLifecycle } from "@/utils/sessionLifecycle.mjs";

export const adminUserKeys = {
  all: ["users", "management"],
  list: (params) => ["users", "management", params],
};

export const useAdminUsers = (params, { enabled = true } = {}) => useQuery({
  queryKey: adminUserKeys.list(params),
  queryFn: ({ signal }) => listAdminUsersApi(params, { signal }),
  retry: false,
  enabled,
});

export function useSetUserBan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ generation, ...payload }) => {
      sessionLifecycle.assertCurrent(generation, true);
      const result = await setUserBanApi(payload);
      sessionLifecycle.assertCurrent(generation, true);
      return result;
    },
    onSuccess: async (result, { generation }) => {
      sessionLifecycle.assertCurrent(generation, true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["users"] }),
        queryClient.invalidateQueries({ queryKey: ["user", String(result.id)] }),
        queryClient.invalidateQueries({ queryKey: ["user", result.id] }),
      ]);
    },
  });
}

// Infinite-query data: never shares a key with the plain ["users"] query.
export const userPickerKeys = {
  all: ["users", "picker"],
  list: (params) => ["users", "picker", params],
};

// Admin picker cursor pages of GET /users/admin (params from
// buildUserPickerParams).
export const useAdminUserPickerSearch = (params, { enabled = true } = {}) =>
  useInfiniteQuery({
    queryKey: userPickerKeys.list(params),
    queryFn: ({ pageParam, signal }) =>
      searchAdminUsersApi(
        { ...params, cursor: pageParam || undefined },
        { signal },
      ),
    initialPageParam: null,
    getNextPageParam: getNextUserCursor,
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

export const useGetAllUsers = () =>
  useQuery({
    queryKey: ["users"],
    queryFn: getAllUsersApi,
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

export const useGetUserById = (id) =>
  useQuery({
    queryKey: ["user", id],
    queryFn: () => getUserByIdApi(id),
    enabled: !!id,
    retry: false,
    refetchOnWindowFocus: false,
  });

// AuthContext.updateUser = PATCH /users/me, then checkAuth() refreshes the
// authenticated user, so onSuccess (toast + back) runs on the fresh user.
export function useUpdateUser() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      toast.success("اطلاعات حساب کاربری شما با موفقیت ویرایش شد");
      router.back();
    },
    onError: (error) => {
      toast.error(
        getSafeApiErrorMessage(
          error,
          "اطلاعات حساب کاربری شما با خطا مواجه شد",
        ),
        { id: "update-user-error" },
      );
    },
  });

  return {
    updateUser: mutateAsync,
    isUpdating: isPending,
  };
}
