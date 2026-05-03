import {
  addToCartApi,
  getAllCartItemsApi,
  removeFromCartApi,
  updateQuantityApi,
} from "@/services/cartServices";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export function useAddToCart() {
  const queryClient = useQueryClient();

  const {
    error,
    isPending: isAdding,
    mutate: addToCart,
  } = useMutation({
    mutationFn: addToCartApi,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({
        queryKey: ["cart-items"],
      });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message);
    },
  });

  return { error, isAdding, addToCart };
}

export const useGetAllCartItems = () =>
  useQuery({
    queryKey: ["cart-items"],
    queryFn: getAllCartItemsApi,
    retry: false,
    refetchOnWindowFocus: true,
  });

export function useUpdateQuantity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateQuantityApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-items"] });
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  const { isPending: isDeleting, mutateAsync: removeFromCart } = useMutation({
    mutationFn: removeFromCartApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-items"] });
    },
  });
  return { isDeleting, removeFromCart };
}
