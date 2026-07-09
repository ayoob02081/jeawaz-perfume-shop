"use client";

import OrderStatusPage from "@/app/(profile)/profile/orders/_components/OrderStatusPage";
import PagesNumber from "@/components/PagesNumber";
import { userStatusConfig } from "@/constants/orderStatus";
import { useGetOrders } from "@/hooks/useOrders";
import OrderStatusButton from "@/ui/OrderStatusButton";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

function OrdersLayout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const page = useMemo(() => {
    const p = Number(searchParams.get("page"));
    return !p || p < 1 ? 1 : p;
  }, [searchParams]);

  const status = useMemo(() => {
    return searchParams.get("status") ||"PENDING"|| undefined;
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

  const {
    data: orders,
    isLoading,
    error,
  } = useGetOrders({
    page,
    limit: 10,
    status,
  });

  const totalPages = isLoading ? 0 : (orders?.meta?.totalPages ?? 1);

  return (
    <div className="flex flex-col justify-between lg:gap-6 w-full">
      <div className="flex flex-col lg:gap-6">
        <div className="flex items-center justify-start max-lg:pb-6 gap-8 px-0.5 snap-x overflow-x-scroll scrollbar-none">
          {userStatusConfig?.map((s) => (
            <OrderStatusButton
              user
              key={s.id}
              statusBtnData={s}
              orders={orders}
              isLoading={isLoading}
              setStatus={setStatus}
              currentStatus={status}
            />
          ))}
        </div>
        <OrderStatusPage
          currentStatus={status}
          orders={orders?.data}
          isLoading={isLoading}
          error={error}
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
