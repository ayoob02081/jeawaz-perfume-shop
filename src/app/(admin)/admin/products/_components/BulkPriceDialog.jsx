"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";
import {
  toEnglishNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";
import {
  useApplyBulkPriceOperation,
  useCreateBulkPricePreview,
  useReadBulkPricePreview,
} from "@/hooks/useProducts";
import {
  buildBulkPricePreviewRequest,
  classifyBulkPriceError,
  hasBulkFilters,
  OPERATION,
  ROUNDING,
  ROUNDING_STEPS,
  SCOPE,
  TARGET,
  validateBulkPriceForm,
} from "./bulkPriceContract.mjs";
import { XMarkIcon } from "@heroicons/react/24/outline";

const targetLabels = {
  [TARGET.SELECTED]: "محصولات انتخاب‌شده",
  [TARGET.FILTERED]: "همهٔ محصولات مطابق فیلترهای فعال",
  [TARGET.ALL]: "همهٔ محصولات",
};
const scopeLabels = {
  [SCOPE.ALL]: "همهٔ واریانت‌ها",
  [SCOPE.DECANT]: "دکانت",
  [SCOPE.SEALED]: "پلمپ",
};
const operationLabels = {
  [OPERATION.PERCENT_INCREASE]: "افزایش درصدی",
  [OPERATION.PERCENT_DECREASE]: "کاهش درصدی",
  [OPERATION.FIXED_INCREASE]: "افزایش مبلغ ثابت",
  [OPERATION.FIXED_DECREASE]: "کاهش مبلغ ثابت",
};
const roundingLabels = {
  [ROUNDING.NONE]: "بدون گرد کردن (نزدیک‌ترین تومان)",
  [ROUNDING.NEAREST]: "نزدیک‌ترین گام",
  [ROUNDING.UP]: "رو به بالا",
  [ROUNDING.DOWN]: "رو به پایین",
};
const conflictLabels = {
  VARIANT_MISSING: "واریانت حذف شده است",
  PRODUCT_MISMATCH: "محصول واریانت تغییر کرده است",
  TYPE_MISMATCH: "نوع واریانت تغییر کرده است",
  VOLUME_MISMATCH: "حجم واریانت تغییر کرده است",
  PRICE_CHANGED: "قیمت واریانت تغییر کرده است",
  SNAPSHOT_INCOMPLETE: "اطلاعات پیش‌نمایش ناقص است",
};
const formatPrice = (value) => Number(value).toLocaleString("fa-IR");

function errorMessage(error) {
  if (error.kind === "invalid")
    return (
      error.message ||
      "درخواست تغییر قیمت نامعتبر است. اطلاعات فرم را بررسی کنید."
    );
  if (error.kind === "forbidden")
    return "برای انجام این عملیات دسترسی مدیریتی لازم است.";
  if (error.kind === "expired")
    return "مهلت پیش‌نمایش پایان یافته است. پیش‌نمایش تازه ایجاد کنید.";
  if (error.kind === "stale")
    return "اطلاعات محصول یا واریانت تغییر کرده است. این پیش‌نمایش دیگر معتبر نیست.";
  return "درخواست انجام نشد. لطفاً دوباره تلاش کنید.";
}

function BulkPriceDialog({ isOpen, selectedIds, filters, onClose, onApplied }) {
  const [form, setForm] = useState({
    targetKind: selectedIds.length
      ? TARGET.SELECTED
      : hasBulkFilters(filters)
        ? TARGET.FILTERED
        : "",
    variantScope: SCOPE.ALL,
    operation: OPERATION.PERCENT_INCREASE,
    value: "",
    roundingMode: ROUNDING.NEAREST,
    roundingStep: 10000,
  });
  const [preview, setPreview] = useState(null);
  const [previewState, setPreviewState] = useState("idle");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const applyingRef = useRef(false);
  const { createPreview, isPreviewing } = useCreateBulkPricePreview();
  const { readPreview, isReadingPreview } = useReadBulkPricePreview();
  const { applyOperation, isApplying } = useApplyBulkPriceOperation();

  // The backend database clock decides expiry; a browser clock may be skewed.
  const ready =
    preview && preview.status === "DRAFT" && previewState === "ready";
  const busy = isPreviewing || isReadingPreview || isApplying;

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setPreview(null);
    setPreviewState("idle");
    setConfirming(false);
    setError(null);
  };

  const close = () => {
    if (!busy && !applyingRef.current) onClose();
  };

  const handlePreview = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setConfirming(false);
    setPreview(null);
    setPreviewState("idle");
    try {
      const payload = buildBulkPricePreviewRequest(form, selectedIds, filters);
      const result = await createPreview(payload);
      setPreview(result);
      setPreviewState(
        result.status === "DRAFT" ? "ready" : result.status.toLowerCase(),
      );
    } catch (cause) {
      setError(
        cause?.response || cause?.isAxiosError
          ? classifyBulkPriceError(cause)
          : { kind: "invalid", message: cause.message },
      );
    }
  };

  const handlePage = async (page) => {
    if (!preview?.operationId || busy || !ready) return;
    setError(null);
    try {
      const result = await readPreview({
        operationId: preview.operationId,
        page,
        limit: 50,
      });
      setPreview(result);
      if (result.status !== "DRAFT")
        setPreviewState(result.status.toLowerCase());
    } catch (cause) {
      const classified = classifyBulkPriceError(cause);
      setError(classified);
      if (classified.kind === "expired" || classified.kind === "stale") {
        setPreviewState(classified.kind);
        setConfirming(false);
      }
    }
  };

  const handleApply = async () => {
    if (!ready || !confirming || applyingRef.current || isApplying) return;
    applyingRef.current = true;
    setError(null);
    try {
      // The persisted operation ID is the entire Apply request.
      const result = await applyOperation(preview.operationId);
      toast.success(
        `قیمت‌ها ثبت شد: ${result.summary.changedVariants} تغییر، ${result.summary.unchangedVariants} بدون تغییر.`,
      );
      setPreview(null);
      setPreviewState("idle");
      onApplied(result);
    } catch (cause) {
      const classified = classifyBulkPriceError(cause);
      setError(classified);
      if (classified.kind === "expired" || classified.kind === "stale") {
        setPreviewState(classified.kind);
      }
      setConfirming(false);
    } finally {
      applyingRef.current = false;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      scrollable
      className="relative flex flex-col w-fit max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6 space-y-4"
    >
      <button
        type="button"
        className="absolute flex items-center justify-center top-3 left-3 btn border border-stroke-800 rounded-full max-md:size-6 size-8"
        onClick={close}
        disabled={busy}
        aria-label="بستن"
      >
        <XMarkIcon className="text-stroke-800 size-4.5" />
      </button>
      <h2 className="font-bold text-lg">مدیریت گروهی قیمت پایه</h2>
      <p className="text-sm text-stroke-600">
        این عملیات فقط قیمت پایهٔ واریانت‌ها را تغییر می‌دهد. تخفیف محصول و
        کمپین جداگانه محاسبه می‌شوند.
      </p>

      <form
        onSubmit={handlePreview}
        className="grid gap-3 md:grid-cols-2 text-sm w-full"
      >
        <fieldset className="space-y-2 rounded-lg border border-stroke-400 p-3 md:col-span-2">
          <legend className="font-bold">محدودهٔ محصولات</legend>
          {Object.values(TARGET).map((kind) => (
            <label
              key={kind}
              className={`flex items-center w-fit ${
                  form.targetKind === kind ?
                  "text-primary font-bold border border-primary px-2 py-1 rounded-xl ":"pr-2"
                }`}
            >
              <input
                type="radio"
                name="bulk-target"
                value={kind}
                checked={form.targetKind === kind}
                disabled={
                  (kind === TARGET.SELECTED && !selectedIds.length) ||
                  (kind === TARGET.FILTERED && !hasBulkFilters(filters)) ||
                  busy
                }
                onChange={() => updateForm("targetKind", kind)}
              />
              <p
                // className={
                //   form.targetKind === kind &&
                //   "text-primary font-bold border border-primary px-3 py-1 rounded-xl"
                // }
              >
                {targetLabels[kind]}
                {kind === TARGET.SELECTED &&
                  ` (${toPersianNumbersWithComma(selectedIds.length)})`}
              </p>
            </label>
          ))}
          {form.targetKind === TARGET.FILTERED && (
            <p className="text-stroke-600">
              تمام محصولات مطابق فیلترهای اعمال‌شده، نه فقط صفحهٔ فعلی.
            </p>
          )}
          {form.targetKind === TARGET.ALL && (
            <p className="text-stroke-600">
              این انتخاب همهٔ محصولات واجد شرایط را دربر می‌گیرد.
            </p>
          )}
        </fieldset>
        <label className="flex flex-col gap-1">
          واریانت‌ها
          <select
            className="textField__input rounded-xl p-2"
            value={form.variantScope}
            disabled={busy}
            onChange={(event) => updateForm("variantScope", event.target.value)}
          >
            {Object.values(SCOPE).map((scope) => (
              <option key={scope} value={scope}>
                {scopeLabels[scope]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          نوع تغییر
          <select
            className="textField__input rounded-xl p-2"
            value={form.operation}
            disabled={busy}
            onChange={(event) => updateForm("operation", event.target.value)}
          >
            {Object.values(OPERATION).map((operation) => (
              <option key={operation} value={operation}>
                {operationLabels[operation]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          مقدار (
          {form.operation.startsWith("PERCENT_") ? "درصد" : "تومان / IRT"})
          <input
            className="textField__input rounded-xl p-2"
            type="text"
            inputMode="decimal"
            value={form.value}
            disabled={busy}
            onChange={(event) =>
              updateForm("value", toEnglishNumbers(event.target.value))
            }
            placeholder={
              form.operation.startsWith("PERCENT_")
                ? "مثلاً ۱۰ یا ۷.۵"
                : "مبلغ به تومان"
            }
          />
        </label>
        <label className="flex flex-col gap-1">
          گرد کردن
          <select
            className="textField__input rounded-xl p-2"
            value={form.roundingMode}
            disabled={busy}
            onChange={(event) => updateForm("roundingMode", event.target.value)}
          >
            {Object.values(ROUNDING).map((mode) => (
              <option key={mode} value={mode}>
                {roundingLabels[mode]}
              </option>
            ))}
          </select>
        </label>
        {form.roundingMode !== ROUNDING.NONE && (
          <label className="flex flex-col gap-1">
            گام گرد کردن (تومان)
            <select
              className="textField__input rounded-xl p-2"
              value={form.roundingStep}
              disabled={busy}
              onChange={(event) =>
                updateForm("roundingStep", Number(event.target.value))
              }
            >
              {ROUNDING_STEPS.map((step) => (
                <option key={step} value={step}>
                  {formatPrice(step)}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="btn btn--primary px-4 py-2"
            disabled={
              busy || Boolean(validateBulkPriceForm(form, selectedIds, filters))
            }
          >
            {isPreviewing ? "در حال آماده‌سازی…" : "نمایش پیش‌نمایش"}
          </button>
          {preview && (
            <span className="text-stroke-600">
              تغییر فرم، پیش‌نمایش فعلی را باطل می‌کند.
            </span>
          )}
        </div>
      </form>

      {(error || previewState === "expired" || previewState === "stale") && (
        <div
          role="alert"
          className="rounded-lg bg-red-600/10 p-3 text-red-700 text-sm"
        >
          {error ? errorMessage(error) : errorMessage({ kind: previewState })}
          {error?.kind === "stale" && (
            <div className="mt-2">
              <p>تعداد مغایرت‌ها: {error.conflictCount}</p>
              <ul className="list-disc pr-5">
                {error.conflicts.map((conflict, index) => (
                  <li key={`${conflict.variantId}-${index}`}>
                    محصول {conflict.productId}، واریانت {conflict.variantId}:{" "}
                    {conflictLabels[conflict.reason] ||
                      "اطلاعات تغییر کرده است"}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {preview && (
        <section className="space-y-3 border-t border-stroke-200 pt-4 text-sm">
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <span>محدوده: {targetLabels[preview.target?.kind]}</span>
            <span>واریانت: {scopeLabels[preview.variantScope]}</span>
            <span>
              عملیات: {operationLabels[preview.operation]} {preview.value}
              {preview.operation?.startsWith("PERCENT_") ? "٪" : " تومان"}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 font-bold">
            <span>محصول: {preview.summary.targetedProducts}</span>
            <span>واریانت: {preview.summary.targetedVariants}</span>
            <span>تغییر: {preview.summary.changedVariants}</span>
            <span>بدون تغییر: {preview.summary.unchangedVariants}</span>
            <span>
              محصول بدون واریانت واجد شرایط:{" "}
              {preview.summary.zeroEligibleVariantProducts}
            </span>
          </div>
          <p className="text-stroke-600">
            اعتبار پیش‌نمایش تا{" "}
            {new Date(preview.expiresAt).toLocaleString("fa-IR")}
          </p>
          <div className="overflow-x-auto rounded-lg border border-stroke-200">
            <table className="w-full min-w-[600px] text-right">
              <thead>
                <tr className="border-b border-stroke-200">
                  <th className="p-2">محصول</th>
                  <th className="p-2">واریانت</th>
                  <th className="p-2">حجم</th>
                  <th className="p-2">قیمت پایهٔ قبلی</th>
                  <th className="p-2">قیمت پایهٔ جدید</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr
                    key={row.variantId}
                    className="border-b border-stroke-200"
                  >
                    <td className="p-2">{row.productTitle}</td>
                    <td className="p-2">
                      {row.type === "decant" ? "دکانت" : "پلمپ"}
                    </td>
                    <td className="p-2">{row.volume} میل</td>
                    <td className="p-2">{formatPrice(row.oldPrice)} تومان</td>
                    <td className="p-2">{formatPrice(row.newPrice)} تومان</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              className="btn px-3 py-1"
              disabled={busy || preview.meta.page <= 1 || !ready}
              onClick={() => handlePage(preview.meta.page - 1)}
            >
              قبلی
            </button>
            <span>
              صفحه {preview.meta.page} از {Math.max(1, preview.meta.totalPages)}
            </span>
            <button
              type="button"
              className="btn px-3 py-1"
              disabled={
                busy || preview.meta.page >= preview.meta.totalPages || !ready
              }
              onClick={() => handlePage(preview.meta.page + 1)}
            >
              بعدی
            </button>
          </div>
          {ready && !confirming && (
            <button
              type="button"
              className="btn btn--success px-4 py-2"
              disabled={busy}
              onClick={() => setConfirming(true)}
            >
              ادامه برای تایید اعمال
            </button>
          )}
          {ready && confirming && (
            <div className="rounded-lg border border-primary p-3 space-y-3">
              <p>
                تایید اعمال {operationLabels[preview.operation]} {preview.value}
                {preview.operation.startsWith("PERCENT_")
                  ? "٪"
                  : " تومان"} روی {scopeLabels[preview.variantScope]} برای{" "}
                {targetLabels[preview.target.kind]}؛{" "}
                {preview.summary.changedVariants} واریانت تغییر می‌کند.
              </p>
              {preview.target.kind === TARGET.ALL && (
                <p className="font-bold">
                  این عملیات همهٔ محصولات واجد شرایط را هدف می‌گیرد.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn px-3 py-2"
                  disabled={isApplying}
                  onClick={() => setConfirming(false)}
                >
                  بازگشت
                </button>
                <button
                  type="button"
                  className="btn btn--success px-3 py-2"
                  disabled={isApplying}
                  onClick={handleApply}
                >
                  {isApplying ? "در حال ثبت…" : "تایید و اعمال قیمت‌ها"}
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </Modal>
  );
}

export default BulkPriceDialog;
