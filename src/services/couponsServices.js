import app from "./httpClient";

export const getAllCouponsApi = () => app.get("/coupons").then((data) => data);

export const getCouponByIdApi = (id) =>
  app.get(`/coupons/${encodeURIComponent(id)}`).then(({ data }) => data);

export const addCouponApi = (payload) =>
  app.post("/coupons", payload).then(({ data }) => data);

export const updateCouponApi = ({ couponId, data: payload }) =>
  app
    .patch(`/coupons/${encodeURIComponent(couponId)}`, payload)
    .then(({ data }) => data);

export const removeCouponApi = (id) =>
  app.delete(`/coupons/${encodeURIComponent(id)}`).then(({ data }) => data);

export const toggleCouponStatusApi = (id) =>
  app
    .patch(`/coupons/${encodeURIComponent(id)}/toggle`)
    .then(({ data }) => data);

export const validateCouponApi = (payload) =>
  app.post("/coupons/validate", payload).then(({ data }) => data);
