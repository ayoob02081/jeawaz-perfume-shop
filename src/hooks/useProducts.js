import {
  addProductApi,
  getAllProductsApi,
  getProductByIdApi,
  getProductPriceApi,
  removeProductApi,
  updateProductApi,
} from "@/services/productServices";
import { showApiError } from "@/utils/showApiError";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export const useGetAllProducts = () =>
  useQuery({
    queryKey: ["products"],
    queryFn: getAllProductsApi,
    retry: false,
    refetchOnWindowFocus: false,
  });

export const useGetProductsbyId = (id) =>
  useQuery({
    queryKey: ["get-product", id],
    queryFn: () => getProductByIdApi(id),
    enabled: !!id,
    retry: false,
    refetchOnWindowFocus: false,
  });

export function useAddProduct() {
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

export function useGetProductPrice() {
  const { isPending: isGettingPrice, mutateAsync: getProductPrice } =
    useMutation({
      mutationFn: getProductPriceApi,
      onError: (err) => {
        const msg = err?.response?.data?.message || "خطا در دریافت قیمت محصول";
        toast.error(msg, { id: "get-price-error" });
      },
    });

  return { isGettingPrice, getProductPrice };
}

export function useEditProduct(productId) {
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

export function useRemoveProduct() {
  const queryClient = useQueryClient();

  const { isPending: isDeleting, mutateAsync: removeProduct } = useMutation({
    mutationFn: removeProductApi,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"], exact: true });
      queryClient.invalidateQueries({
        queryKey: ["product", variables?.id],
        exact: true,
      });
      toast.success("محصول با موفقیت حذف شد", { id: "remove-product" });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || "خطا در حذف محصول";
      toast.error(msg, { id: "remove-product-error" });
    },
  });

  return { isDeleting, removeProduct };
}
