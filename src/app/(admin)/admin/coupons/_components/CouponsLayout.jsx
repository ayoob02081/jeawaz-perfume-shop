"use client";

import Link from "next/link";
import NotExisted from "@/components/NotExisted";
import Loading from "@/components/Loading";
import { useGetAllCoupons } from "@/hooks/useCoupons";
import CouponsListTable from "./CouponsListTable";
import { PlusIcon } from "@heroicons/react/24/outline";

function CouponsLayout() {
  const { data, isPending, error } = useGetAllCoupons();
  const coupons = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-2 w-full px-4 pb-10">
      <div className="flex items-center gap-4 justify-between pb-6 w-full">
        <h1 className="font-bold text-stroke-800 text-xl">کد تخفیف‌ها</h1>
        <Link
          href={"/admin/coupons/add"}
          prefetch={false}
          className="btn btn--primary border gap-1 py-1.5 px-3"
        >
          <PlusIcon className="size-5 stroke-3" />
          <p>اضافه کردن کد تخفیف</p>
        </Link>
      </div>
      {isPending ? <Loading /> : <CouponsListTable coupons={coupons} />}
      {coupons && !isPending && coupons?.length === 0 && (
        <NotExisted className="h-96">کد تخفیفی تعریف نشده است!</NotExisted>
      )}
    </div>
  );
}

export default CouponsLayout;
