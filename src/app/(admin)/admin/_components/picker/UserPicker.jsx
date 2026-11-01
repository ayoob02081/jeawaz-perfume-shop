"use client";

import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useAdminUserPickerSearch } from "@/hooks/useUsers";
import { normalizeIranPhone, toPersianNumbers } from "@/utils/toPersianNumbers";
import {
  PICKER_SEARCH_DEBOUNCE_MS,
  buildUserPickerParams,
  mergePages,
  toUserSnapshot,
} from "@/utils/entityPickerContract.mjs";
import EntityPickerModal from "./EntityPickerModal";

export const userDisplayName = (snapshot) =>
  snapshot.fullName || normalizeIranPhone(snapshot.phoneNumber) || "بدون نام";

// Only what identifies a user safely; the badges come from the search row.
function userBadges(user) {
  const badges = [];
  if (user?.accountStatus === "banned") {
    badges.push({ label: "مسدود", className: "border-error text-error" });
  }
  if (user?.phoneVerified === false) {
    badges.push({ label: "احراز نشده", className: "border-orange text-orange" });
  }
  if (user?.role === "admin") {
    badges.push({ label: "ادمین", className: "border-success text-success" });
  }
  return badges;
}

export function UserSummary({ user, badges = [] }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-1.5">
        <p className="font-bold text-sm truncate">{user.fullName || "بدون نام"}</p>
        {badges.map((badge) => (
          <span
            key={badge.label}
            className={`px-1.5 rounded-full border text-xs ${badge.className}`}
          >
            {badge.label}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 text-xs text-stroke-500">
        {user.phoneNumber && (
          <span dir="ltr">{normalizeIranPhone(user.phoneNumber)}</span>
        )}
        {user.email && (
          <span dir="ltr" className="truncate">
            {user.email}
          </span>
        )}
      </div>
    </div>
  );
}

function UserPicker({ isOpen, onClose, value, onConfirm }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, PICKER_SEARCH_DEBOUNCE_MS);

  const params = buildUserPickerParams({ search: debouncedSearch });
  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useAdminUserPickerSearch(params, { enabled: isOpen });

  const users = mergePages(data?.pages);

  return (
    <EntityPickerModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      value={value}
      title="انتخاب کاربران"
      entityLabel="کاربر"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="نام، نام خانوادگی، موبایل یا ایمیل…"
      items={users}
      getSnapshot={toUserSnapshot}
      getItemName={userDisplayName}
      renderItem={(user) => (
        <UserSummary user={toUserSnapshot(user)} badges={userBadges(user)} />
      )}
      renderSelectedItem={(snapshot) => <UserSummary user={snapshot} />}
      emptyText="کاربری پیدا نشد"
      status={{
        isLoading,
        isFetching,
        isError,
        onRetry: () => refetch(),
        hasNextPage,
        onLoadMore: () => fetchNextPage(),
        isLoadingMore: isFetchingNextPage,
        summary: data ? `${toPersianNumbers(users.length)} کاربر نمایش داده شد` : "",
      }}
    />
  );
}

export default UserPicker;
