"use client";

import { usePathname } from "next/navigation";
import { UserCircleIcon, UserIcon } from "@heroicons/react/24/outline";
import {
  UserIcon as UserSolidIcon,
  UserCircleIcon as UserCircleSolidIcon,
} from "@heroicons/react/24/solid";
import AppImage from "@/components/AppImage";
import { useAuth } from "@/contexts/auth/AuthContext";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { useUnreadNotificationsCount } from "@/hooks/useNotification";
import Link from "next/link";

function MobilePannel() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const showElement = useHideOnScroll();
  const { data } = useUnreadNotificationsCount();

  return (
    showElement && (
      <nav
        className="fixed flex items-center justify-center bottom-0 right-0 w-full lg:hidden z-60
     transition-all duration-200 ease-in-out overflow-hidden h-24"
      >
        <ul
          className={`grid ${user?.role === "admin" ? "grid-cols-5" : "grid-cols-4"} justify-items-center gap-x-5 h-20.75 w-[95%] shadow-lg shadow-black/30 rounded-2xl bg-stroke-800/5 backdrop-blur-xl max-lg:border border-stroke-0/5 px-5`}
        >
          <li className="flex items-center justify-center ">
            <Link
              className="group flex flex-col justify-center items-center gap-2"
              href={"/"}
            >
              <div className="size-7 group-active:scale-95 duration-100">
                <AppImage
                  width="size-7"
                  src={
                    pathname === "/"
                      ? "/images/home-fill-primary-icon.svg"
                      : "/images/home-stroke-sec-icon.svg"
                  }
                  alt="home-icon"
                  className={pathname !== "/" && "dark:invert"}
                  sizes="20vw"
                />
              </div>
              <p
                className={`text-xs text-nowrap font-bold ${
                  pathname === "/" ? "text-stroke-800" : "text-stroke-600"
                }`}
              >
                خانه
              </p>
            </Link>
          </li>
          <li className="flex items-center justify-center ">
            <Link
              className="group flex flex-col justify-center items-center gap-2"
              href={"/products"}
            >
              <div className="size-7 group-active:scale-95 duration-100">
                <AppImage
                  width="size-7"
                  src={
                    pathname.startsWith("/products")
                      ? "/images/products-fill-primary-icon.svg"
                      : "/images/products-stroke-sec-icon.svg"
                  }
                  alt="products-icon"
                  className={!pathname.startsWith("/products") && "dark:invert"}
                  sizes="20vw"
                />
              </div>
              <p
                className={`text-xs text-nowrap font-bold ${
                  pathname.startsWith("/products")
                    ? "text-stroke-800"
                    : "text-stroke-600"
                }`}
              >
                فروشگاه
              </p>
            </Link>
          </li>
          <li className="flex items-center justify-center ">
            <Link
              className="group flex flex-col justify-center items-center gap-2"
              href={"/cart"}
            >
              <div className="size-7 group-active:scale-95 duration-100">
                <AppImage
                  width="size-7"
                  src={
                    pathname.startsWith("/cart")
                      ? "/images/bag-fill-primary-icon.svg"
                      : "/images/bag-stroke-sec-icon.svg"
                  }
                  alt="cart-icon"
                  className={!pathname.startsWith("/cart") && "dark:invert"}
                  sizes="20vw"
                />
              </div>
              <p
                className={`text-xs text-nowrap font-bold ${
                  pathname.startsWith("/cart")
                    ? "text-stroke-800"
                    : "text-stroke-600"
                }`}
              >
                سبد خرید
              </p>
            </Link>
          </li>
          <li className="flex items-center justify-center ">
            <Link
              className="relative group flex flex-col justify-center items-center gap-2"
              href={isAuthenticated !== true ? "/auth/login" : "/profile/me"}
              prefetch={false}
            >
              <div className="flex items-center justify-center size-7 group-active:scale-95 duration-100">
                {pathname.startsWith("/profile") ? (
                  <UserSolidIcon className="size-6 text-primary" />
                ) : (
                  <UserIcon className="size-6 text-stroke-600 dark:text-stroke-400" />
                )}
              </div>
              <p
                className={`text-xs text-nowrap font-bold ${
                  pathname.startsWith("/profile")
                    ? "text-stroke-800"
                    : "text-stroke-600"
                }`}
              >
                {isAuthenticated !== true ? "ورود" : "پروفایل"}
              </p>
              {data?.total > 0 && (
                <div className="absolute -top-1 right-1 z-10 flex items-center justify-center aspect-square text-nowrap p-1 rounded-full max-md:bg-stroke-90 bg-primary text-stroke-0 h-2 text-xs">
                  <p className="translate-y-px" />
                </div>
              )}
            </Link>
          </li>
          {user?.role === "admin" && (
            <li className="flex items-center justify-center ">
              <Link
                className="relative group flex flex-col justify-center items-center gap-2"
                href={"/admin/dashboard"}
                prefetch={false}
              >
                <div className="flex items-center justify-center size-7 group-active:scale-95 duration-100">
                  {pathname.startsWith("/admin") ? (
                    <UserCircleSolidIcon className="size-6 text-primary" />
                  ) : (
                    <UserCircleIcon className="size-6 text-stroke-600 dark:text-stroke-400" />
                  )}
                </div>
                <p
                  className={`text-xs text-nowrap font-bold ${
                    pathname.startsWith("/admin")
                      ? "text-stroke-800"
                      : "text-stroke-600"
                  }`}
                >
                  ادمین
                </p>
              </Link>
            </li>
          )}
        </ul>
      </nav>
    )
  );
}

export default MobilePannel;
