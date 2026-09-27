"use client";

import { useCallback } from "react";
import Loading from "@/components/Loading";
import { getContactStatusCount } from "@/utils/adminContactMessagesContract.mjs";
import { toPersianNumbersWithComma } from "@/utils/toPersianNumbers";
import {
  ArchiveBoxIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon,
  InboxStackIcon,
} from "@heroicons/react/24/outline";

const STATUS_ICONS = {
  ALL: InboxStackIcon,
  NEW: EnvelopeIcon,
  READ: EnvelopeOpenIcon,
  ARCHIVED: ArchiveBoxIcon,
};

// Same card as the admin Orders status filter (OrderStatusButton), counting
// messages from the backend statusCounts instead of orders.
function ContactStatusButton({
  messages,
  isLoading,
  setStatus,
  currentStatus,
  statusBtnData,
}) {
  const count = getContactStatusCount(messages, statusBtnData?.countKey);
  const Icon = STATUS_ICONS[statusBtnData?.countKey];

  const handleClick = useCallback(() => {
    if (isLoading) return;
    setStatus?.(statusBtnData?.value);
  }, [isLoading, setStatus, statusBtnData?.value]);

  const isActive = statusBtnData?.value === currentStatus;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      aria-pressed={isActive}
      className={`flex max-sm:flex-col items-center justify-start max-sm:gap-2 gap-4
        max-md:p-2 md:p-4 rounded-2xl max-sm:min-w-28 max-md:max-w-56 md:max-w-52 w-full h-full
        lg:max-h-28 transition-all duration-200 bg-stroke-0 shadow-sm
        ${isActive ? "border-[1.5px] border-primary" : "border border-stroke-250"}
        ${isLoading ? "opacity-70 cursor-not-allowed" : "hover:shadow-md"}
        snap-center`}
    >
      <div
        className={`flex items-center justify-center rounded-xl ${statusBtnData?.color} size-14`}
      >
        {Icon && <Icon className={`size-7 ${statusBtnData?.textColor}`} />}
      </div>

      <span className="flex flex-col max-sm:items-center items-start max-md:gap-1 md:gap-2">
        <p className="text-sm text-stroke-600 text-nowrap font-bold">
          {statusBtnData?.title}
        </p>

        {isLoading ? (
          <Loading size={7} className="h-fit" />
        ) : (
          <span className="flex items-center gap-2 text-stroke-800">
            <p className="text-2xl max-sm:text-xl text-stroke-800">
              {count >= 9999
                ? toPersianNumbersWithComma(9999) + "+"
                : toPersianNumbersWithComma(count)}
            </p>
            <p className="max-sm:text-sm">پیام</p>
          </span>
        )}
      </span>
    </button>
  );
}

export default ContactStatusButton;
