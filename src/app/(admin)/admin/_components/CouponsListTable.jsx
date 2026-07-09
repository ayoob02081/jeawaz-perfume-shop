"use client";

import { couponTHeads } from "@/constants/tableHeads";
import { useRemoveCoupon } from "@/hooks/useCoupons";
import Table from "@/ui/Table";
import { toLocalDateString } from "@/utils/toLocalDate";
import {
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import toast from "react-hot-toast";

function CouponsListTable({ coupons }) {
  const { removeCoupon, isDeleting } = useRemoveCoupon();
  const queryClient = useQueryClient();

  const removeCouponHandler = async (coupon) => {
    const { id, title } = coupon;
    try {
      await removeCoupon(id);
      toast.success(`${title} با موفقیت حذف شد.`);
      queryClient.invalidateQueries(["coupons"]);
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  };

  return (
    <div className="w-full overflow-auto max-h-screen pb-0.5 rounded-xl shadow-xl scrollbar--primary scrollbar-h-1 scrollbar-w-1 scrollbar-track-stroke-100/0">
      <Table className="overflow-auto">
        <Table.Header className="">
          {couponTHeads.map((item) => (
            <th className="whitespace-nowrap table__th" key={item.id}>
              {item.label}
            </th>
          ))}
        </Table.Header>
        <Table.body>
          {coupons &&
            coupons?.map((coupon, index) => {
              const {
                code,
                title,
                discountValue,
                type,
                usageLimit,
                expiresAt,
                target,
                isActive,
              } = coupon || {};
              return (
                <Table.Row key={coupon.id} className="even:bg-primary/5">
                  <td className="table__td px-3 font-bold rounded-r-full">
                    <p>{toPersianNumbers(index + 1)}</p>
                  </td>
                  <td className="table__td px-6 max-w-70 truncate">
                    <p className="font-bold">{title}</p>
                  </td>
                  <td className="table__td px-6 max-w-70 truncate">
                    <p className="font-bold">{code}</p>
                  </td>
                  <td className="table__td px-2">
                    <p className=" badge badge--secondary--2 font-bold">
                      {toPersianNumbersWithComma(discountValue)}{" "}
                      {type === "FIXED" ? "تومان" : "درصد"}
                    </p>
                  </td>
                  <td className="table__td px-6 overflow-auto ">
                    <p className="badge bg-blue/10 text-blue font-bold">
                      {toPersianNumbersWithComma(usageLimit)}
                    </p>
                  </td>

                  <td className="table__td px-2">
                    <p className="badge badge--primary font-bold">
                      {target === "ALL" ? "همه کاربران" : "کاربران خاص"}
                    </p>
                  </td>
                  <td className="table__td px-2">
                    <p className=" badge badge--secondary--2 font-bold">
                      {type === "FIXED" ? "قیمتی" : "درصدی"}
                    </p>
                  </td>
                  <td className="table__td px-6 overflow-auto ">
                    <p className="badge bg-blue/10 text-blue font-bold">
                      {toLocalDateString(expiresAt)}
                    </p>
                  </td>
                  <td className="table__td px-2">
                    <p
                      className={`badge ${isActive ? " bg-success/10 text-success" : "bg-orange/10 text-orange"}`}
                    >
                      {isActive ? "فعال" : "غیر فعال"}
                    </p>
                  </td>
                  <td className="table__td px-3 rounded-l-full">
                    <div className="flex gap-2 items-center">
                      <Link
                        href={`/admin/coupons/edit/${coupon.id}`}
                        className="text-stroke-450 hover:text-success duration-200"
                      >
                        <PencilIcon className=" size-5" />
                      </Link>
                      <button
                        onClick={() => removeCouponHandler(coupon)}
                        className="text-stroke-450 hover:text-primary duration-200"
                      >
                        <TrashIcon className="size-5" />
                      </button>
                    </div>
                  </td>
                </Table.Row>
              );
            })}
        </Table.body>
      </Table>
    </div>
  );
}

export default CouponsListTable;
