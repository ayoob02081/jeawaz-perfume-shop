"use client";

import { useMemo, useCallback, useEffect, useRef } from "react";
import { useGetAdminOrders } from "@/hooks/useOrders";
import OrdersListTable from "./OrdersListTable";
import OrdersFilters from "./OrdersFilters";
import OrderStatusButton from "@/ui/OrderStatusButton";
import { adminStatusConfig } from "@/constants/orderStatus";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PagesNumber from "@/components/PagesNumber";
import Error from "@/components/Error";
import {
  ADMIN_ORDERS_PAGE_LIMIT,
  adminOrdersSelectionKey,
  canPrintAllReadyToPrint,
  clearAdminOrderFilters,
  getAdminOrdersEmptyMessage,
  hasSearchOrDateFilters,
  nextAdminOrdersSearch,
  parseAdminOrdersQuery,
} from "@/utils/adminOrdersListContract.mjs";

function OrdersLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const query = useMemo(
    () => parseAdminOrdersQuery(searchParams),
    [searchParams],
  );

  // Latest URL query, so successive updates compose and updateQuery is stable.
  const searchRef = useRef(search);
  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  const navigate = useCallback(
    (next) => {
      searchRef.current = next;
      router.replace(next ? `${pathname}?${next}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname],
  );

  // Filter changes return to page 1; paging keeps every filter.
  const updateQuery = useCallback(
    (updates) => navigate(nextAdminOrdersSearch(searchRef.current, updates)),
    [navigate],
  );

  const resetFilters = useCallback(
    () => navigate(clearAdminOrderFilters(searchRef.current)),
    [navigate],
  );

  const setPage = useCallback(
    (newPage) => updateQuery({ page: newPage }),
    [updateQuery],
  );

  const setStatus = useCallback(
    (newStatus) => updateQuery({ status: newStatus }),
    [updateQuery],
  );

  const {
    data: orders,
    isLoading,
    isPlaceholderData,
    error,
    refetch,
  } = useGetAdminOrders({ ...query, limit: ADMIN_ORDERS_PAGE_LIMIT });

  const totalPages = isLoading ? 0 : (orders?.meta?.totalPages ?? 1);
  const rows = orders?.data ?? [];

  return (
    <div className="flex flex-col justify-between gap-4 lg:gap-6 max-lg:w-full lg:w-[calc(100%-88px)] 2xl:w-[calc(100%-270px)] lg:px-4 2xl:px-0 pt-0 pb-10">
      <OrdersFilters
        query={query}
        updateQuery={updateQuery}
        resetFilters={resetFilters}
        isUpdating={isPlaceholderData}
      />
      <div className="flex flex-col gap-2 w-full overflow-hidden">
        <div className="flex items-center justify-start max-md:gap-4 gap-8 overflow-x-auto scrollbar-none px-4 py-1 w-full text-nowrap">
          {adminStatusConfig.map((item) => (
            <OrderStatusButton
              key={item.id}
              admin
              statusBtnData={item}
              orders={orders}
              isLoading={isLoading}
              setStatus={setStatus}
              currentStatus={query.status}
            />
          ))}
        </div>
      </div>
      {error ? (
        <Error onRetry={() => refetch()} />
      ) : (
        <OrdersListTable
          orders={rows}
          isLoading={isLoading}
          status={query.status}
          isStale={isPlaceholderData}
          selectionKey={adminOrdersSelectionKey(query)}
          emptyMessage={getAdminOrdersEmptyMessage(query)}
          canPrintAll={canPrintAllReadyToPrint({
            query,
            hasRows: rows.length > 0,
            isPlaceholderData,
          })}
          printAllBlockedByFilters={hasSearchOrDateFilters(query)}
        />
      )}
      <PagesNumber
        page={query.page}
        setPage={setPage}
        totalPages={totalPages}
        isLoading={isLoading || isPlaceholderData}
      />
    </div>
  );
}

export default OrdersLayout;
