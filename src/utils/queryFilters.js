import { emptyFilters } from "@/contexts/filters/initialStateFilters";

export function buildQueryFromFilters(filters, currentSearchParams) {
  const params = new URLSearchParams(currentSearchParams.toString());

  params.delete("brandIds");
  params.delete("accords");
  params.delete("gender");
  params.delete("volumes");
  params.delete("sort");
  params.delete("minPrice");
  params.delete("maxPrice");
  params.delete("page");
  params.delete("inStock");
  params.delete("original");

  filters.brandIds.forEach((id) => {
    params.append("brandIds", id);
  });

  filters.accords.forEach((item) => {
    params.append("accords", item);
  });

  filters.volumes.forEach((item) => {
    params.append("volumes", item);
  });

  if (filters.gender) {
    params.set("gender", filters.gender);
  }

  if (filters.sort) {
    params.set("sort", filters.sort);
  }

  if (filters.inStock === true) {
    params.set("inStock", "true");
  }

  if (filters.original === true) {
    params.set("original", "true");
  }

  if (filters.priceRange?.[0]) {
    params.set("minPrice", String(filters.priceRange[0]));
  } else {
    params.delete("minPrice");
  }

  if (filters.priceRange?.[1]) {
    params.set("maxPrice", String(filters.priceRange[1]));
  } else {
    params.delete("maxPrice");
  }

  return params.toString();
}

export function getFiltersFromSearchParams(searchParams) {
  return {
    ...emptyFilters,
    brandIds: searchParams.getAll("brandIds").map(Number).filter(Boolean),
    accords: searchParams.getAll("accords"),
    volumes: searchParams.getAll("volumes").map(Number).filter(Boolean),
    gender: searchParams.get("gender") || null,
    sort: searchParams.get("sort") || "",
    inStock: searchParams.get("inStock") === "true" ? true : null,
    original: searchParams.get("original") === "true" ? true : null,
    priceRange: [
      Number(searchParams.get("minPrice")) || emptyFilters.priceRange[0],
      Number(searchParams.get("maxPrice")) || emptyFilters.priceRange[1],
    ],
  };
}
