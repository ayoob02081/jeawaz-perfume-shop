import {
  getAllUsersApi,
  getUserApi,
  updateUserApi,
} from "@/services/usersServices";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetUser = () =>
  useQuery({
    queryKey: ["get-user"],
    queryFn: getUserApi,
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

export const useGetAllUsers = () =>
  useQuery({
    queryKey: ["get-users"],
    queryFn: getAllUsersApi,
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

export function useUpdateUser() {
  const { isPending: isUpdating, mutateAsync: updateUser } = useMutation({
    mutationFn: updateUserApi,
  });

  return { isUpdating, updateUser };
}
