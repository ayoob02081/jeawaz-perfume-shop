"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { normalizeIranPhone, toPersianNumbers } from "@/utils/toPersianNumbers";
import Loading from "./Loading";
import {
  ArrowRightStartOnRectangleIcon,
  ChartPieIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  PencilSquareIcon,
  ReceiptPercentIcon,
  Squares2X2Icon,
  TagIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  UserCircleIcon as UserCircleSolidIcon,
  ChartPieIcon as ChartPieSolidIcon,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightSolidIcon,
  ClipboardDocumentListIcon as ClipboardDocumentListSolidIcon,
  Squares2X2Icon as Squares2X2SolidIcon,
  TagIcon as TagSolidIcon,
  UserGroupIcon as UserGroupSolidIcon,
  UserIcon as UserSolidIcon,
  ReceiptPercentIcon as ReceiptPercentSolidIcon,
} from "@heroicons/react/24/solid";
import { useAuth } from "@/contexts/filters/auth/AuthContext";
import { useUnreadNotificationsCount } from "@/hooks/useNotification";

export default function ProfileSidebarLayout({ children, className }) {
  return (
    <div
      className={`${className} group lg:absolute right-2 z-70 max-lg:h-full max-lg:w-[75vw] group-hover:lg:w-full lg:size-fit lg:shadow-xl lg:border lg:rounded-3xl
       bg-stroke-0 lg:bg-stroke-100 dark:lg:bg-stroke-50 border-stroke-200 transition-all duration-200 **:transition-all **:duration-200 `}
    >
      <div className={`flex flex-col h-full max-lg:pb-6 w-full`}>
        <div className=" flex items-center gap-2 w-full max-lg:*:*:*:first:border-none">
          <div className="flex flex-col items-start justify-center size-full lg:max-w-xs max-lg:pb-34 lg:pb-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileLink({
  children,
  label,
  href,
  baseHref,
  logoutMode,
  profileMode,
  countUnread,
  toggleSideBar,
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const { phoneNumber, firstName, lastName, role } = user || {};
  const isPending = isAuthenticated === null;
  const fullName =
    (isAuthenticated === true && firstName + " " + lastName) ||
    "لطفا وارد شوید";

  const pathName = usePathname();
  const isPathName = pathName.startsWith(baseHref);
  const router = useRouter();
  const LogoutHandler = async () => {
    try {
      await logout();
      router.replace("/");
      localStorage.removeItem("user");
      toggleSideBar();
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const { data: count } = useUnreadNotificationsCount();

  const renderSteps = () => {
    switch (baseHref) {
      case "/admin":
        return <UserCircleSolidIcon className="size-7" />;

      case "/admin/dashboard":
        return isPathName ? (
          <ChartPieSolidIcon className="size-7" />
        ) : (
          <ChartPieIcon className="size-7" />
        );

      case "/admin/orders":
        return isPathName ? (
          <ClipboardDocumentListSolidIcon className="size-7" />
        ) : (
          <ClipboardDocumentListIcon className="size-7" />
        );

      case "/admin/users":
        return isPathName ? (
          <UserGroupSolidIcon className="size-7" />
        ) : (
          <UserGroupIcon className="size-7" />
        );

      case "/admin/products":
        return isPathName ? (
          <Squares2X2SolidIcon className="size-7" />
        ) : (
          <Squares2X2Icon className="size-7" />
        );

      case "/admin/categories":
        return isPathName ? (
          <TagSolidIcon className="size-7" />
        ) : (
          <TagIcon className="size-7" />
        );

      case "/admin/coupons":
        return isPathName ? (
          <ReceiptPercentSolidIcon className="size-7" />
        ) : (
          <ReceiptPercentIcon className="size-7" />
        );

      case "/admin/notifs":
        return isPathName ? (
          <ChatBubbleLeftRightSolidIcon className="size-7" />
        ) : (
          <ChatBubbleLeftRightIcon className="size-7" />
        );

      case "/profile/orders":
        return isPathName ? (
          <ClipboardDocumentListSolidIcon className="size-7" />
        ) : (
          <ClipboardDocumentListIcon className="size-7" />
        );

      case "/profile/me":
        return isPathName ? (
          <UserSolidIcon className="size-7" />
        ) : (
          <UserIcon className="size-7" />
        );

      case "/profile/notifs":
        return isPathName ? (
          <ChatBubbleLeftRightSolidIcon className="size-7" />
        ) : (
          <ChatBubbleLeftRightIcon className="size-7" />
        );

      default:
        break;
    }
  };

  if (logoutMode) {
    return (
      <div className="flex flex-col items-center justify-center size-full p-2 lg:py-1 max-lg:border-t border-stroke-300">
        <button
          onClick={LogoutHandler}
          className="flex items-center justify-start gap-4 hover:bg-stroke-250 **:transition-all **:last:duration-200 text-stroke-800
              py-3 px-1 size-full lg:size-fit group-hover:lg:size-full rounded-[44px] duration-200"
        >
          <div className="flex items-center justify-start gap-2 w-full">
            <ArrowRightStartOnRectangleIcon className="size-10 p-2" />
            <p className="lg:w-0 group-hover:lg:w-fit lg:opacity-0 group-hover:lg:opacity-100 text-nowrap">
              {label}
            </p>
          </div>
        </button>
      </div>
    );
  }

  if (profileMode) {
    return (
      <div className=" flex flex-col items-center justify-center size-full px-6 lg:px-2">
        <div className="flex items-center justify-start py-4 lg:pt-6 size-full rounded-3xl">
          <div className="flex items-center max-lg:justify-between justify-start lg:-translate-x-1 group-hover:lg:translate-x-0 w-full h-full group-hover:lg:gap-12">
            <Link
              onClick={toggleSideBar}
              href={"/profile/me"}
              className="flex items-center justify-between max-lg:gap-4 lg:gap-4"
            >
              <UserIcon className="p-3 text-stroke-800 size-14 bg-stroke-150 lg:bg-stroke-0 rounded-xl" />
              {isPending ? (
                <Loading
                  height={2}
                  size={8}
                  width={2}
                  className="w-fit! h-full! lg:hidden"
                />
              ) : (
                <span className="flex flex-col items-start justify-between gap-2 max-[365px]:w-44 lg:gap-0 group-hover:gap-2 lg:translate-x-25 group-hover:lg:translate-x-0 lg:opacity-0 lg:w-0 group-hover:lg:opacity-100 group-hover:lg:w-fit transition-all duration-200">
                  <p className="max-lg:font-bold text-stroke-800 text-nowrap ">
                    {fullName}
                  </p>
                  <p className="text-stroke-800/40 overflow-x-auto w-full pt-px scrollbar-none text-nowrap duration-200">
                    {phoneNumber ? normalizeIranPhone(phoneNumber) : "-"}
                  </p>
                </span>
              )}
            </Link>
            <Link
              onClick={toggleSideBar}
              href={"/profile/me"}
              className="flex items-center justify-center lg:opacity-0 lg:w-0 group-hover:lg:opacity-100 group-hover:lg:w-fit transition-all duration-200"
            >
              <PencilSquareIcon className="size-6 text-stroke-800 hover:text-success active:text-success duration-200" />
            </Link>
          </div>
        </div>
        <div className="w-full lg:w-0 group-hover:lg:w-full max-lg:hidden max-lg:border-t lg:border-0 group-hover:lg:border-t border-stroke-300"></div>
      </div>
    );
  }

  return (
    <div className=" flex flex-col items-center justify-center size-full p-2 lg:py-1 max-lg:border-t border-stroke-300 transition-all duration-200">
      <Link
        onClick={toggleSideBar}
        href={href}
        className={`flex items-center justify-start gap-4
            ${
              isPathName
                ? "bg-stroke-900 dark:bg-stroke-200 text-stroke-0 dark:text-stroke-800"
                : "hover:bg-stroke-250 **:transition-all **:duration-200 text-stroke-800"
            }    
            max-lg:py-2 lg:py-2 size-full lg:w-fit group-hover:lg:size-full px-2 rounded-full transition-all duration-200`}
      >
        <div className="relative flex items-center justify-start w-full gap-2 lg:gap-0 group-hover:gap-2">
          <div className="flex items-center justify-center size-11">
            <>{renderSteps()}</>
          </div>
          <div className="flex items-center justify-between w-full lg:opacity-0 lg:w-0 group-hover:lg:opacity-100 group-hover:lg:w-fit lg:translate-x-20 group-hover:lg:translate-x-0 text-nowrap transition-all duration-200">
            <p>{label}</p>
          </div>
          {!pathName.startsWith("/admin") &&
            countUnread &&
            count?.total > 0 && (
              <div className="shrink grow flex items-center justify-end">
                <div
                  className={`${isPathName ? "bg-stroke-0 text-primary dark:text-white " : "bg-primary dark:bg-stroke-200 text-white"} lg:absolute lg:left-0 lg:top-1 group-hover:lg:static flex items-center justify-center max-lg:text-sm max-lg:px-2.5 px-3 lg:px-1 lg:size-2 group-hover:lg:size-7 aspect-square rounded-full font-bold`}
                >
                  <p className="translate-y-px lg:w-0 lg:opacity-0 group-hover:lg:w-fit group-hover:lg:opacity-100">
                    {toPersianNumbers(count?.total)}
                  </p>
                </div>
              </div>
            )}
          {children}
        </div>
      </Link>
    </div>
  );
}
