import app from "./httpClient";

export const getAllProductsApi = () =>
  app.get("/products").then(({ data }) => data.data);

export const getProductByIdApi = (id) =>
  app.get(`/products/${encodeURIComponent(id)}`).then(({ data }) => data);

export const addProductApi = (payload) =>
  app.post("/products", payload).then(({ data }) => data);

export const updateProductApi = ({ productId, data: payload }) =>
  app
    .patch(`/products/${encodeURIComponent(productId)}`, payload)
    .then(({ data }) => data);

export const removeProductApi = (id) =>
  app.delete(`/products/${encodeURIComponent(id)}`).then(({ data }) => data);

export const getProductPriceApi = ({ id, mode, volume }) =>
  app
    .get(`/products/${encodeURIComponent(id)}/price`, {
      params: { mode, volume },
    })
    .then(({ data }) => data);

// در آینده اضافه میشود

// export function likeProductApi(id) {
//   return app.post(`/products/${id}`).then(({data}) => data);
// }
