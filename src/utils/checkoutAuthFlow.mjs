import { cartSnapshotsDiffer } from "./cartSnapshot.mjs";

// Checkout's in-place authentication (checkout/auth Phase 2B). The cart page
// owns a login modal; nothing here navigates, and nothing here ever submits
// an order: after a login the shopper always presses pay themselves.
//
// GUEST_ADVANCE   a guest pressed "تایید و تکمیل سفارش" on step 1.
// SESSION_EXPIRED a signed-in checkout lost its session (refresh rejected),
//                 or a submit found no signed-in user.

export const CHECKOUT_AUTH_REASON = Object.freeze({
  GUEST_ADVANCE: "GUEST_ADVANCE",
  SESSION_EXPIRED: "SESSION_EXPIRED",
});

export const CHECKOUT_STEP = Object.freeze({ CART: 1, DETAILS: 2 });

export const CART_REVIEW_NOTICE =
  "سبد خرید شما با حساب کاربری‌تان به‌روزرسانی شد. لطفاً قبل از ادامه آن را بررسی کنید.";

// Step 1 → step 2.
export function decideAdvance({ isAuthenticated }) {
  return isAuthenticated
    ? { type: "GO_TO_STEP", step: CHECKOUT_STEP.DETAILS }
    : { type: "OPEN_AUTH", reason: CHECKOUT_AUTH_REASON.GUEST_ADVANCE };
}

// Pay pressed. Only SUBMIT may reach POST /addresses, /orders or /payments.
export function decideSubmit({ isAuthenticated, isCheckingOut }) {
  if (isCheckingOut) return { type: "IGNORE" };
  if (!isAuthenticated) {
    return { type: "OPEN_AUTH", reason: CHECKOUT_AUTH_REASON.SESSION_EXPIRED };
  }
  return { type: "SUBMIT" };
}

// The modal was closed without logging in: a guest stays on the cart; a
// lapsed checkout keeps its step (and its form), submitting nothing.
export function decideAuthClosed({ reason, step }) {
  return {
    step:
      reason === CHECKOUT_AUTH_REASON.GUEST_ADVANCE ? CHECKOUT_STEP.CART : step,
  };
}

// After a successful login: compare the cart snapshot taken when the modal
// opened with the server's cart now. A changed (or unknown) cart sends the
// shopper back to step 1 with the review notice; otherwise a guest continues
// to step 2 and a lapsed checkout stays where it was. The result never asks
// for a submit.
export function decideResumeAfterAuth({ reason, step, before, after }) {
  if (cartSnapshotsDiffer(before, after) || !after?.lines?.length) {
    return { step: CHECKOUT_STEP.CART, notice: CART_REVIEW_NOTICE };
  }
  if (reason === CHECKOUT_AUTH_REASON.GUEST_ADVANCE) {
    return { step: CHECKOUT_STEP.DETAILS, notice: null };
  }
  return { step, notice: null };
}

// A checkout request rejected because the session is gone (the shared HTTP
// client has already tried one refresh).
export function isAuthFailure(error) {
  return error?.response?.status === 401;
}
