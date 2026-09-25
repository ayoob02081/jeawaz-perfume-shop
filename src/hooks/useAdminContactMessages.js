import {
  getAdminContactMessageByIdApi,
  getAdminContactMessagesApi,
  updateContactMessageStatusApi,
} from "@/services/adminContactMessagesServices";
import {
  adminContactMessageKeys,
  applyContactStatusChange,
  buildAdminContactListParams,
  getAdminContactErrorMessage,
  shouldRetryAdminContactQuery,
} from "@/utils/adminContactMessagesContract.mjs";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

/* ================= GET ================= */

export const useGetAdminContactMessages = (query) => {
  const params = buildAdminContactListParams(query);
  return useQuery({
    queryKey: adminContactMessageKeys.list(params),
    queryFn: () => getAdminContactMessagesApi(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: shouldRetryAdminContactQuery,
  });
};

// Read-only: opening a message never changes its status.
export const useGetAdminContactMessage = (id) =>
  useQuery({
    queryKey: adminContactMessageKeys.detail(id),
    queryFn: () => getAdminContactMessageByIdApi(id),
    enabled: !!id,
    retry: shouldRetryAdminContactQuery,
  });

/* ================= ADMIN ACTIONS ================= */

export function useUpdateContactMessageStatus() {
  const queryClient = useQueryClient();

  const { mutateAsync: updateContactMessageStatus, isPending } = useMutation({
    mutationFn: updateContactMessageStatusApi,

    onSuccess: (updated) => {
      applyContactStatusChange(queryClient, updated);
      toast.success("وضعیت پیام بروزرسانی شد", {
        id: "contact-message-status",
      });
    },

    onError: (err) => {
      toast.error(getAdminContactErrorMessage(err, "خطا در تغییر وضعیت پیام"), {
        id: "contact-message-status-error",
      });
    },
  });

  return { updateContactMessageStatus, isPending };
}
