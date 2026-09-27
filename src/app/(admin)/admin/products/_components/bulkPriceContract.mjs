export const TARGET = Object.freeze({
  SELECTED: "SELECTED_PRODUCTS",
  FILTERED: "FILTERED_PRODUCTS",
  ALL: "ALL_PRODUCTS",
});

export const SCOPE = Object.freeze({ ALL: "ALL", DECANT: "DECANT", SEALED: "SEALED" });
export const OPERATION = Object.freeze({
  PERCENT_INCREASE: "PERCENT_INCREASE",
  PERCENT_DECREASE: "PERCENT_DECREASE",
  FIXED_INCREASE: "FIXED_INCREASE",
  FIXED_DECREASE: "FIXED_DECREASE",
});
export const ROUNDING = Object.freeze({
  NONE: "NONE", NEAREST: "NEAREST", UP: "UP", DOWN: "DOWN",
});
export const ROUNDING_STEPS = [1000, 10000, 50000, 100000];

export function supportedBulkFilters(filters = {}) {
  const search = filters.search?.trim();
  const brandIds = [...new Set((filters.brandIds || []).map(Number))]
    .filter((id) => Number.isInteger(id) && id > 0);
  const gender = filters.gender?.trim();
  const fragranceFamilies = [...new Set((filters.fragranceFamilies || [])
    .map((slug) => slug.trim()).filter(Boolean))];
  return {
    ...(search ? { search } : {}),
    ...(brandIds.length ? { brandIds } : {}),
    ...(typeof filters.original === "boolean" ? { original: filters.original } : {}),
    ...(gender ? { gender } : {}),
    ...(fragranceFamilies.length ? { fragranceFamilies } : {}),
  };
}

export function hasBulkFilters(filters) {
  return Object.keys(supportedBulkFilters(filters)).length > 0;
}

export function toggleSelectedId(selectedIds, id) {
  const normalized = Number(id);
  if (!Number.isInteger(normalized) || normalized <= 0) return selectedIds;
  return selectedIds.includes(normalized)
    ? selectedIds.filter((value) => value !== normalized)
    : [...selectedIds, normalized];
}

export function setVisibleSelection(selectedIds, visibleIds, select) {
  const visible = new Set(visibleIds.map(Number));
  return select
    ? [...new Set([...selectedIds, ...visible])]
    : selectedIds.filter((id) => !visible.has(id));
}

export function validateBulkPriceForm(form, selectedIds, filters) {
  if (form.targetKind === TARGET.SELECTED && selectedIds.length === 0) {
    return "ابتدا حداقل یک محصول را انتخاب کنید.";
  }
  if (form.targetKind === TARGET.FILTERED && !hasBulkFilters(filters)) {
    return "برای محصولات فیلترشده، دست‌کم یک فیلتر فعال کنید.";
  }
  if (!Object.values(TARGET).includes(form.targetKind)) return "محدوده محصولات را انتخاب کنید.";
  if (!Object.values(SCOPE).includes(form.variantScope)) return "نوع واریانت نامعتبر است.";
  if (!Object.values(OPERATION).includes(form.operation)) return "نوع تغییر قیمت نامعتبر است.";
  const value = String(form.value).trim();
  if (form.operation.startsWith("PERCENT_")) {
    if (!/^\d+(?:\.\d{1,2})?$/.test(value) || Number(value) <= 0 || Number(value) > 1000) {
      return "درصد باید بیشتر از صفر، حداکثر ۱۰۰۰ و تا دو رقم اعشار باشد.";
    }
  } else if (!/^\d+$/.test(value) || Number(value) <= 0 || Number(value) > 2147483647) {
    return "مبلغ باید یک عدد صحیح مثبت به تومان باشد.";
  }
  if (!Object.values(ROUNDING).includes(form.roundingMode)) return "روش گرد کردن نامعتبر است.";
  if (form.roundingMode !== ROUNDING.NONE && !ROUNDING_STEPS.includes(Number(form.roundingStep))) {
    return "گام گرد کردن نامعتبر است.";
  }
  return null;
}

export function buildBulkPricePreviewRequest(form, selectedIds, filters) {
  const error = validateBulkPriceForm(form, selectedIds, filters);
  if (error) throw new Error(error);
  const target = form.targetKind === TARGET.SELECTED
    ? { kind: TARGET.SELECTED, productIds: [...new Set(selectedIds)].sort((a, b) => a - b) }
    : form.targetKind === TARGET.FILTERED
      ? { kind: TARGET.FILTERED, filters: supportedBulkFilters(filters) }
      : { kind: TARGET.ALL };
  return {
    target,
    variantScope: form.variantScope,
    operation: form.operation,
    value: String(form.value).trim(),
    rounding: form.roundingMode === ROUNDING.NONE
      ? { mode: ROUNDING.NONE }
      : { mode: form.roundingMode, step: Number(form.roundingStep) },
  };
}

export function classifyBulkPriceError(error) {
  const status = error?.response?.status;
  const payload = error?.response?.data || {};
  if (status === 409 && payload.reason === "STALE_PREVIEW") {
    return { kind: "stale", conflictCount: payload.conflictCount || 0,
      conflicts: Array.isArray(payload.conflicts) ? payload.conflicts.slice(0, 20) : [] };
  }
  if (status === 410) return { kind: "expired" };
  if (status === 401 || status === 403) return { kind: "forbidden" };
  if (status === 400) return { kind: "invalid",
    message: Array.isArray(payload.message) ? payload.message.join("، ") : payload.message };
  return { kind: "server" };
}
