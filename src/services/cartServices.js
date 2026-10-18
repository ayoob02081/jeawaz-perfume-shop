import app from "./httpClient";

export function getAllCartItemsApi({ signal } = {}) {
  return app.get("/cart", { signal }).then(({ data }) => data);
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

export const applyCouponApi = (couponCode) =>
  app
    .post("/cart/apply-coupon", {
      couponCode,
    })
    .then(({ data }) => data);
