"use client";

import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { usePathname, useRouter } from "next/navigation";

const notifTypesData = [
  {
    id: 1,
    value: "ALL",
    title: "همه پیام‌ها",
  },
  {
    id: 2,
    value: "ORDER",
    title: "سفارش‌ها",
  },
  {
    id: 3,
    value: "DISCOUNT",
    title: "تخفیف‌ها",
  },
  {
    id: 4,
    value: "CAMPAIGN",
    title: "پیشنهادات لحظه آخر",
  },
  {
    id: 5,
    value: "SYSTEM",
    title: "اعلان‌های داخلی",
  },
  {
    id: 6,
    value: "CUSTOM",
    title: "پیشنهادات شخصی",
  },
];

export default NotifTypes;

function NotifTypes({ data }) {
  const pathName = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center justify-start max-lg:py-4 py-4 gap-4 snap-x overflow-x-scroll scrollbar-none">
      {notifTypesData?.map((item) => (
        <button
          key={item.id}
          onClick={() =>
            router.replace(
              `/${pathName.startsWith("/admin") ? "admin" : "profile"}/notifs/${item.value}`,
            )
          }
          className={`relative flex items-center justify-center px-4 max-lg:rounded-lg lg:rounded-3xl w-fit h-9 snap-center
        ${
          pathName.includes(item.value)
            ? "lg:border lg:border-primary max-lg:bg-primary lg:bg-stroke-0 max-lg:text-white lg:font-bold lg:text-primary"
            : "lg:border lg:border-stroke-250 max-lg:bg-primary/10 lg:bg-stroke-100 dark:lg:bg-stroke-50 text-stroke-800"
        } snap-center`}
        >
          <p className="text-sm text-nowrap font-bold">{item.title}</p>
          {data?.byType[item.value] > 0 && (
            <div className="absolute -top-1 -left-1 z-10 flex items-center justify-center aspect-square text-nowrap p-1 rounded-full max-lg:bg-stroke-900 lg:bg-primary text-white h-4 text-xs">
              <p className="translate-y-px">
                {toPersianNumbers(data?.byType[item.value])}
              </p>
            </div>
          )}
          {item?.value === "ALL" && data?.total > 0 && (
            <div className="absolute -top-1 -left-1 z-10 flex items-center justify-center aspect-square text-nowrap p-1 rounded-full max-lg:bg-stroke-900 lg:bg-primary text-white h-4 text-xs">
              <p className="translate-y-px">{toPersianNumbers(data?.total)}</p>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
