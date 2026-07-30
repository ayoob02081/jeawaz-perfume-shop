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
import { showApiError } from "@/utils/showApiError";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

export const notificationKeys = {
  all: ["notifications"],
  lists: () => [...notificationKeys.all, "list"],
  list: (page = 1, limit = 10) => [...notificationKeys.lists(), page, limit],
  details: () => [...notificationKeys.all, "detail"],
  detail: (id) => [...notificationKeys.details(), id],
  unreadCount: () => [...notificationKeys.all, "unread-count"],
  adminLists: () => [...notificationKeys.all, "admin-list"],
  adminList: (params = {}) => [...notificationKeys.adminLists(), params],
  adminDetails: () => [...notificationKeys.all, "admin-detail"],
  adminDetail: (id) => [...notificationKeys.adminDetails(), id],
};

// =========================
// USER
// =========================

export function useGetNotifications(page = 1, limit = 10) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(page, limit),
    queryFn: ({ pageParam = 1 }) =>
      getMyNotificationsApi({
        page: pageParam,
        limit,
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

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadNotificationsCountApi,
    retry: false,
    refetchOnWindowFocus: false,
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.adminLists(),
      });
      toast.success("اعلان با موفقیت ارسال شد");
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
