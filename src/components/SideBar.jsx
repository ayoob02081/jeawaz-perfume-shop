"use client";

import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import ImageFrame from "./ImageFrame";
import Logo from "./Logo";

function SideBar({ toggleSideBar, toggleCategory, sidebarOpen }) {
  // const pathName = usePathname();
  // const { data, isLoading } = useGetUser();
  // const { user } = data || {};
  // console.log(user?.role);

  // const router = useRouter();
  // const queryClient = useQueryClient();
  // const { isPending, mutateAsync: logout } = useMutation({
  // mutationFn: logoutApi,
  // });

  // const logoutHandler = async (e) => {
  //   e.preventDefault();
  //   try {
  //     await logout();
  //     queryClient.invalidateQueries({ queryKey: "get-user" });
  //     document.location.href = "/";
  //     router.push("/");
  //   } catch (error) {
  //     const errorMessage = error?.response?.data?.message;
  //     toast.error(errorMessage);
  //     console.log(error);
  //   }
  // };

  return (
    <ul
      className={`${
        sidebarOpen ? "right-0" : "-right-[100vw]"
      } absolute top-0 bg-black/30 w-[100vw] h-screen z-50 backdrop-blur-md flex flex-col duration-200`}
    >
      <div className="pt-6 w-[75vw] bg-white h-full">
        <li className="p-6 pb-10 flex items-center justify-between">
          <Logo width="size-16" />
          <button className="size-6" onClick={toggleSideBar}>
            <ImageFrame
              src="/images/close-icon.svg"
              alt="close icon"
              className="size-6"
            />
          </button>
        </li>
        <div className="px-6 pb-4 border-b-4 border-stroke">
          <li>
            <button
              className="profileLink justify-between text-base w-full "
              onClick={toggleCategory}
            >
              <div className="flex items-center">
                <ImageFrame
                  src="/images/category.svg"
                  alt="offer icon"
                  className="pl-2 size-6"
                />
                <div className="flex items-center justify-center gap-1 border-r-[1.5px] border-primary-10 px-2">
                  <span className="profileTitle text-base">دسته بندی</span>
                  <span className="profileTitle text-[10px]">محصولات</span>
                </div>
              </div>
              <ChevronLeftIcon className="size-5" />
            </button>
          </li>
          <li>
            <Link
              className="profileLink"
              // className={`${
              //   pathName.endsWith("/profile") ? "text-primary-900" : ""
              // } profileLink`}
              href={"/profile"}
            >
              <ImageFrame
                src="/images/warranty-check-icon.svg"
                alt="offer icon"
                className="size-6"
              />

              <span className="profileTitle">پرفروش ترین ها</span>
            </Link>
          </li>
          <li>
            <Link
              className="profileLink"
              // className={`${
              //   pathName.startsWith("/profile/me") ? "text-primary-900" : ""
              // } profileLink`}
              href="/profile/me"
            >
              <ImageFrame
                src="/images/two-tag-icon.svg"
                alt="offer icon"
                className="size-6"
              />
              <span className="profileTitle">جدیدترین ها</span>
            </Link>
          </li>
          <li>
            <Link
              className="profileLink"
              // className={`${
              //   pathName.startsWith("/profile/payments") ? "text-primary-900" : ""
              // } profileLink`}
              href={"/profile/payments"}
            >
              <ImageFrame
                src="/images/special-offer-2-icon.svg"
                alt="offer icon"
                className="size-6"
              />
              <span className="profileTitle">تخفیف دار</span>
            </Link>
          </li>
        </div>
        <div className="p-6">
          {/* <li>
            <Link className="profileLinkSecond border-none" href="/">
              <span>مطالب آموزشی</span>
              <ChevronLeftIcon className="size-4" />
            </Link>
          </li> */}
          <li>
            <Link className="profileLinkSecond" href="/">
              <span>تماس با ما</span>
              <ChevronLeftIcon className="size-4" />
            </Link>
          </li>
          <li>
            <Link className="profileLinkSecond" href="/">
              <span>درباره ما</span>
              <ChevronLeftIcon className="size-4" />
            </Link>
          </li>
        </div>
      </div>
    </ul>
  );
}

export default SideBar;
