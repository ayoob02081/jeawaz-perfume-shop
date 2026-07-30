"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

import {
  connectSocket,
  disconnectSocket,
  onSocket,
  offSocket,
} from "@/services/socketService";

import { notificationKeys } from "./useNotification";

export function useNotificationSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    connectSocket();

    const handleNewNotification = (notification) => {
      toast.success(notification.title || "اعلان جدید دریافت شد", {
        id: `notification-${notification.id}`,
      });

      queryClient.setQueryData(notificationKeys.list(), (oldData = []) => {
        if (!Array.isArray(oldData)) {
          return [notification];
        }

        const exists = oldData.some((item) => item.id === notification.id);

        if (exists) return oldData;

        return [notification, ...oldData];
      });

      queryClient.setQueryData(
        notificationKeys.unreadCount(),
        (oldCount = 0) => {
          if (oldCount && typeof oldCount.count === "number") {
            return {
              ...oldCount,
              count: oldCount.count + 1,
            };
          }

          //   queryClient.setQueryData(
          //     notificationKeys.unreadCount(),
          //     (old = { count: 0 }) => ({
          //       ...old,
          //       count: old.count + 1,
          //     }),
          //   );

          return oldCount;
        },
      );
    };

    onSocket("notification:new", handleNewNotification);

    return () => {
      offSocket("notification:new", handleNewNotification);
    };
  }, [queryClient]);
}
