"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

function SearchSection({
  placeholder = "جستجو...",
  value = "",
  onChange,
  onSubmit,
  results = [],
  isFetching = false,
  minSearchLength = 3,
  renderResult,
  emptyMessage = "نتیجه‌ای پیدا نشد",
  loadingMessage = "در حال جستجو...",
  showResults = true,
}) {
  const [open, setOpen] = useState(false);

  const shouldShow = value?.trim()?.length >= minSearchLength;

  const shouldShowDropdown = open && shouldShow && showResults;

  const handleFocus = () => {
    if (results.length > 0) {
      setOpen(true);
    }
  };

  return (
    <div className="relative size-full">
      <form
        onSubmit={onSubmit}
        className={`flex items-center justify-center group border-primary bg-stroke-800/5 backdrop-blur-md size-full h-12 rounded-[48px]
          ${
            shouldShowDropdown
              ? "border-[1.5px]"
              : "focus-within:border-[1.5px] focus-within:bg-stroke-0"
          }
          duration-200`}
      >
        <input
          className="p-4 outline-0 w-full text-stroke-800"
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
        />

        <button
          type="submit"
          className={`absolute flex items-center justify-center gap-1 top-1/2 -translate-1/2 bg-stroke-0/80 backdrop-blur-md rounded-full p-2
            ${
              shouldShowDropdown
                ? "left-12 bg-stroke-100"
                : "lg:group-hover:left-12 lg:group-focus-within:left-12 group-focus-within:bg-stroke-100 left-6"
            }
            duration-200`}
        >
          <MagnifyingGlassIcon className="size-6 text-stroke-800 duration-200" />

          <p
            className={`text-sm text-stroke-800
              ${
                shouldShowDropdown
                  ? "block w-full"
                  : "lg:group-hover:w-auto lg:group-focus-within:w-auto lg:group-hover:block lg:group-focus-within:block hidden w-0"
              }
              duration-200`}
          >
            جستجو
          </p>
        </button>
      </form>

      {shouldShowDropdown && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-stroke-0 rounded-2xl shadow-xl shadow-stroke-800/10 border border-stroke-150 z-50 overflow-hidden">
          {isFetching && (
            <div className="p-4 text-sm text-gray-500">{loadingMessage}</div>
          )}

          {!isFetching && results.length === 0 && (
            <div className="p-4 text-sm text-gray-500">{emptyMessage}</div>
          )}

          {!isFetching &&
            results.length > 0 &&
            results.map((item) => (
              <div key={item.id} className="w-full">
                {renderResult(item, () => setOpen(false))}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default SearchSection;
