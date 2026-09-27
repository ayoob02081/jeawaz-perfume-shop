// Home banner and category sections: loading (skeleton), settled content,
// and the existing empty/error behaviour, kept as distinct states.

// Primary banners are a one-slide carousel; secondary banners show at most 2.
export const SECONDARY_BANNER_SKELETON_COUNT = 2;
// Gender cards stack on mobile and sit in one row from md (usually 3).
export const GENDER_CATEGORY_SKELETON_COUNT = 3;
// Fragrance-family cards scroll horizontally: 4 fill the desktop row.
export const ACCORD_CATEGORY_SKELETON_COUNT = 4;

/**
 * @returns {"loading" | "hidden" | "banners"}
 * An error or an empty list hides the section, as before.
 */
export function homeBannerView({ isPending, isError, banners }) {
  if (isPending) return "loading";
  if (isError || !banners?.length) return "hidden";
  return "banners";
}

/**
 * @returns {"loading" | "error" | "categories"}
 * The error UI wins, as before; a settled empty list renders an empty row.
 */
export function homeCategoryView({ isPending, error }) {
  if (error) return "error";
  if (isPending) return "loading";
  return "categories";
}
