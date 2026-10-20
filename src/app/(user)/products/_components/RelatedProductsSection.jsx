"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import CategoryLandingLink from "@/components/CategoryLandingLink";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import ProductCard from "../../_components/ProductCard";

// The homepage product rows' native swipe/snap row and ProductCard. Desktop
// scroll buttons appear only while the row actually overflows.
export default function RelatedProductsSection({ products, more }) {
  const headingId = useId();
  const rowRef = useRef(null);
  const [scroll, setScroll] = useState({ prev: false, next: false });

  const update = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    // RTL: scrollLeft is 0 at the start and negative toward the end.
    const offset = Math.abs(row.scrollLeft);
    const max = row.scrollWidth - row.clientWidth;
    setScroll({ prev: offset > 1, next: max - offset > 1 });
  }, []);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    update();
    row.addEventListener("scroll", update, { passive: true });
    const observer =
      typeof ResizeObserver === "function" ? new ResizeObserver(update) : null;
    observer?.observe(row);
    return () => {
      row.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, [update]);

  const controls = scroll.prev || scroll.next;

  // In RTL the next cards are to the left (negative scroll).
  const page = (direction) => {
    const row = rowRef.current;
    row?.scrollBy({ left: -direction * row.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section
      aria-labelledby={headingId}
      className="md:container md:mx-auto xl:max-w-7xl flex flex-col gap-6 pt-6 pb-2 md:px-6"
    >
      <div className="flex items-center justify-between gap-4 w-full">
        <h2
          id={headingId}
          className="text-lg sm:text-xl md:text-[28px] font-bold text-stroke-800 text-nowrap"
        >
          <span className="text-primary">عطرهایی که</span> شاید بپسندی
        </h2>

        <div className="flex items-center gap-4">
          {controls && (
            <div className="max-md:hidden flex items-center gap-1">
              <button
                type="button"
                onClick={() => page(-1)}
                disabled={!scroll.prev}
                aria-label="محصولات قبلی"
                className="flex items-center justify-center aspect-square size-10 rounded-full bg-stroke-0 dark:bg-stroke-50 border border-stroke-250 shadow-sm disabled:opacity-40 duration-200"
              >
                <ChevronRightIcon className="size-4 stroke-2 text-stroke-800" />
              </button>
              <button
                type="button"
                onClick={() => page(1)}
                disabled={!scroll.next}
                aria-label="محصولات بعدی"
                className="flex items-center justify-center aspect-square size-10 rounded-full bg-stroke-0 dark:bg-stroke-50 border border-stroke-250 shadow-sm disabled:opacity-40 duration-200"
              >
                <ChevronLeftIcon className="size-4 stroke-2 text-stroke-800" />
              </button>
            </div>
          )}
          {more && (
            <CategoryLandingLink
              href={more.href}
              className={`hidden md:flex items-center gap-4 text-primary hover:text-primary/70 duration-200 ${
                controls ? "pr-3 border-r-[1.5px] border-stroke-200" : ""
              }`}
            >
              <span className="text-lg text-nowrap">{more.label}</span>
              <ArrowLeftIcon className="size-6" />
            </CategoryLandingLink>
          )}
        </div>
      </div>

      <div
        ref={rowRef}
        className="flex items-center w-full overflow-x-auto scrollbar-none snap-x gap-4 md:gap-6 rounded-2xl"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {more && (
        <CategoryLandingLink
          href={more.href}
          className="flex md:hidden items-center justify-center gap-4 py-2 text-primary active:text-primary/70 duration-200"
        >
          <span>{more.label}</span>
          <ArrowLeftIcon className="size-[1.1rem]" />
        </CategoryLandingLink>
      )}
    </section>
  );
}
