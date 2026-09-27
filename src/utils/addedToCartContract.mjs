// Product Detail "added to cart" feedback: which cart line was added, and
// whether that success is shown as the mobile confirmation modal or the
// existing desktop toast.

import { getVariantLabel } from "./priceCalculator.js";

// Tailwind `md`, the same boundary as the Product Detail layout and the
// ImageSwiper lightbox. Below it the modal is used; at or above it the toast.
export const DESKTOP_MEDIA_QUERY = "(min-width: 48rem)";

export const CART_ROUTE = "/cart";

// A cart line is identified by product id + variant mode + volume.
export function findCartLine(cart, { productId, mode, volume } = {}) {
  if (!Array.isArray(cart?.items)) return null;
  return (
    cart.items.find(
      (item) =>
        Number(item?.product?.id) === Number(productId) &&
        item?.mode === mode &&
        Number(item?.volume) === Number(volume),
    ) ?? null
  );
}

// The POST /cart/item response is the whole cart. The added line is the one
// the request was for: the mutation variables, never the page's current
// selection (which may have changed while the request was in flight).
export function findAddedCartLine(cart, variables) {
  if (!variables) return null;
  return findCartLine(cart, variables);
}

// POST /cart/item returns the same cart as GET /cart, so it can replace the
// cached cart at once: the new line is known before the refetch finishes.
export function cartFromAddResponse(data) {
  return Array.isArray(data?.items) ? data : null;
}

// Quantity "+": an existing line is updated; only an unknown line is added.
export function resolveIncrement({ line, quantity, request }) {
  if (line) return { type: "update", itemId: line.id, quantity: quantity + 1 };
  return { type: "add", payload: { ...request, quantity: 1 } };
}

// Quantity "-": nothing without a known line; the last unit removes it.
export function resolveDecrement({ line, quantity }) {
  if (!line) return null;
  if (quantity > 1) return { type: "update", itemId: line.id, quantity: quantity - 1 };
  return { type: "remove", itemId: line.id };
}

// Everything the modal renders, taken from the returned cart line. The price
// is the server's unitPrice; it is never recalculated here. An incomplete
// line yields null so the caller falls back to the toast.
export function toAddedCartItem(line) {
  const title = line?.product?.perTitle;
  const variantLabel = getVariantLabel({ type: line?.mode, volume: line?.volume });
  const unitPrice = Number(line?.unitPrice);
  if (!title || !variantLabel || line?.unitPrice == null || !Number.isFinite(unitPrice)) {
    return null;
  }
  return {
    productId: line.product.id,
    image: line.product.images?.[0] ?? null,
    title,
    variantLabel,
    unitPrice,
  };
}

export function isDesktopViewport(win) {
  // Without matchMedia the modal cannot be scoped to mobile; keep the toast.
  if (typeof win?.matchMedia !== "function") return true;
  return win.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

// { kind: "modal", item } on mobile when the added line is identified;
// { kind: "toast" } on desktop and whenever the line cannot be identified.
export function resolveAddSuccessFeedback({ cart, variables, isDesktop }) {
  if (isDesktop) return { kind: "toast" };
  const item = toAddedCartItem(findAddedCartLine(cart, variables));
  return item ? { kind: "modal", item } : { kind: "toast" };
}

// Modal state: one confirmation at a time. A later success replaces the item
// (and bumps `seq` so focus is reset) instead of stacking a second modal.
// `item` is kept after closing so the closing animation still has content.
export const initialAddedToCartState = { open: false, item: null, seq: 0 };

export function showAddedItem(state, item) {
  return { open: true, item, seq: state.seq + 1 };
}

export function closeAddedItem(state) {
  return state.open ? { ...state, open: false } : state;
}

// While the modal is open: Escape closes it, and so does the viewport reaching
// the desktop breakpoint (the modal is mobile-only). Returns the cleanup.
export function openAddedToCartSession({ window, onClose }) {
  const media = window.matchMedia(DESKTOP_MEDIA_QUERY);
  const onKeyDown = (event) => {
    if (event.key === "Escape") onClose();
  };
  const onMediaChange = () => {
    if (media.matches) onClose();
  };

  window.addEventListener("keydown", onKeyDown);
  if (media.addEventListener) media.addEventListener("change", onMediaChange);
  else media.addListener?.(onMediaChange);
  onMediaChange();

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    if (media.removeEventListener) media.removeEventListener("change", onMediaChange);
    else media.removeListener?.(onMediaChange);
  };
}
