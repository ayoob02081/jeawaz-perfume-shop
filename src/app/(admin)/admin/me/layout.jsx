"use client";

import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function RootLayout({ children }) {
  const pathName = usePathname();
  const [openMeProfile, setOpenMeProfile] = useState(false);

  if (pathName.startsWith("/admin/me") && openMeProfile === false) {
    setOpenMeProfile(true);
  }

  return (
    <AdaptiveOverlayPage
      isOpen={openMeProfile}
      label="اطلاعات کاربری"
      side="right"
      className="size-4"
      fontStyle="text-base font-normal"
      justify="between"
      overflow="overflow-y-auto"
      max="true"
      min="true"
    >
      {children}
    </AdaptiveOverlayPage>
  );
}
