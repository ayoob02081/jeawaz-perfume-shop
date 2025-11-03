"use client";

import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";
import { usePathname } from "next/navigation";
import { useState } from "react";

function ProfileLayout({ children, label, correctPathName }) {
  const pathName = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  if (pathName.startsWith(correctPathName) && profileOpen === false) {
    setProfileOpen(true);
  }

  return (
    <AdaptiveOverlayPage
      isOpen={profileOpen}
      label={label}
      side="right"
      className="size-4"
      max="true"
      min="true"
    >
      {children}
    </AdaptiveOverlayPage>
  );
}

export default ProfileLayout;
