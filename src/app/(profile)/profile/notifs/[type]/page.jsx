"use client";

import NotifTypePage from "@/components/NotifTypePage";
import { useParams } from "next/navigation";

function NotifsPage() {
  const { type } = useParams();

  return <NotifTypePage type={type} />;
}

export default NotifsPage;
