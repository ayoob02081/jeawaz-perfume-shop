import http from "./httpClient";

export const getAllProductsApi = async () => {
  const res = await http.get("/products");
  // دوباره مطمئن شو چیزی برمی‌گردونه
  return res.data;
};

export function getProductByIdApi(id) {
  return http.get(`/products/${id}`).then(({ data }) => data);
}

export function addProductApi(data) {
  return http.post("/products", data).then((data) => data.data);
}

export function updateProductApi({ productId, data }) {
  return http.patch(`/products/${productId}`, data).then(({ data }) => data);
}

export function removeProductApi(id) {
  return http.delete(`/products/${id}`).then(({ data }) => data);
}

export function getProductPriceApi({ id, mode, volume }) {
  return http
    .get(`/products/${id}/price`, { params: { mode, volume } })
    .then(({ data }) => data);
}

// در آینده اضافه میشود

// export function likeProductApi(id) {
//   return http.post(`/products/${id}`).then(({data}) => data);
// }
