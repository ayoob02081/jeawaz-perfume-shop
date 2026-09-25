import app from "./httpClient";

// Creates or reuses the backend payment attempt for an Order. The backend
// computes the amount and returns the gateway URL; nothing is sent but the id.
export const createPaymentApi = (orderId) =>
  app
    .post(`/payments/${encodeURIComponent(orderId)}`)
    .then(({ data }) => data);
