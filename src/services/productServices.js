import app from "./httpClient";
import { historyPaths, recoveryPaths } from "@/utils/priceHistoryContract.mjs";

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

export const getAllProductsApi = (params = {}, { signal } = {}) =>
  app
    .get("/products", {
      params: cleanParams(params),
      signal,
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

export const getProductVolumeOptionsApi = () =>
  app.get("/products/filter-options/volumes").then(({ data }) => data);

export const createBulkPricePreviewApi = (payload) =>
  app.post("/products/bulk-price/preview", payload).then(({ data }) => data);

export const readBulkPricePreviewApi = ({ operationId, page = 1, limit = 50 }) =>
  app
    .get(`/products/bulk-price/${encodeURIComponent(operationId)}/preview`, {
      params: { page, limit },
    })
    .then(({ data }) => data);

export const applyBulkPriceOperationApi = (operationId) =>
  app
    .post(`/products/bulk-price/${encodeURIComponent(operationId)}/apply`)
    .then(({ data }) => data);

export const getPriceHistoryOperationsApi = (params) =>
  app.get(historyPaths.operations, { params: cleanParams(params) })
    .then(({ data }) => data);

export const getPriceHistoryOperationApi = ({ operationId, page = 1, limit = 50 }) =>
  app.get(historyPaths.operation(operationId),
    { params: { page, limit } }).then(({ data }) => data);

export const createRecoveryPreviewApi = (payload) =>
  app.post(recoveryPaths.preview, payload).then(({ data }) => data);

export const readRecoveryPreviewApi = ({ operationId, page = 1, limit = 50 }) =>
  app.get(recoveryPaths.read(operationId), { params: { page, limit } })
    .then(({ data }) => data);

export const applyRecoveryApi = (operationId) =>
  app.post(recoveryPaths.apply(operationId)).then(({ data }) => data);

// در آینده اضافه میشود

// export function likeProductApi(id) {
//   return app.post(`/products/${id}`).then(({data}) => data);
// }
