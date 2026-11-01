"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAdminUsers, useSetUserBan } from "@/hooks/useUsers";
import { useAuth } from "@/contexts/auth/AuthContext";
import {
  sessionLifecycle,
  isSessionSuperseded,
} from "@/utils/sessionLifecycle.mjs";
import { getSafeApiErrorMessage } from "@/utils/profileFormContract.mjs";
import {
  ADMIN_USERS_LIMITS,
  nextAdminUsersSearch,
  parseAdminUsersQuery,
} from "@/utils/adminUsersContract.mjs";
import UsersListTable from "./UsersListTable";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import NotExisted from "@/components/NotExisted";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import toast from "react-hot-toast";
import ConfirmModal from "@/ui/ConfirmModal";
import PagesNumber from "@/components/PagesNumber";

function UsersLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const search = params.toString();
  const query = useMemo(() => parseAdminUsersQuery(params), [params]);
  const { user, sessionReady } = useAuth();
  const { data, isPending, isFetching, error, refetch } = useAdminUsers(query, {
    enabled: sessionReady && user?.role === "admin",
  });
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
    router[replace ? "replace" : "push"](
      next ? `${pathname}?${next}` : pathname,
      { scroll: false },
    );
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
    return () => {
      mounted.current = false;
      dialogEpoch.current += 1;
    };
  }, []);
  // URL changes (including Back/Forward) cancel a pending search debounce.
  useEffect(() => {
    setDraft(query.search);
    closeBanDialog();
  }, [search, query.search]);
  useEffect(() => {
    if (draft === query.search) return undefined;
    const timer = setTimeout(
      () => navigate({ search: draft.trim().replace(/\s+/g, " ") }, true),
      350,
    );
    return () => clearTimeout(timer);
  }, [draft, query.search, search]);
  useEffect(() => {
    if (
      !isFetching &&
      !error &&
      meta &&
      query.page > Math.max(1, meta.totalPages)
    ) {
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
      await ban.mutateAsync({
        id: selected.id,
        isBanned: selected.accountStatus !== "banned",
        generation,
      });
      sessionLifecycle.assertCurrent(generation, true);
      if (!mounted.current || dialogEpoch.current !== opening) return;
      closeBanDialog();
      toast.success("وضعیت کاربر به‌روزرسانی شد");
    } catch (cause) {
      if (
        mounted.current &&
        dialogEpoch.current === opening &&
        sessionLifecycle.current(generation) &&
        !isSessionSuperseded(cause)
      ) {
        setBanError(
          getSafeApiErrorMessage(cause, "تغییر وضعیت کاربر ناموفق بود"),
        );
      }
    } finally {
      pending.current = false;
    }
  }

  return (
    <div className="flex flex-col justify-between gap-4 lg:gap-6 max-lg:w-full lg:w-[calc(100%-88px)] 2xl:w-[calc(100%-270px)] px-4 2xl:px-0 pt-0 pb-10">
      <h1 className="font-bold max-sm:text-center text-secndary-900 text-xl max-sm:pb-4 pb-6 text-stroke-800">
        اطلاعات کاربران
      </h1>
      <div className="flex flex-wrap gap-3 items-end">
        <label className="flex flex-col gap-2 grow">
          جستجوی نام، شماره موبایل یا ایمیل
          <input
            type="search"
            value={draft}
            maxLength={200}
            onChange={(event) => setDraft(event.target.value)}
            className="textField__input"
          />
        </label>
        <label className="flex flex-col gap-2">
          وضعیت حساب
          <select
            value={query.isBanned === undefined ? "" : String(query.isBanned)}
            onChange={(event) => navigate({ isBanned: event.target.value })}
            className="textField__input"
          >
            <option value="">همه</option>
            <option value="false">فعال (مسدود نیست)</option>
            <option value="true">مسدود</option>
          </select>
        </label>
        <label className="flex flex-col gap-2">
          تعداد در صفحه
          <select
            value={query.limit}
            onChange={(event) =>
              navigate({ limit: Number(event.target.value) })
            }
            className="textField__input"
          >
            {ADMIN_USERS_LIMITS.map((limit) => (
              <option key={limit} value={limit}>
                {toPersianNumbers(limit)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p role="status">
        {isFetching
          ? "در حال دریافت کاربران…"
          : meta
            ? `${toPersianNumbers(meta.total)} کاربر`
            : ""}
      </p>
      {error ? (
        <Error onRetry={refetch} />
      ) : isPending ? (
        <Loading />
      ) : (
        <UsersListTable
          users={users}
          rowOffset={(query.page - 1) * query.limit}
          actorId={user?.id}
          disabled={!sessionReady || !user || isFetching}
          onBan={openBanDialog}
        />
      )}
      {!error && !isPending && users.length === 0 && (
        <NotExisted className="h-40">کاربری یافت نشد.</NotExisted>
      )}
      {meta && !error && meta.totalPages > 1 && (
        <nav
          aria-label="صفحه‌بندی کاربران"
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <PagesNumber
            page={query.page}
            setPage={(page) => navigate({ page })}
            totalPages={meta.totalPages}
            isLoading={isFetching}
          />
        </nav>
      )}
      {selected && (
        <ConfirmModal
          accessibleLabel={selected.accountStatus === "banned" ? "رفع مسدودی حساب کاربر" : "مسدود کردن حساب کاربر"}
          isPending={ban.isPending}
          cancellBtn={closeBanDialog}
          confirmBtn={confirmBan}
          isOpen={true}
          onClose={closeBanDialog}
        >
          <div className="flex flex-col items-center justify-center gap-1 text-stroke-800 max-md:text-xl md:text-2xl">
            <span className="flex flex-wrap *:text-nowrap items-center justify-center gap-1 max-[30rem]:text-lg font-bold">
              {selected.accountStatus === "banned" ? (
                <p className="text-success">رفع مسدودی حساب</p>
              ) : (
                <p className="text-primary">مسدود کردن حساب</p>
              )}
              <p className="text-blue">{selected.fullName || "کاربر"}</p>؟
            </span>
            <p className="max-sm:text-xs text-sm text-stroke-400">
              در صورت مسدود سازی، کاربر از حساب خود خارج می‌شود.
            </p>
          </div>
          {banError && (
            <p role="alert" className="text-error">
              {banError}
            </p>
          )}
        </ConfirmModal>
      )}
    </div>
  );
}

export default UsersLayout;
