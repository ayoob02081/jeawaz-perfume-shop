"use client";

import ProfileLayout from "@/components/ProfileLayout";
import ProfileLinks, {
  ProfileLink,
  UserProfileLink,
} from "@/components/ProfileLinks";
import { usePathname } from "next/navigation";

function ProfileSidebar() {
  const pathName = usePathname();

  return (
    <ProfileLayout label="پروفایل کاربری" correctPathName="/profile">
      <ProfileLinks>
        <UserProfileLink
          href={"/profile/me"}
          label="ایوب محمودیان"
          phoneNumber="09180522273"
        />
        <ProfileLink
          href={"/profile/orders"}
          label="سفارش های من"
          src={`/images/orders-stroke-${
            pathName.startsWith("/profile/orders") ? "white" : "black"
          }-icon.svg`}
          alt="orders-icon"
        />
        <ProfileLink
          href={"/profile/me"}
          label="اطلاعات حساب کاربری"
          src={`/images/user-serach-stroke-${
            pathName.startsWith("/profile/me") ? "white" : "black"
          }-icon.svg`}
          alt="user-icon"
        />
        <ProfileLink
          href={"/profile/notifs/all"}
          label="پیام ها"
          src={`/images/notification-stroke-${
            pathName.startsWith("/profile/notifs") ? "white" : "black"
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

export default ProfileSidebar;
