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

export function useNotificationSocket(enabled) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      disconnectSocket();
      return;
    }

    connectSocket();

    const handleNewNotification = (notification) => {
      toast.success(notification.title || "اعلان جدید دریافت شد", {
        id: `notification-${notification.id}`,
      });

      queryClient.invalidateQueries({
        queryKey: notificationKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
        exact: true,
      });
    };

    onSocket("notification:new", handleNewNotification);

    return () => {
      offSocket("notification:new", handleNewNotification);
      disconnectSocket();
    };
  }, [enabled, queryClient]);
}
