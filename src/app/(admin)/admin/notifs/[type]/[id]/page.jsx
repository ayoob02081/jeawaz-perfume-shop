"use client";

import SingleNotifPage from "@/components/SingleNotifPage";
import { NotifTHeads } from "@/constants/tableHeads";
import { useGetAdminNotificationById } from "@/hooks/useNotification";
import Table from "@/ui/Table";
import { toLocalDateString } from "@/utils/toLocalDate";
import { normalizeIranPhone, toPersianNumbers } from "@/utils/toPersianNumbers";
import { TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useParams } from "next/navigation";

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
      <NotifUsersTable data={recipients} />
    </div>
  );
}

function NotifUsersTable({ data }) {
  return (
    <div className="w-full overflow-x-auto pb-0.5 mt-4 rounded-xl max-lg:shadow-xl scrollbar--primary scrollbar-h-1 scrollbar-track-stroke-100/0">
      <Table>
        <Table.Header>
          {NotifTHeads.map((item) => (
            <th className="whitespace-nowrap table__th" key={item.id}>
              {item.label}
            </th>
          ))}
        </Table.Header>
        <Table.body>
          {data &&
            data?.map((item, index) => (
              <Table.Row key={item.id} className="even:bg-primary/5">
                <td className="table__td font-bold px-2">
                  {toPersianNumbers(index + 1)}
                </td>
                <td className="table__td px-2 max-w-70 truncate">
                  <p>
                    {item.user?.firstName + " " + item.user?.lastName ||
                      "اسمی ثبت نشده"}
                  </p>
                </td>
                <td className="table__td px-2">
                  <Link
                    href={`tel:+${item.user?.phoneNumber}`}
                    className="flex items-center gap-2 justify-between hover:text-primary duration-200"
                  >
                    {normalizeIranPhone(item.user?.phoneNumber) ||
                      "شماره‌ای ثبت نشده"}
                  </Link>
                </td>
                <td className="table__td px-2 max-w-70 truncate">
                  <p>{item.isRead ? "خوانده شده" : "خوانده نشده"}</p>
                </td>
                <td className="table__td px-2 max-w-70 truncate">
                  <p>{item.readAt ? toLocalDateString(item.readAt) : "-"}</p>
                </td>
                <td className="table__td px-2 max-w-70 truncate">
                  <p>{item.smsSent ? "فرستاده شده" : "فرستاده نشده"}</p>
                </td>
                <td className="table__td px-2 max-w-70 truncate">
                  <p>
                    {item.smsSent
                      ? item.smsSentAt
                        ? toLocalDateString(item.smsSentAt)
                        : "-"
                      : "-"}
                  </p>
                </td>
                <td className="table__td px-2 max-w-70 truncate">
                  <p>
                    {item.smsSent
                      ? item.smsError
                        ? "خطایی پیش آمده"
                        : "-"
                      : "-"}
                  </p>
                </td>

                <td className="table__td flex items-center justify-center gap-2 px-3">
                  <button
                    type="button"
                    className="flex items-center justify-center text-stroke-450 hover:text-primary duration-200"
                  >
                    <TrashIcon className="size-5" />
                  </button>
                </td>
              </Table.Row>
            ))}
        </Table.body>
      </Table>
    </div>
  );
}
