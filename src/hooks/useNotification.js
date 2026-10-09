"use client";

import {
  getMyNotificationsApi,
  getNotificationByIdApi,
  getUnreadNotificationsCountApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
  sendNotificationApi,
  getAdminNotificationsApi,
  getAdminNotificationByIdApi,
  deleteNotificationApi,
  bulkDeleteNotificationsApi,
} from "@/services/notificationServices";
import { useAuth } from "@/contexts/auth/AuthContext";
import { showApiError } from "@/utils/showApiError";
import {
  USER_NOTIFICATION_PAGE_LIMIT,
  buildAdminNotificationListParams,
  notificationCreatedMessage,
  toNotificationTypeFilter,
} from "@/utils/notificationsContract.mjs";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

export const notificationKeys = {
  all: ["notifications"],
  lists: () => [...notificationKeys.all, "list"],
  // One cache per type tab: ALL and unknown types share the unfiltered list.
  list: (type, limit = USER_NOTIFICATION_PAGE_LIMIT) => [
    ...notificationKeys.lists(),
    toNotificationTypeFilter(type) ?? "ALL",
    limit,
  ],
  details: () => [...notificationKeys.all, "detail"],
  detail: (id) => [...notificationKeys.details(), id],
  unreadCount: () => [...notificationKeys.all, "unread-count"],
  adminLists: () => [...notificationKeys.all, "admin-list"],
  adminList: (params = {}) => [
    ...notificationKeys.adminLists(),
    buildAdminNotificationListParams(params),
  ],
  adminDetails: () => [...notificationKeys.all, "admin-detail"],
  adminDetail: (id) => [...notificationKeys.adminDetails(), id],
};

// =========================
// USER
// =========================

// Server-filtered by type: every page holds only that type.
export function useGetNotifications(type, limit = USER_NOTIFICATION_PAGE_LIMIT) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(type, limit),
    queryFn: ({ pageParam = 1 }) =>
      getMyNotificationsApi({
        page: pageParam,
        limit,
        type,
      }),
    initialPageParam: 1,
    retry: false,
    refetchOnWindowFocus: false,
    getNextPageParam: (lastPage) =>
      lastPage?.meta?.hasNextPage ? lastPage.meta.page + 1 : undefined,
  });
}

export function useGetNotificationById(id) {
  return useQuery({
    queryKey: notificationKeys.detail(id),
    queryFn: () => getNotificationByIdApi(id),
    enabled: Boolean(id),
    retry: false,
    refetchOnWindowFocus: false,
  });
}

// Signed-in users only (a guest request would only answer 401 and trigger a
// refresh attempt). Refetched on window focus: the cheap fallback for missed
// socket events, suspended tabs and reads in another tab.
export function useUnreadNotificationsCount() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadNotificationsCountApi,
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 10 * 1000,
  });
}

export function useOpenNotification() {
  const queryClient = useQueryClient();
  const { mutateAsync: openNotification, isPending: isOpening } = useMutation({
    mutationFn: markNotificationAsReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });
    },
    onError: (error) => showApiError(error),
  });

  return {
    openNotification,
    isOpening,
  };
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMutation({
    mutationFn: markAllNotificationsAsReadApi,
    onSuccess: () => {
      toast.success("همه اعلان‌ها خوانده شدند", {
        id: "notifications-read-all",
      });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });
    },
    onError: (error) => showApiError(error),
  });

  return {
    markAllAsRead,
    isMarkingAll,
  };
}

// =========================
// ADMIN
// =========================

export function useSendNotification() {
  const queryClient = useQueryClient();
  const { mutate: sendNotification, isPending: isSending } = useMutation({
    mutationFn: sendNotificationApi,
    onSuccess: (_data, payload) => {
      // Every admin list (any page or filter) shows the new notification.
      queryClient.invalidateQueries({
        queryKey: notificationKeys.adminLists(),
      });
      toast.success(notificationCreatedMessage(payload?.channel));
    },
    onError: (error) => showApiError(error),
  });

  return {
    sendNotification,
    isSending,
  };
}

export function useGetAdminNotifications(params = {}) {
  return useQuery({
    queryKey: notificationKeys.adminList(params),
    queryFn: () => getAdminNotificationsApi(params),
    retry: false,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}

export function useGetAdminNotificationById(id) {
  return useQuery({
    queryKey: notificationKeys.adminDetail(id),
    queryFn: () => getAdminNotificationByIdApi(id),
    enabled: Boolean(id),
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { mutateAsync: removeNotification, isPending: isDeleting } =
    useMutation({
      mutationFn: deleteNotificationApi,
      onSuccess: (_, id) => {
        toast.success("اعلان حذف شد");
        queryClient.invalidateQueries({
          queryKey: notificationKeys.adminLists(),
        });
        queryClient.removeQueries({
          queryKey: notificationKeys.adminDetail(id),
          exact: true,
        });
      },
      onError: (error) => showApiError(error),
    });

  return {
    removeNotification,
    isDeleting,
  };
}

export function useBulkDeleteNotifications() {
  const queryClient = useQueryClient();
  const { mutate: bulkDeleteNotifications, isPending: isDeleting } =
    useMutation({
      mutationFn: bulkDeleteNotificationsApi,
      onSuccess: () => {
        toast.success("اعلان‌های انتخاب‌شده حذف شدند");
        queryClient.invalidateQueries({
          queryKey: notificationKeys.adminLists(),
        });
      },
      onError: (error) => showApiError(error),
    });

  return {
    bulkDeleteNotifications,
    isDeleting,
  };
}
