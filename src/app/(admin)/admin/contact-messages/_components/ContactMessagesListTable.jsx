import {
  contactMessageDesktopTHeads,
  contactMessageMobileTHeads,
} from "@/constants/tableHeads";
import Table from "@/ui/Table";
import {
  formatContactDateTime,
  getContactMessagePreview,
  getContactRowNumber,
  getContactStatusBadge,
} from "@/utils/adminContactMessagesContract.mjs";
import { normalizeIranPhone, toPersianNumbers } from "@/utils/toPersianNumbers";
import { EyeIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

function StatusBadge({ status }) {
  const badge = getContactStatusBadge(status);
  return (
    <p className={`badge border font-bold text-nowrap ${badge.className}`}>
      {badge.label}
    </p>
  );
}

function ViewLink({ id }) {
  return (
    <Link
      href={`/admin/contact-messages/${id}`}
      aria-label="مشاهده پیام"
      className="flex items-center justify-center text-stroke-450 hover:text-blue duration-200"
    >
      <EyeIcon className="size-5" />
    </Link>
  );
}

function PhoneLink({ phoneNumber }) {
  return (
    <Link
      href={phoneNumber ? `tel:+${phoneNumber}` : ""}
      className="flex items-center gap-2 justify-center hover:text-primary duration-200 text-nowrap"
    >
      {normalizeIranPhone(phoneNumber) || "-"}
    </Link>
  );
}

function ContactMessagesListTable({ messages, page, limit }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl shadow-xl scrollbar-none">
      <>
        <Table className="overflow-auto md:hidden">
          <Table.Header>
            {contactMessageMobileTHeads.map((item) => (
              <th className="whitespace-nowrap table__th" key={item.id}>
                {item.label}
              </th>
            ))}
          </Table.Header>
          <Table.body>
            {messages?.map((message, index) => (
              <Table.Row key={message.id} className="even:bg-primary/5">
                <td className="table__td font-bold rounded-r-xl px-2">
                  {toPersianNumbers(getContactRowNumber(page, limit, index))}
                </td>
                <td className="table__td px-2 max-w-60 min-w-40 text-wrap">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="font-bold">{message.fullName}</p>
                    <PhoneLink phoneNumber={message.phoneNumber} />
                    <p className="text-stroke-600 text-xs">
                      {getContactMessagePreview(message.message, 40)}
                    </p>
                  </div>
                </td>
                <td className="table__td px-2">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <StatusBadge status={message.status} />
                    <p className="text-xs text-nowrap">
                      {formatContactDateTime(message.createdAt)}
                    </p>
                  </div>
                </td>
                <td className="table__td rounded-l-xl px-3">
                  <ViewLink id={message.id} />
                </td>
              </Table.Row>
            ))}
          </Table.body>
        </Table>
        <Table className="overflow-auto max-md:hidden">
          <Table.Header>
            {contactMessageDesktopTHeads.map((item) => (
              <th className="whitespace-nowrap table__th" key={item.id}>
                {item.label}
              </th>
            ))}
          </Table.Header>
          <Table.body>
            {messages?.map((message, index) => (
              <Table.Row key={message.id} className="even:bg-primary/5">
                <td className="table__td font-bold rounded-r-xl px-2">
                  {toPersianNumbers(getContactRowNumber(page, limit, index))}
                </td>
                <td className="table__td px-2 max-w-48 truncate">
                  <p className="font-bold">{message.fullName}</p>
                </td>
                <td className="table__td px-2">
                  <PhoneLink phoneNumber={message.phoneNumber} />
                </td>
                <td className="table__td px-2 max-w-72 truncate text-stroke-600">
                  {getContactMessagePreview(message.message)}
                </td>
                <td className="table__td px-2">
                  <StatusBadge status={message.status} />
                </td>
                <td className="table__td px-2 text-nowrap">
                  {formatContactDateTime(message.createdAt)}
                </td>
                <td className="table__td rounded-l-xl px-3">
                  <ViewLink id={message.id} />
                </td>
              </Table.Row>
            ))}
          </Table.body>
        </Table>
      </>
    </div>
  );
}

export default ContactMessagesListTable;
