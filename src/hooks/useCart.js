import { useAuth } from "@/contexts/filters/auth/AuthContext";
import {
  addToCartApi,
  getAllCartItemsApi,
  removeFromCartApi,
  updateQuantityApi,
  updateShippingMethodApi,
} from "@/services/cartServices";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const showApiError = (err) => {
  const message = err?.response?.data?.message || "خطا در ارتباط با سرور";
  toast.error(message, { id: "api-error" });
};

export function useAddToCart() {
  const queryClient = useQueryClient();

  const {
    error,
    isPending: isAdding,
    mutate: addToCart,
  } = useMutation({
    mutationFn: addToCartApi,
    onSuccess: () => {
      toast.success("محصول به سبدتون اضافه شد", { id: "cart-success" });
      queryClient.invalidateQueries({
        queryKey: ["cart-items"],
        exact: true,
      });
    },
    onError: showApiError,
  });

  return { error, isAdding, addToCart };
}
export const useGetAllCartItems = () => {
  const { loading } = useAuth();

  return useQuery({
    queryKey: ["cart-items"],
    queryFn: getAllCartItemsApi,
    enabled: !loading,
    retry: 1,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export function useUpdateQuantity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateQuantityApi,
    onSuccess: () => {
      toast.success("سبدتون به روز شد");
      queryClient.invalidateQueries({ queryKey: ["cart-items"], exact: true });
    },
    onError: showApiError,
  });
}

export function useUpdateShippingMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateShippingMethodApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-items"], exact: true });
    },
    onError: showApiError,
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  const { isPending: isDeleting, mutateAsync: removeFromCart } = useMutation({
    mutationFn: removeFromCartApi,
    onSuccess: () => {
      toast.success("محصول از سبدتون حذف شد");
      queryClient.invalidateQueries({ queryKey: ["cart-items"], exact: true });
    },
    onError: showApiError,
  });
  return { isDeleting, removeFromCart };
}
