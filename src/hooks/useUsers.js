import {
  getAllUsersApi,
  getUserApi,
  getUserByIdApi,
  updateUserApi,
} from "@/services/usersServices";
import { useMutation, useQuery } from "@tanstack/react-query";

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
    queryKey: ["get-product", id],
    queryFn: () => getUserByIdApi(id),
    enabled: !!id,
    retry: false,
    refetchOnWindowFocus: false,
  });

export function useUpdateUser() {
  const { isPending: isUpdating, mutateAsync: updateUser } = useMutation({
    mutationFn: updateUserApi,
  });

  return { isUpdating, updateUser };
}
