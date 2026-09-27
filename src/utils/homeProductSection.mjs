// Home product sections (Recent, Popular, most-discounted): what the products
// row shows while its list loads, fails or has settled.

// Skeleton cards per section: fills the desktop row (about 3.5 cards of
// w-77 at xl:max-w-7xl) and the mobile viewport without over-rendering;
// the loaded list is limited to 8.
export const HOME_SECTION_SKELETON_COUNT = 4;

/** @returns {"loading" | "error" | "products"} */
export function homeSectionView({ isLoading, error }) {
  if (isLoading) return "loading";
  if (error) return "error";
  return "products";
}
