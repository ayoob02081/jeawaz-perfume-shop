"use client";

import { useParams } from "next/navigation";
import OrdersLayout from "../../_components/OrdersLayout";

function SingleStatusPage() {
  const params = useParams();

  return <OrdersLayout status={params.status} />;
}

export default SingleStatusPage;
