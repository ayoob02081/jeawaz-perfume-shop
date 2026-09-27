export const RECOVERY_MODE = Object.freeze({
  SELECTED: "SELECTED_ITEMS",
  WHOLE: "ALL_RECOVERABLE",
});

export const HISTORY_SOURCE = Object.freeze({
  BULK: "BULK_PRICE",
  MANUAL: "MANUAL_PRODUCT_EDIT",
  RECOVERY: "RECOVERY",
});

export const sourceLabels = Object.freeze({
  BULK_PRICE: "تغییر گروهی قیمت",
  MANUAL_PRODUCT_EDIT: "ویرایش محصول",
  RECOVERY: "بازیابی قیمت",
});

export const changeLabels = Object.freeze({
  CREATED: "افزوده‌شده",
  PRICE_CHANGED: "تغییر قیمت",
  REMOVED: "حذف‌شده",
  RECOVERY: "بازیابی قیمت",
});

export const recoverabilityLabels = Object.freeze({
  RECOVERABLE: "قابل بازیابی",
  ALREADY_AT_TARGET: "قیمت اکنون برابر هدف است",
  LATER_PRICE_CHANGE: "تغییر قیمت جدیدتری ثبت شده",
  CURRENT_PRICE_CHANGED: "قیمت فعلی با تاریخچه متفاوت است",
  PRODUCT_MISSING: "محصول دیگر وجود ندارد",
  VARIANT_MISSING: "واریانت دیگر وجود ندارد",
  STRUCTURE_CHANGED: "ساختار واریانت تغییر کرده",
  HISTORY_GAP: "زنجیرهٔ تاریخچه کافی نیست",
  STRUCTURAL_EVENT: "تغییر ساختاری؛ بازیابی قیمت ندارد",
});

export const recoveryPaths = Object.freeze({
  preview: "/products/price-history/recovery/preview",
  read: (id) => `/products/price-history/recovery/${encodeURIComponent(id)}/preview`,
  apply: (id) => `/products/price-history/recovery/${encodeURIComponent(id)}/apply`,
});

export const historyPaths = Object.freeze({
  operations: "/products/price-history/operations",
  operation: (id) => `/products/price-history/operations/${encodeURIComponent(id)}`,
});

export function historyListParams(filters = {}, page = 1, limit = 20) {
  const positiveId = (value) => /^\d+$/.test(String(value)) &&
    Number.isSafeInteger(Number(value)) && Number(value) > 0;
  const zoned = (value) => value ? new Date(value).toISOString() : undefined;
  return {
    ...(positiveId(filters.productId) ? { productId: Number(filters.productId) } : {}),
    ...(Object.values(HISTORY_SOURCE).includes(filters.source) ? { source: filters.source } : {}),
    ...(positiveId(filters.adminId) ? { adminId: Number(filters.adminId) } : {}),
    ...(filters.appliedFrom ? { appliedFrom: zoned(filters.appliedFrom) } : {}),
    ...(filters.appliedTo ? { appliedTo: zoned(filters.appliedTo) } : {}),
    page,
    limit,
  };
}

export const isRecoverableItem = (row) =>
  row?.recoverable === true && row?.status === "RECOVERABLE";

export function toggleHistoryItem(selectedIds, row) {
  if (!isRecoverableItem(row)) return selectedIds;
  return selectedIds.includes(row.id)
    ? selectedIds.filter((id) => id !== row.id)
    : [...selectedIds, row.id];
}

export function buildRecoveryPreviewRequest(sourceOperationId, mode, selectedIds) {
  if (!Number.isSafeInteger(sourceOperationId) || sourceOperationId <= 0) {
    throw new Error("عملیات تاریخچه نامعتبر است.");
  }
  if (mode === RECOVERY_MODE.WHOLE) {
    return { sourceOperationId, targetMode: RECOVERY_MODE.WHOLE };
  }
  if (mode !== RECOVERY_MODE.SELECTED) throw new Error("محدوده بازیابی نامعتبر است.");
  const ids = [...new Set(selectedIds.map(Number))].sort((a, b) => a - b);
  if (!ids.length || ids.length > 5000 || ids.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    throw new Error("حداقل یک ردیف معتبر و حداکثر ۵۰۰۰ ردیف انتخاب کنید.");
  }
  return { sourceOperationId, targetMode: RECOVERY_MODE.SELECTED, sourceItemIds: ids };
}

export function recoveryInputKey(sourceOperationId, mode, selectedIds) {
  return JSON.stringify({ sourceOperationId, mode,
    selectedIds: mode === RECOVERY_MODE.SELECTED
      ? [...new Set(selectedIds)].sort((a, b) => a - b) : [] });
}

export const recoveryPreviewReady = (preview, previewKey, inputKey, state) =>
  preview?.status === "DRAFT" && state === "ready" && previewKey === inputKey;

export function classifyRecoveryError(error) {
  const status = error?.response?.status;
  const body = error?.response?.data || {};
  if (status === 409 && body.reason === "STALE_RECOVERY") {
    return { kind: "stale", conflictCount: body.conflictCount ?? 0,
      conflicts: Array.isArray(body.conflicts) ? body.conflicts.slice(0, 20) : [] };
  }
  if (status === 409 && body.reason === "RECOVERY_NOT_SAFE") {
    return { kind: "unsafe", conflictCount: body.nonRecoverableCount ?? 0,
      reasons: body.reasons || {},
      conflicts: Array.isArray(body.conflicts) ? body.conflicts.slice(0, 20) : [] };
  }
  if (status === 410) return { kind: "expired" };
  if (status === 401 || status === 403) return { kind: "forbidden" };
  if (status === 404) return { kind: "missing" };
  if (status === 400) return { kind: "invalid",
    message: Array.isArray(body.message) ? body.message.join("، ") : body.message };
  return { kind: "server" };
}

export const basePriceText = (value) => value == null
  ? "—" : `${Number(value).toLocaleString("fa-IR")} تومان`;
