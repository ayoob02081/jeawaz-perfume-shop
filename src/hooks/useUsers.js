"use client";

import {
  getAllUsersApi,
  getUserByIdApi,
  searchAdminUsersApi,
} from "@/services/usersServices";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/auth/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getSafeApiErrorMessage } from "@/utils/profileFormContract.mjs";
import { getNextUserCursor } from "@/utils/entityPickerContract.mjs";

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
