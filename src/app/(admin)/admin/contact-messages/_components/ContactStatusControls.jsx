"use client";

import { useUpdateContactMessageStatus } from "@/hooks/useAdminContactMessages";
import {
  CONTACT_MESSAGE_STATUSES,
  createContactStatusChanger,
  getContactStatusBadge,
} from "@/utils/adminContactMessagesContract.mjs";
import { useMemo } from "react";

// Explicit status controls: any direction is allowed; the current status is
// shown as selected and never re-sent.
function ContactStatusControls({ message }) {
  const { updateContactMessageStatus, isPending } =
    useUpdateContactMessageStatus();

  // Errors are toasted by the mutation; the changer contains the rejection.
  const changeStatus = useMemo(
    () => createContactStatusChanger({ send: updateContactMessageStatus }),
    [updateContactMessageStatus],
  );

  return (
    <div className="flex flex-col gap-3 w-full">
      <p className="text-base text-stroke-800 md:text-stroke-600">
        تغییر وضعیت :
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {CONTACT_MESSAGE_STATUSES.map((status) => {
          const isCurrent = message?.status === status;
          return (
            <button
              key={status}
              type="button"
              aria-pressed={isCurrent}
              disabled={isCurrent || isPending}
              onClick={() => changeStatus(message, status)}
              className={`btn border px-4 py-2 rounded-xl font-bold disabled:cursor-not-allowed ${
                isCurrent
                  ? "border-primary text-primary"
                  : "border-stroke-250 hover:border-primary disabled:opacity-50"
              }`}
            >
              {getContactStatusBadge(status).label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ContactStatusControls;
