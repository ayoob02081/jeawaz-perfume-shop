// Customer-facing availability. The backend decides it by the checkout rules:
// GET /products sends `isAvailable` per Product, GET /products/:id sends
// `isPurchasable` per Variant. An explicit boolean always wins; only when the
// field is absent (an older backend) does the previous physical-stock rule apply.
import { getMatchingVariant, getVariantsByType } from "./priceCalculator.js";

// Preference order of the detail page's purchase modes.
export const PURCHASE_MODES = ["decant", "sealed"];

// Product card: the Product can be bought (through its representative Variant).
export function isProductAvailable(product, representativeVariant) {
  if (typeof product?.isAvailable === "boolean") return product.isAvailable;
  return (
    !!representativeVariant &&
    Number(product?.stock) >= Number(representativeVariant.volume)
  );
}

// Product detail: one unit of this Variant can be bought now.
export function isVariantPurchasable(product, variant) {
  if (!variant) return false;
  if (typeof variant.isPurchasable === "boolean") return variant.isPurchasable;
  return Number(product?.stock) >= Number(variant.volume);
}

// The first mode with a purchasable Variant (decant before sealed); with none,
// the first mode that has Variants, for display; null without Variants.
export function getPreferredPurchaseMode(product) {
  const modes = PURCHASE_MODES.filter((mode) => getVariantsByType(product, mode).length > 0);
  const purchasable = modes.find((mode) =>
    getVariantsByType(product, mode).some((variant) => isVariantPurchasable(product, variant)),
  );
  return purchasable ?? modes[0] ?? null;
}

// The mode's smallest purchasable volume, else its smallest volume, else 0.
export function getDefaultPurchaseVolume(product, mode) {
  const variants = mode ? getVariantsByType(product, mode) : [];
  const variant =
    variants.find((candidate) => isVariantPurchasable(product, candidate)) ?? variants[0];
  return Number(variant?.volume ?? 0);
}

// Keeps the customer's volume while the mode still offers it, purchasable or
// not (an unavailable one stays visible as such); otherwise the mode's default.
export function resolveSelectedVolume(product, mode, selectedVolume) {
  return getMatchingVariant(product, mode, selectedVolume)
    ? Number(selectedVolume)
    : getDefaultPurchaseVolume(product, mode);
}

// The Cart refused a change because the Product changed since the page loaded:
// a 400 with the service's single message (stock, price or Variant). A
// ValidationPipe 400 carries a list of messages: a request problem, not stale data.
export function isStaleAvailabilityRejection(error) {
  const message = error?.response?.data?.message;
  return error?.response?.status === 400 && typeof message === "string" && message.length > 0;
}
