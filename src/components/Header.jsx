import Image from "next/image";
import Link from "next/link";

function Header() {
  return (
    <header className=" top-0 right-0 left-0 p-2 h-32">
      <nav>
        <ul className="grid grid-cols-3 p-2 gap-x-10 gap-y-5 container mx-auto xl:max-w-7xl">
          <li className=" justify-items-start">
            <Link
              className="block p-3 rounded-full border-2 border-primary/10"
              href="/"
            >
              <Image
                src="/images/category.svg"
                alt="category icon"
                width={24}
                height={24}
              />
            </Link>
          </li>
          <li className=" justify-items-center">
            <Link className="block p-2" href="/">
              jeawaz
            </Link>
          </li>
          <li className=" justify-items-end">
            <Link
              className="relative block p-3 rounded-full border-2 border-primary/10"
              href="/"
            >
              <Image
                src="/images/card stroke.svg"
                alt="card icon"
                width={18.5}
                height={18.5}
              />
              <p className="absolute -top-1 -right-1 px-1.5 py-0. rounded-full bg-primary text-white text-[12px]">
                4
              </p>
            </Link>
          </li>
          <li className="flex relative grow col-span-3 w-full h-12 rounded-[48px] bg-[#F7F7F7]">
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
        </ul>
      </nav>
    </header>
  );
}

export default Header;
