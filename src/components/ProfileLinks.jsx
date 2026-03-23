"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AppImage from "./AppImage";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import Loading from "./Loading";
import {
  ArrowRightStartOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  PencilSquareIcon,
  Squares2X2Icon,
  TagIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightSolidIcon,
  ClipboardDocumentListIcon as ClipboardDocumentListSolidIcon,
  Squares2X2Icon as Squares2X2SolidIcon,
  TagIcon as TagSolidIcon,
  UserGroupIcon as UserGroupSolidIcon,
  UserIcon as UserSolidIcon,
} from "@heroicons/react/24/solid";

export default function ProfileLinks({ children }) {

  return (
    <div className=" flex items-center justify- gap-2 max-lg:w-full lg:w-fit min-w-xs max-lg:border-t-[1.5px] border-stroke-300 max-lg:*:*:*:first:border-none ">
      <div className="flex flex-col items-start justify-center size-full lg:max-w-xs lg:pb-34 lg:gap-2 max-lg:px-4 py-4 lg:px-4 lg:bg-stroke-100 dark:lg:bg-stroke-50 lg:rounded-2.5xl">
        {children}
      </div>
    </div>
  );
}

export function UserProfileLink({ label, phoneNumber, isloading }) {
  if (isloading) {
    return <Loading />;
  }
  return (
    <div className="flex flex-col items-center justify-center size-full">
      <div className="flex items-center justify-start gap-4 max-lg:py-2 size-full lg:mb-2 lg:py-4 px-4 rounded-3xl">
        <div className="flex items-center justify-between gap-4 w-full h-full">
          <Link
            href={"/profile/me"}
            className="flex items-center justify-between max-lg:gap-2 lg:gap-4"
          >
            <div className="flex items-center justify-center size-14 bg-stroke-150 lg:bg-stroke-0 rounded-xl">
              <UserIcon className="size-7 text-stroke-800" />
            </div>
            <span className="flex flex-col items-start justify-between gap-2 max-[365px]:w-44 lg:w-36">
              <p className="max-lg:font-bold text-stroke-800">{label}</p>
              <p
                dir="ltr"
                className="text-stroke-800/40 overflow-x-auto w-full py-0.5 scrollbar-none duration-200"
              >
                {toPersianNumbers(phoneNumber)}
              </p>
            </span>
          </Link>
          <Link
            href={"/profile/me"}
            className="flex items-center justify-center"
          >
            <PencilSquareIcon className="size-6 text-stroke-800 hover:text-success active:text-success duration-200" />
          </Link>
        </div>
      </div>
      <div className="h-[1.5px] w-full max-lg:hidden bg-stroke-3"></div>
    </div>
  );
}

export function ProfileLink({ children, label, href, baseHref }) {
  const pathName = usePathname();
  const isPathName = pathName.startsWith(baseHref);

  const renderSteps = () => {
    switch (baseHref) {
      case "/admin":
        return <UserSolidIcon className="size-7" />;
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
      case "/admin/notifs":
        return isPathName ? (
          <ChatBubbleLeftRightSolidIcon className="size-7" />
        ) : (
          <ChatBubbleLeftRightIcon className="size-7" />
        );
      case "/logout":
        return <ArrowRightStartOnRectangleIcon className="size-7" />;
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

  return (
    <div className="flex flex-col items-center justify-center size-full">
      {label && (
        <div className="h-[1.5px] w-full bg-stroke-300 lg:hidden my-2"></div>
      )}
      <Link
        href={href}
        className={`flex items-center justify-start gap-4
            ${
              label && isPathName
                ? "bg-stroke-900 dark:bg-stroke-200 text-stroke-0 dark:text-stroke-800"
                : "hover:bg-stroke-250 hover:*:*:*:last:*:last:duration-200 text-stroke-800"
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
                  : "max-lg:size-11 lg:size-14 lg:bg-stroke-0 lg:rounded-xl"
              }`}
            >
              <>{renderSteps()}</>

              {/* <AppImage
                src={isPathName ? srcPrimary : srcSecondary}
                alt={alt}
                width="size-7"
                sizes="10vw"
              /> */}
            </div>
            {label && <p>{label}</p>}
            {children}
          </div>
          {label ? (
            <div></div>
          ) : (
            <AppImage
              src="/images/edit-stroke-icon.svg"
              alt="edit-icon"
              width="size-6"
              sizes="10vw"
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
