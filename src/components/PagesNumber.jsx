import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

function PagesNumber() {
  return (
    <div className="flex items-center justify-between flex-row-reverse gap-4">
      <div>
        <ArrowLeftIcon className="size-6 text-text-primary hover:text-primary" />
      </div>
      <Link href={"/products"} className="pagesBtn">
        <p>۰۱</p>
      </Link>
      <Link href={"/products"} className="pagesBtn">
        <p>۰۲</p>
      </Link>
      <Link href={"/products"} className="pagesBtn">
        <p>۰۳</p>
      </Link>
      <Link href={"/products"} className="pagesBtn">
        <p>۰۴</p>
      </Link>
      <div>
        <ArrowRightIcon className="size-6 text-text-primary hover:text-primary" />
      </div>
    </div>
  );
}

export default PagesNumber;
