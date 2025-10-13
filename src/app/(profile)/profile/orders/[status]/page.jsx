"use client";

import OrdersLayout from "../../_components/OrdersLayout";
import React from "react";

function SingleStatusPage({ params }) {
  const correctParams = React.use(params);

  return <OrdersLayout status={correctParams} />;
}

export default SingleStatusPage;
