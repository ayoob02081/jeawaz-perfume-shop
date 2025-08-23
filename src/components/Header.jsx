import { CreditCardIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";

function Header() {
  return (
    <header className="max-md:hidden  p-2 container mx-auto xl:max-w-7xl ">
      <nav>
        <ul className="flex flex-col justify-between gap-6">
          <div className="flex items-center justify-between gap-10">
            <div className="flex grow items-center justify-between gap-4">
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
              <li className="w-20 bg-red-100">hello 1</li>
              <li className="w-20 bg-red-100">hello 2</li>
              <li className="w-20 bg-red-100">hello 3</li>
            </div>
            <div className="flex flex-none items-center justify-between gap-4">
              <li className="w-36 h-12 border border-text-secondary rounded-[3.3rem]">
                <Link href={"/"}>
                  <div className="flex items-center justify-center px-4 py-3 gap-2 ">
                    <p>hellow</p>
                    <CreditCardIcon className="size-5" />
                  </div>
                </Link>
              </li>
              <li className="w-36 bg-red-100">5</li>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between gap-2">
              <li className="w-44 h-12 border border-text-secondary rounded-[3.3rem]">
                <Link href={"/"}>
                  <div className="flex items-center justify-center px-5 py-3 gap-2 ">
                    <CreditCardIcon className="size-6" />
                    <p>hellow</p>
                  </div>
                </Link>
              </li>
              <li className="w-32">
                <Link href={"/"}>
                  <div className="flex items-center justify-center gap-2 ">
                    <CreditCardIcon className="size-5" />
                    <p>hellow</p>
                  </div>
                </Link>
              </li>
              <li className="w-32">
                <Link href={"/"}>
                  <div className="flex items-center justify-center gap-2 ">
                    <CreditCardIcon className="size-5" />
                    <p>hellow</p>
                  </div>
                </Link>
              </li>
              <li className="w-32">
                <Link href={"/"}>
                  <div className="flex items-center justify-center gap-2 ">
                    <CreditCardIcon className="size-5" />
                    <p>hellow</p>
                  </div>
                </Link>
              </li>
            </div>
            <div className="flex items-center justify-between gap-4">
              <li className="w-32">09180522273</li>
              <li className="w-32 h-10 border border-text-secondary rounded-[3.3rem]">
                <Link href={"/"}>
                  <div className="flex items-center justify-center px-4 py-2 gap-2 ">
                    <CreditCardIcon className="size-5" />
                    <p>hellow</p>
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
