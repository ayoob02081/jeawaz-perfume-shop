import app from "./httpClient";

// =========================
// USER NOTIFICATIONS
// =========================

export const getMyNotificationsApi = ({ page = 1, limit = 10 } = {}) =>
  app
    .get("/notifications", {
      params: {
        page,
        limit,
      },
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

export const getAdminNotificationsApi = ({
  page = 1,
  limit = 20,
  type,
  channel,
  target,
  search,
  from,
  to,
} = {}) =>
  app
    .get("/admin/notifications", {
      params: {
        page,
        limit,
        type,
        channel,
        target,
        search,
        from,
        to,
      },
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
