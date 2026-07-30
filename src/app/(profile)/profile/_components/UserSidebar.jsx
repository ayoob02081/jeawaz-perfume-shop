"use client";

import ProfileLayout from "@/components/ProfileLayout";
import ProfileLinks, { ProfileLink } from "@/components/ProfileLinks";
import { useAuth } from "@/contexts/filters/auth/AuthContext";

function UserSidebar() {
  const { user } = useAuth();
  const { role } = user || {};

  const UserProfileLinks = [
    {
      id: 1,
      href: "/profile/orders",
      baseHref: "/profile/orders",
      label: "سفارش های من",
      countUnread: false,
    },
    {
      id: 2,
      href: "/profile/me",
      baseHref: "/profile/me",
      label: "اطلاعات حساب کاربری",
      countUnread: false,
    },
    {
      id: 3,
      href: "/profile/notifs/ALL",
      baseHref: "/profile/notifs",
      label: "پیام‌ها",
      countUnread: true,
    },
  ];
  return (
    <ProfileLayout label="پروفایل کاربری" correctPathName="/profile">
      <ProfileLinks>
        <ProfileLink href={"/profile/me"} userProfileMode />
        {UserProfileLinks?.map((link) => (
          <ProfileLink
            key={link.id}
            href={link.href}
            baseHref={link.baseHref}
            label={link.label}
            countUnread={link.countUnread}
          />
        ))}
        {role === "admin" && (
          <ProfileLink
            href={"/admin"}
            baseHref="/admin"
            label="ادمین"
            srcPrimary="/images/user-stroke-black-icon.svg"
            srcSecondary="/images/user-stroke-black-icon.svg"
            alt="admin-icon"
          />
        )}
        <ProfileLink label="خروج از حساب کاربری" logoutMode />
      </ProfileLinks>
    </ProfileLayout>
  );
}

export default UserSidebar;
