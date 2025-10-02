"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserIcon } from "@heroicons/react/24/outline";
import { UserIcon as UserIconFill } from "@heroicons/react/24/solid";
import ImageFrame from "@/components/ImageFrame";

function MobilePannel() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[83px] w-full md:hidden bg-white px-5 z-[70]">
      <ul className="grid grid-cols-4 justify-items-center p-2 gap-x-5 gap-y-5 h-full">
        <li className=" justify-items-start">
          <Link
            className="flex flex-col justify-between items-center gap-2 p-3"
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
            <p className="text-xs text-text-secondary">خانه</p>
          </Link>
        </li>
        <li className=" justify-items-start">
          <Link
            className="flex flex-col justify-between items-center gap-2 p-3"
            href="/products"
          >
            <div className="size-7">
              <ImageFrame
                className="size-7"
                src={
                  pathname === "/products"
                    ? "/images/products-fill-primary-icon.svg"
                    : "/images/products-stroke-sec-icon.svg"
                }
                alt="products icon"
              />
            </div>
            <p className="text-xs text-text-secondary">فروشگاه</p>
          </Link>
        </li>
        <li className=" justify-items-start">
          <Link
            className="flex flex-col justify-between items-center gap-2 p-3"
            href="/cart"
          >
            <div className="size-7">
              <ImageFrame
                className="size-7"
                src={
                  pathname === "/cart"
                    ? "/images/bag-fill-primary-icon.svg"
                    : "/images/bag-stroke-sec-icon.svg"
                }
                alt="cart icon"
              />
            </div>
            <p className="text-xs text-text-secondary">سبد خرید</p>
          </Link>
        </li>
        <li className=" justify-items-start">
          <Link
            className="flex flex-col justify-between items-center gap-2 p-3"
            href="/profile"
          >
            <div className="flex items-center justify-center size-7">
              {pathname === "/profile" ? (
                <UserIconFill className="size-6 text-primary" />
              ) : (
                <UserIcon className="size-6 text-[#606060]" />
              )}
            </div>
            <p className="text-xs text-text-secondary">پروفایل</p>
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default MobilePannel;
