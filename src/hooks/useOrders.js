import {
  getAllOrdersApi,
  getOrderByIdApi,
  createOrderApi,
} from "@/services/orderServices";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useGetOrders = () =>
  useQuery({
    queryKey: ["orders"],
    queryFn: getAllOrdersApi,
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

export const useGetAllOrdersByStatus = (status) =>
  useQuery({
    queryKey: ["orders-by-status", status],
    queryFn: () => fetchOrders(status),
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
