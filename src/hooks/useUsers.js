import { getAllUsersApi, getUserApi } from "@/services/usersServices";
import { useQuery } from "@tanstack/react-query";

export const useGetUser = () =>
  useQuery({
    queryKey: ["get-user"],
    queryFn: getUserApi,
    retry: false,
    refetchOnWindowFocus: true,
  });

export const useGetAllUsers = () =>
  useQuery({
    queryKey: ["get-users"],
    queryFn: getAllUsersApi,
    retry: false,
    refetchOnWindowFocus: true,
  });
