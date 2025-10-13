import AllOrderStatus from "./AllOrderStatus";
import OrderStatusPage from "./OrderStatusPage";

function OrdersLayout({ status }) {

  return (
    <div className="flex flex-col justify-center lg:gap-6 pb-28 max-md:border-t-[1.5px] border-stroke">
      <AllOrderStatus />
      {status && <OrderStatusPage status={status} />}
    </div>
  );
}

export default OrdersLayout;
