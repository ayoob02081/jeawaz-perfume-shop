import {
  createAddressApi,
  editAddressApi,
  getAddressByIdApi,
  getAddressesByUserIdApi,
  getAllAddressesApi,
  removeAddressApi,
} from "@/services/addressServices";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

// `enabled: false` keeps a guest (or a screen that does not need them yet)
// from requesting the account's addresses.
export const useGetAddresses = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: ["addresses"],
    queryFn: getAllAddressesApi,
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
  });

export const useGetAddressesByUserId = (userId) =>
  useQuery({
    queryKey: ["addresses", userId],
    queryFn: () => getAddressesByUserIdApi(userId),
    enabled: !!userId,
    retry: false,
  });

// `silentAuthErrors`: the caller (checkout) answers a 401 with its own
// re-login prompt, so no generic error toast is shown for it.
export function useCreateAddress({ silentAuthErrors = false } = {}) {
  const queryClient = useQueryClient();

  const { isPending: isCreating, mutateAsync: createAddress } = useMutation({
    mutationFn: createAddressApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("آدرس جدید با موفقیت ثبت شد", { id: "create-address" });
    },
    onError: (err) => {
      if (silentAuthErrors && err?.response?.status === 401) return;
      const msg = err?.response?.data?.message || "خطا در ثبت آدرس";
      toast.error(msg, { id: "create-address-error" });
    },
  });

  return { isCreating, createAddress };
}

export const useGetAddressById = (id) =>
  useQuery({
    queryKey: ["addresses", id],
    queryFn: () => getAddressByIdApi(id),
    enabled: !!id,
    retry: false,
  });

export function useEditAddress() {
  const queryClient = useQueryClient();

  const { isPending: isUpdating, mutateAsync: editAddress } = useMutation({
    mutationFn: editAddressApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("آدرس با موفقیت بروزرسانی شد", { id: "edit-address" });
    },
    onError: (err) => {
      console.log(err);

      const msg = err?.response?.data?.message || "خطا در بروزرسانی آدرس";
      toast.error(msg, { id: "edit-address-error" });
    },
  });

  return { isUpdating, editAddress };
}

export function useRemoveAddress() {
  const queryClient = useQueryClient();

  const { isPending: isDeleting, mutateAsync: removeAddress } = useMutation({
    mutationFn: removeAddressApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("آدرس با موفقیت حذف شد", { id: "remove-address" });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || "خطا در حذف آدرس";
      toast.error(msg, { id: "remove-address-error" });
    },
  });

  return { isDeleting, removeAddress };
}
