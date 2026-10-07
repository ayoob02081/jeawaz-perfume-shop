"use client";

import Error from "@/components/Error";
import Loading from "@/components/Loading";
import { useGetOrderById } from "@/hooks/useOrders";
import {
  buildInvoiceView,
  waitForDocumentFonts,
} from "@/utils/orderInvoice.mjs";
import { toLocalDateString } from "@/utils/toLocalDate";
import {
  normalizeIranPhone,
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";
import { ArrowRightIcon, PrinterIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";

const EMPTY = "—";
const formatDate = (value) =>
  value && !Number.isNaN(new Date(value).getTime())
    ? toLocalDateString(value)
    : EMPTY;
const formatToman = (value) =>
  value === null ? EMPTY : toPersianNumbersWithComma(value) + " تومان";
const formatNumber = (value) =>
  value === null ? EMPTY : toPersianNumbersWithComma(value);

export default function page() {
  const { id } = useParams();
  const { data: order, isLoading } = useGetOrderById(id);
  const [isPreparing, setIsPreparing] = useState(false);
  const preparingRef = useRef(false);
  const invoice = buildInvoiceView(order);

  const handlePrint = async () => {
    if (!invoice?.printable || preparingRef.current) return;
    preparingRef.current = true;
    setIsPreparing(true);
    try {
      await waitForDocumentFonts();
      window.print();
    } finally {
      preparingRef.current = false;
      setIsPreparing(false);
    }
  };

  if (isLoading)
    return (
      <InvoiceShell>
        <Loading />
      </InvoiceShell>
    );

  // No order data (fetch failed, e.g. 404 for another user's order). A failed
  // background refetch keeps an already loaded invoice on screen.
  if (!invoice)
    return (
      <InvoiceShell>
        <Error />
        <BackLink href="/profile/orders" label="بازگشت" />
      </InvoiceShell>
    );

  if (!invoice.printable)
    return (
      <InvoiceShell>
        <p className="py-10 text-center font-bold text-stroke-800">
          چاپ فاکتور پس از تکمیل پرداخت سفارش امکان‌پذیر است.
        </p>
        <BackLink href={`/profile/orders/${id}`} label="بازگشت" />
      </InvoiceShell>
    );

  const { customer, shipping, payment } = invoice;

  return (
    <InvoiceShell>
      <div className="flex items-center justify-between gap-4 w-full max-w-[210mm] print:hidden">
        <BackLink href={`/profile/orders/${id}`} label="بازگشت" />
        <button
          type="button"
          onClick={handlePrint}
          disabled={isPreparing}
          className="btn btn--primary gap-2 px-5 py-2 disabled:opacity-60 print:hidden"
        >
          <PrinterIcon className="size-5" />
          چاپ فاکتور
        </button>
      </div>

      <article
        dir="rtl"
        className="invoice w-full max-w-[210mm] bg-white text-black font-display border border-neutral-300 rounded-xl p-5 sm:p-8 text-sm print:max-w-none print:border-0 print:rounded-none print:p-0"
      >
        <header className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-neutral-400">
          <div>
            <p className="text-2xl font-black">جیاواز</p>
            <p className="text-neutral-600">Jeawaz</p>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold">فاکتور سفارش</h1>
            <InvoiceField
              label="شماره سفارش"
              value={toPersianNumbers(invoice.orderNumber) || EMPTY}
            />
            <InvoiceField
              label="تاریخ سفارش"
              value={formatDate(invoice.orderDate)}
            />
          </div>
        </header>

        <section className="grid sm:grid-cols-2 print:grid-cols-2 gap-x-6 gap-y-2 py-4 border-b border-neutral-300">
          {customer?.name && (
            <InvoiceField label="خریدار" value={customer.name} />
          )}
          {customer?.phone && (
            <InvoiceField
              label="شماره خریدار"
              value={normalizeIranPhone(customer.phone)}
            />
          )}
          <InvoiceField
            label="تحویل گیرنده"
            value={shipping.receiver ?? EMPTY}
          />
          <InvoiceField
            label="شماره تماس گیرنده"
            value={normalizeIranPhone(shipping.phone) || EMPTY}
          />
          <div className="sm:col-span-2 print:col-span-2">
            <InvoiceField label="آدرس" value={shipping.address ?? EMPTY} />
          </div>
          <InvoiceField
            label="کد پستی"
            value={toPersianNumbers(shipping.postalCode) || EMPTY}
          />
          <InvoiceField
            label="روش ارسال"
            value={shipping.methodLabel ?? EMPTY}
          />
        </section>

        <section className="py-4 overflow-x-auto print:overflow-visible">
          <table className="w-full min-w-lg print:min-w-0 border-collapse text-start">
            <thead>
              <tr className="bg-neutral-100 text-black">
                <th className="border border-neutral-300 p-2 text-start">#</th>
                <th className="border border-neutral-300 p-2 text-start">
                  محصول
                </th>
                <th className="border border-neutral-300 p-2 text-start">
                  نوع
                </th>
                <th className="border border-neutral-300 p-2">تعداد</th>
                <th className="border border-neutral-300 p-2">
                  قیمت واحد (تومان)
                </th>
                <th className="border border-neutral-300 p-2">
                  مبلغ کل (تومان)
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.id ?? index} className="break-inside-avoid">
                  <td className="border border-neutral-300 p-2">
                    {toPersianNumbers(index + 1)}
                  </td>
                  <td className="border border-neutral-300 p-2">
                    <p className="font-bold">{item.title ?? EMPTY}</p>
                    {item.subtitle && (
                      <p
                        dir="ltr"
                        className="text-xs text-neutral-600 text-end"
                      >
                        {item.subtitle}
                      </p>
                    )}
                  </td>
                  <td className="border border-neutral-300 p-2">
                    {item.variantLabel ?? EMPTY}
                  </td>
                  <td className="border border-neutral-300 p-2 text-center">
                    {formatNumber(item.quantity)}
                  </td>
                  <td className="border border-neutral-300 p-2 text-center">
                    {formatNumber(item.unitPrice)}
                  </td>
                  <td className="border border-neutral-300 p-2 text-center">
                    {formatNumber(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="invoice-totals flex flex-wrap items-start justify-between gap-6 break-inside-avoid">
          <div className="flex flex-col gap-2">
            <InvoiceField
              label="وضعیت پرداخت"
              value={payment.statusLabel ?? EMPTY}
            />
            {payment.gatewayLabel && (
              <InvoiceField label="درگاه پرداخت" value={payment.gatewayLabel} />
            )}
            {payment.paidAt && (
              <InvoiceField
                label="تاریخ پرداخت"
                value={formatDate(payment.paidAt)}
              />
            )}
            {invoice.trackingCode && (
              <InvoiceField
                label="کد رهگیری مرسوله"
                value={toPersianNumbers(invoice.trackingCode)}
              />
            )}
          </div>
          <dl className="flex flex-col gap-2 min-w-64 max-sm:w-full">
            {invoice.totals.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between gap-4"
              >
                <dt className="text-neutral-700">{row.label}</dt>
                <dd>{formatToman(row.amount)}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 pt-2 border-t-2 border-black text-base font-black">
              <dt>مبلغ قابل پرداخت</dt>
              <dd>{formatToman(invoice.grandTotal)}</dd>
            </div>
          </dl>
        </section>
      </article>
    </InvoiceShell>
  );
}

function InvoiceShell({ children }) {
  return (
    <div className="flex flex-col items-center gap-4 w-full px-4 pb-10 print:block print:p-0">
      {children}
    </div>
  );
}

function InvoiceField({ label, value }) {
  return (
    <p className="flex flex-wrap items-start gap-1">
      <span className="text-neutral-600 text-nowrap">{label}:</span>
      <span className="font-bold">{value}</span>
    </p>
  );
}

// Links to a known order route instead of going back in browser history: the
// invoice is often opened in a new tab or bookmarked, where history back would
// do nothing or leave the site.
function BackLink({ href, label }) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="flex items-center gap-2 font-bold text-stroke-800 hover:text-primary duration-200 print:hidden"
    >
      <ArrowRightIcon className="size-5 text-primary" />
      {label}
    </Link>
  );
}
