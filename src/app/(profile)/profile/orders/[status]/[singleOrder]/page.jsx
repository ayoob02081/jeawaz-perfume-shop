"use client";

import SingleOrderPage from "@/components/SingleOrderPage";
import React from "react";

export default function page({ params }) {
  const correctParams = React.use(params);
  return <SingleOrderPage correctParams={correctParams} />;
}
