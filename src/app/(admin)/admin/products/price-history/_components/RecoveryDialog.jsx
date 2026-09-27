"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";
import {
  useApplyRecovery,
  useCreateRecoveryPreview,
  useReadRecoveryPreview,
} from "@/hooks/useProducts";
import {
  basePriceText,
  buildRecoveryPreviewRequest,
  classifyRecoveryError,
  RECOVERY_MODE,
  recoverabilityLabels,
  recoveryInputKey,
  recoveryPreviewReady,
} from "@/utils/priceHistoryContract.mjs";

const modeLabels = {
  [RECOVERY_MODE.SELECTED]: "ردیف‌های انتخاب‌شده",
  [RECOVERY_MODE.WHOLE]: "کل عملیات",
};
const variantText = (type) =>
  type === "decant" ? "دکانت" : type === "sealed" ? "پلمپ" : type;

function errorText(error) {
  if (error.kind === "stale")
    return "داده‌ها از زمان پیش‌نمایش تغییر کرده‌اند. برای ادامه، پیش‌نمایش تازه بسازید.";
  if (error.kind === "unsafe")
    return "بخشی از تغییرات این عملیات برای بازیابی امن نیست. هیچ ردیفی بازیابی نشده است.";
  if (error.kind === "expired")
    return "مهلت پیش‌نمایش پایان یافته است. پیش‌نمایش تازه بسازید.";
  if (error.kind === "forbidden")
    return "دسترسی لازم برای این پیش‌نمایش یا بازیابی را ندارید.";
  if (error.kind === "missing") return "تاریخچه یا پیش‌نمایش موردنظر پیدا نشد.";
  if (error.kind === "invalid")
    return error.message || "درخواست بازیابی نامعتبر است.";
  return "درخواست انجام نشد. لطفاً دوباره تلاش کنید.";
}

export default function RecoveryDialog({
  sourceOperationId,
  mode,
  selectedIds,
  onClose,
  onApplied,
}) {
  const [targetMode, setTargetMode] = useState(mode);
  const [preview, setPreview] = useState(null);
  const [previewKey, setPreviewKey] = useState(null);
  const [previewState, setPreviewState] = useState("idle");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const applyingRef = useRef(false);
  const { createPreview, isPreviewing } = useCreateRecoveryPreview();
  const { readPreview, isReadingPreview } = useReadRecoveryPreview();
  const { applyRecovery, isApplying } = useApplyRecovery();
  const inputKey = recoveryInputKey(sourceOperationId, targetMode, selectedIds);
  const busy = isPreviewing || isReadingPreview || isApplying;
  const ready = recoveryPreviewReady(
    preview,
    previewKey,
    inputKey,
    previewState,
  );

  // A changed source or selection cannot use the previously persisted operation ID.
  useEffect(() => {
    setPreview(null);
    setPreviewKey(null);
    setPreviewState("idle");
    setConfirming(false);
    setError(null);
  }, [inputKey]);

  const close = () => {
    if (!busy && !applyingRef.current) onClose();
  };

  const handlePreview = async () => {
    if (busy) return;
    setPreview(null);
    setPreviewKey(null);
    setPreviewState("idle");
    setConfirming(false);
    setError(null);
    try {
      const payload = buildRecoveryPreviewRequest(
        sourceOperationId,
        targetMode,
        selectedIds,
      );
      const result = await createPreview(payload);
      setPreview(result);
      setPreviewKey(inputKey);
      setPreviewState(result.status === "DRAFT" ? "ready" : "idle");
    } catch (cause) {
      setError(
        cause?.response
          ? classifyRecoveryError(cause)
          : { kind: "invalid", message: cause.message },
      );
    }
  };

  const handlePage = async (page) => {
    if (!ready || busy || !preview?.recoveryOperationId) return;
    setError(null);
    try {
      const result = await readPreview({
        operationId: preview.recoveryOperationId,
        page,
        limit: 50,
      });
      setPreview(result);
      if (result.status !== "DRAFT") setPreviewState("idle");
    } catch (cause) {
      const classified = classifyRecoveryError(cause);
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
      // Apply accepts only the frozen operation ID; no client prices are sent.
      const result = await applyRecovery(preview.recoveryOperationId);
      toast.success(`${result.summary.changedVariants} قیمت پایه بازیابی شد.`);
      setPreview(null);
      setPreviewState("idle");
      onApplied(result);
    } catch (cause) {
      const classified = classifyRecoveryError(cause);
      setError(classified);
      if (classified.kind === "stale" || classified.kind === "expired") {
        setPreviewState(classified.kind);
      }
      setConfirming(false);
    } finally {
      applyingRef.current = false;
    }
  };

  return (
    <Modal
      isOpen
      onClose={close}
      scrollable
      className="w-full max-w-4xl max-h-[90dvh] overflow-y-auto p-4 md:p-6 space-y-4"
    >
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-lg font-bold">بازیابی قیمت‌های پایه</h2>
        <button
          type="button"
          className="btn px-2"
          onClick={close}
          disabled={busy}
          aria-label="بستن"
        >
          ✕
        </button>
      </div>
      <p className="text-sm text-stroke-600">
        بازیابی یک تغییر قیمت جدید ثبت می‌کند؛ تاریخچهٔ قبلی باقی می‌ماند.
        قیمت‌ها دقیقاً به مقدار تاریخی بازمی‌گردند. تغییرات جدیدتر و قیمت‌های
        تغییرکرده توسط سرور محافظت می‌شوند.
      </p>
      <fieldset
        className="space-y-2 rounded-lg border border-stroke-200 p-3 text-sm"
        disabled={busy}
      >
        <legend className="font-bold">
          محدودهٔ بازیابی از عملیات #{sourceOperationId}
        </legend>
        {Object.values(RECOVERY_MODE).map((choice) => (
          <label key={choice} className="flex items-center gap-2">
            <input
              type="radio"
              name="recovery-mode"
              value={choice}
              checked={targetMode === choice}
              disabled={
                busy ||
                (choice === RECOVERY_MODE.SELECTED && !selectedIds.length)
              }
              onChange={() => setTargetMode(choice)}
            />
            {modeLabels[choice]}
            {choice === RECOVERY_MODE.SELECTED && ` (${selectedIds.length})`}
          </label>
        ))}
        {targetMode === RECOVERY_MODE.WHOLE && (
          <p className="text-stroke-600">
            اگر حتی یک تغییر قیمت این عملیات ناامن باشد، کل پیش‌نمایش رد می‌شود؛
            هیچ ردیفی بی‌صدا کنار گذاشته نمی‌شود.
          </p>
        )}
      </fieldset>
      <button
        type="button"
        className="btn btn--primary px-4 py-2"
        disabled={
          busy || (targetMode === RECOVERY_MODE.SELECTED && !selectedIds.length)
        }
        onClick={handlePreview}
      >
        {isPreviewing ? "در حال آماده‌سازی…" : "ساخت پیش‌نمایش تازه"}
      </button>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-600/10 p-3 text-red-700 text-sm space-y-2"
        >
          <p>{errorText(error)}</p>
          {(error.kind === "stale" || error.kind === "unsafe") && (
            <>
              <p>تعداد مغایرت‌ها: {error.conflictCount}</p>
              {error.reasons && (
                <p>
                  {Object.entries(error.reasons)
                    .map(
                      ([reason, count]) =>
                        `${recoverabilityLabels[reason] || reason}: ${count}`,
                    )
                    .join(" · ")}
                </p>
              )}
              <ul className="list-disc pr-5">
                {error.conflicts.map((conflict, index) => (
                  <li key={`${conflict.sourceItemId}-${index}`}>
                    محصول #{conflict.productId}، {variantText(conflict.type)}{" "}
                    {conflict.volume} میل، رویداد #{conflict.sourceItemId}:{" "}
                    {recoverabilityLabels[conflict.reason] ||
                      "اطلاعات تغییر کرده است"}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {preview && (
        <section className="space-y-3 border-t border-stroke-200 pt-4 text-sm">
          <div className="flex flex-wrap gap-x-5 gap-y-1 font-bold">
            <span>عملیات منبع: #{preview.sourceOperationId}</span>
            <span>محدوده: {modeLabels[preview.targetMode]}</span>
            <span>محصول: {preview.summary.targetedProducts}</span>
            <span>قیمت قابل تغییر: {preview.summary.changedVariants}</span>
          </div>
          <p className="text-stroke-600">
            اعتبار پیش‌نمایش تا{" "}
            {new Date(preview.expiresAt).toLocaleString("fa-IR")}
          </p>
          <div className="overflow-x-auto rounded-lg border border-stroke-200">
            <table className="w-full min-w-[650px] text-right">
              <thead>
                <tr className="border-b border-stroke-200">
                  <th className="p-2">محصول</th>
                  <th className="p-2">واریانت</th>
                  <th className="p-2">قیمت فعلی</th>
                  <th className="p-2">قیمت بازیابی</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr
                    key={row.sourceItemId}
                    className="border-b border-stroke-200"
                  >
                    <td className="p-2">{row.productTitle}</td>
                    <td className="p-2">
                      {variantText(row.type)} · {row.volume} میل
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {basePriceText(row.currentPrice)}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {basePriceText(row.recoveryPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              className="btn px-3 py-1"
              disabled={busy || !ready || preview.meta.page <= 1}
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
                busy || !ready || preview.meta.page >= preview.meta.totalPages
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
              ادامه برای تأیید بازیابی
            </button>
          )}
          {ready && confirming && (
            <div className="space-y-3 rounded-lg border border-primary p-3">
              <p>
                تأیید بازیابی {preview.summary.changedVariants} قیمت پایه از
                عملیات #{preview.sourceOperationId}
                {preview.targetMode === RECOVERY_MODE.WHOLE
                  ? " برای کل عملیات"
                  : " برای ردیف‌های انتخاب‌شده"}
                . این کار یک رویداد جدید در تاریخچه ثبت می‌کند.
              </p>
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
                  {isApplying ? "در حال ثبت…" : "تأیید و اعمال بازیابی"}
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </Modal>
  );
}
