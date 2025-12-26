export function buildFiltersQuery(filters) {
  const params = new URLSearchParams();

  if (filters.brands.length) params.set("brand", filters.brands.join(","));
  if (filters.gender) params.set("gender", filters.gender);

  params.set("price_min", filters.priceRange[0]);
  params.set("price_max", filters.priceRange[1]);

  return params.toString();
}
