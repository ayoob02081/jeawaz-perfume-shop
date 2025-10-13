"use client";

import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function EditPage() {
  const pathName = usePathname();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const toggleEditPage = () => {
    setEditProfileOpen((prevState) => !prevState);
  };

  if (pathName === "/profile/edit" && editProfileOpen === false) {
    setEditProfileOpen(true);
  }

  return (
    <AdaptiveOverlayPage
      isOpen={editProfileOpen}
      onClick={toggleEditPage}
      label="ویرایش اطلاعات کاربری"
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
