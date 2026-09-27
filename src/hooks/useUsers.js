"use client";

import { getAllUsersApi, getUserByIdApi } from "@/services/usersServices";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/auth/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getSafeApiErrorMessage } from "@/utils/profileFormContract.mjs";

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
