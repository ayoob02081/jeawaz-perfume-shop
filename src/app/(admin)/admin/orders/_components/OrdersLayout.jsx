"use client";

import { useMemo, useCallback } from "react";
import { useGetAdminOrders } from "@/hooks/useOrders";
import OrdersListTable from "./OrdersListTable";
import OrderStatusButton from "@/ui/OrderStatusButton";
import { adminStatusConfig } from "@/constants/orderStatus";
import { useRouter, useSearchParams } from "next/navigation";
import PagesNumber from "@/components/PagesNumber";

function OrdersLayout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const page = useMemo(() => {
    const p = Number(searchParams.get("page"));
    return !p || p < 1 ? 1 : p;
  }, [searchParams]);

  const status = useMemo(() => {
    return searchParams.get("status") || undefined;
  }, [searchParams]);

  const updateParams = useCallback(
    (updates) => {
      const params = new URLSearchParams(search);

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null) params.delete(key);
        else params.set(key, String(value));
      });

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, search],
  );

  const setPage = useCallback(
    (newPage) => {
      updateParams({ page: newPage });
    },
    [updateParams],
  );

  const setStatus = useCallback(
    (newStatus) => {
      updateParams({
        status: newStatus || undefined,
        page: 1,
      });
    },
    [updateParams],
  );

  const { data: orders, isLoading } = useGetAdminOrders({
    page,
    limit: 15,
    status,
  });

  const totalPages = isLoading ? 0 : (orders?.meta?.totalPages ?? 1);

  return (
    <div className="flex flex-col justify-between lg:gap-6 pb-28 max-md:border-t border-stroke-200 w-full max-lg:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-8 overflow-x-auto scrollbar-none">
          {adminStatusConfig.map((s) => (
            <OrderStatusButton
              key={s.id}
              admin
              statusBtnData={s}
              orders={orders}
              isLoading={isLoading}
              setStatus={setStatus}
              currentStatus={status}
            />
          ))}
        </div>

        <OrdersListTable
          orders={orders?.data}
          isLoading={isLoading}
          status={status}
        />
      </div>

      <PagesNumber
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        isLoading={isLoading}
      />
    </div>
  );
}

export default OrdersLayout;
