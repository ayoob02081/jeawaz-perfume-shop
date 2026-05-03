import http from "./httpClient";

export function getAllCartItemsApi() {
  return http.get("/cart").then(({ data }) => data);
}

export function addToCartApi(data) {
  return http.post("/cart/item", data).then(({ data }) => data);
}

export const updateQuantityApi = ({ itemId, quantity }) => {
  return http
    .patch(`/cart/item/${itemId}`, { quantity })
    .then((res) => res.data);
};

export function removeFromCartApi(itemId) {
  return http.delete(`/cart/item/${itemId}`).then(({ data }) => data);
}
