export function parseFiltersFromUrl(searchParams) {
  return {
    accordTypes: [],
    brands: searchParams.get("brand")?.searchParamslit(",") || [],
    priceRange: [
      Number(searchParams.get("price_min")) || 0,
      Number(searchParams.get("price_max")) || 10_000_000,
    ],
    inStock: null,
    isOriginal: null,
    volume: [],
    gender: searchParams.get("gender"),
  };
}
