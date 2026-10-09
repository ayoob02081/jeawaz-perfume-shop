"use client";

import { useGetNotifications } from "@/hooks/useNotification";
import { toLocalDateString } from "@/utils/toLocalDate";
import { BoltIcon } from "@heroicons/react/24/outline";
import { BoltIcon as BoltSolidIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import Error from "./Error";
import Loading from "./Loading";

// The signed-in user's inbox (GET /notifications); `type` is filtered on the
// server, so every loaded page holds only that type. Admin management has
// its own list (admin/notifs/_components).
function NotifTypePage({ type }) {
  const bottomRef = useRef(null);

  const {
    data,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetNotifications(type);

  const notifications = data?.pages.flatMap((page) => page.data ?? []) ?? [];
  const loadedPages = data?.pages.length ?? 0;

  // Re-armed after every page: a sentinel that is still visible (a short
  // page) loads the next one too. The viewport root also honours the list's
  // own scroll clipping.
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !bottomRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchNextPage();
      },
      { threshold: 0.1 },
    );
    observer.observe(bottomRef.current);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, loadedPages]);

  if (isPending) {
    return <Loading />;
  }

  // A failed request is not an empty inbox.
  if (isError && !notifications.length) {
    return <Error onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col items-start justify-start gap-1 w-full max-md:max-h-dvh lg:max-h-[50dvh] overflow-auto max-lg:rounded-2xl scrollbar-none">
      {notifications.length > 0 ? (
        notifications.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-center gap-1 w-full "
          >
            <NotifTypeCard
              id={item.id}
              type={item.notification?.type}
              title={item.notification?.title}
              message={item.notification?.message}
              isRead={item.isRead}
              date={item.createdAt}
            />
            <div className="w-full border-t border-stroke-200"></div>
          </div>
        ))
      ) : (
        <div className="flex items-center justify-center size-full h-40">
          <p>اعلانی وجود ندارد!</p>
        </div>
      )}
      <div className="h-2 w-full" ref={bottomRef}></div>
    </div>
  );
}

export default NotifTypePage;

function NotifTypeCard({ id, type, date, title, message, isRead }) {
  const router = useRouter();

  return (
    <div
      className={`flex items-center justify-between gap-2 py-4 w-full rounded-xl px-4 ${!isRead ? "bg-stroke-150" : ""}`}
    >
      <button
        type="button"
        onClick={() => router.push(`/profile/notifs/${type}/${id}`)}
        className="flex items-start justify-start gap-2 w-full"
      >
        <div className="flex items-end justify-center h-full">
          <div className="flex items-center justify-center bg-red/10 max-md:size-10 md:size-9 rounded-lg max-md:min-w-10 md:min-w-9">
            {isRead ? (
              <BoltIcon className="max-md:size-5 size-4 text-primary" />
            ) : (
              <BoltSolidIcon className="max-md:size-5 size-4 text-primary" />
            )}
          </div>
        </div>
        <div className="flex flex-col items-start justify-start gap-3 ">
          <div className="flex items-center justify-start gap-2">
            <div
              className={`max-md:text-sm text-stroke-800 ${!isRead ? "font-bold" : ""}`}
            >
              {title}
            </div>
            <div
              className={`text-stroke-400 max-md:text-xs md:text-sm ${!isRead ? "font-bold" : ""}`}
            >
              {toLocalDateString(date)}
            </div>
          </div>
          <div
            className={`flex items-center justify-start max-md:text-xs md:text-sm text-stroke-600 ${!isRead ? "font-bold" : ""}`}
          >
            {message}
          </div>
        </div>
      </button>
    </div>
  );
}
