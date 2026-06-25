import app from "./httpClient";

const cleanParams = (params = {}) => {
  const cleaned = {};

  Object.entries(params).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return;
    }

    cleaned[key] = value;
  });

  return cleaned;
};

export const getAllProductsApi = (params = {}) =>
  app
    .get("/products", {
      params: cleanParams(params),
    })
    .then(({ data }) => data);

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

export const getProductSuggestionsApi = (params) =>
  app
    .get("/products/search/suggestions", {
      params: cleanParams(params),
    })
    .then(({ data }) => data);

// در آینده اضافه میشود

// export function likeProductApi(id) {
//   return app.post(`/products/${id}`).then(({data}) => data);
// }
