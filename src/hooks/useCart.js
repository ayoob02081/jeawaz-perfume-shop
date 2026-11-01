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
import { sessionLifecycle } from "@/utils/sessionLifecycle.mjs";
import { captureCartMutation, sessionCartOptions, cartMutationCallbacks } from "@/utils/sessionCartMutation.mjs";

function useCartMutation(options) {
  const mutation = useMutation(sessionCartOptions(options));
  const wrap = (run) => (variables, callbacks) => {
    const request = captureCartMutation(variables);
    return run(request, cartMutationCallbacks(callbacks, request));
  };
  return { ...mutation, mutate: wrap(mutation.mutate), mutateAsync: wrap(mutation.mutateAsync) };
}

async function getSessionCart({ signal } = {}) {
  const generation = sessionLifecycle.generation();
  sessionLifecycle.assertCurrent(generation, true);
  const cart = await getAllCartItemsApi({ signal });
  await sessionLifecycle.waitUntilReady(generation);
  return cart;
}

export const cartKeys = {
  all: ["cart-items"],
  items: () => [...cartKeys.all],
};

export const useGetAllCartItems = () => {
  const { loading, sessionReady } = useAuth();

  return useQuery({
    queryKey: cartKeys.items(),
    queryFn: getSessionCart,
    enabled: !loading && sessionReady,
    retry: 1,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

// The cart as the server has it now, e.g. right after a login merged the
// guest cart: a fetch that may have started under the previous session is
// cancelled, then a new one runs and its result is cached.
export async function fetchFreshCart(queryClient) {
  const generation = sessionLifecycle.generation();
  sessionLifecycle.assertCurrent(generation, true);
  await queryClient.cancelQueries({ queryKey: cartKeys.all });
  sessionLifecycle.assertCurrent(generation, true);
  return queryClient.fetchQuery({
    queryKey: cartKeys.items(),
    queryFn: getSessionCart,
    staleTime: 0,
  });
}

export function showAddToCartSuccessToast(data) {
  toast.success(data?.message || "محصول به سبد خرید اضافه شد", {
    id: "add-cart-success",
  });
}

// Line changes (add, quantity, remove): the cart is re-read after success and
// after rejection, and the returned promise keeps the mutation pending until
// it is, so the caller's own callbacks see the server's cart. `scope` (one
// cart line) runs that line's changes one at a time.
const lineChangeOptions = (queryClient, scope) => ({
  ...(scope ? { scope: { id: scope } } : {}),
  onSettled: () => queryClient.invalidateQueries({ queryKey: cartKeys.all }),
});

// With `onAdded`, the caller owns the success feedback and receives the
// returned cart and the request variables; without it, the toast is shown.
export function useAddToCart({ onAdded, scope } = {}) {
  const queryClient = useQueryClient();
  const onAddedRef = useRef(onAdded);
  onAddedRef.current = onAdded;

  const { isPending: isAdding, mutate: addToCart } = useCartMutation({
    mutationFn: addToCartApi,
    onSuccess: (data, variables) => {
      // The response is the full cart: cache it now so the new line is
      // available to the next quantity change before the refetch returns.
      const cart = cartFromAddResponse(data);
      if (cart) queryClient.setQueryData(cartKeys.items(), cart);
      if (onAddedRef.current) onAddedRef.current(data, variables);
      else showAddToCartSuccessToast(data);
    },
    onError: (error) => showApiError(error),
    ...lineChangeOptions(queryClient, scope),
  });

  return {
    isAdding,
    addToCart,
  };
}

export function useUpdateQuantity({ scope } = {}) {
  const queryClient = useQueryClient();
  const { isPending: isUpdating, mutate: updateQuantity } = useCartMutation({
    mutationFn: updateQuantityApi,
    onSuccess: (data) => {
      toast.success(data?.message || "تعداد محصول بروزرسانی شد", {
        id: "update-cart-quantity-success",
      });
    },
    onError: (error) => showApiError(error),
    ...lineChangeOptions(queryClient, scope),
  });

  return {
    isUpdating,
    updateQuantity,
  };
}

export function useUpdateShippingMethod() {
  const queryClient = useQueryClient();
  const { isPending: isUpdatingShipping, mutate: updateShippingMethod } =
    useCartMutation({
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

export function useRemoveFromCart({ scope } = {}) {
  const queryClient = useQueryClient();
  const { isPending: isDeleting, mutateAsync: removeFromCart } = useCartMutation({
    mutationFn: removeFromCartApi,
    onSuccess: (data) => {
      toast.success(data?.message || "محصول از سبد خرید حذف شد", {
        id: "remove-cart-success",
      });
    },
    onError: (error) => showApiError(error),
    ...lineChangeOptions(queryClient, scope),
  });

  return {
    isDeleting,
    removeFromCart,
  };
}

export function useApplyCoupon() {
  const queryClient = useQueryClient();

  const { isPending: isApplyingCoupon, mutateAsync: applyCoupon } = useCartMutation(
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
