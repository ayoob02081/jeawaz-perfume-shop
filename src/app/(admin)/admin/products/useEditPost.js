import { updateProductApi } from "@/services/productServices";
import { showApiError } from "@/utils/showApiError";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function useEditProduct(productId) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { isPending: isEditing, mutate: editProduct } = useMutation({
    mutationFn: (data) => updateProductApi({ productId, data }),
    onSuccess: (data) => {
      toast.success(data.message || "محصول با موفقیت ویرایش شد", {
        id: "edit-product-success",
      });

      queryClient.setQueryData(["get-product", productId], (oldData) => {
        return { ...oldData, ...data.product };
      });

      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["get-product", productId] });

      router.refresh();
      router.back();
    },
    onError: (err) => showApiError(err),
  });

  return { isEditing, editProduct };
}
