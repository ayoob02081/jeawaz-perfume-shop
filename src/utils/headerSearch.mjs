// Header search box ↔ URL `search`. The box follows the URL whenever its
// `search` changes (navigation, Back/Forward, a cleared search); otherwise it
// keeps what the customer has typed but not yet submitted.
export const syncHeaderSearch = (state, urlSearch) =>
  state.urlSearch === urlSearch ? state : { value: urlSearch, urlSearch };

// Submitting the header search. On /products it refines the current result
// in place (like every filter change there); from any other page it adds a
// history entry, so Back returns to that page.
export function productSearchNavigation(value, currentSearchParams, pathname) {
  const params = new URLSearchParams(currentSearchParams.toString());
  const search = value.trim();

  if (search) {
    params.set("search", search);
  } else {
    params.delete("search");
  }

  params.set("page", "1");
  params.set("limit", "12");

  return {
    href: `/products?${params.toString()}`,
    replace: pathname === "/products",
  };
}

// Only the active, fully debounced term owns a query. Moving to the disabled
// empty key also detaches/aborts the previous request when its signal is consumed.
export function headerSuggestionQuery(value, debounced, active) {
  const term = value.trim();
  const enabled = Boolean(active && term.length >= 3 && term === debounced);
  return { search: enabled ? term : "", enabled, waiting: Boolean(active && term.length >= 3 && !enabled) };
}

export function headerSearchSurface(width) {
  return width <= 480 ? "spotlight" : width < 1024 ? "tablet" : "desktop";
}
