"use client";

import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { productPageHref, productPaginationState } from "@/utils/productPagination.mjs";

export default function ProductPagination({ page, totalPages, search, isLoading }) {
  const { items, previous, next } = productPaginationState(page, totalPages);
  if (!items.length) return null;
  const link = (target, children, label, className, rel) => (
    <Link
      key={target}
      href={productPageHref(search, target)}
      replace
      scroll={false}
      rel={rel}
      aria-label={label}
      aria-disabled={isLoading || undefined}
      tabIndex={isLoading ? -1 : undefined}
      className={className}
      onClick={(event) => { if (isLoading) event.preventDefault(); }}
      onNavigate={(event) => {
        if (isLoading) { event.preventDefault(); return; }
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      {children}
    </Link>
  );
  const previousIcon = <ArrowLeftIcon className="size-5 text-stroke-800" />;
  const nextIcon = <ArrowRightIcon className="size-5 text-stroke-800" />;
  return (
    <nav aria-label="صفحه‌بندی محصولات" className="flex items-center justify-center gap-2 flex-row-reverse">
      {previous ? link(previous, previousIcon, "صفحه قبل", isLoading ? "opacity-30" : undefined, "prev") : (
        <span aria-disabled="true" aria-label="صفحه قبل" className="opacity-30">{previousIcon}</span>
      )}
      {items.map((item) => typeof item === "string" ? (
        <span key={item} className="px-2" aria-hidden="true">...</span>
      ) : item === page ? (
        <span key={item} aria-current="page" aria-label={`صفحه ${toPersianNumbers(item)}`}
          className="pages--btn bg-primary text-white">{toPersianNumbers(item)}</span>
      ) : link(item, toPersianNumbers(item), `صفحه ${toPersianNumbers(item)}`,
        "pages--btn hover:text-primary text-stroke-800"))}
      {next ? link(next, nextIcon, "صفحه بعد", isLoading ? "opacity-30" : undefined, "next") : (
        <span aria-disabled="true" aria-label="صفحه بعد" className="opacity-30">{nextIcon}</span>
      )}
    </nav>
  );
}
