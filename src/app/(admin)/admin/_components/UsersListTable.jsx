import { userTHeads } from "@/constants/tableHeads";
import Table from "@/ui/Table";
import { toLocalDateString } from "@/utils/toLocalDate";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { EyeIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
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
                  <td className="table__td px-2 max-w-[280px] truncate">
                    <div className="flex items-center justify-start gap-1">
                      <p>{user?.firstName}</p>
                      <p>{user?.lastName}</p>
                    </div>
                  </td>
                  <td className="table__td px-2">
                    <div className="flex items-center gap-2 justify-between">
                      {/* {toPersianNumbers(user?.phoneNumber)} */}
                      {/* {user.isVerifiedPhoneNumber && (
                      <CheckCircleIcon className="size-4 text-success" />
                    )} */}
                    </div>
                  </td>
                  <td className="table__td px-2 max-w-[280px] truncate">
                    {user.email}
                  </td>

                  <td className="table__td px-2">
                    <div className="flex flex-col items-center justify-center gap-y-2 badge badge--primary ">
                      {toPersianNumbers(
                        user?.Products?.length >= 1
                          ? user.Products?.map((product, index) => (
                              <div
                                className="block badge badge--secondary"
                                key={product.id + index}
                              >
                                {product.title}
                              </div>
                            ))
                          : 0,
                      )}
                    </div>
                  </td>

                  {/* <td className="table__td px-2">
                    {toLocalDateString(user?.createdAt)}
                  </td> */}
                  <td className="table__td px-2">
                    <p
                      className={`badge ${user?.role === "admin" ? " bg-success/10 text-success" : "bg-orange/10 text-orange"}`}
                    >
                      {user?.role}
                    </p>
                  </td>
                  <td className="table__td fle px-3">
                    <Link
                      href={`/admin/users/${user?.id}`}
                      className="flex items-center justify-center text-blue/70 hover:text-blue duration-200"
                    >
                      <EyeIcon className="size-4" />
                    </Link>
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
