"use client";

import { useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PlusIcon } from "@heroicons/react/24/outline";
import Error from "@/components/Error";
import Loading from "@/components/Loading";
import NotExisted from "@/components/NotExisted";
import PagesNumber from "@/components/PagesNumber";
import { useGetAdminNotifications } from "@/hooks/useNotification";
import {
  ADMIN_NOTIFICATION_PAGE_LIMIT,
  NOTIFICATION_TYPES,
  getAdminNotificationTotalPages,
  hasActiveNotificationFilters,
  notificationTypeLabel,
  parseAdminNotificationQuery,
} from "@/utils/notificationsContract.mjs";
import AdminNotificationsFilters from "./AdminNotificationsFilters";
import AdminNotificationsListTable from "./AdminNotificationsListTable";

const TYPE_TABS = [
  { value: "ALL", label: "همه" },
  ...NOTIFICATION_TYPES.map((value) => ({
    value,
    label: notificationTypeLabel(value),
  })),
];

// Notifications the admins and the system created: one row per Notification
// (never a recipient row). The type is the route segment; page, channel,
// target and search live in the URL.
function AdminNotificationsLayout() {
  const router = useRouter();
  const { type: routeType } = useParams();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const query = useMemo(
    () => parseAdminNotificationQuery(routeType, searchParams),
    [routeType, searchParams],
  );

  const navigate = useCallback(
    (type, updates = {}) => {
      const params = new URLSearchParams(search);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      const queryString = params.toString();
      router.replace(
        `/admin/notifs/${type}${queryString ? `?${queryString}` : ""}`,
        { scroll: false },
      );
    },
    [router, search],
  );

  const currentType = query.type ?? "ALL";

  // Any filter change starts again at page 1.
  const setType = (type) => navigate(type, { page: undefined });
  const setFilter = useCallback(
    (key, value) => navigate(currentType, { [key]: value, page: undefined }),
    [navigate, currentType],
  );
  const setPage = (page) =>
    navigate(currentType, { page: page > 1 ? page : undefined });
  const resetFilters = () =>
    router.replace(`/admin/notifs/${currentType}`, { scroll: false });

  const { data, isLoading, isFetching, isError, refetch } =
    useGetAdminNotifications({
      ...query,
      limit: ADMIN_NOTIFICATION_PAGE_LIMIT,
    });

  const rows = data?.data ?? [];
  const totalPages = isLoading ? 0 : getAdminNotificationTotalPages(data);

  return (
    <div className="flex flex-col justify-between gap-4 lg:gap-6 max-lg:w-full lg:w-[calc(100%-88px)] 2xl:w-[calc(100%-270px)] lg:px-4 2xl:px-0 pt-0 pb-10">
      <div className="flex items-center justify-between gap-2 px-4">
        <h1 className="font-bold text-xl text-stroke-800">مدیریت اعلان‌ها</h1>
        <button
          type="button"
          onClick={() => router.push("/admin/notifs/add")}
          className="btn btn--primary border gap-1 px-2 py-1"
        >
          <PlusIcon className="size-3 md:size-3.5 stroke-3" />
          <p className="text-xs md:text-sm">اعلان جدید</p>
        </button>
      </div>

      <div className="flex items-center justify-start gap-3 overflow-x-auto scrollbar-none px-4 py-1 w-full text-nowrap">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setType(tab.value)}
            aria-pressed={currentType === tab.value}
            className={`flex items-center justify-center px-4 h-9 rounded-lg lg:rounded-3xl text-sm font-bold ${
              currentType === tab.value
                ? "max-lg:bg-primary max-lg:text-white lg:border lg:border-primary lg:text-primary"
                : "max-lg:bg-primary/10 lg:border lg:border-stroke-250 lg:bg-stroke-100 dark:lg:bg-stroke-50 text-stroke-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AdminNotificationsFilters
        query={query}
        onFilterChange={setFilter}
        onReset={resetFilters}
        isUpdating={isFetching && !isLoading}
      />

      {isError ? (
        <Error onRetry={() => refetch()} />
      ) : isLoading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <NotExisted className="h-60">
          {hasActiveNotificationFilters(query)
            ? "اعلانی با این جستجو یا فیلترها پیدا نشد"
            : "اعلانی وجود ندارد!"}
        </NotExisted>
      ) : (
        <div className="size-full max-lg:px-4">
          <AdminNotificationsListTable
            notifications={rows}
            page={query.page}
            limit={ADMIN_NOTIFICATION_PAGE_LIMIT}
          />
        </div>
      )}

      <PagesNumber
        page={query.page}
        setPage={setPage}
        totalPages={totalPages}
        isLoading={isFetching}
      />
    </div>
  );
}

export default AdminNotificationsLayout;
