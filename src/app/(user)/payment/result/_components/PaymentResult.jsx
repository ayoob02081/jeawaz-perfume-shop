"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeftIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import Loading from "@/components/Loading";
import { useGetOrderById } from "@/hooks/useOrders";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import PayOrderButton from "@/app/(profile)/profile/orders/_components/PayOrderButton";
import {
  parsePaymentResultQuery,
  resolvePaymentResult,
} from "@/utils/paymentFlowContract.mjs";
import {
  canShowOrderDetails,
  getPaymentResultActions,
  getPaymentResultView,
} from "@/utils/paymentResultView.mjs";
import AppImage from "@/components/AppImage";
import PriceSection from "@/components/PriceSection";
import Table from "@/ui/Table";
import CartItemsLayout from "@/app/(user)/cart/_components/CartItemsLayout";
import { toLocalDateString } from "@/utils/toLocalDate";

const formatDate = (value) => (value ? toLocalDateString(value) : "—");

// Shows only backend-authoritative Order state. The `status` query value is a
// presentation hint and can never produce a success state on its own.
function PaymentResult() {
  const searchParams = useSearchParams();
  const { orderId, hint } = parsePaymentResultQuery(searchParams);
  const {
    data: order,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useGetOrderById(orderId);

  if (orderId && isLoading) return <Loading />;

  const { state, canRetry } = resolvePaymentResult({
    order: orderId ? order : null,
    error,
    hint,
  });
  const view = getPaymentResultView(state);
  const actions = getPaymentResultActions({ state, canRetry, order });
  const showDetails = canShowOrderDetails({ order, error });
  const { pricing, shipping, items, dates, orderNumber } = order || {};
  const date = formatDate(dates?.[view.dateField]);
  const [titleStart, titleAccent, titleEnd] = view.title;

  return (
    <div className="flex flex-col md:flex-ro items-center justify-center gap-4 w-full">
      <div className="flex flex-col items-center justify-center gap-6 size-full">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between size-full">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-start gap-2 size-full">
            {view.icon ? (
              <AppImage
                src={view.icon}
                alt={`${state}-payment-icon`}
                width="max-md:size-12 md:size-16"
                sizes="30vw"
              />
            ) : (
              <ExclamationCircleIcon className="flex-none max-md:size-12 md:size-16 text-stroke-600" />
            )}
            <div className="flex flex-col items-center md:items-start justify-between gap-4 md:gap-2 text-stroke-800">
              <p className="md:text-lg font-bold">
                {titleStart}{" "}
                <strong className={view.accent}>{titleAccent}</strong>{" "}
                {titleEnd}
              </p>
              <p className="text-stroke-600 max-md:text-center">{view.body}</p>
            </div>
          </div>
          {showDetails && (
            <div className="md:flex flex-col items-start justify-between gap-2 max-md:hidden">
              <p className="text-stroke-600 text-nowrap">{view.amountLabel}</p>
              <PriceSection
                offValue={0}
                basePrice={pricing?.grandTotal}
                unitPrice={pricing?.grandTotal}
                priceClassName="text-3xl"
                textClassName="text-sm text-stroke-800 font-normal"
              />
            </div>
          )}
        </div>
        {showDetails && (
          <div className="flex items-center justify-start overflow-auto gap-4 flex-wrap bg-stroke-100 rounded-2xl py-4 px-6 w-full scrollbar--primary scrollbar-h-1 duration-200">
            <Table className="text-right max-lg:hidden">
              <Table.Header className="*:text-stroke-400 *:font-normal w-full h-fit">
                <th className="pl-2 truncate">کد سفارش شما</th>
                <th className="px-2 truncate">{view.dateLabel}</th>
                <th className="px-2 truncate">تعداد محصولات</th>
                <th className="pr-2 truncate">آدرس</th>
              </Table.Header>
              <Table.body>
                <Table.Row className="*:pt-2 *:text-stroke-800 w-full h-fit">
                  <td className="pl-2 whitespace-nowrap text-ellipsis w-full">
                    #{toPersianNumbers(orderNumber)}
                  </td>
                  <td className="px-2 whitespace-nowrap text-ellipsis w-full">
                    {date}
                  </td>
                  <td className="px-2 whitespace-nowrap text-ellipsis w-full">
                    {toPersianNumbers(items?.length ?? 0)} محصول
                  </td>
                  <td className="pr-2 whitespace-nowrap overflow-x-auto w-full py-0.5">
                    {shipping?.address}
                  </td>
                </Table.Row>
              </Table.body>
            </Table>
            <Table className="lg:hidden *:*:*:odd:text-right *:*:*:even:text-left *:*:*:pt-6">
              <Table.body>
                <tr className="*:pt-0">
                  <th className="text-stroke-400 font-normal">کد سفارش شما</th>
                  <td className="text-stroke-800">
                    #{toPersianNumbers(orderNumber)}
                  </td>
                </tr>
              </Table.body>
              <Table.body>
                <tr>
                  <th className="text-stroke-400 font-normal">
                    {view.dateLabel}
                  </th>
                  <td className="text-stroke-800">{date}</td>
                </tr>
              </Table.body>
              <Table.body>
                <tr>
                  <th className="text-stroke-400 font-normal">تعداد محصولات</th>
                  <td className="text-stroke-800">
                    {toPersianNumbers(items?.length ?? 0)} محصول
                  </td>
                </tr>
              </Table.body>
              <Table.body>
                <tr>
                  <th className="text-stroke-400 font-normal">آدرس</th>
                  <td className="text-stroke-800">{shipping?.address}</td>
                </tr>
              </Table.body>
            </Table>
          </div>
        )}
        {showDetails && view.showItems && (
          <div className="grid grid-cols-1 lg:grid-cols-2 w-full gap-4">
            {items?.map((item) => (
              <CartItemsLayout.Success key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
      <div className="flex max-md:flex-col items-center justify-between gap-4 size-full max-md:px-6 ">
        {actions.retry && (
          <PayOrderButton order={order} className="size-full md:max-w-60" />
        )}
        {actions.checkAgain && (
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn btn--primary--2 border size-full py-2 md:max-w-60 disabled:opacity-50"
          >
            {isFetching ? "در حال بررسی..." : "بررسی مجدد"}
          </button>
        )}
        {actions.orderLink && (
          <Link
            href={actions.orderLink.href}
            prefetch={false}
            className="btn btn--secondary--2 size-full py-2 duration-200 md:max-w-60"
          >
            {actions.orderLink.label}
          </Link>
        )}
        {/* A link, not history back: the previous page is the payment gateway. */}
        <Link
          href="/"
          className="btn btn--secondary--2 flex items-center justify-center gap-2 size-full py-2 duration-200 md:max-w-60"
        >
          <p className="truncate text-stroke-800">بازگشت به سایت</p>
          <ArrowLeftIcon className="size-4 text-stroke-800" />
        </Link>
      </div>
    </div>
  );
}

export default PaymentResult;
