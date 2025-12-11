import { addProductApi } from "@/services/productServices";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function useAddProduct() {
  const queryClient = useQueryClient();

  const { isPending: isAdding, mutate: AddProduct } = useMutation({
    mutationFn: addProductApi,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
    },
    onError: (err) => toast.error(err?.response?.data?.message),
  });

  return { isAdding, AddProduct };
}
