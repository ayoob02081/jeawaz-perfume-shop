"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAdminUsers, useSetUserBan } from "@/hooks/useUsers";
import { useAuth } from "@/contexts/auth/AuthContext";
import { sessionLifecycle, isSessionSuperseded } from "@/utils/sessionLifecycle.mjs";
import { getSafeApiErrorMessage } from "@/utils/profileFormContract.mjs";
import { ADMIN_USERS_LIMITS, nextAdminUsersSearch, parseAdminUsersQuery } from "@/utils/adminUsersContract.mjs";
import UsersListTable from "./UsersListTable";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import NotExisted from "@/components/NotExisted";
import Modal from "@/components/Modal";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import toast from "react-hot-toast";

function UsersLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const search = params.toString();
  const query = useMemo(() => parseAdminUsersQuery(params), [params]);
  const { user, sessionReady } = useAuth();
  const { data, isPending, isFetching, error, refetch } = useAdminUsers(query, { enabled: sessionReady && user?.role === "admin" });
  const ban = useSetUserBan();
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(query.search);
  const [banError, setBanError] = useState("");
  const pending = useRef(false);
  const dialogEpoch = useRef(0);
  const mounted = useRef(true);
  const latestSearch = useRef(search);
  latestSearch.current = search;
  const users = data?.data || [];
  const meta = data?.meta;

  function navigate(changes, replace = false) {
    const next = nextAdminUsersSearch(latestSearch.current, changes);
    if (next === latestSearch.current) return;
    latestSearch.current = next;
    router[replace ? "replace" : "push"](next ? `${pathname}?${next}` : pathname, { scroll: false });
  }

  function closeBanDialog() {
    // Modal has already accepted dismissal. Invalidate this opening before
    // unmounting it; the request/cache refresh may still finish independently.
    dialogEpoch.current += 1;
    setSelected(null);
    setBanError("");
  }

  function openBanDialog(target) {
    dialogEpoch.current += 1;
    setBanError("");
    setSelected(target);
  }

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; dialogEpoch.current += 1; };
  }, []);
  // URL changes (including Back/Forward) cancel a pending search debounce.
  useEffect(() => { setDraft(query.search); closeBanDialog(); }, [search, query.search]);
  useEffect(() => {
    if (draft === query.search) return undefined;
    const timer = setTimeout(() => navigate({ search: draft.trim().replace(/\s+/g, " ") }, true), 350);
    return () => clearTimeout(timer);
  }, [draft, query.search, search]);
  useEffect(() => {
    if (!isFetching && !error && meta && query.page > Math.max(1, meta.totalPages)) {
      navigate({ page: Math.max(1, meta.totalPages) }, true);
    }
  }, [isFetching, error, meta, query.page]);

  async function confirmBan() {
    if (pending.current || !selected) return;
    pending.current = true;
    const generation = sessionLifecycle.generation();
    const opening = dialogEpoch.current;
    setBanError("");
    try {
      await ban.mutateAsync({ id: selected.id, isBanned: selected.accountStatus !== "banned", generation });
      sessionLifecycle.assertCurrent(generation, true);
      if (!mounted.current || dialogEpoch.current !== opening) return;
      closeBanDialog();
      toast.success("وضعیت کاربر به‌روزرسانی شد");
    } catch (cause) {
      if (mounted.current && dialogEpoch.current === opening && sessionLifecycle.current(generation) && !isSessionSuperseded(cause)) {
        setBanError(getSafeApiErrorMessage(cause, "تغییر وضعیت کاربر ناموفق بود"));
      }
    } finally { pending.current = false; }
  }

  return (
    <div className="space-y-4 w-full px-4 pb-10">
      <h1 className="font-bold max-sm:text-center text-secndary-900 text-xl max-sm:pb-4 pb-6 text-stroke-800">
        اطلاعات کاربران
      </h1>
      <div className="flex flex-wrap gap-3 items-end">
        <label className="flex flex-col gap-2 grow">
          جستجوی نام، شماره موبایل یا ایمیل
          <input type="search" value={draft} maxLength={200} onChange={(event) => setDraft(event.target.value)} className="textField__input" />
        </label>
        <label className="flex flex-col gap-2">
          وضعیت حساب
          <select value={query.isBanned === undefined ? "" : String(query.isBanned)} onChange={(event) => navigate({ isBanned: event.target.value })} className="textField__input">
            <option value="">همه</option><option value="false">فعال (مسدود نیست)</option><option value="true">مسدود</option>
          </select>
        </label>
        <label className="flex flex-col gap-2">
          تعداد در صفحه
          <select value={query.limit} onChange={(event) => navigate({ limit: Number(event.target.value) })} className="textField__input">
            {ADMIN_USERS_LIMITS.map((limit) => <option key={limit} value={limit}>{toPersianNumbers(limit)}</option>)}
          </select>
        </label>
      </div>
      <p role="status">{isFetching ? "در حال دریافت کاربران…" : meta ? `${toPersianNumbers(meta.total)} کاربر` : ""}</p>
      {error ? <Error onRetry={refetch} /> : isPending ? <Loading /> : (
        <UsersListTable users={users} rowOffset={(query.page - 1) * query.limit} actorId={user?.id} disabled={!sessionReady || !user || isFetching} onBan={openBanDialog} />
      )}
      {!error && !isPending && users.length === 0 && <NotExisted className="h-40">کاربری یافت نشد.</NotExisted>}
      {meta && !error && meta.totalPages > 1 && (
        <nav aria-label="صفحه‌بندی کاربران" className="flex flex-wrap items-center justify-center gap-4">
          <button type="button" className="btn disabled:opacity-40" disabled={isFetching || query.page <= 1} onClick={() => navigate({ page: query.page - 1 })}>صفحه قبل</button>
          <span>صفحه {toPersianNumbers(query.page)} از {toPersianNumbers(meta.totalPages)}</span>
          <button type="button" className="btn disabled:opacity-40" disabled={isFetching || query.page >= meta.totalPages} onClick={() => navigate({ page: query.page + 1 })}>صفحه بعد</button>
        </nav>
      )}
      {selected && <Modal isOpen={true} accessibleLabel="تغییر وضعیت حساب کاربر" onClose={closeBanDialog} className="h-fit md:w-fit p-6 space-y-5">
        <p>{selected.accountStatus === "banned" ? "رفع مسدودی" : "مسدود کردن"} حساب {selected.fullName || "کاربر"}؟</p>
        <p className="text-sm">با مسدود کردن، نشست تازه‌سازی کاربر لغو می‌شود.</p>
        {banError && <p role="alert" className="text-error">{banError}</p>}
        <div className="flex gap-3">
          <button type="button" className="btn btn--primary px-4 py-2" disabled={ban.isPending} onClick={confirmBan}>{ban.isPending ? "در حال ثبت…" : "تایید"}</button>
          <button type="button" className="btn px-4 py-2" onClick={closeBanDialog}>لغو</button>
        </div>
      </Modal>}
    </div>
  );
}

export default UsersLayout;
