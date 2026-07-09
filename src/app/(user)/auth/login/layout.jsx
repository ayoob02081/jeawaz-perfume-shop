"use client";

import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function RootLayout({ children }) {
  const pathName = usePathname();
  const [openMeProfile, setOpenMeProfile] = useState(false);

  if (pathName.startsWith("/auth/login") && openMeProfile === false) {
    setOpenMeProfile(true);
  }

  return (
    <AdaptiveOverlayPage
      isOpen={openMeProfile}
      side="right"
      label="ورود | ثبت نام"
      className="size-4"
      fontStyle="text-lg sm:text-2xl font-bold"
      justify="between"
      overflow="overflow-y-auto"
      max={false}
      product
    >
      {children}
    </AdaptiveOverlayPage>
  );
}
