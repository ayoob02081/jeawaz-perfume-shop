import Image from "next/image";
import Link from "next/link";

function MobilePannel() {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-[83px] bg-white px-5">
      <ul className="grid grid-cols-4 p-2 gap-x-5 gap-y-5 container mx-auto xl:max-w-7xl h-full">
        <li className=" justify-items-start">
          <Link
            className="flex flex-col justify-between items-center gap-2 p-3"
            href="/"
          >
            <div className="w-6 h-6">
              <Image
                className="w-full h-full"
                src="/images/homefilled.svg"
                alt="home icon"
                width={24}
                height={24}
              />
            </div>
            <p className="text-xs text-text-secondary">خانه</p>
          </Link>
        </li>
        <li className=" justify-items-start">
          <Link
            className="flex flex-col justify-between items-center gap-2 p-3"
            href="/"
          >
            <div className="w-6 h-6">
              <Image
                className="w-full h-full"
                src="/images/category stroke.svg"
                alt="products icon"
                width={24}
                height={24}
              />
            </div>
            <p className="text-xs text-text-secondary">فروشگاه</p>
          </Link>
        </li>
        <li className=" justify-items-start">
          <Link
            className="flex flex-col justify-between items-center gap-2 p-3"
            href="/"
          >
            <div className="w-6 h-6">
              <Image
                className="w-full h-full"
                src="/images/card stroke2.svg"
                alt="card icon"
                width={24}
                height={24}
              />
            </div>
            <p className="text-xs text-text-secondary">سبد خرید</p>
          </Link>
        </li>
        <li className=" justify-items-start">
          <Link
            className="flex flex-col justify-between items-center gap-2 p-3"
            href="/"
          >
            <div className="w-6 h-6">
              <Image
                className="w-full h-full"
                src="/images/acount stroke.svg"
                alt="acount icon"
                width={24}
                height={24}
              />
            </div>
            <p className="text-xs text-text-secondary">پروفایل</p>
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default MobilePannel;
