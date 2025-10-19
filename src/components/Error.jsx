"use client";

import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

function Error({ className }) {
  const router = useRouter();
  return (
    <div
      className={`flex flex-col items-center justify-center gap-6 ${className}  h-60`}
    >
      <p className="text-error font-bold text-2xl">خطا در بارگذاری محصولات</p>
      <button
        onClick={() => router.refresh()}
        className="flex items-center justify-center gap-1 btn hover:text-primary active:text-primary duration-200 "
      >
        <p className="text-lg">تازه سازی صفحه</p>
        <ArrowPathIcon className="size-6" />
      </button>
    </div>
  );
}

export default Error;
