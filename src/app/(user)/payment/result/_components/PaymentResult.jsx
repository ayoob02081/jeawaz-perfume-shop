"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Loading from "@/components/Loading";
import { useGetOrderById } from "@/hooks/useOrders";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import PayOrderButton from "@/app/(profile)/profile/orders/_components/PayOrderButton";
import {
  parsePaymentResultQuery,
  resolvePaymentResult,
} from "@/utils/paymentFlowContract.mjs";

const COPY = {
  success: {
    title: "پرداخت با موفقیت انجام شد",
    body: "سفارش شما ثبت و پرداخت شد و به‌زودی پردازش می‌شود.",
    tone: "text-green-600",
  },
  failed: {
    title: "پرداخت انجام نشد",
    body: "پرداخت تأیید نشد. اگر مبلغی از حساب شما کسر شده باشد، طبق قوانین درگاه به حساب شما بازگردانده می‌شود.",
    tone: "text-red-600",
  },
  pending: {
    title: "پرداخت در حال بررسی است",
    body: "تأیید پرداخت هنوز کامل نشده است. این بررسی به‌صورت خودکار ادامه پیدا می‌کند؛ چند لحظه بعد وضعیت را دوباره بررسی کنید.",
    tone: "text-amber-600",
  },
  unknown: {
    title: "وضعیت پرداخت مشخص نیست",
    body: "نتیجه پرداخت قابل نمایش نیست. وضعیت سفارش را از بخش سفارش‌های من بررسی کنید.",
    tone: "text-stroke-600",
  },
};

// Shows only backend-authoritative Order state. The `status` query value is a
// presentation hint and can never produce a success state on its own.
function PaymentResult() {
  const searchParams = useSearchParams();
  const { orderId, hint } = parsePaymentResultQuery(searchParams);
  const { data: order, error, isLoading, isFetching, refetch } = useGetOrderById(orderId);

  if (orderId && isLoading) return <Loading />;

  const { state, canRetry } = resolvePaymentResult({
    order: orderId ? order : null,
    error,
    hint,
  });
  const copy = COPY[state];

  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full px-4">
      <div className="flex flex-col items-center gap-5 max-w-lg text-center text-stroke-800">
        <p className={`font-bold max-md:text-xl md:text-2xl ${copy.tone}`}>{copy.title}</p>
        <p className="leading-8 text-stroke-600">{copy.body}</p>

        {order?.orderNumber && state !== "unknown" && (
          <p className="text-stroke-600">
            شماره سفارش: <span className="font-bold">{toPersianNumbers(order.orderNumber)}</span>
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          {state === "pending" && (
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="btn btn--primary px-4 py-2 disabled:opacity-50"
            >
              {isFetching ? "در حال بررسی..." : "بررسی مجدد"}
            </button>
          )}

          {state === "failed" && canRetry && <PayOrderButton order={order} />}

          {order?.id && state !== "unknown" ? (
            <Link href={`/profile/orders/${order.id}`} className="btn btn--primary px-4 py-2">
              مشاهده سفارش
            </Link>
          ) : (
            <Link href="/profile/orders" className="btn btn--primary px-4 py-2">
              سفارش‌های من
            </Link>
          )}

          <Link href="/products" className="btn px-4 py-2 border border-stroke-300">
            صفحه محصولات
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PaymentResult;
