export const emptyFilters = {
  accords: [],
  brandIds: [],
  volumes: [],
  minPrice: null,
  maxPrice: null,
  priceRange: [null, null],
  inStock: null,
  original: null,
  gender: null,
};

export const initialFilters = {
  draft: structuredClone(emptyFilters),
  applied: structuredClone(emptyFilters),
};
