"use client";

import {
  addToCartApi,
  applyCouponApi,
  getAllCartItemsApi,
  removeFromCartApi,
  updateQuantityApi,
  updateShippingMethodApi,
} from "@/services/cartServices";
import { showApiError } from "@/utils/showApiError";
import { cartFromAddResponse } from "@/utils/addedToCartContract.mjs";
import { useAuth } from "@/contexts/auth/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import toast from "react-hot-toast";

export const cartKeys = {
  all: ["cart-items"],
  items: () => [...cartKeys.all],
};

export const useGetAllCartItems = () => {
  const { loading } = useAuth();

  return useQuery({
    queryKey: cartKeys.items(),
    queryFn: getAllCartItemsApi,
    enabled: !loading,
    retry: 1,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export function showAddToCartSuccessToast(data) {
  toast.success(data?.message || "محصول به سبد خرید اضافه شد", {
    id: "add-cart-success",
  });
}

// With `onAdded`, the caller owns the success feedback and receives the
// returned cart and the request variables; without it, the toast is shown.
export function useAddToCart({ onAdded } = {}) {
  const queryClient = useQueryClient();
  const onAddedRef = useRef(onAdded);
  onAddedRef.current = onAdded;

  const { isPending: isAdding, mutate: addToCart } = useMutation({
    mutationFn: addToCartApi,
    onSuccess: (data, variables) => {
      // The response is the full cart: cache it now so the new line is
      // available to the next quantity change before the refetch returns.
      const cart = cartFromAddResponse(data);
      if (cart) queryClient.setQueryData(cartKeys.items(), cart);
      if (onAddedRef.current) onAddedRef.current(data, variables);
      else showAddToCartSuccessToast(data);
      queryClient.invalidateQueries({
        queryKey: cartKeys.all,
      });
    },
    onError: (error) => showApiError(error),
  });

  return {
    isAdding,
    addToCart,
  };
}

export function useUpdateQuantity() {
  const queryClient = useQueryClient();
  const { isPending: isUpdating, mutate: updateQuantity } = useMutation({
    mutationFn: updateQuantityApi,
    onSuccess: (data) => {
      toast.success(data?.message || "تعداد محصول بروزرسانی شد", {
        id: "update-cart-quantity-success",
      });
      queryClient.invalidateQueries({
        queryKey: cartKeys.all,
      });
    },
    onError: (error) => showApiError(error),
  });

  return {
    isUpdating,
    updateQuantity,
  };
}

export function useUpdateShippingMethod() {
  const queryClient = useQueryClient();
  const { isPending: isUpdatingShipping, mutate: updateShippingMethod } =
    useMutation({
      mutationFn: updateShippingMethodApi,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: cartKeys.all,
        });
      },
      onError: (error) => showApiError(error),
    });

  return {
    isUpdatingShipping,
    updateShippingMethod,
  };
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  const { isPending: isDeleting, mutateAsync: removeFromCart } = useMutation({
    mutationFn: removeFromCartApi,
    onSuccess: (data) => {
      toast.success(data?.message || "محصول از سبد خرید حذف شد", {
        id: "remove-cart-success",
      });
      queryClient.invalidateQueries({
        queryKey: cartKeys.all,
      });
    },
    onError: (error) => showApiError(error),
  });

  return {
    isDeleting,
    removeFromCart,
  };
}

export function useApplyCoupon() {
  const queryClient = useQueryClient();

  const { isPending: isApplyingCoupon, mutateAsync: applyCoupon } = useMutation(
    {
      mutationFn: applyCouponApi,
      onSuccess: (data) => {
        toast.success(data?.message || "کد تخفیف اعمال شد", {
          id: "apply-coupon-success",
        });
        queryClient.invalidateQueries({
          queryKey: cartKeys.all,
        });
      },
      onError: (error) => showApiError(error),
    },
  );

  return {
    isApplyingCoupon,
    applyCoupon,
  };
}
