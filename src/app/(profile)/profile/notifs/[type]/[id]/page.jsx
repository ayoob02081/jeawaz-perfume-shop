"use client";

import SingleNotifPage from "@/components/SingleNotifPage";
import {
  useGetNotificationById,
  useOpenNotification,
} from "@/hooks/useNotification";
import { useParams } from "next/navigation";
import { useEffect } from "react";

function UserNotifPage() {
  const { id } = useParams();
  const { data, isPending, error } = useGetNotificationById(id);
  const { openNotification } = useOpenNotification();

  useEffect(() => {
    if (!data) return;

    if (!data.isRead) {
      openNotification(data.id);
    }
  }, [data]);
  return (
    <SingleNotifPage
      title={data?.notification?.title}
      createdAt={data?.notification?.createdAt}
      message={data?.notification?.message}
      isPending={isPending}
      error={error}
    />
  );
}

export default UserNotifPage;
