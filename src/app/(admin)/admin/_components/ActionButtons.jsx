"use client";

import { CheckIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
function ActionButtons({
  confurmLabel,
  isPending,
  children,
  handleDelete,
  isDeleting,
  itemToEdit,
}) {
  const router = useRouter();
  return (
    <div className="max-md:fixed bottom-20 left-0 z-70 flex items-start justify-between flex-col max-md:gap-2 md:gap-6 w-full max-md:p-4">
      <div className="flex items-center justify-start gap-2 max-md:w-full">
        <button
          type="submit"
          disabled={isPending}
          aria-label={confurmLabel || "ذخیره"}
          className="btn btn--success max-md:py-2.5 py-3 max-md:px-2.5 px-7 rounded-x disabled:bg-success/50 md:w-44 flex-2 backdrop-blur-md text-nowrap font-bold"
        >
          <p className="sm:flex max-sm:hidden">{confurmLabel}</p>
          <CheckIcon className="max-sm:flex stroke-4 size-4 sm:hidden" />
        </button>
        {children}
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="بازگشت"
          className="btn btn--primary--2 border-2 border-primary max-md:py-2.5 py-3 max-md:px-2.5 px-7 disabled:bg-stroke-0/50 md:w-44 flex-1 backdrop-blur-md text-nowrap font-bold"
        >
          <p className="sm:flex max-sm:hidden">بازگشت</p>
          <ArrowLeftIcon className="max-sm:flex stroke-3 size-4 sm:hidden" />
        </button>
      </div>
      {/* {children} */}
      {/* {itemToEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn btn--primary border-0 py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
            >
              حذف
            </button>
          )} */}
    </div>
  );
}

export default ActionButtons;
