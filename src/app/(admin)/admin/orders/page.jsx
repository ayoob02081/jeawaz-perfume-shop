import { Suspense } from "react";
import Loading from "@/components/Loading";
import OrdersLayout from "./_components/OrdersLayout";

export default function OrdersPage() {
  return (
    <Suspense fallback={<Loading />}>
      <OrdersLayout />
    </Suspense>
  );
}
