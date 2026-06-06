import {
  getOrderByIdApi,
  createOrderApi,
  getUserOrdersApi,
  getOrdersByUserIdApi,
  getAdminOrdersApi,
} from "@/services/orderServices";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useGetAdminOrders = (params) =>
  useQuery({
    queryKey: ["admin-orders", params],
    queryFn: () => getAdminOrdersApi(params),
    retry: false,
    refetchOnWindowFocus: false,
  });

export const useGetOrders = () =>
  useQuery({
    queryKey: ["orders"],
    queryFn: getUserOrdersApi,
    retry: false,
    refetchOnWindowFocus: false,
  });

export const useGetOrderById = (id) =>
  useQuery({
    queryKey: ["orders", id],
    queryFn: () => getOrderByIdApi(id),
    enabled: !!id,
    retry: false,
  });

export const useGetOrdersByUserId = (userId) =>
  useQuery({
    queryKey: ["orders2", userId],
    queryFn: () => getOrdersByUserIdApi(userId),
    enabled: !!userId,
    retry: false,
  });

export function useCreateOrder() {
  const queryClient = useQueryClient();

  const { isPending: isCreating, mutateAsync: createOrder } = useMutation({
    mutationFn: createOrderApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["cart-items"] });
      toast.success("سفارش با موفقیت ثبت شد", { id: "create-order" });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || "خطا در ثبت سفارش";
      toast.error(msg, { id: "create-order-error" });
    },
  });

  return { isCreating, createOrder };
}
