import ProfileLayout from "@/components/ProfileLayout";
import ProfileLinks, { ProfileLink } from "@/components/ProfileLinks";

function AdminSidebar() {
  const AdminProfileLinks = [
    {
      id: 1,
      href: "/admin/orders",
      baseHref: "/admin/orders",
      label: "همه سفارش‌ها",
      countUnread: false,
    },
    {
      id: 2,
      href: "/admin/users",
      baseHref: "/admin/users",
      label: "همه حساب‌ها",
      countUnread: false,
    },
    {
      id: 3,
      href: "/admin/notifs/ALL",
      baseHref: "/admin/notifs",
      label: "پیام‌ها",
      countUnread: true,
    },
    {
      id: 4,
      href: "/admin/products",
      baseHref: "/admin/products",
      label: "محصولات",
      countUnread: false,
    },
    {
      id: 5,
      href: "/admin/categories",
      baseHref: "/admin/categories",
      label: "دسته‌بندی‌ها",
      countUnread: false,
    },
    {
      id: 6,
      href: "/admin/coupons",
      baseHref: "/admin/coupons",
      label: "کد تخفیف‌ها",
      countUnread: false,
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
            countUnread={link.countUnread}
          />
        ))}
      </ProfileLinks>
    </ProfileLayout>
  );
}

export default AdminSidebar;
