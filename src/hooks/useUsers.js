"use client";

import {
  getAllUsersApi,
  getUserApi,
  getUserByIdApi,
  updateUserApi,
} from "@/services/usersServices";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export const useGetUser = () =>
  useQuery({
    queryKey: ["user"],
    queryFn: getUserApi,
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

export const useGetAllUsers = () =>
  useQuery({
    queryKey: ["users"],
    queryFn: getAllUsersApi,
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

export const useGetUserbyId = (id) =>
  useQuery({
    queryKey: ["user", id],
    queryFn: () => getUserByIdApi(id),
    enabled: !!id,
    retry: false,
    refetchOnWindowFocus: false,
  });

export function useUpdateUser(userId) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isPending: isUpdating, mutate: updateUser } = useMutation({
    mutationFn: updateUserApi,
    onSuccess: (data) => {
      toast.success("اطلاعات حساب کاربری شما با موفقیت ویرایش شد");
      queryClient.setQueryData(["user"], data);
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.refresh();
      router.back();
    },
    onError: (err) => {
      toast.error("اطلاعات حساب کاربری شما با خطا مواجه شد");
    },
  });

  return { isUpdating, updateUser };
}
