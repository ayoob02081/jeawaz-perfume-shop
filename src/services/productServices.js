import http from "./httpService";

export function getAllProductsApi() {
  return http.get(`/products`).then(({ data }) => data);
}

export function getProductByIdApi(id) {
  return http.get(`/products/${id}`).then(({ data }) => data);
}

export function addProductApi(data) {
  return http.post("/products", data).then(({ data }) => data);
}

export function updateProductApi({ productId, data }) {
  return http.patch(`/products/${productId}`, data).then(({ data }) => data);
}

export function removeProductApi(id) {
  return http.delete(`/products/${id}`).then(({ data }) => data);
}

// در آینده اضافه میشود

// export function likeProductApi(id) {
//   return http.post(`/products/${id}`).then(({data}) => data);
// }

// export function getProductBySlugApi(slug) {
//   return http.get(`/products/${slug}`).then(({data}) => data);
// }

