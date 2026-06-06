import { userTHeads } from "@/constants/tableHeads";
import Table from "@/ui/Table";
import { toLocalDateString } from "@/utils/toLocalDate";
import { normalizeIranPhone, toPersianNumbers } from "@/utils/toPersianNumbers";
import { EyeIcon, TrashIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

function UsersListTable({ users }) {
  return (
    <div className="w-full overflow-x-auto pb-0.5 rounded-xl shadow-xl scrollbar--primary scrollbar-h-1 scrollbar-track-stroke-100/0">
      <Table className="overflow-auto">
        <Table.Header>
          {userTHeads.map((item) => (
            <th className="whitespace-nowrap table__th" key={item.id}>
              {item.label}
            </th>
          ))}
        </Table.Header>
        <Table.body>
          {users &&
            users?.map((user, index) => {
              return (
                <Table.Row key={user.id} className="even:bg-primary/5">
                  <td className="table__td font-bold px-2">
                    {toPersianNumbers(index + 1)}
                  </td>
                  <td className="table__td px-2 max-w-70 truncate">
                    <p>{user?.fullName || "اسمی ثبت نشده"}</p>
                  </td>
                  <td className="table__td px-2">
                    <Link
                      href={`tel:+${user?.phoneNumber}`}
                      className="flex items-center gap-2 justify-between hover:text-primary duration-200"
                    >
                      {normalizeIranPhone(user?.phoneNumber) ||
                        "شماره‌ای ثبت نشده"}
                    </Link>
                  </td>
                  <td className="table__td px-2 max-w-70 truncate">
                    {user?.email || "ایمیلی ثبت نشده"}
                  </td>
                  <td className="table__td px-2">
                    <p
                      className={`badge ${user?.role === "admin" ? " bg-success/10 text-success" : "bg-orange/10 text-orange"}`}
                    >
                      {user?.role}
                    </p>
                  </td>
                  <td className="table__td px-2">
                    <p
                      className={`badge ${user?.accountStatus === "active" ? " bg-success/10 text-success" : "bg-orange/10 text-orange"}`}
                    >
                      {user?.accountStatus === "active" ? "فعال" : "غیر فعال"}
                    </p>
                  </td>
                  <td className="table__td px-2">
                    <div className="flex flex-col items-center justify-center gap-y-2 badge badge--primary ">
                      {toPersianNumbers(user?.ordersCount)}
                    </div>
                  </td>

                  <td className="table__td px-2">
                    {toLocalDateString(user?.createdAt)}
                  </td>

                  <td className="table__td flex items-center justify-center gap-2 px-3">
                    <Link
                      href={`/admin/users/${user?.id}`}
                      className="flex items-center justify-center text-stroke-450 hover:text-blue duration-200"
                    >
                      <EyeIcon className="size-5" />
                    </Link>
                    <button
                      type="button"
                      className="flex items-center justify-center text-stroke-450 hover:text-primary duration-200"
                    >
                      <TrashIcon className="size-5" />
                    </button>
                  </td>
                </Table.Row>
              );
            })}
        </Table.body>
      </Table>
    </div>
  );
}

export default UsersListTable;
