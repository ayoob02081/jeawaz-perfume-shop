import { PAYMENT_ATTENTION_NOTICE } from "@/utils/adminPaymentAttention.mjs";
import {
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

// `attention` is getAdminPaymentAttention(order.payments); both render nothing
// without it. Admin pages only.

export function PaymentAttentionBadges({ attention }) {
  if (!attention) return null;

  return attention.states.map(({ state, label }) => (
    <p
      key={state}
      title={PAYMENT_ATTENTION_NOTICE}
      data-payment-attention={state}
      className="badge border border-warning bg-warning/20 text-stroke-800 font-bold gap-1 text-nowrap"
    >
      <ExclamationTriangleIcon className="size-4 shrink-0 stroke-2" aria-hidden="true" />
      {label}
    </p>
  ));
}

export function PaymentAttentionPanel({ attention }) {
  if (!attention) return null;

  return (
    <section
      aria-labelledby="payment-attention-title"
      data-payment-attention-panel=""
      className="flex flex-col gap-3 w-full mb-4 p-4 max-sm:p-3 rounded-xl border border-warning bg-warning/15 text-stroke-800"
    >
      <div className="flex items-start gap-2">
        <ExclamationTriangleIcon
          className="size-6 shrink-0 stroke-2 text-stroke-800"
          aria-hidden="true"
        />
        <div className="flex flex-col gap-1">
          <h2 id="payment-attention-title" className="font-bold">
            {attention.states.map(({ label }) => label).join(" / ")}
          </h2>
          <p className="text-sm">{PAYMENT_ATTENTION_NOTICE}</p>
          {attention.states.map(({ state, description }) => (
            <p key={state} className="text-sm">
              {description}
            </p>
          ))}
        </div>
      </div>
      <ul className="flex flex-col gap-2 w-full">
        {attention.attempts.map((attempt) => (
          <li
            key={attempt.id}
            className="flex flex-wrap items-start gap-x-4 gap-y-1 p-3 rounded-lg bg-stroke-0 text-sm"
          >
            <AttemptDetail label="تلاش پرداخت :" value={toPersianNumbers(attempt.id)} />
            <AttemptDetail
              label="وضعیت بررسی :"
              value={
                attention.states.find(
                  ({ state }) => state === attempt.reconciliationState,
                )?.label
              }
            />
            {attempt.gateway && (
              <AttemptDetail label="درگاه :" value={attempt.gateway} />
            )}
            {attempt.amount != null && (
              <AttemptDetail
                label="مبلغ :"
                value={toPersianNumbersWithComma(attempt.amount) + " تومان"}
              />
            )}
            {attempt.authority && (
              <AttemptDetail label="کد Authority :" value={attempt.authority} code />
            )}
            {attempt.refId && (
              <AttemptDetail label="شماره مرجع :" value={attempt.refId} code />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function AttemptDetail({ label, value, code = false }) {
  return (
    <span className="flex flex-wrap items-start gap-1 min-w-0">
      <span className="text-stroke-600 text-nowrap">{label}</span>
      <span className={code ? "font-bold break-all" : "font-bold"} dir={code ? "ltr" : undefined}>
        {value}
      </span>
    </span>
  );
}
