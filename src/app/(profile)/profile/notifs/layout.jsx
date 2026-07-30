"use client";

import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";
import NotifLayout from "@/components/NotifLayout";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function NotifsPageLayout({ children }) {
  const pathName = usePathname();
  const [openNotifs, setOpenNotifs] = useState(false);

  if (pathName.startsWith("/profile/notifs") && openNotifs === false) {
    setOpenNotifs(true);
  }

  return (
    <AdaptiveOverlayPage
      isOpen={openNotifs}
      label="پیام‌ها"
      side="right"
      className="size-4"
      fontStyle="text-base font-bold"
      justify="between"
      overflow="overflow-y-auto"
      defaultStyle="p-0"
    >
      <NotifLayout>{children}</NotifLayout>
    </AdaptiveOverlayPage>
  );
}
