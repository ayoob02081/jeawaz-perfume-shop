import { addCategoryApi } from "@/services/categoriesServices";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function useAddCategory() {
  const queryClient = useQueryClient();

  const { isPending: isAdding, mutate: AddCategory } = useMutation({
    mutationFn: addCategoryApi,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({
        queryKey: ["categories"],
      });
    },
    onError: (err) => toast.error(err?.response?.data?.message),
  });

  return { isAdding, AddCategory };
}
