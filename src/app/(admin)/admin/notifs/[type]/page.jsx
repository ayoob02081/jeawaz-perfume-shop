"use client";

import NotifTypePage from "@/components/NotifTypePage";
import { useParams } from "next/navigation";

function SingleNotifPage() {
  const { type } = useParams();

  return <NotifTypePage type={type} />;
}

export default SingleNotifPage;
