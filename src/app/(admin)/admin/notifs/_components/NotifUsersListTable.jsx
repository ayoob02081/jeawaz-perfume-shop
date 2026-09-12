import { NotifDesktopTHeads, NotifMobileTHeads } from "@/constants/tableHeads";
import Table from "@/ui/Table";
import { toLocalDateString } from "@/utils/toLocalDate";
import { normalizeIranPhone, toPersianNumbers } from "@/utils/toPersianNumbers";
import { TrashIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

function NotifUsersListTable({ data }) {
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
              data?.map((item, index) => (
                <Table.Row key={item.id} className="even:bg-primary/5">
                  <td className="table__td font-bold px-2 rounded-r-xl">
                    {toPersianNumbers(index + 1)}
                  </td>
                  <td className="table__td px-2 max-w-70 min-w-40 text-wrap">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <p>
                        {item.user?.firstName + " " + item.user?.lastName ||
                          "اسمی ثبت نشده"}
                      </p>
                      <Link
                        href={`tel:+${item.user?.phoneNumber}`}
                        className="flex items-center gap-2 justify-end hover:text-primary duration-200"
                      >
                        {normalizeIranPhone(item.user?.phoneNumber) || "-"}
                      </Link>
                    </div>
                  </td>
                  <td className="table__td px-2 max-w-70 truncate">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <p>{item.isRead ? "خوانده شده" : "خوانده نشده"}</p>
                    </div>
                    <p>{item.readAt ? toLocalDateString(item.readAt) : "-"}</p>
                  </td>
                  <td className="table__td px-2 max-w-70 truncate">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <p>{item.smsSent ? "فرستاده شده" : "فرستاده نشده"}</p>
                      <p>
                        {item.smsSent
                          ? item.smsSentAt
                            ? toLocalDateString(item.smsSentAt)
                            : "-"
                          : "-"}
                      </p>
                    </div>
                  </td>
                  <td className="table__td px-3 rounded-l-xl">
                    {/* <button
                      type="button"
                      className="flex items-center justify-center text-stroke-450 hover:text-primary duration-200 w-full"
                    >
                      <TrashIcon className="size-5" />
                    </button> */}
                  </td>
                </Table.Row>
              ))}
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
              data?.map((item, index) => (
                <Table.Row key={item.id} className="even:bg-primary/5">
                  <td className="table__td font-bold px-2 rounded-r-xl">
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
                      className="flex items-center gap-2 justify-end hover:text-primary duration-200"
                    >
                      {normalizeIranPhone(item.user?.phoneNumber) || "-"}
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

                  <td className="table__td px-3 rounded-l-xl">
                    {/* <button
                      type="button"
                      className="flex items-center justify-center text-stroke-450 hover:text-primary duration-200 w-full"
                    >
                      <TrashIcon className="size-5" />
                    </button> */}
                  </td>
                </Table.Row>
              ))}
          </Table.body>
        </Table>
      </>
    </div>
  );
}

export default NotifUsersListTable;
