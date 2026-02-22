import { updateBrandApi } from "@/services/categoriesServices";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function useEditBrand(brandId) {
  const queryClient = useQueryClient();

  const { isPending: isEditing, mutate: editBrand } = useMutation({
    mutationFn: (data) => updateBrandApi({ brandId, data }),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      queryClient.invalidateQueries({ queryKey: ["brands", brandId] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Something went wrong");
    },
  });

  return { isEditing, editBrand };
}
