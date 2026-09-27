import { createContactMessageApi } from "@/services/contactServices";
import {
  getContactErrorMessage,
  getContactSuccessMessage,
} from "@/utils/contactFormContract.mjs";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

export function useCreateContactMessage() {
  const { isPending: isSending, mutateAsync: createContactMessage } =
    useMutation({
      mutationFn: createContactMessageApi,
      onSuccess: (data) => {
        toast.success(getContactSuccessMessage(data), {
          id: "create-contact-message",
        });
      },
      onError: (err) => {
        toast.error(getContactErrorMessage(err), {
          id: "create-contact-message-error",
        });
      },
    });

  return { isSending, createContactMessage };
}
