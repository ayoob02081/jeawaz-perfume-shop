"use client";

import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import {
  productPageHref,
  productPaginationState,
} from "@/utils/productPagination.mjs";

export default function ProductPagination({
  page,
  totalPages,
  search,
  isLoading,
}) {
  const {
    items: desktopItems,
    previous,
    next,
  } = productPaginationState(page, totalPages);
  if (!desktopItems.length) return null;
  const compactItems = productPaginationState(page, totalPages, true).items;
  // One SSR tree: narrow phones keep one neighbor per side; wider screens
  // keep the original window. Only this bounded center section can wrap.
  const items = [...desktopItems];
  if (compactItems.includes("dots-start") && !items.includes("dots-start"))
    items.splice(1, 0, "dots-start");
  if (compactItems.includes("dots-end") && !items.includes("dots-end"))
    items.splice(items.length - 1, 0, "dots-end");
  const visibility = (item) =>
    compactItems.includes(item)
      ? desktopItems.includes(item)
        ? ""
        : " min-[375px]:hidden"
      : " hidden min-[375px]:flex";
  const arrowClassName = "flex size-10 shrink-0 items-center justify-center sm:size-5";
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
      onClick={(event) => {
        if (isLoading) event.preventDefault();
      }}
      onNavigate={(event) => {
        if (isLoading) {
          event.preventDefault();
          return;
        }
        if (typeof window !== "undefined")
          window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      {children}
    </Link>
  );
  const previousIcon = <ArrowLeftIcon className="size-5 text-stroke-800" />;
  const nextIcon = <ArrowRightIcon className="size-5 text-stroke-800" />;
  return (
    <nav
      aria-label="صفحه‌بندی محصولات"
      className="flex w-full max-w-full items-center justify-between gap-2 flex-row-reverse sm:w-auto sm:justify-center"
    >
      {previous ? (
        link(
          previous,
          previousIcon,
          "صفحه قبل",
          `${arrowClassName}${isLoading ? " opacity-30" : ""}`,
          "prev",
        )
      ) : (
        <span
          role="link"
          aria-disabled="true"
          aria-label="صفحه قبل"
          className={`${arrowClassName} opacity-30`}
        >
          {previousIcon}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2 flex-row-reverse sm:flex-none sm:flex-nowrap">
        {items.map((item) =>
          typeof item === "string" ? (
            <span
              key={item}
              className={`px-2 shrink-0 ${visibility(item)}`}
              aria-hidden="true"
            >
              ...
            </span>
          ) : item === page ? (
            <span
              key={item}
              aria-current="page"
              aria-label={`صفحه ${toPersianNumbers(item)}`}
              className={`pages--btn shrink-0 bg-primary text-white ${visibility(item)}`}
            >
              <span className="max-w-full truncate px-1 text-inherit">
                {toPersianNumbers(item)}
              </span>
            </span>
          ) : (
            link(
              item,
              <span className="max-w-full truncate px-1 text-inherit">
                {toPersianNumbers(item)}
              </span>,
              `صفحه ${toPersianNumbers(item)}`,
              `pages--btn shrink-0 hover:text-primary text-stroke-800 ${visibility(item)}`,
            )
          ),
        )}
      </div>
      {next ? (
        link(
          next,
          nextIcon,
          "صفحه بعد",
          `${arrowClassName}${isLoading ? " opacity-30" : ""}`,
          "next",
        )
      ) : (
        <span
          role="link"
          aria-disabled="true"
          aria-label="صفحه بعد"
          className={`${arrowClassName} opacity-30`}
        >
          {nextIcon}
        </span>
      )}
    </nav>
  );
}
