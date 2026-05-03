import ProfileLayout from "@/components/ProfileLayout";
import ProfileLinks, { ProfileLink } from "@/components/ProfileLinks";

function AdminSidebar() {
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
  ];

  return (
    <ProfileLayout label="پروفایل ادمین" correctPathName="/admin">
      <ProfileLinks>
        <ProfileLink href={"/profile/me"} userProfileMode />
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
        <ProfileLink label="خروج از حساب کاربری" logoutMode />
      </ProfileLinks>
    </ProfileLayout>
  );
}

export default AdminSidebar;
