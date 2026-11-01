"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

import { connectSocket, disconnectSocket } from "@/services/socketService";
import { getUnreadNotificationsCountApi } from "@/services/notificationServices";
import { createNotificationSocketSync } from "@/utils/notificationSocketSync.mjs";

import { notificationKeys } from "./useNotification";

export function useNotificationSocket(enabled) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      disconnectSocket();
      return;
    }

    const sync = createNotificationSocketSync({
      socket: connectSocket(),
      queryClient,
      keys: notificationKeys,
      notify: (notification) =>
        toast.success(notification.title || "اعلان جدید دریافت شد", {
          id: `notification-${notification.id}`,
        }),
      // Any authenticated request renews an expired access cookie (401 →
      // refresh in the HTTP client); a refused refresh ends the session.
      refreshAuth: getUnreadNotificationsCountApi,
    });
    sync.start();

    return () => {
      sync.stop();
      disconnectSocket();
    };
  }, [enabled, queryClient]);
}
