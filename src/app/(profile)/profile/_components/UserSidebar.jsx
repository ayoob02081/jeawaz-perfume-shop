"use client";

import ProfileSidebarLayout, { ProfileLink } from "@/components/ProfileLinks";
import { useAuth } from "@/contexts/auth/AuthContext";

function UserSidebar({ className, toggleSidebar }) {
  const { user } = useAuth();
  const { role } = user || {};

  const UserProfileLinks = [
    {
      id: 1,
      href: "/profile/me",
      baseHref: "/profile/me",
      label: "اطلاعات کاربری",
      countUnread: false,
    },
    {
      id: 2,
      href: "/profile/orders",
      baseHref: "/profile/orders",
      label: "سفارش های من",
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
    <ProfileSidebarLayout className={className}>
      <ProfileLink href={"/profile/me"} profileMode="user" />
      {UserProfileLinks?.map((link) => (
        <ProfileLink
          key={link.id}
          href={link.href}
          baseHref={link.baseHref}
          label={link.label}
          countUnread={link.countUnread}
          toggleSidebar={toggleSidebar}
        />
      ))}
      {role === "admin" && (
        <ProfileLink
          href={"/admin/dashboard"}
          baseHref="/admin"
          label="ادمین"
          srcPrimary="/images/user-stroke-black-icon.svg"
          srcSecondary="/images/user-stroke-black-icon.svg"
          alt="admin-icon"
          toggleSidebar={toggleSidebar}
        />
      )}
      <ProfileLink label="خروج از حساب کاربری" logoutMode />
    </ProfileSidebarLayout>
  );
}

export default UserSidebar;
