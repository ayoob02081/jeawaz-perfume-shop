"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { toPersianNumbers } from "@/utils/toPersianNumbers";

// The confirmed selection inside a form: entities, never raw IDs. Every
// button is type="button" so nothing here submits the surrounding form.
function SelectedEntityList({
  label,
  items = [],
  entityLabel,
  addLabel,
  emptyText,
  renderItem,
  getItemName,
  onOpen,
  onRemove,
  onClear,
  error,
  isRequired = false,
}) {
  const count = items.length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-bold">
          {label}
          {isRequired && <span className="text-error">*</span>}
        </p>
        <div className="flex items-center gap-3">
          {count > 0 && (
            <button type="button" onClick={onClear} className="text-sm text-error">
              حذف همه
            </button>
          )}
          <button
            type="button"
            onClick={onOpen}
            className="btn btn--primary--2 border-2 border-primary px-4 py-2 text-sm font-bold"
          >
            {count > 0
              ? `ویرایش انتخاب (${toPersianNumbers(count)})`
              : `+ ${addLabel}`}
          </button>
        </div>
      </div>

      {count > 0 ? (
        <>
          <p className="text-sm text-stroke-600">
            {toPersianNumbers(count)} {entityLabel} انتخاب شده
          </p>
          <ul className="max-h-112 overflow-y-auto overscroll-contain divide-y divide-stroke-200 rounded-xl border border-stroke-250 px-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-2">
                {renderItem(item)}
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  aria-label={`حذف ${getItemName(item)}`}
                  className="mr-auto flex items-center justify-center size-8 shrink-0 rounded-full text-stroke-500 hover:text-error"
                >
                  <XMarkIcon className="size-5" />
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm text-stroke-500">{emptyText}</p>
      )}

      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export default SelectedEntityList;
