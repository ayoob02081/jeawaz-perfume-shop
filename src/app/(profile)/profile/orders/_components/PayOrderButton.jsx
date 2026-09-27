"use client";

import { useStartOrderPayment } from "@/hooks/usePayment";
import { canPayOrder } from "@/utils/paymentFlowContract.mjs";

// Pay / retry for a PENDING Order. Eligibility here is UX only; the backend
// reuses an active attempt or rejects Orders that can no longer be paid.
function PayOrderButton({ order, className = "" }) {
  const { startPayment, isStarting } = useStartOrderPayment();

  if (!canPayOrder(order)) return null;

  return (
    <button
      type="button"
      disabled={isStarting}
      onClick={() => startPayment(order.id)}
      className={`btn btn--primary px-4 py-2 disabled:opacity-50 ${className}`}
    >
      {isStarting ? "در حال انتقال به درگاه..." : "پرداخت سفارش"}
    </button>
  );
}

export default PayOrderButton;
