import Link from "next/link";
import { EyeIcon } from "@heroicons/react/24/solid";
import Table from "@/ui/Table";
import {
  adminNotifDesktopTHeads,
  adminNotifMobileTHeads,
} from "@/constants/tableHeads";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { getContactMessagePreview } from "@/utils/adminContactMessagesContract.mjs";
import {
  formatNotificationDateTime,
  getNotificationRowNumber,
  notificationChannelLabel,
  notificationStatsSummary,
  notificationTargetLabel,
  notificationTypeLabel,
} from "@/utils/notificationsContract.mjs";

// Notification ids, never recipient ids.
function ViewLink({ notification }) {
  return (
    <Link
      href={`/admin/notifs/${notification.type}/${notification.id}`}
      prefetch={false}
      aria-label="مشاهده اعلان"
      className="flex items-center justify-center text-stroke-450 hover:text-blue duration-200"
    >
      <EyeIcon className="size-5" />
    </Link>
  );
}

function ReadStat({ stats }) {
  return (
    <p className="text-nowrap">
      {toPersianNumbers(stats.read)} از {toPersianNumbers(stats.recipients)}
      <span className="text-stroke-500 text-xs">
        {" "}
        ({toPersianNumbers(stats.readPercentage)}٪)
      </span>
    </p>
  );
}

function SmsStat({ stats }) {
  if (!stats.sms) return <p className="text-stroke-500">—</p>;
  return (
    <p className="flex flex-col text-nowrap">
      <span className="text-success">
        {toPersianNumbers(stats.sms.success)} موفق
      </span>
      {stats.sms.failed > 0 && (
        <span className="text-error">
          {toPersianNumbers(stats.sms.failed)} ناموفق
        </span>
      )}
    </p>
  );
}

function AdminNotificationsListTable({ notifications, page, limit }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl shadow-xl scrollbar-none">
      <Table className="overflow-auto md:hidden">
        <Table.Header>
          {adminNotifMobileTHeads.map((item) => (
            <th className="whitespace-nowrap table__th" key={item.id}>
              {item.label}
            </th>
          ))}
        </Table.Header>
        <Table.body>
          {notifications.map((notification, index) => {
            const stats = notificationStatsSummary(notification);
            return (
              <Table.Row key={notification.id} className="even:bg-primary/5">
                <td className="table__td font-bold rounded-r-xl px-2">
                  {toPersianNumbers(
                    getNotificationRowNumber(page, limit, index),
                  )}
                </td>
                <td className="table__td px-2 max-w-60 min-w-40 text-wrap">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <p className="font-bold wrap-break-word">
                      {notification.title}
                    </p>
                    <p className="text-xs text-stroke-600">
                      {notificationTypeLabel(notification.type)} ·{" "}
                      {notificationChannelLabel(notification.channel)} ·{" "}
                      {notificationTargetLabel(notification.target)}
                    </p>
                    <p className="text-xs text-nowrap text-stroke-500">
                      {formatNotificationDateTime(notification.createdAt)}
                    </p>
                  </div>
                </td>
                <td className="table__td px-0 text-xs">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <ReadStat stats={stats} />
                    <SmsStat stats={stats} />
                  </div>
                </td>
                <td className="table__td rounded-l-xl px-2">
                  <ViewLink notification={notification} />
                </td>
              </Table.Row>
            );
          })}
        </Table.body>
      </Table>
      <Table className="overflow-auto max-md:hidden">
        <Table.Header>
          {adminNotifDesktopTHeads.map((item) => (
            <th className="whitespace-nowrap table__th" key={item.id}>
              {item.label}
            </th>
          ))}
        </Table.Header>
        <Table.body>
          {notifications.map((notification, index) => {
            const stats = notificationStatsSummary(notification);
            return (
              <Table.Row key={notification.id} className="even:bg-primary/5">
                <td className="table__td font-bold rounded-r-xl px-2">
                  {toPersianNumbers(
                    getNotificationRowNumber(page, limit, index),
                  )}
                </td>
                <td className="table__td px-2 max-w-64">
                  <p className="font-bold truncate">{notification.title}</p>
                  <p className="text-xs text-stroke-600 truncate">
                    {getContactMessagePreview(notification.message)}
                  </p>
                </td>
                <td className="table__td px-2 text-nowrap">
                  {notificationTypeLabel(notification.type)}
                </td>
                <td className="table__td px-2 text-nowrap">
                  {notificationChannelLabel(notification.channel)}
                </td>
                <td className="table__td px-2 text-nowrap">
                  {notificationTargetLabel(notification.target)}
                </td>
                <td className="table__td px-2 text-nowrap">
                  {formatNotificationDateTime(notification.createdAt)}
                </td>
                <td className="table__td px-2">
                  <ReadStat stats={stats} />
                </td>
                <td className="table__td px-0">
                  <SmsStat stats={stats} />
                </td>
                <td className="table__td rounded-l-xl px-2">
                  <ViewLink notification={notification} />
                </td>
              </Table.Row>
            );
          })}
        </Table.body>
      </Table>
    </div>
  );
}

export default AdminNotificationsListTable;
