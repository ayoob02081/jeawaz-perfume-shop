"use client";

import ProfileLayout from "@/components/ProfileLayout";
import ProfileLinks, {
  ProfileLink,
  UserProfileLink,
} from "@/components/ProfileLinks";
import { useGetUser } from "@/hooks/useUsers";

function AdminSidebar() {
  const { data: user, isLoading, error } = useGetUser();
  const { email, firstName, lastName, role } = user || {};
  const AdminProfileLinks = [
    {
      id: 1,
      href: "/admin/orders",
      baseHref: "/admin/orders",
      label: "همه سفارش‌ها",
    },
    {
      id: 2,
      href: "/admin/users",
      baseHref: "/admin/users",
      label: "همه حساب‌ها",
    },
    {
      id: 3,
      href: "/admin/products",
      baseHref: "/admin/products",
      label: "محصولات",
    },
    {
      id: 4,
      href: "/admin/categories",
      baseHref: "/admin/categories",
      label: "دسته‌بندی‌ها",
    },
    {
      id: 5,
      href: "/admin/notifs/all",
      baseHref: "/admin/notifs",
      label: "پیام‌ها",
    },
    {
      id: 6,
      href: "/logout",
      baseHref: "/logout",
      label: "خروج از حساب کاربری",
    },
  ];

  return (
    <ProfileLayout label="پروفایل ادمین" correctPathName="/admin">
      <ProfileLinks>
        <UserProfileLink
          href={"/profile/me"}
          label={firstName + " " + lastName}
          phoneNumber={email}
          isloading={isLoading}
        />
        {AdminProfileLinks?.map((link) => (
          <ProfileLink
            key={link.id}
            href={link.href}
            label={link.label}
            baseHref={link.baseHref}
            srcPrimary={link.srcPrimary}
            srcSecondary={link.srcSecondary}
            alt={link.alt}
          />
        ))}
      </ProfileLinks>
    </ProfileLayout>
  );
}

export default AdminSidebar;
