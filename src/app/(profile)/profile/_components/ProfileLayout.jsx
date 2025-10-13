"use client";

import AdaptiveOverlayPage from "@/components/AdaptiveOverlayPage";
import ImageFrame from "@/components/ImageFrame";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

function ProfileLayout() {
  const pathName = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  // const toggleProfile = () => {
  //   setProfileOpen((prevState) => !prevState);
  // };

  if (pathName.startsWith("/profile") && profileOpen === false) {
    setProfileOpen(true);
  }

  return (
    <AdaptiveOverlayPage
      isOpen={profileOpen}
      // onClick={toggleProfile}
      label="پروفایل کاربری"
      side="right"
      className="size-4"
      max="true"
      min="true"
    >
      <ProfileLinks />
    </AdaptiveOverlayPage>
  );
}

export default ProfileLayout;

function UserProfileLink({}) {
  return (
    <div className="flex flex-col items-center justify-center size-full">
      <div className="flex items-center justify-start gap-4 max-lg:py-2 size-full lg:mb-2 lg:py-4 px-4 rounded-3xl">
        <div className="flex items-center justify-between gap-4 w-full h-full">
          <Link
            href={"/profile/me"}
            className="flex items-center justify-between max-lg:gap-2 lg:gap-4"
          >
            <div className="flex items-center justify-center max-lg:size-11 lg:size-14 lg:bg-white lg:rounded-xl">
              <ImageFrame
                src="/images/user-stroke-sec-icon.svg"
                alt="user-icon"
                className="size-6"
              />
            </div>
            <span className="flex flex-col items-start justify-between gap-2 ">
              <p className="max-lg:font-bold ">ایوب محمودیان</p>
              <p className="text-text/40 duration-200">
                {toPersianNumbers("09180522273")}
              </p>
            </span>
          </Link>
          <Link
            href={"/profile/edit"}
            className="flex items-center justify-center"
          >
            <ImageFrame
              src="/images/edit-stroke-icon.svg"
              alt="edit-icon"
              className="size-6"
            />
          </Link>
        </div>
      </div>
      <div className="h-[1.5px] w-full max-lg:hidden bg-stroke-3"></div>
    </div>
  );
}

function ProfileLink({ children, label, src, alt, href }) {
  const pathName = usePathname();

  return (
    <div className="flex flex-col items-center justify-center size-full">
      {label && (
        <div className="h-[1.5px] w-full bg-stroke-3 lg:hidden my-2"></div>
      )}
      <Link
        href={href}
        className={`flex items-center justify-start gap-4
            ${
              label && pathName.startsWith(href)
                ? "bg-dark-brown text-white"
                : "hover:bg-stroke-2 hover:*:*:*:last:*:last:duration-200"
            }
            max-lg:py-2 lg:py-2 size-full ${
              label ? "px-2 rounded-[44px]" : "lg:mb-2 lg:py-4 px-4 rounded-3xl"
            } duration-200`}
      >
        <div className="flex items-center justify-between gap-4 w-full">
          <div
            className={`flex items-center justify-between ${
              label ? "gap-2" : "max-lg:gap-2 lg:gap-4"
            }`}
          >
            <div
              className={`flex items-center justify-center ${
                label
                  ? "size-11"
                  : "max-lg:size-11 lg:size-14 lg:bg-white lg:rounded-xl"
              }`}
            >
              <ImageFrame
                src={src}
                alt={alt}
                className={`${label ? "size-6" : "size-7"}`}
              />
            </div>
            {label && <p>{label}</p>}
            {children}
          </div>
          {label ? (
            <div></div>
          ) : (
            <ImageFrame
              src="/images/edit-stroke-icon.svg"
              alt="edit-icon"
              className="size-6"
            />
          )}
        </div>
      </Link>
      {!label && (
        <div className="h-[1.5px] w-full max-lg:hidden bg-stroke-3"></div>
      )}
    </div>
  );
}

function ProfileLinks() {
  const pathName = usePathname();

  return (
    <div className=" flex items-center justify- gap-2 max-lg:w-full lg:w-fit min-w-xs max-lg:border-t-[1.5px] border-stroke-3 max-lg:*:*:*:first:border-none ">
      <div className="flex flex-col items-start justify-center size-full lg:max-w-xs lg:pb-34 lg:gap-2 max-lg:px-4 py-4 lg:px-4 lg:bg-grey lg:rounded-[1.25rem]">
        <UserProfileLink />
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
          href={"/profile/notifications"}
          label="پیام ها"
          src={`/images/notification-stroke-${
            pathName.startsWith("/profile/notifications") ? "white" : "black"
          }-icon.svg`}
          alt="notification-icon"
        />
        <ProfileLink
          href={"/logout"}
          label="خروج"
          src={`/images/logout-stroke-black-icon.svg`}
          alt="logout-icon"
        />
      </div>
    </div>
  );
}
