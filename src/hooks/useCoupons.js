"use client";

import {
  addCouponApi,
  getAllCouponsApi,
  getCouponByIdApi,
  removeCouponApi,
  toggleCouponStatusApi,
  updateCouponApi,
  validateCouponApi,
} from "@/services/couponsServices";
import { showApiError } from "@/utils/showApiError";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export const couponKeys = {
  all: ["coupons"],
  cart: ["cart-items"],
  lists: () => [...couponKeys.all, "list"],
  list: () => [...couponKeys.lists()],
  details: () => [...couponKeys.all, "detail"],
  detail: (id) => [...couponKeys.details(), id],
};

export const useGetAllCoupons = () =>
  useQuery({
    queryKey: couponKeys.list(),
    queryFn: getAllCouponsApi,
    retry: false,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

export const useGetCouponById = (id) =>
  useQuery({
    queryKey: couponKeys.detail(id),
    queryFn: () => getCouponByIdApi(id),
    enabled: Boolean(id),
    retry: false,
    refetchOnWindowFocus: false,
  });

export function useAddCoupon() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { isPending: isAdding, mutate: addCoupon } = useMutation({
    mutationFn: addCouponApi,

    onSuccess: (data) => {
      toast.success(data.message || "کد تخفیف با موفقیت ایجاد شد", {
        id: "add-coupon-success",
      });

      queryClient.invalidateQueries({ queryKey: couponKeys.all });
      router.push("/admin/coupons");
    },

    onError: (error) => showApiError(error),
  });

  return { isAdding, addCoupon };
}

export function useEditCoupon(couponId) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { isPending: isEditing, mutate: editCoupon } = useMutation({
    mutationFn: (data) => updateCouponApi({ couponId, data }),

    onSuccess: (data) => {
      toast.success(data.message || "کد تخفیف با موفقیت ویرایش شد", {
        id: "edit-coupon-success",
      });

      queryClient.setQueryData(couponKeys.detail(couponId), (oldData) => {
        if (!oldData) return data;

        return {
          ...oldData,
          ...(data.coupon || data),
        };
      });

      queryClient.invalidateQueries({ queryKey: couponKeys.all });
      queryClient.invalidateQueries({
        queryKey: couponKeys.detail(couponId),
      });

      router.refresh();
      router.back();
    },

    onError: (error) => showApiError(error),
  });

  return { isEditing, editCoupon };
}

export function useRemoveCoupon() {
  const queryClient = useQueryClient();

  const { isPending: isDeleting, mutateAsync: removeCoupon } = useMutation({
    mutationFn: removeCouponApi,

    onSuccess: (_, deletedCouponId) => {
      queryClient.invalidateQueries({ queryKey: couponKeys.all });

      queryClient.removeQueries({
        queryKey: couponKeys.detail(deletedCouponId),
        exact: true,
      });

      toast.success("کد تخفیف با موفقیت حذف شد", {
        id: "remove-coupon-success",
      });
    },

    onError: (err) => {
      const msg = err?.response?.data?.message || "خطا در حذف کد تخفیف";
      toast.error(msg, {
        id: "remove-coupon-error",
      });
    },
  });

  return { isDeleting, removeCoupon };
}

export function useToggleCouponStatus() {
  const queryClient = useQueryClient();

  const { isPending: isToggling, mutate: toggleCouponStatus } = useMutation({
    mutationFn: toggleCouponStatusApi,

    onSuccess: (data) => {
      toast.success(data.message || "وضعیت کد تخفیف بروزرسانی شد", {
        id: "toggle-coupon-success",
      });

      queryClient.invalidateQueries({ queryKey: couponKeys.all });
    },

    onError: (error) => showApiError(error),
  });

  return { isToggling, toggleCouponStatus };
}

export function useValidateCoupon() {
  const queryClient = useQueryClient();

  const { isPending: isValidating, mutateAsync: validateCoupon } = useMutation({
    mutationFn: validateCouponApi,
    onSuccess: (data) => {
      toast.success(data.message || "کد تخفیف اعمال شد", {
        id: "validate-coupon-success",
      });

      queryClient.invalidateQueries({ queryKey: couponKeys.cart });
    },
    onError: (error) => showApiError(error),
  });

  return { isValidating, validateCoupon };
}
