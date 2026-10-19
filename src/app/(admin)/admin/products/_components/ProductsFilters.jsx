"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { AdjustmentsHorizontalIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import {
  adminProductFiltersKey,
  countActiveAdminProductFilters,
  draftFromAdminProductsQuery,
} from "@/utils/adminProductsListContract.mjs";
import ProductFilterFields from "./ProductFilterFields";

export const MOBILE_FILTER_SHEET_LABEL = "فیلتر محصولات";

// The form draft follows the applied (URL) filters: when they change under it
// (Back/Forward, reset, apply) the unapplied edits are replaced.
function useDraftFor(query) {
  const appliedKey = adminProductFiltersKey(query);
  const [state, setState] = useState(() => ({
    key: appliedKey,
    draft: draftFromAdminProductsQuery(query),
  }));
  if (state.key !== appliedKey) {
    const next = { key: appliedKey, draft: draftFromAdminProductsQuery(query) };
    setState(next);
    return [next.draft, setState, appliedKey];
  }
  const setDraft = (update) =>
    setState((current) => ({
      ...current,
      draft: typeof update === "function" ? update(current.draft) : update,
    }));
  return [state.draft, setDraft, appliedKey];
}

// Desktop: the filters inline, as before. Below md: a filter button with the
// applied-filter count opening a bottom sheet with the same controls.
function ProductsFilters({ query, onApply, onReset, brands, genders, families }) {
  const [inlineDraft, setInlineDraft] = useDraftFor(query);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDraft, setSheetDraft] = useState(() => draftFromAdminProductsQuery(query));
  const activeCount = countActiveAdminProductFilters(query);
  const options = { brands, genders, families };

  const openSheet = () => {
    // Every opening starts from the applied filters: closing without Apply
    // discards the edits.
    setSheetDraft(draftFromAdminProductsQuery(query));
    setSheetOpen(true);
  };

  const applySheet = (event) => {
    event.preventDefault();
    onApply(sheetDraft);
    setSheetOpen(false);
  };

  const resetSheet = () => {
    onReset();
    setSheetOpen(false);
  };

  return (
    <>
      <form
        data-admin-product-filters
        onSubmit={(event) => {
          event.preventDefault();
          onApply(inlineDraft);
        }}
        className="max-md:hidden flex flex-col items-cente justify-stretch gap-3 rounded-xl border border-stroke-200 shadow p-3 text-sm w-full"
      >
        <ProductFilterFields
          draft={inlineDraft}
          setDraft={setInlineDraft}
          {...options}
        />
        <div className="flex items-center justify-between gap-2 max-sm:w-full w-full h-full">
          <button
            type="submit"
            className="btn btn--primary px-3 py-2 text-nowrap max-sm:w-full"
          >
            اعمال فیلتر
          </button>
          <button
            type="button"
            className="btn btn--secondary--2 px-3 py-2 text-nowrap max-sm:w-full"
            onClick={onReset}
          >
            پاک کردن فیلتر
          </button>
        </div>
      </form>

      <div className="md:hidden flex items-center gap-2">
        <button
          type="button"
          data-admin-product-filter-trigger
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          aria-label={
            activeCount
              ? `فیلترها، ${toPersianNumbers(activeCount)} فیلتر فعال`
              : "فیلترها"
          }
          className="btn border border-stroke-200 rounded-xl px-3 py-2 flex items-center gap-2"
          onClick={openSheet}
        >
          <AdjustmentsHorizontalIcon className="size-5" aria-hidden="true" />
          <span>فیلترها</span>
          {activeCount > 0 && (
            <span
              aria-hidden="true"
              className="flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-primary text-white text-xs font-bold"
            >
              {toPersianNumbers(activeCount)}
            </span>
          )}
        </button>
        {activeCount > 0 && (
          <button
            type="button"
            className="btn btn--secondary--2 px-3 py-2 text-nowrap text-sm"
            onClick={onReset}
          >
            پاک کردن فیلتر
          </button>
        )}
      </div>

      <Modal
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        accessibleLabel={MOBILE_FILTER_SHEET_LABEL}
        scrollable
        className="w-full h-[85dvh] max-h-full"
      >
        {sheetOpen && (
          <form
            onSubmit={applySheet}
            data-admin-product-filter-sheet
            className="flex flex-col size-full min-h-0 text-stroke-800 bg-stroke-0 text-sm"
          >
            <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-stroke-250 shrink-0">
              <h2 className="font-bold text-lg">{MOBILE_FILTER_SHEET_LABEL}</h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="بستن فیلترها"
                className="flex items-center justify-center size-8 aspect-square rounded-full border border-stroke-250"
              >
                <XMarkIcon className="size-4 text-stroke-800 stroke-2" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 scrollbar-none">
              <ProductFilterFields
                draft={sheetDraft}
                setDraft={setSheetDraft}
                variant="sheet"
                {...options}
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-3 border-t border-stroke-250 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="submit"
                className="btn btn--primary px-3 py-2 grow"
              >
                اعمال فیلتر
              </button>
              <button
                type="button"
                className="btn btn--secondary--2 px-3 py-2"
                onClick={resetSheet}
              >
                پاک کردن فیلتر
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

export default ProductsFilters;
