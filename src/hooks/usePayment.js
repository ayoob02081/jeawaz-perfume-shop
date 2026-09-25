"use client";

import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createPaymentApi } from "@/services/paymentServices";
import { startOrderPayment } from "@/utils/paymentFlowContract.mjs";

export const paymentErrorMessage = (error) =>
  error?.response?.data?.message || "اتصال به درگاه پرداخت برقرار نشد";

const redirectToGateway = (url) => window.location.assign(url);

// Pay / retry an existing PENDING Order: backend-issued URL only.
export function useStartOrderPayment() {
  const { mutateAsync, isPending: isStarting } = useMutation({
    mutationFn: (orderId) =>
      startOrderPayment({
        orderId,
        createPayment: createPaymentApi,
        redirect: redirectToGateway,
      }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(paymentErrorMessage(result.error), { id: "start-payment" });
      }
    },
  });

  return { startPayment: mutateAsync, isStarting };
}

export { createPaymentApi, redirectToGateway };
