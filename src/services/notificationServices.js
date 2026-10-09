import app from "./httpClient";
import {
  buildAdminNotificationListParams,
  buildMyNotificationsParams,
} from "@/utils/notificationsContract.mjs";

// =========================
// USER NOTIFICATIONS
// =========================

// The signed-in user's own recipient rows; `type` filters on the server.
export const getMyNotificationsApi = ({ page = 1, limit = 10, type } = {}) =>
  app
    .get("/notifications", {
      params: buildMyNotificationsParams({ page, limit, type }),
    })
    .then(({ data }) => data);

export const getNotificationByIdApi = (notificationId) =>
  app.get(`/notifications/${notificationId}`).then(({ data }) => data);

export const getUnreadNotificationsCountApi = () =>
  app.get("/notifications/unread-count").then(({ data }) => data);

export const markNotificationAsReadApi = (notificationId) =>
  app.patch(`/notifications/${notificationId}/read`).then(({ data }) => data);

export const markAllNotificationsAsReadApi = () =>
  app.patch("/notifications/read-all").then(({ data }) => data);

// =========================
// ADMIN NOTIFICATIONS
// =========================

export const sendNotificationApi = (payload) =>
  app.post("/admin/notifications", payload).then(({ data }) => data);

// Notification entities with recipient/delivery stats (management list).
export const getAdminNotificationsApi = (query = {}) =>
  app
    .get("/admin/notifications", {
      params: buildAdminNotificationListParams(query),
    })
    .then(({ data }) => data);

export const getAdminNotificationByIdApi = (id) =>
  app.get(`/admin/notifications/${id}`).then(({ data }) => data);

export const deleteNotificationApi = (id) =>
  app.delete(`/admin/notifications/${id}`).then(({ data }) => data);

export const bulkDeleteNotificationsApi = (ids) =>
  app
    .delete("/admin/notifications", {
      data: {
        ids,
      },
    })
    .then(({ data }) => data);
