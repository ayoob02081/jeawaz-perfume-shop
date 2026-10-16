"use client";

import { useRef } from "react";
import { Dialog } from "@base-ui/react/dialog";
import useBodyScrollLock from "@/hooks/useBodyScrollLock";
import SearchSection from "./SearchSection";

export default function MobileSearchOverlay({ open, onClose, dialogId, finalFocus, searchProps }) {
  const inputRef = useRef(null);
  // Base UI traps focus; the existing owner-counted lock remains the sole
  // scroll-lock implementation, including when another overlay is also open.
  useBodyScrollLock(open);
  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }} modal="trap-focus">
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-110 bg-black/60 backdrop-blur-md" />
        <Dialog.Popup id={dialogId} dir="rtl" aria-modal="true" initialFocus={inputRef} finalFocus={finalFocus}
          className="fixed inset-x-3 top-[max(1rem,env(safe-area-inset-top))] z-120 max-h-[calc(100dvh-max(1rem,env(safe-area-inset-top))-max(1rem,env(safe-area-inset-bottom)))] overflow-y-auto overscroll-contain rounded-3xl bg-stroke-0 p-3 shadow-2xl outline-none">
          <div className="mb-2 flex items-center justify-between gap-3">
            <Dialog.Title className="px-2 font-bold text-stroke-800">جستجوی محصولات</Dialog.Title>
            <Dialog.Close className="flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm text-stroke-800">انصراف</Dialog.Close>
          </div>
          <SearchSection {...searchProps} inline inputRef={inputRef} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
