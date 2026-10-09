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
  const { data, isPending, error, refetch } = useGetNotificationById(id);
  const { openNotification } = useOpenNotification();

  useEffect(() => {
    if (!data) return;

    // Opening marks it read; a failure is already shown by the mutation and
    // never blocks reading the notification.
    if (!data.isRead) {
      openNotification(data.id).catch(() => {});
    }
  }, [data]);
  return (
    <SingleNotifPage
      title={data?.notification?.title}
      createdAt={data?.notification?.createdAt}
      message={data?.notification?.message}
      isPending={isPending}
      error={error}
      onRetry={() => refetch()}
    />
  );
}

export default UserNotifPage;
