"use client";

import { useRouter } from "next/navigation";
import "./globals.css";

export const metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function GlobalNotFound() {
  const route = useRouter();
  return (
    <html lang="fa" dir="rtl" className="">
      <body>
        <div className="flex flex-col items-center justify-start gap-4 h-screen translate-y-1/3">
          <h1 className="font-bold text-2xl">
            متاسفانه صفحه مورد نظر پیدا نشد!
          </h1>
          <button
            onClick={() => route.back()}
            className="btn btn--primary py-1 px-3 rounded-xl"
          >
            برگشت
          </button>
        </div>
      </body>
    </html>
  );
}
