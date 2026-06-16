"use client";

import { useMemo, useCallback } from "react";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

function PagesNumber({ page, setPage, totalPages, isLoading }) {
  if (!totalPages || totalPages <= 1) return null;

  const safeSetPage = useCallback(
    (newPage) => {
      if (newPage < 1 || newPage > totalPages) return;
      if (newPage === page || isLoading) return;

      setPage(newPage);

      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [page, totalPages, setPage, isLoading],
  );

  const pages = useMemo(() => {
    const delta = 2;
    const range = [];

    const start = Math.max(1, page - delta);
    const end = Math.min(totalPages, page + delta);

    if (start > 1) {
      range.push(1);
      if (start > 2) range.push("dots-start");
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) range.push("dots-end");
      range.push(totalPages);
    }

    return range;
  }, [page, totalPages]);

  return (
    <section className="flex items-center justify-center gap-2 flex-row-reverse">
      <button
        type="button"
        disabled={page === 1 || isLoading}
        onClick={() => safeSetPage(page - 1)}
        className="disabled:opacity-30"
      >
        <ArrowLeftIcon className="size-5 text-stroke-800" />
      </button>

      {pages.map((item, index) =>
        typeof item === "string" ? (
          <span key={item + index} className="px-2">
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            disabled={isLoading}
            onClick={() => safeSetPage(item)}
            className={`pages--btn ${
              page === item
                ? "bg-primary text-white"
                : "hover:text-primary text-stroke-800"
            }`}
          >
            {toPersianNumbers(item)}
          </button>
        ),
      )}

      <button
        type="button"
        disabled={page === totalPages || isLoading}
        onClick={() => safeSetPage(page + 1)}
        className="disabled:opacity-30"
      >
        <ArrowRightIcon className="size-5 text-stroke-800" />
      </button>
    </section>
  );
}

export default PagesNumber;
