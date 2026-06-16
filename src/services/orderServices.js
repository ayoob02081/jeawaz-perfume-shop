import app from "./httpClient";

/* ================= USER ================= */

export const getUserOrdersApi = (params = {}) =>
  app.get("/orders", { params }).then(({ data }) => data);

export const getOrdersByUserIdApi = (userId, params = {}) =>
  app.get(`/orders/admin/user/${userId}`, { params }).then(({ data }) => data);

export const getOrderByIdApi = (id) =>
  app.get(`/orders/${id}`).then(({ data }) => data);

export const createOrderApi = (payload) =>
  app.post("/orders", payload).then(({ data }) => data);

export const getOrderTimelineApi = (id) =>
  app.get(`/orders/${id}/timeline`).then(({ data }) => data);

/* ================= ADMIN ================= */

export const getAdminOrdersApi = (params = {}) =>
  app.get("/orders/admin", { params }).then(({ data }) => data);

export const getAllOrdersApi = () =>
  app.get("/orders/admin/all").then(({ data }) => data);

export const updateOrderStatusApi = (id, status) =>
  app.patch(`/orders/admin/${id}/status`, { status }).then(({ data }) => data);

export const bulkUpdateStatusApi = (ids, status) =>
  app
    .patch("/orders/admin/bulk-status", { ids, status })
    .then(({ data }) => data);

export const exportOrdersApi = (payload = {}) =>
  app.post("/orders/admin/export", payload, {
    responseType: "blob",
  });

export const confirmPaymentApi = (id) =>
  app.patch(`/orders/${id}/pay`).then(({ data }) => data);

export const getOrderByNumberApi = (orderNumber) =>
  app.get(`/orders/number/${orderNumber}`).then(({ data }) => data);

export const getAdminDashboardApi = () =>
  app.get("/orders/admin/dashboard").then(({ data }) => data);

export const getFullAdminDashboardApi = () =>
  app.get("/orders/admin/full-dashboard").then(({ data }) => data);

export const getSalesChartApi = (days = 30) =>
  app
    .get("/orders/admin/sales-chart", { params: { days } })
    .then(({ data }) => data);

export const getTopProductsApi = (limit = 10) =>
  app
    .get("/orders/admin/top-products", { params: { limit } })
    .then(({ data }) => data);
