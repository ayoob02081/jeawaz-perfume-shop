"use client";

import { getAllUsersApi, getUserByIdApi } from "@/services/usersServices";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/filters/auth/AuthContext";
import { useQuery } from "@tanstack/react-query";

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

export function useUpdateUser() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const { mutate, isPending } = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      toast.success("اطلاعات حساب کاربری شما با موفقیت ویرایش شد");
      router.back();
    },
    onError: () => {
      toast.error("اطلاعات حساب کاربری شما با خطا مواجه شد");
    },
  });

  return {
    updateUser: mutate,
    isUpdating: isPending,
  };
}
