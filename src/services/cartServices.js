import app from "./httpClient";

export function getAllCartItemsApi() {
  return app.get("/cart").then(({ data }) => data);
}

export function addToCartApi(data) {
  return app.post("/cart/item", data).then(({ data }) => data);
}

export const updateQuantityApi = ({ itemId, quantity }) => {
  return app
    .patch(`/cart/item/${itemId}`, { quantity })
    .then((res) => res.data);
};

export function removeFromCartApi(itemId) {
  return app.delete(`/cart/item/${itemId}`).then(({ data }) => data);
}

export function updateShippingMethodApi(shippingMethod) {
  return app
    .patch("/cart/shipping-method", { shippingMethod })
    .then(({ data }) => data);
}
