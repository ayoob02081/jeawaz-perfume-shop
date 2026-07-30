"use client";

import NotifTypes from "@/components/NotifTypes";
import {
  useMarkAllNotificationsAsRead,
  useUnreadNotificationsCount,
} from "@/hooks/useNotification";
import { PlusIcon } from "@heroicons/react/24/outline";
import { usePathname, useRouter } from "next/navigation";

function NotifLayout({ children }) {
  const { data } = useUnreadNotificationsCount();
  const { markAllAsRead, isMarkingAll } = useMarkAllNotificationsAsRead();
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div className="flex flex-col items-center justify-start w-full">
      <div className="relative flex flex-col items-start justify-start lg:rounded-3xl lg:p-4 pb-28 bg-stroke-0 w-full">
        <div className=" flex items-center justify-between w-full">
          <h1 className="max-lg:hidden font-bold text-stroke-800">پیام ها</h1>
          {!pathname.startsWith("admin") ? (
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={data?.total <= 0}
              className="max-lg:fixed top-4 left-4 z-10 btn btn--primary--2 px-2 border border-primary disabled:text-stroke-400 disabled:border-stroke-300"
            >
              خواندن همه
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/admin/notifs/add")}
              className="max-lg:fixed top-4 left-4 z-10 btn btn--primary border gap-1 px-2 py-1"
            >
              <PlusIcon className="size-3 md:size-3.5 stroke-3" />
              <p className="text-xs md:text-sm">اعلان جدید</p>
            </button>
          )}
        </div>
        <div className="flex flex-col justify-center w-full">
          <NotifTypes data={data} />
          {children}
        </div>
      </div>
    </div>
  );
}

export default NotifLayout;
