"use client";

import NotifLayout from "@/components/NotifLayout";
import NotifTypePage from "@/components/NotifTypePage";
import { useParams } from "next/navigation";

function SingleNotifPage() {
  const { type } = useParams();

  return (
    <NotifLayout>
      <NotifTypePage type={type} />
    </NotifLayout>
  );
}

export default SingleNotifPage;
