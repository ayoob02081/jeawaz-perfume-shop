import ProfileLayout from "@/components/ProfileLayout";
import ProfileLinks, { ProfileLink } from "@/components/ProfileLinks";

function AdminSidebar() {
  const AdminProfileLinks = [
    {
      id: 1,
      href: "/admin/orders",
      label: "همه سفارش‌ها",
      srcPrimary: "/images/orders-stroke-white-icon.svg",
      srcSecondary: "/images/orders-stroke-black-icon.svg",
      alt: "orders-icon",
    },
    {
      id: 2,
      href: "/admin/users",
      label: "همه حساب‌ها",
      srcPrimary: "/images/user-serach-stroke-white-icon.svg",
      srcSecondary: "/images/user-serach-stroke-black-icon.svg",
      alt: "user-icon",
    },
    {
      id: 3,
      href: "/admin/products",
      label: "محصولات",
      srcPrimary: "/images/category.svg",
      srcSecondary: "/images/category.svg",
      alt: "products-icon",
    },
    {
      id: 4,
      href: "/admin/categories",
      label: "دسته‌بندی‌ها",
      srcPrimary: "/images/orders-stroke-white-icon.svg",
      srcSecondary: "/images/orders-stroke-black-icon.svg",
      alt: "orders-icon",
    },
    {
      id: 5,
      href: "/admin/accord-groups",
      label: "رایحه‌ها",
      srcPrimary: "/images/orders-stroke-white-icon.svg",
      srcSecondary: "/images/orders-stroke-black-icon.svg",
      alt: "orders-icon",
    },
    {
      id: 6,
      href: "/admin/notifs/all",
      label: "پیام‌ها",
      srcPrimary: "/images/notification-stroke-white-icon.svg",
      srcSecondary: "/images/notification-stroke-black-icon.svg",
      alt: "notif-icon",
    },
    {
      id: 7,
      href: "/logout",
      label: "خروج از حساب کاربری",
      srcPrimary: "/images/logout-stroke-black-icon.svg",
      srcSecondary: "/images/logout-stroke-black-icon.svg",
      alt: "logout-icon",
    },
  ];

  return (
    <ProfileLayout label="پروفایل ادمین" correctPathName="/admin">
      <ProfileLinks>
        {/* <UserProfileLink
          href={"/admin/me"}
          label="ایوب محمودیان"
          phoneNumber="09180522273"
        /> */}
        {AdminProfileLinks?.map((link) => (
          <ProfileLink
            key={link.id}
            href={link.href}
            label={link.label}
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
