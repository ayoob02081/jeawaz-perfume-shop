"use client";

import AppImage from "@/components/AppImage";
import Modal from "@/components/Modal";
import PriceSection from "@/components/PriceSection";
import { openAddedToCartSession } from "@/utils/addedToCartContract.mjs";
import { CheckIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

// Mobile-only confirmation after a new cart line is added on Product Detail.
// Rendered only once a mobile add succeeded; on desktop it is never mounted.
function AddedToCartModal({
  open,
  item,
  seq,
  onClose,
  onGoToCart,
  returnFocusRef,
}) {
  const headingId = useId();
  const primaryRef = useRef(null);

  // Every close except "go to cart" returns focus to the add-to-cart trigger.
  const dismiss = useCallback(() => {
    onClose();
    const target = returnFocusRef?.current;
    if (target?.isConnected) target.focus({ preventScroll: true });
  }, [onClose, returnFocusRef]);

  useEffect(() => {
    if (!open) return undefined;
    return openAddedToCartSession({ window, onClose: dismiss });
  }, [open, dismiss]);

  // Also re-runs when a later success replaces the item.
  useEffect(() => {
    if (open) primaryRef.current?.focus({ preventScroll: true });
  }, [open, seq]);

  if (!item || typeof document === "undefined") return null;

  // Portaled to <body>: on mobile the product page sits in AdaptiveOverlayPage,
  // a scrolling wrapper with a `translate`, which would become the containing
  // block of the fixed Backdrop. Inline, the open modal scrolls with the page
  // and the closed one lands over the page content instead of off-screen.
  return createPortal(
    <Modal isOpen={open} onClose={dismiss} className="h-fit">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        inert={!open}
        dir="rtl"
        className="relative flex flex-col gap-5 w-full p-4 py- text-stroke-800"
      >
        <div className="flex items-center justify-start gap-2">
          <div className="flex items-center justify-center size-16 aspect-square bg-stroke-150 rounded-xl">
            <CheckIcon
              aria-hidden="true"
              className="size-7 shrink-0 text-success"
            />
          </div>
          <h2
            id={headingId}
            className="font-bold max-[30rem]:text-base text-xl leading-8 max-w-3/5"
          >
            محصول شما با موفقیت به سبد خرید اضافه شد!
          </h2>
          <img
            src="/images/flower.svg"
            alt="flower-icon"
            className="pointer-events-none absolute -z-20 left-0 top-0 w-18 "
          />
        </div>

        <div className="flex gap-3 p-3 border-[1.5px] border-stroke-200 rounded-2xl">
          <AppImage
            src={item.image}
            alt={item?.title + "-عکس"}
            width="size-16 shrink-0"
            sizes="30vw"
          />
          <div className="flex flex-col items-start justify-between gap-2 w-full">
            <p className="font-bold w-full max-[30rem]:text-sm">{item.title}</p>
            <div className="flex items-center justify-between gap-4 w-full">
              <span className="badge badge--secondary w-fit">
                <p>{item.variantLabel}</p>
              </span>
              <div className="flex items-end gap-1 text-stroke-800">
                <PriceSection
                  unitPrice={item.unitPrice}
                  basePrice={item.unitPrice}
                  priceClassName="max-[30rem]:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 w-full">
          <button
            ref={primaryRef}
            type="button"
            onClick={onGoToCart}
            className="btn btn--primary gap-2 w-full flex-2 h-12 px-2 font-bold text-sm"
          >
            <div className="size-4.5">
              <AppImage src="/images/bag-white-icon.svg" alt="bag-icon" />
            </div>
            <p>رفتن به سبد خرید</p>
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="btn btn--secondary--2 flex-1 w-full h-12 px-2 text-sm"
          >
            ادامه خرید
          </button>
        </div>
      </div>
    </Modal>,
    document.body,
  );
}

export default AddedToCartModal;
