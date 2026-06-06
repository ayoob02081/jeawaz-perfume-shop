import app from "./httpClient";

export const getUserOrdersApi = () =>
  app.get("/orders").then(({ data }) => data);

export const getOrderByIdApi = (id) =>
  app.get(`/orders/${encodeURIComponent(id)}`).then(({ data }) => data);

export const getOrdersByUserIdApi = (userId) =>
  app
    .get(`/orders?userId=${encodeURIComponent(userId)}`)
    .then(({ data }) => data.data);

export const createOrderApi = (payload) =>
  app.post("/orders", payload).then(({ data }) => data);

export const getAdminOrdersApi = (params = {}) =>
  app.get("/orders/admin", { params }).then(({ data }) => data);
