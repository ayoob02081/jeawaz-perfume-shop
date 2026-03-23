import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

function BreadCrumb({ href, label, className, chevron }) {
  const currentHref = href;
  return (
    <div className="flex items-center justify-center gap-2 text-sm">
      {chevron ? <ChevronLeftIcon className="size-2.5 text-stroke-600" /> : ""}
      <Link href={href} className={`text-stroke-600 ${className}`}>
        {label}
      </Link>
    </div>
  );
}

export default BreadCrumb;
