"use client";

import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function NotificationsPage() {
  const pathName = usePathname();
  const [openNotifications, setOpenNotifications] = useState(false);
  const toggleNotificationsPage = () => {
    setOpenNotifications((prevState) => !prevState);
  };

  if (pathName === "/profile/notifications" && openNotifications === false) {
    setOpenNotifications(true);
  }

  return (
    <AdaptiveOverlayPage
      isOpen={openNotifications}
      onClick={toggleNotificationsPage}
      label="پیام‌ها"
      side="right"
      className="size-4"
      fontStyle="text-base font-normal"
      justify="between"
      max="true"
      min="true"
    >
      EditPage
    </AdaptiveOverlayPage>
  );
}
