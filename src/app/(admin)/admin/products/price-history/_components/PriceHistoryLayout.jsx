"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePriceHistoryOperation, usePriceHistoryOperations } from "@/hooks/useProducts";
import {
  basePriceText, changeLabels, HISTORY_SOURCE, historyListParams,
  isRecoverableItem, recoverabilityLabels, RECOVERY_MODE, sourceLabels,
  toggleHistoryItem,
} from "@/utils/priceHistoryContract.mjs";
import RecoveryDialog from "./RecoveryDialog";

const emptyFilters = { productId: "", source: "", adminId: "", appliedFrom: "", appliedTo: "" };
const dateText = (value) => value ? new Date(value).toLocaleString("fa-IR") : "—";
const variantText = (type) => type === "decant" ? "دکانت" : type === "sealed" ? "پلمپ" : type;

function Pager({ meta, page, onPage, disabled }) {
  if (!meta || meta.totalPages <= 1) return null;
  return <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
    <button type="button" className="btn px-3 py-1" disabled={disabled || page <= 1}
      onClick={() => onPage(page - 1)}>قبلی</button>
    <span>صفحه {meta.page} از {meta.totalPages} — {meta.total} ردیف</span>
    <button type="button" className="btn px-3 py-1" disabled={disabled || page >= meta.totalPages}
      onClick={() => onPage(page + 1)}>بعدی</button>
  </div>;
}

export default function PriceHistoryLayout() {
  const [draft, setDraft] = useState(emptyFilters);
  const [filters, setFilters] = useState({});
  const [filterError, setFilterError] = useState("");
  const [page, setPage] = useState(1);
  const [operationId, setOperationId] = useState(null);
  const [detailPage, setDetailPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [recoveryMode, setRecoveryMode] = useState(null);
  const [lastRecovery, setLastRecovery] = useState(null);
  const list = usePriceHistoryOperations({ ...filters, page, limit: 20 });
  const detail = usePriceHistoryOperation(operationId, detailPage, 50);
  const operations = list.data?.data || [];
  const detailRows = detail.data?.items || [];

  // Detail classification is point-in-time. Drop newly unsafe visible selections on refetch,
  // but retain explicit selections from other detail pages until the server validates Preview.
  useEffect(() => {
    if (!detail.data) return;
    const visible = new Map(detail.data.items.map((item) => [item.id, item]));
    setSelectedIds((ids) => ids.filter((id) =>
      !visible.has(id) || isRecoverableItem(visible.get(id))));
  }, [detail.data]);

  const applyFilters = (event) => {
    event.preventDefault();
    const validId = (value) => !value || (/^[1-9]\d*$/.test(value) &&
      Number.isSafeInteger(Number(value)));
    if (!validId(draft.productId) || !validId(draft.adminId)) {
      setFilterError("شناسهٔ محصول و مدیر باید عدد صحیح مثبت باشند.");
      return;
    }
    try {
      const next = historyListParams(draft);
      if (next.appliedFrom && next.appliedTo && next.appliedFrom > next.appliedTo) {
        setFilterError("تاریخ شروع نمی‌تواند پس از تاریخ پایان باشد.");
        return;
      }
      const { page: _page, limit: _limit, ...active } = next;
      setFilters(active);
      setPage(1);
      setFilterError("");
    } catch {
      setFilterError("بازهٔ تاریخ نامعتبر است.");
    }
  };

  const openOperation = (id) => {
    if (id === operationId) return;
    setOperationId(id);
    setDetailPage(1);
    setSelectedIds([]);
    setRecoveryMode(null);
  };

  return <div className="space-y-5 w-full max-lg:py-4 px-4 pb-10 overflow-hidden text-stroke-800">
    <div className="flex flex-wrap justify-between items-center gap-3">
      <div><h1 className="text-xl font-bold">تاریخچه قیمت واریانت‌ها</h1>
        <p className="text-sm text-stroke-600">قیمت‌های پایه به تومان؛ تخفیف و کمپین جداگانه اعمال می‌شوند.</p></div>
      <Link href="/admin/products" prefetch={false} className="btn border px-3 py-2">بازگشت به محصولات</Link>
    </div>

    <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-3 rounded-xl border border-stroke-200 p-3 text-sm">
      <label className="flex flex-col gap-1">شناسه محصول
        <input className="textField__input rounded-xl p-2" inputMode="numeric" value={draft.productId}
          onChange={(event) => setDraft((current) => ({ ...current, productId: event.target.value }))} />
      </label>
      <label className="flex flex-col gap-1">منبع تغییر
        <select className="textField__input rounded-xl p-2" value={draft.source}
          onChange={(event) => setDraft((current) => ({ ...current, source: event.target.value }))}>
          <option value="">همه</option>
          {Object.values(HISTORY_SOURCE).map((source) => <option key={source} value={source}>{sourceLabels[source]}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1">شناسه مدیر
        <input className="textField__input rounded-xl p-2" inputMode="numeric" value={draft.adminId}
          onChange={(event) => setDraft((current) => ({ ...current, adminId: event.target.value }))} />
      </label>
      <label className="flex flex-col gap-1">از تاریخ
        <input className="textField__input rounded-xl p-2" type="datetime-local" value={draft.appliedFrom}
          onChange={(event) => setDraft((current) => ({ ...current, appliedFrom: event.target.value }))} />
      </label>
      <label className="flex flex-col gap-1">تا تاریخ
        <input className="textField__input rounded-xl p-2" type="datetime-local" value={draft.appliedTo}
          onChange={(event) => setDraft((current) => ({ ...current, appliedTo: event.target.value }))} />
      </label>
      <button className="btn btn--primary px-3 py-2" type="submit">اعمال فیلتر</button>
      <button className="btn px-3 py-2" type="button" onClick={() => {
        setDraft(emptyFilters); setFilters({}); setPage(1); setFilterError("");
      }}>پاک کردن</button>
      {filterError && <p role="alert" className="w-full text-red-600">{filterError}</p>}
    </form>

    {lastRecovery && <p role="status" className="rounded-lg bg-success/10 p-3 text-success text-sm">
      بازیابی ثبت شد: {lastRecovery.changedVariants} قیمت پایه تغییر کرد.
    </p>}

    <section className="space-y-3">
      <h2 className="font-bold">عملیات ثبت‌شده</h2>
      {list.isPending && <p>در حال دریافت تاریخچه…</p>}
      {list.error && <p role="alert" className="text-red-600">دریافت تاریخچه ناموفق بود.</p>}
      {!list.isPending && !list.error && !operations.length && <p>عملیاتی یافت نشد.</p>}
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {operations.map((entry) => <button key={entry.id} type="button"
          className={`rounded-xl border p-3 text-right space-y-1 ${operationId === entry.id ? "border-primary" : "border-stroke-200"}`}
          onClick={() => openOperation(entry.id)}>
          <div className="flex flex-wrap justify-between gap-2 font-bold">
            <span>#{entry.id} — {sourceLabels[entry.source] || entry.source}</span>
            <span className="text-sm font-normal">{dateText(entry.appliedAt)}</span>
          </div>
          <p className="text-sm">مدیر #{entry.adminId} · {entry.summary.affectedProducts} محصول · {entry.summary.historyItems} رویداد</p>
          <p className="text-xs text-stroke-600">تغییر قیمت: {entry.summary.priceChanged + entry.summary.recovery} · افزوده: {entry.summary.created} · حذف: {entry.summary.removed}</p>
        </button>)}
      </div>
      <Pager meta={list.data?.meta} page={page} onPage={setPage} disabled={list.isFetching} />
    </section>

    {operationId && <section className="space-y-3 border-t border-stroke-200 pt-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="font-bold">جزئیات عملیات #{operationId}</h2>
        <button type="button" className="btn px-3 py-1" onClick={() => {
          setOperationId(null); setSelectedIds([]); setRecoveryMode(null);
        }}>بستن جزئیات</button>
      </div>
      {detail.isPending && <p>در حال دریافت جزئیات…</p>}
      {detail.error && <p role="alert" className="text-red-600">
        {detail.error?.response?.status === 404 ? "این تاریخچه دیگر در دسترس نیست." : "دریافت جزئیات ناموفق بود."}
      </p>}
      {detail.data && <>
        <p className="text-sm text-stroke-600">
          {sourceLabels[detail.data.operation.source]} · {dateText(detail.data.operation.appliedAt)}
          {detail.data.operation.recovery?.sourceOperationId &&
            ` · بازیابی از عملیات #${detail.data.operation.recovery.sourceOperationId}`}
        </p>
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <span>{selectedIds.length} ردیف قابل بازیابی انتخاب‌شده</span>
          <button type="button" className="btn btn--primary px-3 py-2" disabled={!selectedIds.length}
            onClick={() => setRecoveryMode(RECOVERY_MODE.SELECTED)}>بازیابی ردیف‌های انتخاب‌شده</button>
          <button type="button" className="btn border px-3 py-2"
            disabled={!(detail.data.operation.summary.priceChanged + detail.data.operation.summary.recovery)}
            onClick={() => setRecoveryMode(RECOVERY_MODE.WHOLE)}>بازیابی کل عملیات</button>
          {selectedIds.length > 0 && <button type="button" className="btn px-3 py-2"
            onClick={() => setSelectedIds([])}>پاک کردن انتخاب</button>}
        </div>
        <div className="overflow-x-auto rounded-xl border border-stroke-200">
          <table className="w-full min-w-[850px] text-right text-sm">
            <thead><tr className="border-b border-stroke-200">
              <th className="p-2">انتخاب</th><th className="p-2">محصول</th><th className="p-2">واریانت</th>
              <th className="p-2">رویداد</th><th className="p-2">قیمت قبلی</th>
              <th className="p-2">قیمت جدید</th><th className="p-2">وضعیت بازیابی</th>
            </tr></thead>
            <tbody>{detailRows.map((row) => <tr key={row.id} className="border-b border-stroke-200">
              <td className="p-2"><input type="checkbox" aria-label={`انتخاب رویداد ${row.id}`}
                checked={selectedIds.includes(row.id)} disabled={!isRecoverableItem(row)}
                onChange={() => setSelectedIds((ids) => toggleHistoryItem(ids, row))} /></td>
              <td className="p-2">{row.productTitle} <span className="text-stroke-600">#{row.productId}</span></td>
              <td className="p-2">{variantText(row.type)} · {row.volume} میل</td>
              <td className="p-2">{changeLabels[row.changeKind] || row.changeKind}</td>
              <td className="p-2 whitespace-nowrap">{basePriceText(row.oldPrice)}</td>
              <td className="p-2 whitespace-nowrap">{basePriceText(row.newPrice)}</td>
              <td className="p-2">{recoverabilityLabels[row.status] || row.status}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <Pager meta={detail.data.meta} page={detailPage} onPage={setDetailPage}
          disabled={detail.isFetching} />
      </>}
    </section>}

    {recoveryMode && operationId && <RecoveryDialog key={operationId} sourceOperationId={operationId}
      mode={recoveryMode} selectedIds={selectedIds} onClose={() => setRecoveryMode(null)}
      onApplied={(result) => {
        setLastRecovery(result.summary);
        setSelectedIds([]);
        setRecoveryMode(null);
      }} />}
  </div>;
}
