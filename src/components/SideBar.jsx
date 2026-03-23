"use client";

import {
  ChevronLeftIcon,
  MoonIcon,
  SunIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import AppImage from "./AppImage";
import useOutsideClick from "@/hooks/useOutsideClick";
import { usePathname } from "next/navigation";

const filterLinks = [
  {
    id: 1,
    href: "/products",
    src: "/images/warranty-check-icon.svg",
    alt: "popular-icon",
    title: "پرفروش ترین ها",
  },
  {
    id: 2,
    href: "/products",
    src: "/images/two-tag-icon.svg",
    alt: "tag-icon",
    title: "جدیدترین ها",
  },
  {
    id: 3,
    href: "/products",
    src: "/images/special-offer-2-icon.svg",
    alt: "offer-icon",
    title: "تخفیف دار",
  },
];

const pageLinks = [
  {
    id: 1,
    href: "/page/terms",
    title: "قوانین و مقررات",
  },
  {
    id: 2,
    href: "/page/contact-us",
    title: "تماس با ما",
  },
  {
    id: 3,
    href: "/page/about-us",
    title: "درباره ما",
  },
];

function SideBar({
  toggleSideBar,
  toggleCategory,
  sidebarOpen,
  toggleTheme,
  dark,
}) {
  const ref = useOutsideClick(toggleSideBar);

  return (
    <ul
      className={`${
        sidebarOpen ? "right-0" : "translate-x-[200vw]"
      } fixed top-0 bg-black/30 w-[100vw] h-full z-[60] backdrop-blur-md flex flex-col duration-200`}
    >
      {sidebarOpen && (
        <div
          ref={ref}
          className=" pt-6 w-[75vw] h-full scrollbar-none overflow-y-auto bg-stroke-0 pb-28"
        >
          <li className="px-6 flex items-center justify-between">
            <AppImage
              src="/images/Jeaawaz-Logo-red-v5.0.webp"
              alt="jeawaz-brand-icon"
              width="size-24"
              sizes="20vw"
            />
            <div className="flex items-center justify-between gap-6">
              {!!dark ? (
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="text-stroke-800"
                >
                  <SunIcon className="max-md:size-6 size-5 text-warning" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="text-stroke-800"
                >
                  <MoonIcon className="max-md:size-5 size-4 text-blue-900" />
                </button>
              )}
              <button
                className="flex items-center justify-center size-6 border-[1.5px] border-primary rounded-md  "
                onClick={toggleSideBar}
              >
                <XMarkIcon className="size-4 text-primary stroke-2" />
              </button>
            </div>
          </li>
          <div className=" border-b-4 border-stroke-200 dark:border-stroke-150 ">
            <li>
              <button
                className="flex-col gap-0 profile__link justify-between text-base size-full "
                onClick={toggleCategory}
              >
                <div className=" w-full !h-[1px] bg-stroke-250 rounded-full"></div>
                <div className="flex items-center w-full">
                  <div className="profile__title border-0">
                    <AppImage
                      src="/images/category.svg"
                      alt="category-icon"
                      className="pl-2"
                      width="size-6"
                      sizes="10vw"
                    />
                    <div className="w-[1.5px] h-6 bg-primary/10 dark:bg-stroke-50 rounded-full"></div>
                    <div className="flex items-end justify-center gap-1 pl-2">
                      <span className="text-base font-bold">دسته بندی</span>
                      <span className="text-sm">محصولات</span>
                    </div>
                  </div>
                  <ChevronLeftIcon className="size-5 text-stroke-800" />
                </div>
              </button>
            </li>
            <div className="flex flex-col gap-1 mb-1">
              {filterLinks.map((item) => (
                <li key={item.id} className="flex flex-col items-center gap-1">
                  <div className=" w-[88%] !h-[1px] bg-stroke-250 rounded-full"></div>
                  <SideBarLink
                    toggleSideBar={toggleSideBar}
                    href={item.href}
                    title={item.title}
                    src={item.src}
                    alt={item.alt}
                  />
                </li>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1 ">
            {pageLinks.map((item) => (
              <li key={item.id} className="flex flex-col items-center gap-1">
                <div className=" w-[88%] !h-[1px] bg-stroke-250 rounded-full"></div>
                <SideBarLink
                  id={item.id}
                  toggleSideBar={toggleSideBar}
                  href={item.href}
                  title={item.title}
                />
              </li>
            ))}
          </div>
        </div>
      )}
    </ul>
  );
}

export default SideBar;

function SideBarLink({ href, src, alt, title, toggleSideBar, id }) {
  const pathName = usePathname();

  return (
    <Link
      onClick={toggleSideBar}
      className={`${
        pathName.endsWith(href) &&
        "*:text-primary *:font-bold bg-stroke-50 rounded-full"
      } ${src ? "profile__link" : "profile__link--2"} w-full`}
      href={href}
    >
      {src ? (
        <div className="profile__title">
          <div className="relative">
            <div className="absolute translate-y-1/ top-0 size-full dark:bg-stroke-800/20 rounded-full blur-[4px"></div>
            <AppImage src={src} alt={alt} width="size-6" sizes="10vw" />
          </div>
          <p>{title}</p>
        </div>
      ) : (
        <div
          className={`profile__title justify-between ${id === 1 && "border-none"}`}
        >
          <p>{title}</p>
          <ChevronLeftIcon className="size-4" />
        </div>
      )}
    </Link>
  );
}
