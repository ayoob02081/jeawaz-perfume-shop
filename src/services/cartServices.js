import app from "./httpClient";
import { guestCartRequest } from "../utils/guestCartInit.mjs";

// Requests that may mint the guest cart token wait for this browser's guest
// cart identity to be established (see guestCartInit.mjs).
export function getAllCartItemsApi({ signal } = {}) {
  return guestCartRequest(() => app.get("/cart", { signal })).then(({ data }) => data);
}

export function addToCartApi(data) {
  return guestCartRequest(() => app.post("/cart/item", data)).then(({ data }) => data);
}

export const updateQuantityApi = ({ itemId, quantity }) => {
  return guestCartRequest(() => app.patch(`/cart/item/${itemId}`, { quantity }))
    .then((res) => res.data);
};

export function removeFromCartApi(itemId) {
  return guestCartRequest(() => app.delete(`/cart/item/${itemId}`)).then(({ data }) => data);
}

export function updateShippingMethodApi(shippingMethod) {
  return guestCartRequest(() => app.patch("/cart/shipping-method", { shippingMethod }))
    .then(({ data }) => data);
}

export const applyCouponApi = (couponCode) =>
  app
    .post("/cart/apply-coupon", {
      couponCode,
    })
    .then(({ data }) => data);
