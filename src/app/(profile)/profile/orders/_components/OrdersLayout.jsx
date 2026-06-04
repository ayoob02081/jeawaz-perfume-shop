import OrderStatusButton from "@/ui/OrderStatusButton";
import OrderStatusPage from "./OrderStatusPage";

function OrdersLayout({ status }) {
  return (
    <div className="flex flex-col justify-start lg:gap-6 pb-28 max-md:border-t-[1.5px] border-stroke-200 w-full">
      <OrderStatusButton />
      {status && <OrderStatusPage status={status} />}
    </div>
  );
}

export default OrdersLayout;
