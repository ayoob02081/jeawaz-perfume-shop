"use client";

import { usePathname, useRouter } from "next/navigation";
import { UserIcon } from "@heroicons/react/24/outline";
import { UserIcon as UserIconFill } from "@heroicons/react/24/solid";
import AppImage from "@/components/AppImage";
import { useGetUser } from "@/hooks/useUsers";

function MobilePannel() {
  const router = useRouter();
  const pathname = usePathname();
  const { data, isPending, error } = useGetUser();

  return (
    <nav className="fixed flex items-center justify-center bottom-3 right-0 h-[83px] w-full md:hidden z-[70]">
      <ul className="grid grid-cols-4 justify-items-center gap-x-5 h-full w-[95%] shadow-2xl shadow-black rounded-2xl bg-stroke-0 px-5">
        <li className="flex items-center justify-center ">
          <button
            className="flex flex-col justify-center items-center gap-2"
            onClick={() => router.push("/")}
          >
            <div className="size-7">
              <AppImage
                width="size-7"
                src={
                  pathname === "/"
                    ? "/images/home-fill-primary-icon.svg"
                    : "/images/home-stroke-sec-icon.svg"
                }
                alt="home-icon"
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
          </button>
        </li>
        <li className="flex items-center justify-center ">
          <button
            className="flex flex-col justify-center items-center gap-2"
            onClick={() => router.push("/products")}
          >
            <div className="size-7">
              <AppImage
                width="size-7"
                src={
                  pathname.startsWith("/products")
                    ? "/images/products-fill-primary-icon.svg"
                    : "/images/products-stroke-sec-icon.svg"
                }
                alt="products-icon"
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
          </button>
        </li>
        <li className="flex items-center justify-center ">
          <button
            className="flex flex-col justify-center items-center gap-2"
            onClick={
              !data?.email || data?.email === undefined
                ? () => router.push("/auth/login")
                : () => router.push("/cart")
            }
          >
            <div className="size-7">
              <AppImage
                width="size-7"
                src={
                  pathname.startsWith("/cart")
                    ? "/images/bag-fill-primary-icon.svg"
                    : "/images/bag-stroke-sec-icon.svg"
                }
                alt="cart-icon"
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
          </button>
        </li>
        <li className="flex items-center justify-center ">
          <button
            className="flex flex-col justify-center items-center gap-2"
            onClick={
              !data?.email || data?.email === undefined
                ? () => router.push("/auth/login")
                : () => router.push("/profile")
            }
          >
            <div className="flex items-center justify-center size-7">
              {pathname.startsWith("/profile") ? (
                <UserIconFill className="size-6 text-primary" />
              ) : (
                <UserIcon className="size-6 text-[#606060]" />
              )}
            </div>
            <p
              className={`text-xs text-nowrap font-bold ${
                pathname.startsWith("/profile")
                  ? "text-stroke-800"
                  : "text-stroke-600"
              }`}
            >
              پروفایل
            </p>
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default MobilePannel;
