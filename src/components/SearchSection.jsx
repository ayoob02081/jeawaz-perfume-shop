"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useId, useRef } from "react";
import useOutsideClick from "@/hooks/useOutsideClick";

function SearchSection({
  placeholder = "جستجو...", value = "", onChange, onSubmit,
  results = [], isFetching = false, isError = false, errorStatus,
  minSearchLength = 3, renderResult, active = false, onActiveChange,
  inputRef, inline = false, showResults = true,
  emptyMessage = "نتیجه‌ای پیدا نشد", loadingMessage = "در حال جستجو...",
}) {
  const resultsId = useId();
  const composing = useRef(false);
  const dismiss = () => onActiveChange?.(false);
  const ref = useOutsideClick(dismiss, true, active && !inline);
  const shouldShowDropdown = active && value.trim().length >= minSearchLength && showResults;
  const message = isFetching ? loadingMessage : isError
    ? (errorStatus === 429 ? "تعداد جستجوها زیاد است؛ کمی صبر کنید یا جستجو را ارسال کنید." : "پیشنهادها دریافت نشد؛ می‌توانید جستجو را ارسال کنید.")
    : results.length === 0 ? emptyMessage : `${results.length} پیشنهاد`;

  return (
    <div ref={ref} className={inline ? "relative w-full" : "relative size-full"}
      onBlur={(event) => {
        if (!inline && !event.currentTarget.contains(event.relatedTarget)) dismiss();
      }}>
      <form onSubmit={(event) => {
        if (composing.current) { event.preventDefault(); return; }
        onSubmit(event);
      }}
        className={`relative flex items-center justify-center group border-primary bg-stroke-800/5 backdrop-blur-md size-full h-12 rounded-[48px]
          ${shouldShowDropdown ? "border-[1.5px]" : "focus-within:border-[1.5px] focus-within:bg-stroke-0"} duration-200`}>
        <input ref={inputRef} className="p-4 pl-16 outline-0 w-full text-base text-stroke-800"
          type="search" enterKeyHint="search" autoComplete="off" aria-label="جستجوی محصولات"
          aria-expanded={shouldShowDropdown} aria-controls={shouldShowDropdown ? resultsId : undefined}
          placeholder={placeholder} value={value}
          onChange={(event) => { onActiveChange?.(true); onChange(event); }}
          onFocus={() => onActiveChange?.(true)}
          onCompositionStart={() => { composing.current = true; }}
          onCompositionEnd={() => { composing.current = false; }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && !inline) { event.preventDefault(); dismiss(); }
          }} />
        <button type="submit" aria-label="جستجو"
          className={`absolute flex items-center justify-center gap-1 top-1/2 -translate-1/2 bg-stroke-0/80 backdrop-blur-md rounded-full p-2
            ${shouldShowDropdown ? "left-12 bg-stroke-100" : "lg:group-hover:left-12 lg:group-focus-within:left-12 group-focus-within:bg-stroke-100 left-6"} duration-200`}>
          <MagnifyingGlassIcon className="size-6 text-stroke-800 duration-200" />
          <p className={`text-sm text-stroke-800 ${shouldShowDropdown ? "block w-full" : "lg:group-hover:w-auto lg:group-focus-within:w-auto lg:group-hover:block lg:group-focus-within:block hidden w-0"} duration-200`}>جستجو</p>
        </button>
      </form>
      {inline && !shouldShowDropdown && <p className="p-3 text-sm text-stroke-500">حداقل سه نویسه وارد کنید.</p>}
      {shouldShowDropdown && (
        <div id={resultsId} aria-label="پیشنهادهای جستجو" aria-busy={isFetching}
          className={`${inline ? "mt-3" : "absolute top-full mt-2 z-50 max-h-[min(60dvh,24rem)] overflow-y-auto overscroll-contain"} w-full bg-white dark:bg-stroke-0 rounded-2xl shadow-xl shadow-stroke-800/10 border border-stroke-150`}>
          <p role="status" aria-live="polite" className={!isFetching && !isError && results.length ? "sr-only" : "p-4 text-sm text-stroke-500"}>{message}</p>
          {!isFetching && !isError && results.length > 0 && (
            <ul>{results.map((item) => <li key={item.id}>{renderResult(item, dismiss)}</li>)}</ul>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchSection;
