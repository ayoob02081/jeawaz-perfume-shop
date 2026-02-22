import { addBrandApi } from "@/services/categoriesServices";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function useAddBrand() {
  const queryClient = useQueryClient();

  const { isPending: isAdding, mutate: AddBrand } = useMutation({
    mutationFn: addBrandApi,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({
        queryKey: ["brands"],
      });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message);
    },
  });

  return { isAdding, AddBrand };
}
