"use client";

import SingleNotifPage from "@/components/SingleNotifPage";
import { useGetAdminNotificationById } from "@/hooks/useNotification";
import { useParams } from "next/navigation";
import NotifUsersListTable from "../../_components/NotifUsersListTable";

function AdminNotifPage() {
  const { id } = useParams();
  const { data, isPending, error } = useGetAdminNotificationById(id);

  return (
    <SingleNotifPage
      title={data?.title}
      createdAt={data?.createdAt}
      message={data?.message}
      isPending={isPending}
      error={error}
    >
      <NotifDetails data={data} />
    </SingleNotifPage>
  );
}

export default AdminNotifPage;

function NotifDetails({ data }) {
  const { target, createdByAdminId, channel, recipients, type } = data || {};

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 w-full">
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-stroke-200 shadow-md p-4 size-fit">
        <p className="text-sm text-stroke-600">بخش:</p>
        <p className="font-bold text-stroke-800">
          {(type === "ORDER" && "سفارش") ||
            (type === "SYSTEM" && "اعلان سیستمی") ||
            (type === "DISCOUNT" && "تخفیف") ||
            (type === "CAMPAIGN" && "کمپین") ||
            (type === "CUSTOM" && "شخصی")}
        </p>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-stroke-200 shadow-md p-4 size-fit">
        <p className="text-sm text-stroke-600">مخاطب هدف:</p>
        <p className="font-bold text-stroke-800">
          {(target === "USER" && "کاربر انتخاب شده") ||
            (target === "ALL" && "همه کاربران") ||
            (target === "ًROLE" && "نقش مربوطه")}
        </p>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-stroke-200 shadow-md p-4 size-fit">
        <p className="text-sm text-stroke-600">ارسال شده توسط:</p>
        <p className="font-bold text-stroke-800">
          {createdByAdminId ? "ادمین" : "سیستم"}
        </p>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-stroke-200 shadow-md p-4 size-fit">
        <p className="text-sm text-stroke-600">مقصد ارسال:</p>
        <p className="font-bold text-stroke-800">
          {(channel === "BOTH" && "سایت و پیامک") ||
            (channel === "IN_APP" && "سایت") ||
            (channel === "SMS" && "پیامک")}
        </p>
      </div>
      <div className="max-lg:w-screen lg:w-full max-lg:px-4">
        <NotifUsersListTable data={recipients} />
      </div>
    </div>
  );
}
