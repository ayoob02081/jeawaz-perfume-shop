"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserIcon } from "@heroicons/react/24/outline";
import { UserIcon as UserIconFill } from "@heroicons/react/24/solid";
import ImageFrame from "@/components/ImageFrame";

function MobilePannel() {
  const pathname = usePathname();

  return (
    <div className="fixed flex items-center justify-center bottom-3 right-0 h-[83px] w-full md:hidden z-[70]">
      <ul className="grid grid-cols-4 justify-items-center gap-x-5 h-full w-[95%] shadow-2xl shadow-black rounded-2xl bg-white px-5">
        <li className="flex items-center justify-center ">
          <Link
            className="flex flex-col justify-center items-center gap-2"
            href="/"
          >
            <div className="size-7">
              <ImageFrame
                className="size-7"
                src={
                  pathname === "/"
                    ? "/images/home-fill-primary-icon.svg"
                    : "/images/home-stroke-sec-icon.svg"
                }
                alt="home icon"
              />
            </div>
            <p
              className={`text-xs text-text-secondary text-nowrap font-bold ${
                pathname === "/" ? "text-text" : "text-text-secondary"
              }`}
            >
              خانه
            </p>
          </Link>
        </li>
        <li className="flex items-center justify-center ">
          <Link
            className="flex flex-col justify-center items-center gap-2"
            href="/products"
          >
            <div className="size-7">
              <ImageFrame
                className="size-7"
                src={
                  pathname.startsWith("/products")
                    ? "/images/products-fill-primary-icon.svg"
                    : "/images/products-stroke-sec-icon.svg"
                }
                alt="products icon"
              />
            </div>
            <p
              className={`text-xs  text-nowrap font-bold ${
                pathname.startsWith("/products")
                  ? "text-text"
                  : "text-text-secondary"
              }`}
            >
              فروشگاه
            </p>
          </Link>
        </li>
        <li className="flex items-center justify-center ">
          <Link
            className="flex flex-col justify-center items-center gap-2"
            href="/cart"
          >
            <div className="size-7">
              <ImageFrame
                className="size-7"
                src={
                  pathname.startsWith("/cart")
                    ? "/images/bag-fill-primary-icon.svg"
                    : "/images/bag-stroke-sec-icon.svg"
                }
                alt="cart icon"
              />
            </div>
            <p
              className={`text-xs text-text-secondary text-nowrap font-bold ${
                pathname.startsWith("/cart")
                  ? "text-text"
                  : "text-text-secondary"
              }`}
            >
              سبد خرید
            </p>
          </Link>
        </li>
        <li className="flex items-center justify-center ">
          <Link
            className="flex flex-col justify-center items-center gap-2"
            href="/profile"
          >
            <div className="flex items-center justify-center size-7">
              {pathname.startsWith("/profile") ? (
                <UserIconFill className="size-6 text-primary" />
              ) : (
                <UserIcon className="size-6 text-[#606060]" />
              )}
            </div>
            <p
              className={`text-xs text-text-secondary text-nowrap font-bold ${
                pathname.startsWith("/profile")
                  ? "text-text"
                  : "text-text-secondary"
              }`}
            >
              پروفایل
            </p>
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default MobilePannel;
