import {
  getOrderByIdApi,
  createOrderApi,
  getUserOrdersApi,
  getOrdersByUserIdApi,
  getAdminOrdersApi,
  updateOrderStatusApi,
  bulkUpdateStatusApi,
  confirmPaymentApi,
  getOrderTimelineApi,
  getAdminDashboardApi,
  getOrderByNumberApi,
  exportOrdersApi,
} from "@/services/orderServices";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

/* ================= GET ================= */

export const useGetAdminOrders = ({ page, limit, status }) =>
  useQuery({
    queryKey: ["admin-orders", page, limit, status],
    queryFn: () => getAdminOrdersApi({ page, limit, status }),
    keepPreviousData: true,
    staleTime: 30_000,
  });

export const useGetOrders = ({ page = 1, limit = 10, status } = {}) =>
  useQuery({
    queryKey: ["orders", page, limit, status],
    queryFn: () => getUserOrdersApi({ page, limit, status }),
    keepPreviousData: true,
    // staleTime: 30_000,
  });

export const useGetOrderById = (id) =>
  useQuery({
    queryKey: ["orders", id],
    queryFn: () => getOrderByIdApi(id),
    enabled: !!id,
    retry: false,
  });

export const useGetOrderByNumber = (orderNumber) =>
  useQuery({
    queryKey: ["order-number", orderNumber],
    queryFn: () => getOrderByNumberApi(orderNumber),
    enabled: !!orderNumber,
  });

export const useGetOrdersByUserId = ({ userId, page = 1, limit = 10 }) =>
  useQuery({
    queryKey: ["orders-user", userId, page, limit],
    queryFn: () => getOrdersByUserIdApi(userId, { page, limit }),
    enabled: !!userId,
  });

export const useGetOrderTimeline = (id) =>
  useQuery({
    queryKey: ["order-timeline", id],
    queryFn: () => getOrderTimelineApi(id),
    enabled: !!id,
  });

export const useGetAdminDashboard = () =>
  useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboardApi,
  });

export function useExportOrders() {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: exportOrdersApi,
    onError: (err) => {
      toast.error(err?.response?.data?.message || "خطا در دریافت فایل");
    },
  });

  const downloadFile = async (payload) => {
    const res = await mutateAsync(payload);

    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    const disposition = res.headers["content-disposition"];
    const match = disposition?.match(/filename="?(.+)"?/);
    const filename = match?.[1] || `orders_${Date.now()}.xlsx`;

    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);

    const count = Number(res.headers["x-order-count"] || 0);
    toast.success(`${count} سفارش دانلود شد`);
  };

  return {
    exportOrders: downloadFile,
    isPending,
  };
}

/* ================= CREATE ================= */

export function useCreateOrder() {
  const queryClient = useQueryClient();

  const { isPending: isCreating, mutateAsync: createOrder } = useMutation({
    mutationFn: createOrderApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["cart-items"] });
      toast.success("سفارش با موفقیت ثبت شد");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "خطا در ثبت سفارش");
    },
  });

  return { isCreating, createOrder };
}

/* ================= ADMIN ACTIONS ================= */

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  const { mutate: updateOrderStatus, isPending } = useMutation({
    mutationFn: ({ id, status }) => updateOrderStatusApi(id, status),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", variables.id] });
      queryClient.invalidateQueries({
        queryKey: ["order-timeline", variables.id],
      });

      toast.success("وضعیت سفارش بروزرسانی شد");
    },

    onError: (err) => {
      toast.error(err?.response?.data?.message || "خطا در تغییر وضعیت");
    },
  });

  return { updateOrderStatus, isPending };
}

export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();

  const { mutate: bulkUpdateStatus, isPending } = useMutation({
    mutationFn: ({ ids, status }) => bulkUpdateStatusApi(ids, status),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("بروزرسانی گروهی انجام شد");
    },

    onError: (err) => {
      toast.error(err?.response?.data?.message || "خطا در بروزرسانی گروهی");
    },
  });

  return { bulkUpdateStatus, isPending };
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();

  const { mutate: confirmPayment, isPending } = useMutation({
    mutationFn: confirmPaymentApi,

    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      queryClient.invalidateQueries({
        queryKey: ["order-timeline", id],
      });

      toast.success("پرداخت تایید شد");
    },

    onError: (err) => {
      toast.error(err?.response?.data?.message || "خطا در تایید پرداخت");
    },
  });

  return { confirmPayment, isPending };
}
