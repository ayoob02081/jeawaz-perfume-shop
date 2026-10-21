"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import AppImage from "./AppImage";
import useOutsideClick from "@/hooks/useOutsideClick";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/app/(admin)/admin/_components/AdminSidebar";
import UserSidebar from "@/app/(profile)/profile/_components/UserSidebar";
import useBodyScrollLock from "@/hooks/useBodyScrollLock";
import ThemeToggle from "@/ui/ThemeToggle";
import { useSidebar } from "@/contexts/Sidebars/SidebarContext";
import PublicSidebar from "./PublicSidebar";

function Sidebar() {
  const { isSidebarOpen, closeSidebar, toggleCategory } = useSidebar();
  const ref = useOutsideClick(closeSidebar);
  const pathname = usePathname();

  useBodyScrollLock(isSidebarOpen);

  return (
    <div
      className={`${
        isSidebarOpen ? "right-0" : "translate-x-[200vw]"
      } fixed top-0 bg-black/30 w-screen h-full z-80 backdrop-blur-md flex flex-col transition-all duration-200 overflow-y-auto scrollbar-none lg:hidden`}
    >
      {isSidebarOpen && (
        <div
          ref={ref}
          className="w-[75vw] h-full scrollbar-none overflow-y-auto bg-stroke-0 pb-10"
        >
          <div className="p-4 pb-3 flex items-center justify-between">
            <Link href={"/"} onClick={closeSidebar}>
              <AppImage
                src="/images/jeawaz-logo-v6.0-r.webp"
                alt="jeawaz-brand-icon"
                width="w-24"
                sizes="20vw"
                ratio="aspect-[4/2]"
                priority={true}
              />
            </Link>
            <div className="flex items-center justify-between gap-6">
              <ThemeToggle />
              <button
                aria-label="بستن منو"
                className="flex items-center justify-center size-6 border-[1.5px] border-primary rounded-md  "
                onClick={closeSidebar}
              >
                <XMarkIcon className="size-4 text-primary stroke-2" />
              </button>
            </div>
          </div>
          {pathname.startsWith("/admin") ? (
            <AdminSidebar />
          ) : pathname.startsWith("/profile") ? (
            <UserSidebar />
          ) : (
            <PublicSidebar
              toggleCategory={toggleCategory}
              closeSidebar={closeSidebar}
              pathName={pathname}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default Sidebar;
