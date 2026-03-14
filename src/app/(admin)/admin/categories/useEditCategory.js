import { updateCategoryApi } from "@/services/categoriesServices";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function useEditCategory(categoryId) {
  const queryClient = useQueryClient();

  const { isPending: isEditing, mutate: editCategory } = useMutation({
    mutationFn: (data) => updateCategoryApi({ categoryId, data }),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({
        queryKey: ["categories", categoryId],
      });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Something went wrong");
      console.log(err);
    },
  });

  return { isEditing, editCategory };
}
