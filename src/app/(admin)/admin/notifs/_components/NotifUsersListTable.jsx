import { NotifDesktopTHeads, NotifMobileTHeads } from "@/constants/tableHeads";
import Table from "@/ui/Table";
import { toLocalDateString } from "@/utils/toLocalDate";
import { normalizeIranPhone, toPersianNumbers } from "@/utils/toPersianNumbers";
import {
  recipientDisplayName,
  recipientSmsStatus,
} from "@/utils/notificationsContract.mjs";
import Link from "next/link";

const SMS_TONES = {
  sent: "text-success",
  failed: "text-error font-bold",
  pending: "text-stroke-600",
  none: "text-stroke-500",
};

function SmsStatusLabel({ status }) {
  return <p className={SMS_TONES[status.kind]}>{status.label}</p>;
}

// The provider's error text, for the admin; shown only for a failed send.
function SmsError({ status }) {
  if (status.kind !== "failed") return <p>-</p>;
  return (
    <p className="text-error text-xs text-wrap wrap-break-word" dir="ltr">
      {status.error}
    </p>
  );
}

function PhoneLink({ phoneNumber }) {
  return (
    <Link
      href={phoneNumber ? `tel:+${phoneNumber}` : ""}
      className="flex items-center gap-2 justify-end hover:text-primary duration-200"
    >
      {normalizeIranPhone(phoneNumber) || "-"}
    </Link>
  );
}

// `channel` is the notification's: an IN_APP notification sends no SMS.
function NotifUsersListTable({ data, channel }) {
  return (
    <div className="w-full overflow-x-auto mt-4 rounded-xl max-lg:shadow-xl scrollbar-none">
      <>
        <Table className="md:hidden">
          <Table.Header>
            {NotifMobileTHeads.map((item) => (
              <th className="whitespace-nowrap table__th" key={item.id}>
                {item.label}
              </th>
            ))}
          </Table.Header>
          <Table.body>
            {data &&
              data?.map((item, index) => {
                const sms = recipientSmsStatus(item, channel);
                return (
                  <Table.Row key={item.id} className="even:bg-primary/5">
                    <td className="table__td font-bold px-2 rounded-r-xl">
                      {toPersianNumbers(index + 1)}
                    </td>
                    <td className="table__td px-2 max-w-70 min-w-40 text-wrap">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <p>{recipientDisplayName(item.user)}</p>
                        <PhoneLink phoneNumber={item.user?.phoneNumber} />
                      </div>
                    </td>
                    <td className="table__td px-2 max-w-70 truncate">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <p>{item.isRead ? "خوانده شده" : "خوانده نشده"}</p>
                      </div>
                      <p>{item.readAt ? toLocalDateString(item.readAt) : "-"}</p>
                    </td>
                    <td className="table__td px-2 max-w-48">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <SmsStatusLabel status={sms} />
                        {sms.kind === "sent" && sms.sentAt && (
                          <p>{toLocalDateString(sms.sentAt)}</p>
                        )}
                        {sms.kind === "failed" && <SmsError status={sms} />}
                      </div>
                    </td>
                    <td className="table__td px-3 rounded-l-xl"></td>
                  </Table.Row>
                );
              })}
          </Table.body>
        </Table>
        <Table className="max-md:hidden">
          <Table.Header>
            {NotifDesktopTHeads.map((item) => (
              <th className="whitespace-nowrap table__th" key={item.id}>
                {item.label}
              </th>
            ))}
          </Table.Header>
          <Table.body>
            {data &&
              data?.map((item, index) => {
                const sms = recipientSmsStatus(item, channel);
                return (
                  <Table.Row key={item.id} className="even:bg-primary/5">
                    <td className="table__td font-bold px-2 rounded-r-xl">
                      {toPersianNumbers(index + 1)}
                    </td>
                    <td className="table__td px-2 max-w-70 truncate">
                      <p>{recipientDisplayName(item.user)}</p>
                    </td>
                    <td className="table__td px-2">
                      <PhoneLink phoneNumber={item.user?.phoneNumber} />
                    </td>
                    <td className="table__td px-2 max-w-70 truncate">
                      <p>{item.isRead ? "خوانده شده" : "خوانده نشده"}</p>
                    </td>
                    <td className="table__td px-2 max-w-70 truncate">
                      <p>{item.readAt ? toLocalDateString(item.readAt) : "-"}</p>
                    </td>
                    <td className="table__td px-2 max-w-70 truncate">
                      <SmsStatusLabel status={sms} />
                    </td>
                    <td className="table__td px-2 max-w-70 truncate">
                      <p>
                        {sms.kind === "sent" && sms.sentAt
                          ? toLocalDateString(sms.sentAt)
                          : "-"}
                      </p>
                    </td>
                    <td className="table__td px-2 max-w-60">
                      <SmsError status={sms} />
                    </td>
                    <td className="table__td px-3 rounded-l-xl"></td>
                  </Table.Row>
                );
              })}
          </Table.body>
        </Table>
      </>
    </div>
  );
}

export default NotifUsersListTable;
