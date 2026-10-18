import { sessionLifecycle } from "./sessionLifecycle.mjs";

// React Query keys do not encode who is signed in, so data fetched for one
// identity must not survive into the next (guest → user, user → guest,
// user A → user B). Applied by the AuthQueryCacheBridge in Providers.jsx.
//
// Public catalogue data (products, categories, brands, banners, campaigns)
// is identity-independent and kept.

export const CART_QUERY_ROOT = "cart-items";

// Data owned by the signed-in account.
export const USER_SCOPED_QUERY_ROOTS = Object.freeze([
  "addresses",
  "orders",
  "order",
  "order-timeline",
  "order-number",
  "notifications",
]);

// Data only an admin session may read.
export const PRIVILEGED_QUERY_ROOTS = Object.freeze([
  "admin-orders",
  "admin-order",
  "admin-dashboard",
  "admin-contact-messages",
  "orders-user",
  "users",
  "user",
  "coupons",
]);

// `undefined` while authentication has not settled yet; then the user id,
// or null for a guest.
export function identityOf({ initializing, user }) {
  if (initializing) return undefined;
  return user?.id ?? null;
}

// What to do when the settled identity changes; null when nothing changed
// (or on the first settled identity, which is the baseline).
export function planIdentityChange(previous, next) {
  if (previous === undefined || next === undefined || previous === next) {
    return null;
  }

  return {
    // Reset: cached data disappears at once; active, enabled queries refetch
    // for the new identity.
    reset: [...USER_SCOPED_QUERY_ROOTS, ...PRIVILEGED_QUERY_ROOTS],
    // A guest's own cart may stay visible while the merged account cart
    // loads; another account's cart may not.
    cart: previous === null ? "invalidate" : "reset",
  };
}

export async function applyIdentityChange(queryClient, plan, { refetch = true } = {}) {
  if (!plan) return;
  // Capture/cancel now, before awaiting anything. A newer generation's fetch
  // must never be cancelled by an older transition resuming later.
  const generation = sessionLifecycle.generation();
  const cancellation = queryClient.cancelQueries({ queryKey: [CART_QUERY_ROOT], exact: true });
  for (const root of plan.reset) {
    for (const query of queryClient.getQueryCache().findAll({ queryKey: [root] })) query.reset();
  }
  if (plan.cart === "reset") {
    const query = queryClient.getQueryCache().find({ queryKey: [CART_QUERY_ROOT], exact: true });
    query?.reset();
  } else {
    void queryClient.invalidateQueries({ queryKey: [CART_QUERY_ROOT], refetchType: "none" });
  }
  await cancellation;
  if (refetch && sessionLifecycle.current(generation)) {
    for (const root of [...plan.reset, CART_QUERY_ROOT]) {
      void queryClient.invalidateQueries({ queryKey: [root] });
    }
  }
}
