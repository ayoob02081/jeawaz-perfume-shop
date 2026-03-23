"use client";

import ProfileLayout from "@/components/ProfileLayout";
import ProfileLinks, {
  ProfileLink,
  UserProfileLink,
} from "@/components/ProfileLinks";
import { useGetUser } from "@/hooks/useUsers";
import { usePathname } from "next/navigation";

function UserSidebar() {
  const { data: user, isLoading, error } = useGetUser();
  const { email, firstName, lastName, role } = user || {};
  const UserProfileLinks = [
    {
      id: 1,
      href: "/profile/orders",
      baseHref: "/profile/orders",
      label: "سفارش های من",
    },
    {
      id: 2,
      href: "/profile/me",
      baseHref: "/profile/me",
      label: "اطلاعات حساب کاربری",
    },
    {
      id: 3,
      href: "/profile/notifs/all",
      baseHref: "/profile/notifs",
      label: "پیام‌ها",
    },
    {
      id: 4,
      href: "/logout",
      baseHref: "/logout",
      label: "خروج از حساب کاربری",
    },
  ];

  return (
    <ProfileLayout label="پروفایل کاربری" correctPathName="/profile">
      <ProfileLinks>
        <UserProfileLink
          href={"/profile/me"}
          label={firstName + " " + lastName}
          phoneNumber={email}
          isloading={isLoading}
        />
        {UserProfileLinks?.map((link) => (
          <ProfileLink
            key={link.id}
            href={link.href}
            baseHref={link.baseHref}
            label={link.label}
            srcPrimary={link.srcPrimary}
            srcSecondary={link.srcSecondary}
            alt={link.alt}
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
      </ProfileLinks>
    </ProfileLayout>
  );
}

export default UserSidebar;
