"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useDebounce } from "@/hooks/useDebounce";
import {
  ADMIN_NOTIFICATION_SEARCH_MAX,
  hasActiveNotificationFilters,
  normalizeNotificationSearch,
} from "@/utils/notificationsContract.mjs";

const CHANNEL_OPTIONS = [
  { value: "", label: "همه کانال‌ها" },
  { value: "IN_APP", label: "سایت" },
  { value: "SMS", label: "پیامک" },
  { value: "BOTH", label: "سایت و پیامک" },
];

// ROLE is never stored (the backend saves it as USER), so it is not offered.
const TARGET_OPTIONS = [
  { value: "", label: "همه مخاطبان" },
  { value: "USER", label: "کاربران منتخب" },
  { value: "ALL", label: "همه کاربران" },
];

function AdminNotificationsFilters({ query, onFilterChange, onReset, isUpdating }) {
  const urlSearch = query.search ?? "";
  const [input, setInput] = useState(urlSearch);
  const debouncedInput = useDebounce(input, 300);
  // The search value last written to (or read from) the URL.
  const committedRef = useRef(urlSearch);

  const commitSearch = useCallback(
    (value) => {
      const next = normalizeNotificationSearch(value);
      if (next === committedRef.current) return;
      committedRef.current = next;
      onFilterChange("search", next);
    },
    [onFilterChange],
  );

  // Back/forward and reset change the URL without typing: show that value.
  useEffect(() => {
    if (urlSearch === committedRef.current) return;
    committedRef.current = urlSearch;
    setInput(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    commitSearch(debouncedInput);
  }, [debouncedInput, commitSearch]);

  const handleInputChange = (event) => {
    const { value } = event.target;
    setInput(value);
    // Clearing applies at once; typing waits for the debounce.
    if (!normalizeNotificationSearch(value)) commitSearch("");
  };

  const clearSearch = () => {
    setInput("");
    commitSearch("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    commitSearch(input);
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-stroke-200 shadow p-3 mx-4 text-sm"
    >
      <div className="flex max-md:flex-col gap-3 w-full">
        <label className="relative flex items-center grow">
          <span className="sr-only">جستجوی اعلان</span>
          <MagnifyingGlassIcon className="absolute right-3 size-5 text-stroke-600 pointer-events-none" />
          <input
            type="text"
            enterKeyHint="search"
            autoComplete="off"
            value={input}
            maxLength={ADMIN_NOTIFICATION_SEARCH_MAX}
            onChange={handleInputChange}
            placeholder="جستجو در عنوان یا متن اعلان..."
            className="textField__input rounded-xl p-2 pr-10 pl-10 w-full"
          />
          {input && (
            <button
              type="button"
              aria-label="پاک کردن جستجو"
              onClick={clearSearch}
              className="absolute left-3 text-stroke-600 hover:text-primary duration-200"
            >
              <XMarkIcon className="size-5" />
            </button>
          )}
        </label>
        <div className="grid grid-cols-2 gap-3 md:w-96 shrink-0">
          <select
            aria-label="کانال ارسال"
            className="textField__input rounded-xl p-2 w-full"
            value={query.channel ?? ""}
            onChange={(event) => onFilterChange("channel", event.target.value)}
          >
            {CHANNEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            aria-label="مخاطب"
            className="textField__input rounded-xl p-2 w-full"
            value={query.target ?? ""}
            onChange={(event) => onFilterChange("target", event.target.value)}
          >
            {TARGET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(hasActiveNotificationFilters(query) || isUpdating) && (
        <div className="flex items-center justify-between gap-2 w-full">
          <p className="text-stroke-600" role="status">
            {isUpdating ? "در حال به‌روزرسانی…" : ""}
          </p>
          {hasActiveNotificationFilters(query) && (
            <button
              type="button"
              onClick={onReset}
              className="text-primary font-bold hover:underline"
            >
              حذف فیلترها
            </button>
          )}
        </div>
      )}
    </form>
  );
}

export default AdminNotificationsFilters;
