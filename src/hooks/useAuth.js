import { getAllUsersApi, getUserApi, loginApi } from "@/services/authServices";
import { useQuery } from "@tanstack/react-query";

// export const useGetUser = () =>
//   useQuery({
//     queryKey: ["get-user"],
//     queryFn: getUserApi,
//     retry: false,
//     refetchOnWindowFocus: true,
//   });
// export const useLoginUser = () =>
//   useQuery({
//     // queryKey: ["get-user"],
//     queryFn: loginApi,
//     retry: false,
//     refetchOnWindowFocus: true,
//   });

  export const useGetAllUsers = () =>
    useQuery({
      queryKey: ["get-users"],
      queryFn: getAllUsersApi,
      retry: false,
      refetchOnWindowFocus: true,
    });
