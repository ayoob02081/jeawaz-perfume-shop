import { updateProductApi } from "@/services/productServices";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function useEditProduct() {
  const queryClient = useQueryClient();

  const { isPending: isEditing, mutate: editProduct } = useMutation({
    mutationFn: updateProductApi,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
    },
    onError: (err) => toast.error(err?.response?.data?.message),
  });

  return { isEditing, editProduct };
}
