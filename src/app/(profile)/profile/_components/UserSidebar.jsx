"use client";

import ProfileLayout from "@/components/ProfileLayout";
import ProfileLinks, {
  ProfileLink,
  UserProfileLink,
} from "@/components/ProfileLinks";
import { useGetUser } from "@/hooks/useUsers";
import { usePathname } from "next/navigation";

function UserSidebar() {
  const pathName = usePathname();
  const { data, isPending, error } = useGetUser();
  const userRole = data?.role;
  const UserProfileLinks = [
    {
      id: 1,
      href: "/profile/orders",
      label: "سفارش های من",
      srcPrimary: "/images/orders-stroke-white-icon.svg",
      srcSecondary: "/images/orders-stroke-black-icon.svg",
      alt: "orders-icon",
    },
    {
      id: 2,
      href: "/profile/me",
      label: "اطلاعات حساب کاربری",
      srcPrimary: "/images/user-serach-stroke-white-icon.svg",
      srcSecondary: "/images/user-serach-stroke-black-icon.svg",
      alt: "user-icon",
    },
    {
      id: 3,
      href: "/profile/notifs/all",
      label: "پیام‌ها",
      srcPrimary: "/images/notification-stroke-white-icon.svg",
      srcSecondary: "/images/notification-stroke-black-icon.svg",
      alt: "notif-icon",
    },
    {
      id: 4,
      href: "/logout",
      label: "خروج از حساب کاربری",
      srcPrimary: "/images/logout-stroke-black-icon.svg",
      srcSecondary: "/images/logout-stroke-black-icon.svg",
      alt: "logout-icon",
    },
  ];
  return (
    <ProfileLayout label="پروفایل کاربری" correctPathName="/profile">
      <ProfileLinks>
        <UserProfileLink
          href={"/profile/me"}
          label="ایوب محمودیان"
          phoneNumber="09180522273"
        />
        {UserProfileLinks?.map((link) => (
          <ProfileLink
            key={link.id}
            href={link.href}
            label={link.label}
            srcPrimary={link.srcPrimary}
            srcSecondary={link.srcSecondary}
            alt={link.alt}
          />
        ))}
        {userRole === "admin" && (
          <ProfileLink
            href={"/admin"}
            label="ادمین"
            srcPrimary="/images/user-stroke-black-icon.svg"
            srcSecondary="/images/user-stroke-black-icon.svg"
            alt="admin-icon"
          />
        )}
      </ProfileLinks>
    </ProfileLayout>
  );
}

export default UserSidebar;
