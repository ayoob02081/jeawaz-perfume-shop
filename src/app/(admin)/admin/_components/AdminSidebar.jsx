"use client";

import ProfileLayout from "@/components/ProfileLayout";
import ProfileLinks, {
  ProfileLink,
  UserProfileLink,
} from "@/components/ProfileLinks";
import { usePathname } from "next/navigation";

function AdminSidebar() {
  const pathName = usePathname();

  return (
    <ProfileLayout label="پروفایل ادمین" correctPathName="/admin">
      <ProfileLinks>
        <UserProfileLink
          href={"/admin/me"}
          label="ایوب محمودیان"
          phoneNumber="09180522273"
        />
        <ProfileLink
          href={"/admin/orders"}
          label="همه سفارش‌ها"
          src={`/images/orders-stroke-${
            pathName.startsWith("/admin/orders") ? "white" : "black"
          }-icon.svg`}
          alt="orders-icon"
        />
        <ProfileLink
          href={"admin/me"}
          label="اطلاعات حساب‌ها"
          src={`/images/user-serach-stroke-${
            pathName.startsWith("admin/me") ? "white" : "black"
          }-icon.svg`}
          alt="user-icon"
        />
        <ProfileLink
          href={"admin/notifs/all"}
          label="پیام‌ها"
          src={`/images/notification-stroke-${
            pathName.startsWith("admin/notifs") ? "white" : "black"
          }-icon.svg`}
          alt="notification-icon"
        />
        <ProfileLink
          href={"/logout"}
          label="خروج"
          src={`/images/logout-stroke-black-icon.svg`}
          alt="logout-icon"
        />
      </ProfileLinks>
    </ProfileLayout>
  );
}

export default AdminSidebar;
