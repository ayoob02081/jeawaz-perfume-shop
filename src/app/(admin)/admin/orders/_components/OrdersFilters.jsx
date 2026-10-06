"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useDebounce } from "@/hooks/useDebounce";
import { getOrderByNumberApi } from "@/services/orderServices";
import { showApiError } from "@/utils/showApiError";
import { parseDateOnly, toDateOnlyString } from "@/utils/dateOnly.mjs";
import {
  ADMIN_ORDER_SEARCH_MAX,
  ORDER_DATE_PRESETS,
  detectDatePreset,
  getDatePresetRange,
  getExactOrderNumber,
  hasActiveOrderFilters,
  normalizeOrderSearch,
  resolveExactOrderNumber,
  withCustomDate,
} from "@/utils/adminOrdersListContract.mjs";

function OrdersFilters({ query, updateQuery, resetFilters, isUpdating }) {
  const router = useRouter();
  const urlSearch = query.search ?? "";
  const [input, setInput] = useState(urlSearch);
  const debouncedInput = useDebounce(input, 300);
  // The search value last written to (or read from) the URL.
  const committedRef = useRef(urlSearch);
  const [customDates, setCustomDates] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const commitSearch = useCallback(
    (value) => {
      const next = normalizeOrderSearch(value);
      if (next === committedRef.current) return;
      committedRef.current = next;
      updateQuery({ search: next });
    },
    [updateQuery],
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
    if (!normalizeOrderSearch(value)) commitSearch("");
  };

  const clearSearch = () => {
    setInput("");
    commitSearch("");
  };

  // Enter applies the search now; an exact order number opens that order.
  const handleSubmit = async (event) => {
    event.preventDefault();
    commitSearch(input);
    if (isOpening || !getExactOrderNumber(input)) return;

    setIsOpening(true);
    const result = await resolveExactOrderNumber(input, getOrderByNumberApi);
    setIsOpening(false);

    if (result.kind === "open") router.push(result.href);
    else if (result.kind === "error") showApiError(result.error);
  };

  const preset = customDates ? "custom" : detectDatePreset(query);

  const handlePresetChange = (event) => {
    const { value } = event.target;
    setCustomDates(value === "custom");
    if (value === "custom") return;
    const { dateFrom, dateTo } = getDatePresetRange(value);
    updateQuery({ dateFrom, dateTo });
  };

  const handleCustomDate = (key, date) => {
    const next = withCustomDate(
      query,
      key,
      date ? toDateOnlyString(date.toDate()) : undefined,
    );
    updateQuery({ dateFrom: next.dateFrom, dateTo: next.dateTo });
  };

  const handleReset = () => {
    setCustomDates(false);
    resetFilters();
  };

  const isActive = hasActiveOrderFilters(query);
  const statusText = isOpening
    ? "در حال باز کردن سفارش…"
    : isUpdating
      ? "در حال به‌روزرسانی…"
      : "";

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-stroke-200 shadow p-3 mx-4 text-sm"
    >
      <div className="flex max-md:flex-col gap-3 w-full">
        <label className="relative flex items-center grow">
          <span className="sr-only">جستجوی سفارش</span>
          <MagnifyingGlassIcon className="absolute right-3 size-5 text-stroke-600 pointer-events-none" />
          <input
            type="text"
            enterKeyHint="search"
            autoComplete="off"
            value={input}
            maxLength={ADMIN_ORDER_SEARCH_MAX}
            onChange={handleInputChange}
            placeholder="شماره سفارش، نام یا شماره موبایل..."
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
        <label className="flex items-center gap-2 md:w-64 shrink-0">
          <span className="font-bold text-nowrap">تاریخ سفارش</span>
          <select
            className="textField__input rounded-xl p-2 w-full"
            value={preset}
            onChange={handlePresetChange}
          >
            {ORDER_DATE_PRESETS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {preset === "custom" && (
        <div className="grid grid-cols-2 gap-3 w-full">
          <OrderDateField
            label="از تاریخ"
            value={query.dateFrom}
            onChange={(date) => handleCustomDate("dateFrom", date)}
          />
          <OrderDateField
            label="تا تاریخ"
            value={query.dateTo}
            onChange={(date) => handleCustomDate("dateTo", date)}
          />
        </div>
      )}

      {(isActive || statusText) && (
        <div className="flex items-center justify-between gap-2 min-h-8">
          <span role="status" className="text-stroke-600">
            {statusText}
          </span>
          {isActive && (
            <button
              type="button"
              onClick={handleReset}
              className="btn btn--secondary--2 px-3 py-1 text-nowrap"
            >
              پاک کردن فیلترها
            </button>
          )}
        </div>
      )}
    </form>
  );
}

export default OrdersFilters;

// Jalali picker over a YYYY-MM-DD calendar day (no UTC shift).
function OrderDateField({ label, value, onChange }) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="pr-2 font-bold">{label}</span>
      <DatePicker
        calendar={persian}
        locale={persian_fa}
        value={parseDateOnly(value) ?? ""}
        onChange={onChange}
        placeholder={label}
        containerClassName="w-full"
        inputClass="textField__input rounded-xl p-2 w-full"
        calendarPosition="bottom-right"
      />
    </label>
  );
}
