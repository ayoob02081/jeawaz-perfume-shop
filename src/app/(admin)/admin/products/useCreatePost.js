import { addProductApi } from "@/services/productServices";
import { showApiError } from "@/utils/showApiError";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function useAddProduct() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { isPending: isAdding, mutate: addProduct } = useMutation({
    mutationFn: addProductApi,
    onSuccess: (data) => {
      toast.success(data.message || "محصول با موفقیت اضافه شد", {
        id: "add-product-success",
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push("/admin/products");
    },
    onError: (err) => showApiError(err),
  });

  return { isAdding, addProduct };
}
