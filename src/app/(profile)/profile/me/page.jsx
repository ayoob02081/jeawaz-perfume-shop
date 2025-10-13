"use client";

import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function MePage() {
  const pathName = usePathname();
  const [openMeProfile, setOpenMeProfile] = useState(false);
  const toggleMePage = () => {
    setOpenMeProfile((prevState) => !prevState);
  };

  if (pathName === "/profile/me" && openMeProfile === false) {
    setOpenMeProfile(true);
  }

  return (
    <AdaptiveOverlayPage
      isOpen={openMeProfile}
      onClick={toggleMePage}
      label="اطلاعات کاربری"
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
