import { userTHeads } from "@/constants/tableHeads";
import Table from "@/ui/Table";
import { toLocalDateString } from "@/utils/toLocalDate";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { EyeIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

function UsersListTable({ users }) {
  return (
    <Table>
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
            // console.log(user);
            return (
              <Table.Row key={user.id}>
                <td className="table__td">{toPersianNumbers(index + 1)}</td>
                <td className="table__td max-w-[280px] whitespace-nowrap truncate">
                  {user?.firstName}
                </td>
                <td className="table__td">
                  <div className="flex items-center gap-2 justify-between">
                    {/* {toPersianNumbers(user?.phoneNumber)} */}
                    {/* {user.isVerifiedPhoneNumber && (
                      <CheckCircleIcon className="size-4 text-success" />
                    )} */}
                  </div>
                </td>
                <td className="table__td max-w-[280px] whitespace-nowrap truncate">
                  {user.email}
                </td>

                <td className="table__td">
                  <div className="flex flex-col gap-y-2 items-start">
                    {
                      user?.Products?.length >= 1
                        ? user.Products?.map((product, index) => (
                            <div
                              className="block badge badge--secondary"
                              key={product.id + index}
                            >
                              {product.title}
                            </div>
                          ))
                        : ""
                      // toPersianNumbers(user?.Products.length)
                    }
                  </div>
                </td>

                <td className="table__td">
                  {toLocalDateString(user?.createdAt)}
                </td>
                <td className="table__td">
                  <Link
                    href={`/admin/users/${user?.id}`}
                    className="text-secondary-900 hover:text-primary-900 duration-200"
                  >
                    <EyeIcon className="size-4" />
                  </Link>
                </td>
              </Table.Row>
            );
          })}
      </Table.body>
    </Table>
  );
}

export default UsersListTable;
