import ProfileSidebarLayout, { ProfileLink } from "@/components/ProfileLinks";

function AdminSidebar({ className, toggleSideBar }) {
  const AdminProfileLinks = [
    {
      id: 2,
      href: "/admin/dashboard",
      baseHref: "/admin/dashboard",
      label: "داشبورد",
      countUnread: false,
    },
    {
      id: 3,
      href: "/admin/orders",
      baseHref: "/admin/orders",
      label: "سفارشات کاربران",
      countUnread: false,
    },
    {
      id: 4,
      href: "/admin/campaigns",
      baseHref: "/admin/campaigns",
      label: "کمپین‌ها",
      countUnread: false,
    },
    {
      id: 5,
      href: "/admin/users",
      baseHref: "/admin/users",
      label: "حساب‌ کاربران",
      countUnread: false,
    },
    {
      id: 6,
      href: "/admin/notifs/ALL",
      baseHref: "/admin/notifs",
      label: "مدیریت پیام",
      countUnread: true,
    },
    {
      id: 7,
      href: "/admin/products",
      baseHref: "/admin/products",
      label: "محصولات",
      countUnread: false,
    },
    {
      id: 8,
      href: "/admin/categories",
      baseHref: "/admin/categories",
      label: "دسته‌بندی‌ها",
      countUnread: false,
    },
    {
      id: 9,
      href: "/admin/coupons",
      baseHref: "/admin/coupons",
      label: "کد تخفیف‌ها",
      countUnread: false,
    },
    {
      id: 10,
      href: "/admin/banners",
      baseHref: "/admin/banners",
      label: "بنرها",
      countUnread: false,
    },
  ];

  return (
    <ProfileSidebarLayout className={className}>
      <ProfileLink href={"/profile/me"} profileMode="admin" />
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
          toggleSideBar={toggleSideBar}
        />
      ))}
    </ProfileSidebarLayout>
  );
}

export default AdminSidebar;
