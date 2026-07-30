"use client";

import {
  useDeleteNotification,
  useGetNotifications,
} from "@/hooks/useNotification";
import { toLocalDateString } from "@/utils/toLocalDate";
import { BoltIcon, TrashIcon } from "@heroicons/react/24/outline";
import { BoltIcon as BoltSolidIcon } from "@heroicons/react/24/solid";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import Loading from "./Loading";

function NotifTypePage({ type }) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  const { data, isPending, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetNotifications();

  const notifications = data?.pages.flatMap((page) => page.data) ?? [];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      {
        root: containerRef.current,
        threshold: 0.1,
      },
    );

    if (bottomRef.current) {
      observer.observe(bottomRef.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  if (isPending) {
    return <Loading />;
  }
  return (
    <div
      ref={containerRef}
      className="flex flex-col items-start justify-start gap-1 w-full max-md:max-h-screen lg:max-h-[50vh] lg:overflow-auto max-lg:rounded-2xl scrollbar--primary"
    >
      {notifications.length > 0 ? (
        notifications?.map(
          (item) =>
            (type === "ALL" || item.notification?.type === type) && (
              <div
                key={item.id}
                className="flex flex-col justify-center gap-1 w-full "
              >
                <NotifTypeCard
                  adminId={item.notification?.id}
                  id={item?.id}
                  type={item.notification?.type}
                  title={item.notification?.title}
                  message={item.notification?.message}
                  isRead={item?.isRead}
                  date={item.createdAt}
                />
                <div className="w-full border-t border-stroke-200"></div>
              </div>
            ),
        )
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

function NotifTypeCard({
  adminId,
  id,
  type,
  date,
  title,
  message,
  isRead,
  className,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isDeleting, removeNotification } = useDeleteNotification(id);

  return (
    <div
      className={`flex items-center justify-between gap-2 py-4 w-full rounded-xl px-4 ${className} ${!isRead && " bg-stroke-150 dark:bg-stroke-100"}`}
    >
      <button
        type="button"
        onClick={() =>
          router.push(
            `${pathname.startsWith("/admin") ? `/admin/notifs/${type}/${adminId}` : `/profile/notifs/${type}/${id}`}`,
          )
        }
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
              className={`max-md:text-sm text-stroke-800 ${!isRead && "font-bold"}`}
            >
              {title}
            </div>
            <div
              className={`text-stroke-400 max-md:text-xs md:text-sm ${!isRead && "font-bold"}`}
            >
              {toLocalDateString(date)}
            </div>
          </div>
          <div
            className={`flex items-center justify-start max-md:text-xs md:text-sm text-stroke-600 ${!isRead && "font-bold"}`}
          >
            {message}
          </div>
        </div>
      </button>
      <button
        type="button"
        // onClick={() => removeNotification(id)}
        className="invisible flex items-center justify-center text-stroke-500 hover:text-primary duration-200"
      >
        <TrashIcon className="size-5  h-full" />
      </button>
    </div>
  );
}
