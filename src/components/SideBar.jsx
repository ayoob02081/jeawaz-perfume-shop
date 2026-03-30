"use client";

import {
  ChevronLeftIcon,
  MoonIcon,
  SunIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { MoonIcon as MoonSolidIcon, SunIcon as SunSolidIcon } from "@heroicons/react/24/solid";
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
              <button
                type="button"
                onClick={toggleTheme}
                className="relative flex items-center justify-center gap-2 bg-stroke-200 dark:bg-stroke-50 rounded-full px-1 py-0.5 w-12 h-6"
              >
                <div
                  className={`absolute flex items-center justify-center h-full aspect-square from-yellow-400 to-yellow-700 dark:from-blue-700 dark:to-blue-950 bg-gradient-to-r rounded-full ${
                    !dark ? "right-0" : "right-0 -translate-x-full"
                  } shadow duration-200`}
                >
                  {!!dark ? (
                    <div className="text-stroke-800" />
                  ) : (
                    <div className="text-stroke-800" />
                  )}
                </div>
                <div className="flex items-center justify-between w-full">
                  <div className="text-stroke-800 z-10">
                    {!!dark ? (
                      <SunIcon className="size-4 text-warning" />
                    ) : (
                      <SunSolidIcon className="size-4 text-white" />
                    )}
                  </div>
                  <div className="text-stroke-800 z-10">
                    {!dark ? (
                      <MoonIcon className="size-4 text-blue-900" />
                    ) : (
                      <MoonSolidIcon className="size-4 text-white" />
                    )}
                  </div>
                </div>
              </button>
              <button
                className="flex items-center justify-center size-6 border-[1.5px] border-primary rounded-md  "
                onClick={toggleSideBar}
              >
                <XMarkIcon className="size-4 text-primary stroke-2" />
              </button>
            </div>
          </li>
          <div className=" border-b-4 border-stroke-200 dark:border-stroke-150 ">
            <li className="px-6">
              <button
                className="flex-col gap-0 border-t border-stroke-250 justify-between text-base size-full "
                onClick={toggleCategory}
              >
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
            <div>
              {filterLinks.map((item) => (
                <SideBarLink
                  key={item.id}
                  toggleSideBar={toggleSideBar}
                  href={item.href}
                  title={item.title}
                  src={item.src}
                  alt={item.alt}
                />
              ))}
            </div>
          </div>
          <div>
            {pageLinks.map((item) => (
              <SideBarLink
                key={item.id}
                id={item.id}
                toggleSideBar={toggleSideBar}
                href={item.href}
                title={item.title}
              />
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
    <li className="flex flex-col items-center px-6">
      <Link
        onClick={toggleSideBar}
        className={`${
          pathName.endsWith(href) && "*:text-primary *:dark: *:font-bold"
        } flex items-center gap-2 ${src ? "text-xs" : "text-sm text-stroke-800"} w-full`}
        href={href}
      >
        {src ? (
          <div className="profile__title border-t border-stroke-250">
            <AppImage
              src={src}
              alt={alt}
              width="size-6"
              sizes="10vw"
              className={
                !pathName.endsWith(href)
                  ? "mix-blend-luminosity dark:mix-blend-plus-lighter dark:invert-50"
                  : "dark:saturate-150 dark:brightness-200"
              }
            />
            <p>{title}</p>
          </div>
        ) : (
          <div
            className={`profile__title justify-between ${id === 1 ? "border-none" : "border-t border-stroke-250"}`}
          >
            <p>{title}</p>
            <ChevronLeftIcon className=" size-4" />
          </div>
        )}
      </Link>
    </li>
  );
}
