"use client";

import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import AppImage from "./AppImage";
import useOutsideClick from "@/hooks/useOutsideClick";
import { usePathname } from "next/navigation";

function SideBar({ toggleSideBar, toggleCategory, sidebarOpen }) {
  const ref = useOutsideClick(toggleSideBar);
  const pathName = usePathname();

  return (
    toggleSideBar && (
      <ul
        className={`${
          sidebarOpen ? "right-0" : "translate-x-[200vw]"
        } fixed top-0 bg-black/30 w-[100vw] h-full z-[60] backdrop-blur-md flex flex-col duration-200`}
      >
        {sidebarOpen && (
          <div
            ref={ref}
            className="fixed pt-6 w-[75vw] h-full scrollbar-none overflow-y-auto bg-white pb-28"
          >
            <li className="px-6 flex items-center justify-between">
              <AppImage
                src="/images/Jeaawaz-Logo-red-v5.0.webp"
                alt="jeawaz-brand-icon"
                width="size-24"
                sizes="20vw"
              />
              <button className="size-6" onClick={toggleSideBar}>
                <AppImage
                  src="/images/close-icon.svg"
                  alt="close icon"
                  width="size-6"
                  sizes="10vw"
                />
              </button>
            </li>
            <div className=" border-b-4 border-stroke">
              <li>
                <button
                  className="profile__link justify-between text-base w-full "
                  onClick={toggleCategory}
                >
                  <div className="profile__title">
                    <AppImage
                      src="/images/category.svg"
                      alt="offer-icon"
                      className="pl-2"
                      width="size-6"
                      sizes="10vw"
                    />
                    <div className="flex items-end justify-center gap-1 border-r-[1.5px] border-primary/10 px-2">
                      <span className="text-base font-bold">دسته بندی</span>
                      <span className="text-sm">محصولات</span>
                    </div>
                  </div>
                  <ChevronLeftIcon className="size-5" />
                </button>
              </li>
              <li>
                <Link
                  className={`${
                    pathName.endsWith("/products")
                      ? "*:text-primary *:font-bold bg-secondary-2 rounded-full"
                      : ""
                  } profile__link`}
                  href={"/products"}
                >
                  <div className="profile__title">
                    <AppImage
                      src="/images/warranty-check-icon.svg"
                      alt="popular-icon"
                      width="size-6"
                      sizes="10vw"
                    />

                    <p>پرفروش ترین ها</p>
                  </div>
                </Link>
              </li>
              <li>
                <Link
                  className={`${
                    pathName.endsWith("/products")
                      ? "*:text-primary *:font-bold bg-secondary-2 rounded-full"
                      : ""
                  } profile__link`}
                  href={"/products"}
                >
                  <div className="profile__title">
                    <AppImage
                      src="/images/two-tag-icon.svg"
                      alt="tag-icon"
                      width="size-6"
                      sizes="10vw"
                    />
                    <p>جدیدترین ها</p>
                  </div>
                </Link>
              </li>
              <li>
                <Link
                  className={`${
                    pathName.endsWith("/products")
                      ? "*:text-primary *:font-bold bg-secondary-2 rounded-full"
                      : ""
                  } profile__link`}
                  href={"/products"}
                >
                  <div className="profile__title">
                    <AppImage
                      src="/images/special-offer-2-icon.svg"
                      alt="offer-icon"
                      width="size-6"
                      sizes="10vw"
                    />
                    <p>تخفیف دار</p>
                  </div>
                </Link>
              </li>
            </div>
            <div>
              <li>
                <Link
                  className={`${
                    pathName.endsWith("/page/terms")
                      ? "*:text-primary *:font-bold bg-secondary-2 rounded-full"
                      : ""
                  } profile__link--2`}
                  href="/page/terms"
                >
                  <div className="profile__title justify-between border-none">
                    <p>قوانین و مقررات</p>
                    <ChevronLeftIcon className="size-4" />
                  </div>
                </Link>
              </li>
              <li>
                <Link
                  className={`${
                    pathName.endsWith("/page/contact-us")
                      ? "*:text-primary *:font-bold bg-secondary-2 rounded-full"
                      : ""
                  } profile__link--2`}
                  href="/page/contact-us"
                >
                  <div className="profile__title justify-between">
                    <p>تماس با ما</p>
                    <ChevronLeftIcon className="size-4" />
                  </div>
                </Link>
              </li>
              <li>
                <Link
                  className={`${
                    pathName.endsWith("/page/about-us")
                      ? "*:text-primary *:font-bold bg-secondary-2 rounded-full"
                      : ""
                  } profile__link--2`}
                  href="/page/about-us"
                >
                  <div className="profile__title justify-between">
                    <p>درباره ما</p>
                    <ChevronLeftIcon className="size-4" />
                  </div>
                </Link>
              </li>
            </div>
          </div>
        )}
      </ul>
    )
  );
}

export default SideBar;
