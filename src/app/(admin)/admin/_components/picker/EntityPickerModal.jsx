"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Modal from "@/components/Modal";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import {
  confirmDraft,
  isDraftChanged,
  openDraft,
  removeFromSelection,
  selectedIdSet,
  toggleSelection,
} from "@/utils/entityPickerContract.mjs";

// Generic searchable multi-select shell. The parent owns the query (search,
// filters, pages); this component owns the draft selection, which reaches the
// form only through onConfirm.
function EntityPickerModal({
  isOpen,
  onClose,
  onConfirm,
  value = [],
  title,
  entityLabel,
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  notice,
  items = [],
  getSnapshot,
  renderItem,
  renderSelectedItem,
  getItemName,
  status = {},
  emptyText = "موردی پیدا نشد",
}) {
  const titleId = useId();
  const searchRef = useRef(null);
  // The Escape listener reads the latest onClose without re-subscribing.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const [draft, setDraft] = useState(() => openDraft(value));
  const [tab, setTab] = useState("results");
  const [dismissBlocked, setDismissBlocked] = useState(false);
  const [wasOpen, setWasOpen] = useState(isOpen);

  // Every opening starts from the committed selection.
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setDraft(openDraft(value));
      setTab("results");
      setDismissBlocked(false);
    }
  }

  const selectedIds = selectedIdSet(draft);
  const isDirty = isDraftChanged(value, draft);

  // Focus the search on open, Escape cancels, and focus returns to the
  // element that opened the picker.
  useEffect(() => {
    if (!isOpen) return undefined;

    const opener = document.activeElement;
    searchRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onCloseRef.current();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

  // A backdrop click never silently discards a changed draft.
  const handleBackdropDismiss = () => {
    if (isDirty) setDismissBlocked(true);
    else onClose();
  };

  const handleConfirm = () => {
    onConfirm(confirmDraft(draft));
    onClose();
  };

  const toggle = (item) => {
    const snapshot = getSnapshot(item);
    if (snapshot) setDraft((current) => toggleSelection(current, snapshot));
  };

  const {
    isLoading,
    isFetching,
    isError,
    onRetry,
    hasNextPage,
    onLoadMore,
    isLoadingMore,
    summary,
  } = status;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleBackdropDismiss}
      scrollable
      className="w-full md:w-2xl h-[85dvh] max-h-full"
    >
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="flex flex-col size-full min-h-0 text-stroke-800 bg-stroke-0"
        >
          <div className="flex items-center justify-between gap-3 px-4 md:px-6 pt-4 md:pt-6 pb-3 border-b border-stroke-250 shrink-0">
            <h2 id={titleId} className="font-bold md:text-lg">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="flex items-center justify-center size-8 aspect-square rounded-full border border-stroke-250"
            >
              <XMarkIcon className="size-4 text-stroke-800 stroke-2" />
            </button>
          </div>

          <div className="space-y-3 px-4 md:px-6 py-3 shrink-0">
            <label className="relative flex items-center">
              <span className="sr-only">جستجو</span>
              <MagnifyingGlassIcon className="absolute right-3 size-5 text-stroke-500 pointer-events-none" />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                // The picker renders beside forms: Enter must never submit one.
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.preventDefault();
                }}
                placeholder={searchPlaceholder}
                className="textField__input w-full rounded-xl py-2 pr-10 pl-3"
              />
            </label>
            {filters}
            {notice}
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                aria-pressed={tab === "results"}
                onClick={() => setTab("results")}
                className={`px-3 py-1.5 rounded-full border ${tab === "results" ? "border-primary text-primary font-bold bg-primary/5" : "border-stroke-250 text-stroke-600"}`}
              >
                نتایج
              </button>
              <button
                type="button"
                aria-pressed={tab === "selected"}
                onClick={() => setTab("selected")}
                className={`px-3 py-1.5 rounded-full border ${tab === "selected" ? "border-primary text-primary font-bold bg-primary/5" : "border-stroke-250 text-stroke-600"}`}
              >
                انتخاب‌شده‌ها ({toPersianNumbers(selectedIds.size)})
              </button>
            </div>
            <p aria-live="polite" className="text-xs text-stroke-500 min-h-4">
              {tab === "results"
                ? isLoading
                  ? "در حال جستجو…"
                  : isFetching && !isLoadingMore
                    ? "در حال به‌روزرسانی…"
                    : summary
                : `${toPersianNumbers(selectedIds.size)} ${entityLabel} در این انتخاب`}
            </p>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 md:px-6 border-y border-stroke-250">
            {tab === "results" ? (
              isLoading ? (
                <p className="py-8 text-center text-stroke-500">
                  در حال دریافت…
                </p>
              ) : isError ? (
                <div role="alert" className="py-8 flex flex-col items-center gap-3">
                  <p className="text-error">دریافت نتایج ناموفق بود.</p>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="btn btn--primary px-4 py-1.5"
                  >
                    تلاش دوباره
                  </button>
                </div>
              ) : items.length === 0 ? (
                <p className="py-8 text-center text-stroke-500">{emptyText}</p>
              ) : (
                <>
                  <ul className="divide-y divide-stroke-200">
                    {items.map((item) => {
                      const checked = selectedIds.has(Number(item.id));
                      return (
                        <li key={item.id}>
                          <label
                            className={`flex items-center gap-3 py-2.5 px-1 cursor-pointer rounded-lg ${checked ? "bg-primary/5" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggle(item)}
                              className="size-5 accent-primary shrink-0"
                            />
                            {renderItem(item)}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                  {hasNextPage && (
                    <div className="flex justify-center py-3">
                      <button
                        type="button"
                        onClick={onLoadMore}
                        disabled={isLoadingMore}
                        className="btn border border-stroke-300 px-4 py-1.5 text-sm disabled:opacity-50"
                      >
                        {isLoadingMore ? "در حال دریافت…" : "نمایش بیشتر"}
                      </button>
                    </div>
                  )}
                </>
              )
            ) : draft.length === 0 ? (
              <p className="py-8 text-center text-stroke-500">
                هنوز {entityLabel}ی انتخاب نشده است.
              </p>
            ) : (
              <ul className="divide-y divide-stroke-200">
                {draft.map((snapshot) => (
                  <li key={snapshot.id} className="flex items-center gap-3 py-2.5 px-1">
                    {renderSelectedItem(snapshot)}
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((current) => removeFromSelection(current, snapshot.id))
                      }
                      aria-label={`حذف ${getItemName(snapshot)}`}
                      className="mr-auto flex items-center justify-center size-8 shrink-0 rounded-full text-stroke-500 hover:text-error"
                    >
                      <XMarkIcon className="size-5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="shrink-0 px-4 md:px-6 py-3 space-y-2">
            {dismissBlocked && isDirty && (
              <p role="status" className="text-xs text-orange">
                تغییرات انتخاب ذخیره نشده است؛ «تایید» یا «انصراف» را بزنید.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-bold">
                {toPersianNumbers(selectedIds.size)} {entityLabel} انتخاب شده
              </p>
              {draft.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDraft([])}
                  className="text-sm text-error"
                >
                  حذف همه
                </button>
              )}
              <div className="flex items-center gap-2 mr-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn--primary--2 border-2 border-primary px-4 py-2"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="btn btn--success px-5 py-2"
                >
                  تایید
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default EntityPickerModal;
