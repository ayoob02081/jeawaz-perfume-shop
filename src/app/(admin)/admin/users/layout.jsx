"use client";

import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function RootLayout({ children }) {
  const pathName = usePathname();
  const [openUsers, setOpenUsers] = useState(false);

  if (pathName.startsWith("/admin/users") && openUsers === false) {
    setOpenUsers(true);
  }

  return (
    <AdaptiveOverlayPage
      isOpen={openUsers}
      label="کاربران"
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
