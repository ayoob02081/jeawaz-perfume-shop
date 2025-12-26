"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ImageFrame from "./ImageFrame";
import { toPersianNumbers } from "@/utils/toPersianNumbers";

export default function ProfileLinks({ children }) {
  const pathName = usePathname();

  return (
    <div className=" flex items-center justify- gap-2 max-lg:w-full lg:w-fit min-w-xs max-lg:border-t-[1.5px] border-stroke-3 max-lg:*:*:*:first:border-none ">
      <div className="flex flex-col items-start justify-center size-full lg:max-w-xs lg:pb-34 lg:gap-2 max-lg:px-4 py-4 lg:px-4 lg:bg-grey lg:rounded-2.5xl">
        {children}
      </div>
    </div>
  );
}

export function UserProfileLink({ label, phoneNumber }) {
  return (
    <div className="flex flex-col items-center justify-center size-full">
      <div className="flex items-center justify-start gap-4 max-lg:py-2 size-full lg:mb-2 lg:py-4 px-4 rounded-3xl">
        <div className="flex items-center justify-between gap-4 w-full h-full">
          <Link
            href={"/profile/me"}
            className="flex items-center justify-between max-lg:gap-2 lg:gap-4"
          >
            <div className="flex items-center justify-center max-lg:siz-11 lg: size-14 bg-secondary lg:bg-white lg: rounded-xl">
              <ImageFrame
                src="/images/user-stroke-black-icon.svg"
                alt="user-icon"
                className="size-7 "
              />
            </div>
            <span className="flex flex-col items-start justify-between gap-2 ">
              <p className="max-lg:font-bold ">{label}</p>
              <p className="text-text/40 duration-200">
                {toPersianNumbers(phoneNumber)}
              </p>
            </span>
          </Link>
          <button className="flex items-center justify-center">
            <ImageFrame
              src="/images/edit-stroke-icon.svg"
              alt="edit-icon"
              className="size-6"
            />
          </button>
        </div>
      </div>
      <div className="h-[1.5px] w-full max-lg:hidden bg-stroke-3"></div>
    </div>
  );
}

export function ProfileLink({
  children,
  label,
  srcPrimary,
  srcSecondary,
  alt,
  href,
}) {
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
                src={pathName.startsWith(href) ? srcPrimary : srcSecondary}
                alt={alt}
                className="size-7"
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
