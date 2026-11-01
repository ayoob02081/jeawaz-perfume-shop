// Owner-approved populated brands verified through the public catalog on 2026-10-17.
// This is editorial SEO approval, not an inferred activation or stock flag.
export const APPROVED_BRAND_IDS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22]);
const approvedIds = new Set(APPROVED_BRAND_IDS);

export function approvedBrandLanding(brand) {
  if (!["number", "string"].includes(typeof brand?.id) || !/^[0-9]+$/.test(String(brand.id))) return null;
  const id = Number(brand.id);
  if (!approvedIds.has(id) || typeof brand.title !== "string") return null;
  const title = brand.title.trim();
  // Require a real Persian/Arabic-script name from public data, never a made-up fallback.
  if (!title || !/[\u0621-\u063A\u0641-\u064A\u0671-\u06D3]/u.test(title)) return null;
  return { id, title, href: "/products?brandIds=" + id };
}

// Every returned row must support the same identity; an unrelated product cannot
// supply the requested brand's name. No availability check belongs here.
export function brandLandingFromProducts(id, products) {
  if (!products.length) return null;
  const brand = approvedBrandLanding(products[0]?.brand);
  if (!brand || brand.id !== id) return null;
  return products.every((product) => {
    const candidate = approvedBrandLanding(product?.brand);
    return candidate?.id === id && candidate.title === brand.title;
  }) ? brand : null;
}
