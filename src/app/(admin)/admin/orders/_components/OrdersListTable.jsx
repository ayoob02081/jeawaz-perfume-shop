"use client";

import Loading from "@/components/Loading";
import { adminStatusConfig } from "@/constants/orderStatus";
import { orderTHeads } from "@/constants/tableHeads";
import {
  useBulkUpdateStatus,
  useExportOrders,
  useUpdateOrderStatus,
} from "@/hooks/useOrders";
import CheckBox from "@/ui/CheckBox";
import ConfirmModal from "@/ui/ConfirmModal";
import Table from "@/ui/Table";
import { toLocalDateString } from "@/utils/toLocalDate";
import {
  normalizeIranPhone,
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";
import { CheckIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { EyeIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const ORDER_STATUS_FLOW = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["READY_TO_PRINT", "CANCELLED"],
  READY_TO_PRINT: ["PRINTED", "CANCELLED"],
  PRINTED: ["SHIPPED", "CANCELLED"],
  SHIPPED: [],
  CANCELLED: [],
  EXPIRED: [],
};

function OrdersListTable({ orders, isLoading, status }) {
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [orderIds, setOrderIds] = useState([]);
  const [orderId, setOrderId] = useState([]);
  const [nextStatus, setNextStatus] = useState();
  const { updateOrderStatus, isPending: isUpdateStatusPending } =
    useUpdateOrderStatus();
  const { bulkUpdateStatus, isPending: isBulkPening } = useBulkUpdateStatus();
  const { exportOrders, isPending: isExportPending } = useExportOrders();

  const nextPossibleBulkStatuses = ORDER_STATUS_FLOW[status] || [];
  const filteredOrders = useMemo(() => {
    if (!status) return orders;
    return orders?.filter((o) => o.status === status);
  }, [orders, status]);
  const isAllSelected =
    orderIds?.length >= 1 &&
    filteredOrders?.length >= 1 &&
    orderIds?.length === filteredOrders?.length;

  const handleOrderIds = (data) => {
    const id = Number(data?.target.value);

    if (orderIds.includes(id)) {
      const filteredIds = orderIds.filter((i) => i !== id);
      setOrderIds([...filteredIds]);
    } else {
      setOrderIds([id, ...orderIds]);
    }
  };

  const addAll = () => {
    const filteredOrderIds = filteredOrders.map((o) => o.id);
    if (filteredOrderIds.length === orderIds.length) {
      setOrderIds([]);
    } else {
      setOrderIds(filteredOrderIds);
    }
  };

  const handleStatusModal = (data) => {
    if (!data.id) {
      setStatusModalOpen(false);
      setNextStatus();
    }
    if (data.id) {
      setStatusModalOpen(true);
      setOrderId([data.id]);
      setNextStatus(data.status);
    }
    if (data.status) {
      setStatusModalOpen(true);
      setNextStatus(data.status);
    }
  };

  const handleExportPrintFile = async (forceAll = false) => {
    if (forceAll) {
      await exportOrders({
        onlyReadyToPrint: status === "READY_TO_PRINT",
        status: status !== "READY_TO_PRINT" ? status : undefined,
      });
      return;
    }

    if (orderId && orderId.length > 0) {
      await exportOrders({ orderIds: orderId });
      return;
    }

    if (orderIds && orderIds.length > 0) {
      await exportOrders({ orderIds: orderIds });
      return;
    }

    await exportOrders({
      onlyReadyToPrint: status === "READY_TO_PRINT",
      status: status !== "READY_TO_PRINT" ? status : undefined,
    });
  };

  const handleUpdateStatus = async () => {
    const isBulk = orderIds.length > 0;

    if (nextStatus?.value === "PRINTED") {
      await handleExportPrintFile();
    }

    if (isBulk) {
      await bulkUpdateStatus({
        ids: orderIds,
        status: nextStatus.value,
      });
    } else if (orderId.length > 0) {
      await updateOrderStatus({
        id: orderId[0],
        status: nextStatus.value,
      });
    }

    setOrderIds([]);
    setOrderId([]);
    setStatusModalOpen(false);
  };

  useEffect(() => {
    setOrderIds([]);
    setOrderId([]);
  }, [status]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between w-full gap-4">
        {nextPossibleBulkStatuses?.length > 0 && (
          <button
            type="button"
            onClick={addAll}
            disabled={!nextPossibleBulkStatuses || orders?.length <= 0}
            className={`btn btn--primary--2 px-3 py-1 disabled:opacity-60 w-fit gap-2 hover:*:odd:border-stroke-0 ${
              isAllSelected
                ? "font-bold hover:*:text-primary hover:*:even:text-stroke-0 hover:*:odd:bg-stroke-0 "
                : "text-stroke-600  hover:text-stroke-0"
            }`}
          >
            <span
              className={`flex items-center justify-center size-4 border rounded-sm ${isAllSelected ? "border-primary bg-primary text-white" : "border-stroke-600 text-transparent "} transition-all duration-200`}
            >
              <CheckIcon className=" size-2.5 stroke-4 " />
            </span>
            <p>انتخاب همه</p>
          </button>
        )}
        {!isLoading &&
          filteredOrders?.length >= 1 &&
          status === "READY_TO_PRINT" && (
            <button
              type="submit"
              onClick={() => handleExportPrintFile(true)}
              className={` btn btn--primary border  rounded-lg h-full w-fit py-1 px-3 gap-1 disabled:opacity-40 opacity-100 duration-200`}
            >
              <PrinterIcon className=" size-5 duration-200" />
              چاپ همه
            </button>
          )}
      </div>
      <div className="w-full overflow-x-auto pb-0.5 rounded-xl shadow-xl scrollbar--primary scrollbar-h-1 scrollbar-track-stroke-100/0">
        {isLoading ? (
          <Loading />
        ) : (
          <Table className="overflow-auto">
            <Table.Header>
              {orderTHeads.map((item) => (
                <th className="whitespace-nowrap table__th" key={item.id}>
                  {item.label}
                </th>
              ))}
            </Table.Header>
            <Table.body>
              {filteredOrders?.map((order, index) => {
                const currentStatus = adminStatusConfig?.find(
                  (s) => s.value === order?.status,
                );
                const nextPossibleStatuses = ORDER_STATUS_FLOW[status] || [];
                const isChecked = orderIds.includes(order.id);

                return (
                  <Table.Row key={order.id} className="even:bg-primary/5">
                    <td className="pl-2 pr-3 w-fit h-ful text-center">
                      <div className="flex items-center justify-between gap-2 text-stroke-800">
                        {(status === "PENDING" ||
                          status === "PAID" ||
                          status === "READY_TO_PRINT" ||
                          status === "PRINTED") && (
                          <CheckBox
                            id={order.id}
                            value={order.id}
                            name="orderIds"
                            checked={isChecked}
                            className="flex flex-row! items-center justify-between font-bold"
                            onChange={handleOrderIds}
                          >
                            <div
                              className={`flex items-center justify-center size-4 border rounded-sm  ${isChecked ? "border-primary bg-primary text-white" : "border-stroke-600 text-transparent "} transition-all duration-200`}
                            >
                              <CheckIcon className=" size-2.5 stroke-4 " />
                            </div>
                          </CheckBox>
                        )}
                        {toPersianNumbers(index + 1)}
                      </div>
                    </td>
                    <td className="table__td px-2 max-w-70 truncate">
                      <p>{order?.shipping?.receiver || "اسمی ثبت نشده"}</p>
                    </td>
                    <td className="table__td px-2">
                      <Link
                        href={`tel:+${order?.shipping?.phone}`}
                        className="flex items-center gap-2 justify-between hover:text-primary duration-200"
                      >
                        {normalizeIranPhone(order?.shipping?.phone) ||
                          "شماره‌ای ثبت نشده"}
                      </Link>
                    </td>
                    <td className="table__td px-2 max-w-70 truncate">
                      <p className="flex items-center justify-center w-full text-blue">
                        {toPersianNumbers(order?.orderNumber)}
                      </p>
                    </td>
                    <td className="table__td px-2">
                      <p
                        className={`badge ${currentStatus?.textColor} ${currentStatus?.color}`}
                      >
                        {currentStatus?.title}
                      </p>
                    </td>
                    <td className="table__td px-2">
                      <div className="flex flex-col items-center justify-center gap-y-2 badge badge--primary ">
                        {toPersianNumbers(order?.items.length)}
                      </div>
                    </td>
                    <td className="table__td px-2">
                      <p className={`badge bg-success/10 text-success `}>
                        {toPersianNumbersWithComma(
                          order?.pricing?.subtotal + order?.pricing?.shipping,
                        )}
                      </p>
                    </td>

                    <td className="table__td px-2">
                      {toLocalDateString(order?.orderDate)}
                    </td>

                    <td className="table__td flex items-center justify-center gap-2 px-3">
                      <Link
                        href={`/admin/orders/${order?.id}`}
                        className="flex items-center justify-center text-stroke-450 hover:text-blue duration-200"
                      >
                        <EyeIcon className="size-5" />
                      </Link>
                      {nextPossibleStatuses?.map((status) => {
                        const nextStatusData = adminStatusConfig?.find(
                          (s) => s.value === status,
                        );

                        const Icon = nextStatusData?.solidIcon;
                        return (
                          <button
                            key={status}
                            onClick={() =>
                              handleStatusModal({
                                id: order?.id,
                                status: nextStatusData,
                              })
                            }
                          >
                            <Icon
                              className={`size-5 opacity-70 hover:opacity-100 ${nextStatusData?.textColor}  duration-200`}
                            />
                          </button>
                        );
                      })}
                      {nextPossibleStatuses?.length === 0 && (
                        <span className="text-stroke-800 text-xs">
                          نهایی شده
                        </span>
                      )}
                    </td>
                  </Table.Row>
                );
              })}
            </Table.body>
          </Table>
        )}
      </div>
      <ConfirmModal
        cancellBtn={handleStatusModal}
        confirmBtn={handleUpdateStatus}
        isOpen={statusModalOpen}
        onClose={setStatusModalOpen}
      >
        <span className="flex flex-wrap items-center justify-center gap-2 text-stroke-800 max-md:text-xl md:text-2xl">
          <p>سفارش به</p>
          <p className={`${nextStatus?.textColor} font-bold`}>
            " {nextStatus?.title} "
          </p>
          <p>تغییر داده شود؟</p>
        </span>
      </ConfirmModal>
      <div className="flex items-center justify-center max-md:gap-4 md:gap-6 w-full md: *:even:w-2/3">
        {!isLoading &&
          (filteredOrders?.length >= 1 ? (
            nextPossibleBulkStatuses?.map((status) => {
              const nextStatusData = adminStatusConfig?.find(
                (s) => s.value === status,
              );
              return (
                <button
                  key={status}
                  type={
                    nextStatusData?.value === "CANCELLED" ? "button" : "submit"
                  }
                  disabled={orderIds?.length === 0}
                  onClick={() => handleStatusModal({ status: nextStatusData })}
                  className={` btn btn--secondary--2 size-full py-2 gap-1 ${nextStatusData?.textColor} ${nextStatusData?.color} disabled:opacity-40 opacity-100`}
                >
                  تغییر به {nextStatusData?.title}
                </button>
              );
            })
          ) : (
            <p>در این بخش هیچ سفارشی وجود ندارد</p>
          ))}
      </div>
    </div>
  );
}

export default OrdersListTable;
