import { userDesktopTHeads, userMobileTHeads } from "@/constants/tableHeads";
import Table from "@/ui/Table";
import { toLocalDateString } from "@/utils/toLocalDate";
import { normalizeIranPhone, toPersianNumbers } from "@/utils/toPersianNumbers";
import {
  CheckCircleIcon,
  EyeIcon,
} from "@heroicons/react/24/solid";
import {
  canChangeUserBan,
  userAccountStatus,
} from "@/utils/adminUsersContract.mjs";
import Link from "next/link";
import { NoSymbolIcon } from "@heroicons/react/24/outline";

function UsersListTable({ users, rowOffset = 0, actorId, disabled, onBan }) {
  return (
    <div className="w-full overflow-x-auto h-fit rounded-xl shadow-xl scrollbar-none">
      <>
        <Table className="overflow-auto md:hidden">
          <Table.Header>
            {userMobileTHeads.map((item) => (
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
                    <td className="table__td font-bold rounded-r-xl px-2">
                      {toPersianNumbers(rowOffset + index + 1)}
                    </td>
                    <td className="table__td px-2 max-w-35 text-wrap">
                      <p className="w-full flex items-center justify-start overflow-x-auto py-px text-nowrap scrollbar-none">
                        {user?.fullName || "اسمی ثبت نشده"}
                      </p>
                    </td>
                    <td className="table__td px-2 max-w-40">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Link
                          href={
                            user?.phoneNumber ? `tel:+${user?.phoneNumber}` : ""
                          }
                          className="flex items-center gap-2 justify-end hover:text-primary duration-200"
                        >
                          {normalizeIranPhone(user?.phoneNumber) ||
                            "شماره‌ای ثبت نشده"}
                        </Link>
                        {user?.email ? (
                          <p
                            dir="ltr"
                            className="w-full flex items-center justify-start overflow-x-auto py-px scrollbar-none"
                          >
                            {user?.email}
                          </p>
                        ) : (
                          "ایمیلی ثبت نشده"
                        )}
                      </div>
                    </td>
                    <td className="table__td px-2">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p
                          className={`badge border font-bold ${user?.role === "admin" ? " bg-success/5 text-success border-success" : "bg-orange/10 text-orange border-orange"}`}
                        >
                          {user?.role}
                        </p>
                        <p
                          className={`badge border font-bold ${user?.accountStatus === "verified" ? " bg-success/5 text-success border-success" : "bg-orange/10 text-orange border-orange"}`}
                        >
                          {userAccountStatus(user?.accountStatus)}
                        </p>
                      </div>
                    </td>
                    <td className="table__td px-2">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="flex items-center justify-center gap-y-2 badge badge--primary gap-2">
                          <p>{toPersianNumbers(user?.ordersCount)}</p>
                          <p>سفارش</p>
                        </div>
                        <p>{toLocalDateString(user?.createdAt)}</p>
                      </div>
                    </td>
                    <td className="table__td flex items-center justify-center rounded-l-xl gap-2 px-3">
                      <Link
                        href={`/admin/users/${user?.id}`}
                        aria-label="مشاهده جزئیات کاربر"
                        prefetch={false}
                        className="flex items-center justify-center text-stroke-450 hover:text-blue duration-200"
                      >
                        <EyeIcon className="size-5" />
                      </Link>
                      <button
                        type="button"
                        disabled={disabled || !canChangeUserBan(user, actorId)}
                        onClick={() => onBan(user)}
                        aria-label={user.accountStatus === "banned" ? "رفع مسدودی کاربر" : "مسدود کردن کاربر"}
                        className="flex items-center justify-center disabled:opacity-40 text-sm whitespace-nowrap"
                      >
                        {user.accountStatus === "banned" ? (
                          <CheckCircleIcon className=" size-5 text-stroke-450 hover:text-success duration-200" />
                        ) : (
                          <NoSymbolIcon className="stroke-3 size-5 text-primary/70 hover:text-primary duration-200" />
                        )}
                      </button>
                    </td>
                  </Table.Row>
                );
              })}
          </Table.body>
        </Table>
        <Table className="overflow-auto max-md:hidden">
          <Table.Header>
            {userDesktopTHeads.map((item) => (
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
                    <td className="table__td font-bold rounded-r-xl px-2">
                      {toPersianNumbers(rowOffset + index + 1)}
                    </td>
                    <td className="table__td px-2 max-w-70 truncate">
                      <p>{user?.fullName || "اسمی ثبت نشده"}</p>
                    </td>
                    <td className="table__td px-2">
                      <Link
                        href={
                          user?.phoneNumber ? `tel:+${user?.phoneNumber}` : ""
                        }
                        className="flex items-center gap-2 justify-end hover:text-primary duration-200"
                      >
                        {normalizeIranPhone(user?.phoneNumber) ||
                          "شماره‌ای ثبت نشده"}
                      </Link>
                    </td>
                    <td className="table__td px-4 max-w-40 truncate">
                      {user?.email ? (
                        <p
                          dir="ltr"
                          className="w-full flex items-center justify-start overflow-x-auto py-px scrollbar-none"
                        >
                          {user?.email}
                        </p>
                      ) : (
                        "ایمیلی ثبت نشده"
                      )}
                    </td>
                    <td className="table__td px-2">
                      <p
                        className={`badge border font-bold ${user?.role === "admin" ? " bg-success/5 text-success border-success" : "bg-orange/10 text-orange border-orange"}`}
                      >
                        {user?.role}
                      </p>
                    </td>
                    <td className="table__td px-2">
                      <p
                        className={`badge border font-bold ${user?.accountStatus === "verified" ? " bg-success/5 text-success border-success" : "bg-orange/10 text-orange border-orange"}`}
                      >
                        {userAccountStatus(user?.accountStatus)}
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

                    <td className="table__td flex items-center justify-center rounded-l-xl gap-2 px-3">
                      <Link
                        href={`/admin/users/${user?.id}`}
                        aria-label="مشاهده جزئیات کاربر"
                        prefetch={false}
                        className="flex items-center justify-center text-stroke-450 hover:text-blue duration-200"
                      >
                        <EyeIcon className="size-5" />
                      </Link>
                      <button
                        type="button"
                        disabled={disabled || !canChangeUserBan(user, actorId)}
                        onClick={() => onBan(user)}
                        aria-label={user.accountStatus === "banned" ? "رفع مسدودی کاربر" : "مسدود کردن کاربر"}
                        className="flex items-center justify-center disabled:opacity-40 text-sm whitespace-nowrap"
                      >
                        {user.accountStatus === "banned" ? (
                          <CheckCircleIcon className=" size-5 text-stroke-450 hover:text-success duration-200" />
                        ) : (
                          <NoSymbolIcon className="stroke-3 size-5 text-primary/70 hover:text-primary duration-200" />
                        )}
                      </button>
                    </td>
                  </Table.Row>
                );
              })}
          </Table.body>
        </Table>
      </>
    </div>
  );
}

export default UsersListTable;
