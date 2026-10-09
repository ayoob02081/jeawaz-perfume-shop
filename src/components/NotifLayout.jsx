"use client";

import NotifTypes from "@/components/NotifTypes";
import {
  useMarkAllNotificationsAsRead,
  useUnreadNotificationsCount,
} from "@/hooks/useNotification";

// The customer inbox frame (profile). Admin management has its own layout.
function NotifLayout({ children }) {
  const { data } = useUnreadNotificationsCount();
  const { markAllAsRead, isMarkingAll } = useMarkAllNotificationsAsRead();

  return (
    <div className="flex flex-col items-center justify-start w-full max-lg:px-4">
      <div className="flex flex-col items-start justify-start lg:rounded-3xl lg:p-4 pb-28 w-full">
        <div className=" flex items-center justify-between w-full">
          <h1 className="font-bold text-stroke-800">پیام ها</h1>
          <button
            type="button"
            onClick={() => markAllAsRead()}
            disabled={isMarkingAll || data?.total <= 0}
            className="btn btn--primary--2 px-2 border border-primary disabled:text-stroke-400 disabled:border-stroke-300"
          >
            خواندن همه
          </button>
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
