"use client";

// import { useGetUser } from "@/hooks/useAuth";
import HamMenuIcon from "@/ui/HamMenuIcon";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function HamburgerMenu({ children }) {
  // const { data, isLoading } = useGetUser();
  // const { user, cart } = data || {};
  const [open, setOpen] = useState(false);
  const pathName = usePathname();
  const toggle = () => {
    setOpen((prevState) => !prevState);
  };

  return (
    <div className={`flex flex-col items-start bg-white`}>
      <div
        className={`${open ? "border-b" : ""} ${
          pathName.startsWith("/admin") && "sm:justify-center"
        } flex items-center justify-between w-full p-4 container`}
      >
        <button
          className="flex sm:hidden items-center justify-center text-2xl focus:outline-none text-secondary-900"
          onClick={toggle}
        >
          <HamMenuIcon open={open} className="size-8" />
        </button>
        <span className="text-xl font-bold text-primary-900">Jeawaz</span>
        {pathName.startsWith("/profile") && (
          <Link
            className={` headerLink justify-center relative`}
            href={"/cart"}
          >
            <span className="flex flex-col items-center justify-center bg-primary-900 size-5 text-white rounded-full absolute top-1 -right-1">
              <p className="text-xs pt-0.5">
                {cart
                  ? toPersianNumbers(data.cart.payDetail.orderItems.length)
                  : toPersianNumbers(0)}
              </p>
            </span>
            <ShoppingCartIcon className="size-7  " />
          </Link>
        )}
      </div>
      <div
        className={`${
          open ? "" : "hidden"
        } flex flex-col items-start p-4 sm:hidden overflow-auto w-full`}
      >
        {children}
      </div>
    </div>
  );
}
