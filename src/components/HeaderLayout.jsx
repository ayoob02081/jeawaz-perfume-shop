"use client";

import {
  ArrowLeftIcon,
  ChevronDownIcon,
  Squares2X2Icon,
  MagnifyingGlassIcon,
  UserIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import AppImage from "./AppImage";
import ProductGradeBadge from "./ProductGradeBadge";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import MobileSearchOverlay from "./MobileSearchOverlay";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetProductSuggestions } from "@/hooks/useProducts";
import SearchSection from "./SearchSection";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { CardIconResponsive } from "@/app/(user)/_components/ProductCard";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useGetAllCartItems } from "@/hooks/useCart";
import { useAuth } from "@/contexts/auth/AuthContext";
import { formatFullName } from "@/utils/profileFormContract.mjs";
import { useSidebar } from "@/contexts/Sidebars/SidebarContext";
import ThemeToggle from "@/ui/ThemeToggle";
import {
  productSearchNavigation,
  syncHeaderSearch,
  headerSuggestionQuery,
  headerSearchSurface,
} from "@/utils/headerSearch.mjs";

function HeaderLayout() {
  const {
    isCategoryOpen,
    openSidebar,
    toggleSidebar,
    toggleCategory,
    warmCategory,
  } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState({ value: urlSearch, urlSearch });
  // Follow the URL's search during render (no effect, no request).
  const syncedSearch = syncHeaderSearch(search, urlSearch);
  if (syncedSearch !== search) setSearch(syncedSearch);
  const searchValue = syncedSearch.value;
  const setSearchValue = (value) =>
    setSearch((current) => ({ ...current, value }));
  const [activeSurface, setActiveSurface] = useState(null);
  const searchTriggerRef = useRef(null);
  const inlineInputs = useRef({});
  const closeReason = useRef("dismiss");
  const dialogId = useId();
  const closeSearch = useCallback((reason = "dismiss") => {
    closeReason.current = reason;
    setActiveSurface(null);
  }, []);
  const activateSearch = (surface, active) => {
    if (active) {
      if (headerSearchSurface(window.innerWidth) !== surface) return;
      if (surface === "spotlight") closeReason.current = "dismiss";
      setActiveSurface(surface);
    } else
      setActiveSurface((current) => (current === surface ? null : current));
  };
  const queryString = searchParams.toString();
  useEffect(() => {
    closeSearch("navigation");
  }, [pathname, queryString, closeSearch]);
  useEffect(() => {
    const media = [
      "(max-width: 480px)",
      "(min-width: 640px)",
      "(min-width: 1024px)",
    ].map((query) => window.matchMedia(query));
    const onResize = () => {
      if (
        activeSurface &&
        headerSearchSurface(window.innerWidth) !== activeSurface
      )
        closeSearch("resize");
    };
    media.forEach((query) => query.addEventListener("change", onResize));
    return () =>
      media.forEach((query) => query.removeEventListener("change", onResize));
  }, [activeSurface, closeSearch]);
  const debouncedSearch = useDebounce(searchValue.trim(), 300);
  const suggestionQuery = headerSuggestionQuery(
    searchValue,
    debouncedSearch,
    Boolean(activeSurface),
  );
  const suggestions = useGetProductSuggestions(suggestionQuery);
  const renderResult = (item, dismiss) => (
    <Link
      href={`/products/${item.id}`}
      prefetch={false}
      onNavigate={() => {
        dismiss();
        closeSearch("navigation");
      }}
      className="flex items-center gap-3 p-3 text-stroke-800 hover:bg-stroke-100 focus-visible:bg-stroke-100"
    >
      <AppImage src={item.image} alt="" width="size-12 shrink-0" sizes="48px" />
      <span className="min-w-0 flex-1 wrap-break-word">
        <span className="block text-sm">{item.perTitle}</span>
        {item.enTitle && (
          <span className="block text-xs text-stroke-500">{item.enTitle}</span>
        )}
      </span>
      <div className="flex h-6 shrink-0 items-center">
        <ProductGradeBadge product={{ grade: item.grade }} />
      </div>
    </Link>
  );
  const searchProps = (surface) => ({
    active: activeSurface === surface,
    onActiveChange: (active) => activateSearch(surface, active),
    results:
      suggestionQuery.enabled && Array.isArray(suggestions.data)
        ? suggestions.data
        : [],
    isFetching:
      suggestionQuery.waiting ||
      (suggestionQuery.enabled && suggestions.isFetching),
    isError: suggestionQuery.enabled && suggestions.isError,
    errorStatus: suggestions.error?.response?.status,
    renderResult,
    inputRef: (element) => {
      inlineInputs.current[surface] = element;
    },
  });
  const restoreSearchFocus = () => {
    if (closeReason.current === "navigation") return false;
    const visible = (element) =>
      element?.isConnected && element.getClientRects().length > 0;
    if (closeReason.current === "resize")
      return Object.values(inlineInputs.current).find(visible) || false;
    return visible(searchTriggerRef.current) ? searchTriggerRef.current : false;
  };
  const { user, isAuthenticated, loading } = useAuth();
  const { data: cartItems, isLoading } = useGetAllCartItems();
  // No profile is required after login: a user without a name is shown by
  // phone; the name is asked for at checkout instead.
  const accountName = formatFullName(user?.firstName, user?.lastName);

  const fullName =
    isAuthenticated !== true
      ? "ورود | ثبت نام"
      : accountName !== "-"
        ? accountName
        : toPersianNumbers(user?.phoneNumber);

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const { href, replace } = productSearchNavigation(
      searchValue,
      searchParams,
      pathname,
    );

    closeSearch("navigation");
    if (replace) router.replace(href);
    else router.push(href);
  };

  return (
    <>
      <DesktopHeader
        searchProps={searchProps("desktop")}
        totalProducts={cartItems?.totalProducts}
        toggleCategory={toggleCategory}
        warmCategory={warmCategory}
        isCategoryOpen={isCategoryOpen}
        loading={loading}
        fullName={fullName}
        isAuthenticated={isAuthenticated}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        handleSearchSubmit={handleSearchSubmit}
      />

      <MobileHeader
        searchProps={searchProps}
        activeSurface={activeSurface}
        searchTriggerRef={searchTriggerRef}
        dialogId={dialogId}
        onOpenSearch={() => activateSearch("spotlight", true)}
        totalProducts={cartItems?.totalProducts}
        openSidebar={openSidebar}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        handleSearchSubmit={handleSearchSubmit}
        pathname={pathname}
      />
      <MobileSearchOverlay
        open={activeSurface === "spotlight"}
        onClose={() => closeSearch()}
        dialogId={dialogId}
        finalFocus={restoreSearchFocus}
        searchProps={{
          ...searchProps("spotlight"),
          value: searchValue,
          onChange: (event) => setSearchValue(event.target.value),
          onSubmit: handleSearchSubmit,
        }}
      />
    </>
  );
}

export default HeaderLayout;

function DesktopHeader({
  searchProps,
  toggleCategory,
  warmCategory,
  fullName,
  isAuthenticated,
  isCategoryOpen,
  totalProducts,
  loading,
  searchValue,
  setSearchValue,
  handleSearchSubmit,
}) {
  const router = useRouter();
  const pathName = usePathname();

  return (
    <nav className="max-lg:hidden relative lg:fixed top-0 h-fit container mx-auto xl:max-w-7xl p-4 rounded-b-4xl bg-stroke-0 shadow-md shadow-black/10 dark:shadow-black/20 z-90 duration-200">
      <div className="flex flex-col justify-between gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex grow items-center justify-betwee gap-4">
            <ul className="flex grow items-center justify-between">
              <li className=" justify-items-center">
                <Link className="block p-2" href="/">
                  <AppImage
                    src="/images/jeawaz-logo-v6.0-r.webp"
                    alt="jeawaz-brand-icon"
                    width="w-18 h-10"
                    sizes="20vw"
                    priority={true}
                  />
                </Link>
              </li>
              <li className="flex relative grow col-span-3 ">
                <SearchSection
                  {...searchProps}
                  placeholder="نام ادکلن ، دسته بندی ، برند و ..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onSubmit={handleSearchSubmit}
                />
              </li>
            </ul>
            <ul>
              <li>
                <ThemeToggle />
              </li>
            </ul>
            <ul className="flex flex-none items-center justify-between gap-4">
              <li className="relative flex items-center justify-center max-lg:hidden">
                <Link
                  href={"/page/terms"}
                  className={`duration-200 ${
                    pathName.endsWith("/terms")
                      ? "text-primary font-bold"
                      : "text-stroke-800 hover:text-primary "
                  }`}
                >
                  <p className="text-xs lg:text-sm">قوانین و مقررات</p>
                </Link>
                {pathName.endsWith("/terms") && (
                  <div className="absolute -bottom-3 size-2 rounded-full bg-primary"></div>
                )}
              </li>
              <li className="relative flex items-center justify-center">
                <Link
                  href={"/page/about-us"}
                  className={`duration-200 ${
                    pathName.endsWith("/about-us")
                      ? "text-primary font-bold"
                      : "text-stroke-800 hover:text-primary "
                  }`}
                >
                  <p className="text-xs lg:text-sm">درباره ما</p>
                </Link>
                {pathName.endsWith("/about-us") && (
                  <div className="absolute -bottom-3 size-2 rounded-full bg-primary"></div>
                )}
              </li>
              <li className="relative flex items-center justify-center">
                <Link
                  href={"/page/contact-us"}
                  className={`duration-200 ${
                    pathName.endsWith("/contact-us")
                      ? "text-primary font-bold"
                      : "text-stroke-800 hover:text-primary"
                  }`}
                >
                  <p className="text-xs lg:text-sm">تماس با ما</p>
                </Link>
                {pathName.endsWith("/contact-us") && (
                  <div className="absolute -bottom-3 size-2 rounded-full bg-primary"></div>
                )}
              </li>
            </ul>
          </div>
          <ul className="flex flex-none items-center justify-between gap-3">
            <li
              className={`w-fit group max-w-36 h-10 lg:h-12 btn bg-stroke-0 active:bg-stroke-900 dark:active:bg-stroke-150 py-0 pl-1 pr-2 ${isAuthenticated === true ? "border-0 ring-1" : "border ring-0"} ring-stroke-900/10 dark:ring-stroke-800/10 border-stroke-250 duration-200`}
            >
              <button
                onClick={
                  isAuthenticated !== true
                    ? () => router.push("/auth/login")
                    : () => router.push("/profile/me")
                }
                disabled={isAuthenticated === null ? true : false}
                className={`size-full ${loading && "blur-xs opacity-50"} duration-200`}
              >
                <span
                  className={`flex flex-row-reverse items-center gap-1 size-full${isAuthenticated === true ? "justify-between text-stroke-900 dark:text-stroke-800 font-bold " : "justify-center text-stroke-800"}`}
                >
                  <div
                    className={`${isAuthenticated === true && "bg-stroke-900 dark:bg-stroke-50 text-stroke-400"} rounded-full p-2`}
                  >
                    <UserIcon className="size-4 stroke-2" />
                  </div>
                  <p className=" text-xs lg:text-sm text-nowrap overflow-x-scroll scrollbar-none size-full group-active:text-stroke-0 dark:group-active:text-stroke-800">
                    {fullName}
                  </p>
                </span>
              </button>
            </li>
            <li>
              <button
                className="flex items-center justify-between gap-2 group"
                onClick={() => router.push("/cart")}
              >
                <div className="flex items-center justify-center size-8 lg:size-10 p-1 rounded-full ring-4 ring-stroke-900/10 bg-stroke-900 group-active:bg-stroke-0 group-active:ring-stroke-900/20 dark:bg-stroke-50 dark:ring-stroke-800/5 dark:group-active:ring-stroke-800/5 duration-200">
                  <AppImage
                    src="/images/bag-stroke-sec-icon.svg"
                    alt="shopping-bag-icon"
                    className="invert"
                    width="max-lg:size-5 lg:size-6"
                    sizes="10vw"
                  />
                </div>
                {totalProducts > 0 && (
                  <div className="flex flex-col items-center justify-between gap-1 lg:gap-2 w-18 lg:w-20.75 text-xs lg:text-sm text-stroke-800 duration-200">
                    <p>سبد خرید شما</p>
                    <div className="flex items-center justify-between w-full">
                      <span className="flex items-center gap-2 pt-0.5 px-2 lg:px-3 rounded-3xl bg-stroke-900/10 dark:bg-stroke-800/5 text-xs lg:text-sm text-stroke-800">
                        <p>{toPersianNumbers(totalProducts)}</p>
                        <p>کالا</p>
                      </span>
                      <ArrowLeftIcon className="text-stroke-800 group-active:text-stroke-800/70 size-3 lg:size-4" />
                    </div>
                  </div>
                )}
              </button>
            </li>
          </ul>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-between gap-4">
            <ul>
              <li className="relative w-36 lg:w-44 h-12 cursor-not-allowed">
                <button
                  className="w-full h-full btn btn--primary ring-4 ring-primary/5 hover:ring-0 flex items-center justify-center size-full gap-2"
                  onClick={toggleCategory}
                  // Starts the category panel's data on intent, before the click.
                  onPointerEnter={warmCategory}
                  onFocus={warmCategory}
                  disabled={isCategoryOpen}
                >
                  <Squares2X2Icon className="size-6" />
                  <p className="text-xs lg:text-sm">دسته بندی ها</p>
                  <ChevronDownIcon className="size-4" />
                </button>
              </li>
            </ul>
            <ul className="flex items-center justify-start gap-4">
              <li className="">
                <Link
                  href={"/products?sort=best_selling"}
                  className="text-stroke-800 hover:text-primary duration-200"
                >
                  <div className="flex items-center justify-center gap-2 ">
                    <AppImage
                      src="/images/warranty-check-icon.svg"
                      alt="popular-icon"
                      width="size-5"
                      sizes="10vw"
                      className="dark:saturate-150 dark:brightness-200"
                    />
                    <p className="text-sm">پرفروش ترین ها</p>
                  </div>
                </Link>
              </li>
              <li className="">
                <Link
                  href={"/products?sort=newest"}
                  className="text-stroke-800 hover:text-primary duration-200"
                >
                  <div className="flex items-center justify-center gap-2 ">
                    <AppImage
                      src="/images/two-tag-icon.svg"
                      alt="tag-icon"
                      width="size-5"
                      sizes="10vw"
                      className="dark:saturate-150 dark:brightness-200"
                    />
                    <p className="text-sm">جدیدترین ها</p>
                  </div>
                </Link>
              </li>
              <li className="">
                <Link
                  href={"/products?sort=most_discounted&discounted=true"}
                  className="text-stroke-800 hover:text-primary duration-200"
                >
                  <div className="flex items-center justify-center gap-2 ">
                    <AppImage
                      src="/images/special-offer-2-icon.svg"
                      alt="offer-icon"
                      width="size-5"
                      sizes="10vw"
                      className="dark:saturate-150 dark:brightness-200"
                    />
                    <p className="text-sm">تخفیف دار</p>
                  </div>
                </Link>
              </li>
            </ul>
          </div>
          <ul>
            <li className="flex items-center justify-between gap-4">
              <Link
                href={"tel:+989302125151"}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center justify-center text-xl pl-4 border-l-[1.5px] border-stroke-200">
                  <p className="text-stroke-800 ">{toPersianNumbers("5151")}</p>
                  <p className="text-stroke-800 ">{toPersianNumbers("212")}</p>
                  <p className="text-primary ">{toPersianNumbers("0930")}</p>
                </div>
                <CardIconResponsive
                  as="div"
                  src="/images/call-ringing-4-primary-icon.svg"
                  alt="call-ringing-icon"
                  title="پشتیبانی"
                  type="support"
                  className="max-lg:h-8 lg:h-10"
                  size="max-lg:size-4 lg:size-6"
                />
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
function MobileHeader({
  searchProps,
  activeSurface,
  searchTriggerRef,
  dialogId,
  onOpenSearch,
  openSidebar,
  totalProducts,
  searchValue,
  setSearchValue,
  handleSearchSubmit,
  pathname,
}) {
  const router = useRouter();

  return (
    <nav className="lg:hidden max-lg:fixed max-lg:top-0 inset-x-0 h-fit w-full z-50">
      <ul className="flex items-center justify-between gap-2 sm:gap-4 w-full relative p-4 rounded-b-4xl bg-stroke-0/0 duration-200">
        <li className="flex-none">
          <button
            type="button"
            className="text-2xl aspect-square w-14 flex items-center justify-center rounded-full border-2 border-stroke-0/5 bg-stroke-800/5 backdrop-blur-md active:border-stroke-900/20 dark:border-stroke-800/5 dark:active:border-stroke-800/5 shadow-md shadow-black/10 text-primary active:text-primary/80 dark:text-stroke-800 dark:active:text-stroke-800/70 duration-200"
            onClick={openSidebar}
          >
            {pathname.startsWith("/admin") ||
            pathname.startsWith("/profile") ? (
              <Bars3Icon className="size-8 stroke-2 " />
            ) : (
              <AppImage
                src="/images/category.svg"
                alt="shopping-bag-icon"
                width="size-8"
                sizes="10vw"
              />
            )}
          </button>
        </li>
        <li
          className="px-2 flex-1 [@media(max-width:480px)]:pl-0 [@media(max-width:480px)]:w-full backdrop-blur-md bg-stroke-800/5 border-2 border-stroke-0/5
            shadow-md shadow-black/10 rounded-full"
        >
          <div className="[@media(max-width:480px)]:flex items-center justify-between gap-1">
            <Link
              className="block min-[481px]:p-2 [@media(max-width:480px)]:hidden [@media(max-width:480px)]:pr-1"
              href="/"
            >
              <AppImage
                src="/images/jeawaz-logo-v6.0-r.webp"
                alt="jeawaz-brand-icon"
                width="[@media(max-width:480px)]:h-7 h-8.5"
                ratio="aspect-3/2"
                sizes="20vw"
              />
            </Link>
            <button
              ref={searchTriggerRef}
              type="button"
              onClick={onOpenSearch}
              aria-label="جستجوی محصولات"
              aria-haspopup="dialog"
              aria-expanded={activeSurface === "spotlight"}
              aria-controls={dialogId}
              className="relative [@media(max-width:480px)]:flex flex-1 h-14 shrink-0 items-center justify-center rounded-full text-stroke-500 hidden"
            >
              <div className="flex items-center justify-start size-full gap-1">
                <p className="flex items-center text-nowrap text-stroke-400 font-bold -translate-y-">
                  جستجو در
                </p>
                <AppImage
                  src="/images/jeawaz-logo-v6.0-r.webp"
                  alt="jeawaz-brand-icon"
                  width="[@media(max-width:480px)]:h-8 h-8.5"
                  ratio="aspect-3/2"
                  sizes="20vw"
                />
              </div>
              <div className="flex items-center justify-center h-full aspect-square p-2.5 rounded-full backdrop-blur-md bg-stroke-0/5">
                <MagnifyingGlassIcon className="size-6 stroke-2" />
              </div>
            </button>
          </div>
        </li>
        <li className="[@media(max-width:480px)]:hidden w-full">
          <div className=" w-full h-12">
            <SearchSection
              {...searchProps("tablet")}
              placeholder="نام ادکلن ، دسته بندی ، برند و ..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSubmit={handleSearchSubmit}
            />
          </div>
        </li>
        <li className="flex-none">
          <button
            onClick={() => router.push("/cart")}
            className="relative aspect-square w-14 flex items-center justify-center rounded-full border-2 border-stroke-0/5 bg-stroke-800/5 backdrop-blur-md active:bg-stroke-50 active:border-stroke-900/20 dark:border-stroke-800/5 dark:active:border-stroke-800/5 shadow-md shadow-black/10 text-stroke-800 active:text-stroke-800/70 duration-200"
          >
            <AppImage
              src="/images/bag-stroke-sec-icon.svg"
              alt="shopping-bag-icon"
              className="dark:invert"
              width="size-8"
              sizes="10vw"
            />
            {totalProducts > 0 && (
              <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 aspect-square rounded-full bg-primary text-white text-xs">
                <p className="translate-y-px">
                  {toPersianNumbers(totalProducts)}
                </p>
              </div>
            )}
          </button>
        </li>
      </ul>
    </nav>
  );
}
