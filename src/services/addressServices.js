import app from "./httpClient";

export const getAllAddressesApi = () =>
  app.get("/addresses").then(({ data }) => data);

export const createAddressApi = (payload) =>
  app.post("/addresses", payload).then(({ data }) => data);

export const getAddressByIdApi = (id) =>
  app.get(`/addresses/${encodeURIComponent(id)}`).then(({ data }) => data);

export const getAddressesByUserIdApi = (userId) =>
  app
    .get(`/addresses?userId=${encodeURIComponent(userId)}`)
    .then(({ data }) => data);

export const editAddressApi = ({ addressId, data: payload }) =>
  app
    .patch(`/addresses/${encodeURIComponent(addressId)}`, payload)
    .then(({ data }) => data);

export const removeAddressApi = (addressId) =>
  app
    .delete(`/addresses/${encodeURIComponent(addressId)}`)
    .then(({ data }) => data);
