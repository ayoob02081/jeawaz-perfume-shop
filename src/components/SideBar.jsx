"use client";

import { ChevronLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import AppImage from "./AppImage";
import useOutsideClick from "@/hooks/useOutsideClick";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AdminSidebar from "@/app/(admin)/admin/_components/AdminSidebar";
import UserSidebar from "@/app/(profile)/profile/_components/UserSidebar";
import { useEffect } from "react";
import ThemeToggle from "@/ui/ThemeToggle";

const filterLinks = [
  {
    id: 1,
    href: "/products?sort=best_selling&page=1&limit=12",
    src: "/images/warranty-check-icon.svg",
    alt: "popular-icon",
    title: "پرفروش ترین ها",
    sort: "best_selling",
  },
  {
    id: 2,
    href: "/products?sort=newest&page=1&limit=12",
    src: "/images/two-tag-icon.svg",
    alt: "tag-icon",
    title: "جدیدترین ها",
    sort: "newest",
  },
  {
    id: 3,
    href: "/products?sort=most_discounted&discounted=true&page=1&limit=12",
    src: "/images/special-offer-2-icon.svg",
    alt: "offer-icon",
    title: "تخفیف دار",
    sort: "most_discounted",
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

function Sidebar({ toggleSidebar, toggleCategory, isSidebarOpen }) {
  const ref = useOutsideClick(toggleSidebar);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isSidebarOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isSidebarOpen]);

  return (
    <ul
      className={`${
        isSidebarOpen ? "right-0" : "translate-x-[200vw]"
      } fixed top-0 bg-black/30 w-screen h-full z-80 backdrop-blur-md flex flex-col duration-200 overflow-y-auto scrollbar-none lg:hidden`}
    >
      {isSidebarOpen && (
        <div
          ref={ref}
          className="w-[75vw] h-full scrollbar-none overflow-y-auto bg-stroke-0 pb-10"
        >
          <li className="p-4 pb-2 flex items-center justify-between">
            <button
              onClick={() => {
                router.push("/");
                toggleSidebar();
              }}
            >
              <AppImage
                src="/images/Jeaawaz-Logo-red-v5.0.webp"
                alt="jeawaz-brand-icon"
                width="w-24"
                sizes="20vw"
                ratio="aspect-[4/2]"
                priority={true}
              />
            </button>
            <div className="flex items-center justify-between gap-6">
              <ThemeToggle />
              <button
                className="flex items-center justify-center size-6 border-[1.5px] border-primary rounded-md  "
                onClick={toggleSidebar}
              >
                <XMarkIcon className="size-4 text-primary stroke-2" />
              </button>
            </div>
          </li>
          {isSidebarOpen && pathname.startsWith("/admin") && (
            <AdminSidebar toggleSidebar={toggleSidebar} />
          )}
          {isSidebarOpen && pathname.startsWith("/profile") && (
            <UserSidebar toggleSidebar={toggleSidebar} />
          )}
          {!pathname.startsWith("/admin") &&
            !pathname.startsWith("/profile") && (
              <>
                <div className=" border-b-4 border-stroke-200 dark:border-stroke-150 ">
                  <li className="px-4">
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
                            <span className="text-base font-bold">
                              دسته بندی
                            </span>
                            <span className="text-sm">محصولات</span>
                          </div>
                        </div>
                        <ChevronLeftIcon className="size-5 text-stroke-800" />
                      </div>
                    </button>
                  </li>
                  <div>
                    {filterLinks.map((item) => (
                      <SidebarLink
                        key={item.id}
                        sort={item.sort}
                        toggleSidebar={toggleSidebar}
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
                    <SidebarLink
                      key={item.id}
                      id={item.id}
                      toggleSidebar={toggleSidebar}
                      href={item.href}
                      title={item.title}
                    />
                  ))}
                </div>
              </>
            )}
        </div>
      )}
    </ul>
  );
}

export default Sidebar;

function SidebarLink({ href, src, alt, title, sort, toggleSidebar, id }) {
  const searchParams = useSearchParams();
  const pathName = usePathname();

  return (
    <li className="flex flex-col items-center px-4">
      <Link
        onClick={toggleSidebar}
        className={`${
          (searchParams.get("sort") === sort || pathName.endsWith(href)) &&
          "*:text-primary *:dark: *:font-bold"
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
                !searchParams.get("sort") === sort
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
