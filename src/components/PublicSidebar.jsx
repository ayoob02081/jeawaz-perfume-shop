import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useSearchParams } from "next/navigation";
import AppImage from "./AppImage";
import Link from "next/link";

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

function PublicSidebar({ toggleCategory, closeSidebar, pathName }) {
  return (
    <ul>
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
                <span className="text-base font-bold">دسته بندی</span>
                <span className="text-sm">محصولات</span>
              </div>
            </div>
            <ChevronLeftIcon className="size-5 text-stroke-800" />
          </div>
        </button>
      </li>
      {filterLinks.map((item) => (
        <SidebarLink
          key={item.id}
          sort={item.sort}
          closeSidebar={closeSidebar}
          href={item.href}
          title={item.title}
          src={item.src}
          alt={item.alt}
          pathName={pathName}
        />
      ))}
      <li className="border-b-4 border-stroke-200 dark:border-stroke-150"></li>
      {pageLinks.map((item) => (
        <SidebarLink
          key={item.id}
          id={item.id}
          closeSidebar={closeSidebar}
          href={item.href}
          title={item.title}
          pathName={pathName}
        />
      ))}
    </ul>
  );
}

export default PublicSidebar;

function SidebarLink({
  href,
  src,
  alt,
  title,
  sort,
  closeSidebar,
  id,
  pathName,
}) {
  const searchParams = useSearchParams();
  const activeSort = searchParams.get("sort");
  const isActive = sort
    ? pathName === "/products" && activeSort === sort
    : pathName === href;
  return (
    <li className="flex flex-col items-center px-4">
      <Link
        onClick={closeSidebar}
        aria-current={isActive ? "page" : undefined}
        className={`${
          isActive && "*:text-primary *:font-bold"
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
                isActive
                  ? "dark:saturate-150 dark:brightness-200"
                  : "mix-blend-luminosity dark:mix-blend-plus-lighter dark:invert-50"
              }
            />
            <p>{title}</p>
          </div>
        ) : (
          <div
            className={`profile__title justify-between ${id === 1 ? "border-none" : "border-t border-stroke-250"}`}
          >
            <p>{title}</p>
            <ChevronLeftIcon className="size-4 stroke-2" />
          </div>
        )}
      </Link>
    </li>
  );
}
