import {
  ArrowLeftIcon,
  CheckBadgeIcon,
  ChevronDownIcon,
  CreditCardIcon,
  PhoneIcon,
  ReceiptPercentIcon,
  Squares2X2Icon,
  TagIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import ImageFrame from "./ImageFrame";

function Header() {
  return (
    <header className="max-md:hidden p-2 container mx-auto xl:max-w-7xl ">
      <nav>
        <ul className="flex flex-col justify-between gap-6">
          <div className="flex items-center justify-between gap-10">
            <div className="flex grow items-center justify-betwee gap-4">
              <div className="flex grow items-center justify-between">
                <li className=" justify-items-center">
                  <Link className="block p-2" href="/">
                    jeawaz
                  </Link>
                </li>
                <li className="flex relative grow col-span-3 h-12 rounded-[48px] bg-[#F7F7F7]">
                  <input
                    className="p-4 outline-0 w-full"
                    type="search"
                    placeholder="نام ادکلن ، دسته بندی ، برند و ..."
                  />
                  <div className="absolute left-6 top-1/2 -translate-1/2 bg-white rounded-full p-2">
                    <Image
                      src="/images/search.svg"
                      alt="search icon"
                      width={24}
                      height={24}
                    />
                  </div>
                </li>
              </div>
              <div className="flex flex-none items-center justify-between gap-4">
                <li className="">
                  <p className="text-xs lg:text-sm">مطالب آموزشی</p>
                </li>
                <li className="">
                  <p className="text-xs lg:text-sm">درباره ما</p>
                </li>
                <li className="">
                  <p className="text-xs lg:text-sm">تماس با ما</p>
                </li>
              </div>
            </div>
            <div className="flex flex-none items-center justify-between gap-2 lg:gap-4">
              <li className="w-28 lg:w-36 h-10 lg:h-12 btn">
                <Link href={"/"}>
                  <div className="flex items-center justify-center px-1.5 lg:px-4 size-full gap-2 ">
                    <p className="text-xs">ورود | ثبت نام</p>
                    <UserIcon className="size-5" />
                  </div>
                </Link>
              </li>
              <li className="flex items-center justify-between w-32 lg:w-[8.8rem]">
                <div className="size-12 px-2.5 py-2.5 rounded-full border-4 border-secondary2 bg-[#2F0D0C]">
                  <Image
                    src="/images/card stroke white.svg"
                    alt="card icon"
                    width={24}
                    height={24}
                  />
                </div>
                <div className="flex flex-col items-center justify-between gap-1 lg:gap-2 w-[4.5rem] lg:w-[5.3rem]">
                  <p className="text-xs lg:text-sm">سبد خرید شما</p>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 py-0.5 px-2 lg:px-3 rounded-3xl bg-secondary2">
                      <p className="text-xs lg:text-sm">۴</p>
                      <p className="text-xs lg:text-sm">کالا</p>
                    </div>
                    <ArrowLeftIcon className=" size-3 lg:size-4" />
                  </div>
                </div>
              </li>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between gap-4">
              <li className="w-36 lg:w-44 h-12 btn btn-primary">
                <Link href={"/"}>
                  <div className="flex items-center justify-center size-full gap-2 ">
                    <Squares2X2Icon className="size-6" />
                    <p className="text-xs lg:text-sm">دسته بندی ها</p>
                    <ChevronDownIcon className="size-4" />
                  </div>
                </Link>
              </li>
              <div className="flex items-center justify-start gap-4">
                <li className="">
                  <Link href={"/"}>
                    <div className="flex items-center justify-center gap-2 ">
                      <CheckBadgeIcon className="size-5" />
                      <p className="text-sm">پرفروش ترین ها</p>
                    </div>
                  </Link>
                </li>
                <li className="">
                  <Link href={"/"}>
                    <div className="flex items-center justify-center gap-2 ">
                      <TagIcon className="size-5" />
                      <p className="text-sm">جدیدترین ها</p>
                    </div>
                  </Link>
                </li>
                <li className="">
                  <Link href={"/"}>
                    <div className="flex items-center justify-center gap-2 ">
                      <ReceiptPercentIcon className="size-5" />
                      <p className="text-sm">تخفیف دار</p>
                    </div>
                  </Link>
                </li>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <li className="w-[8.18rem] flex items-center justify-center">
                <p className="md:text-base">09180522273</p>
              </li>
              <li className="w-24 lg:w-[7.62rem] h-10 btn btn-primary">
                <Link href={"/"}>
                  <div className="flex items-center justify-center px-4 size-full gap-2 ">
                    <ImageFrame
                      src="/images/call-ringing-4-wihte-icon.svg"
                      alt="call ringing icon"
                      className=""
                      width={20}
                    />
                    <p className="text-sm">پشتیبانی</p>
                  </div>
                </Link>
              </li>
            </div>
          </div>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
