const decimalInteger = (value, allowZero = false) => {
  if (!/^\d+$/.test(String(value ?? ""))) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && (allowZero ? number >= 0 : number > 0)
    ? number
    : null;
};

const uniqueSorted = (values, parse) =>
  [
    ...new Set(
      (Array.isArray(values) ? values : [values])
        .map(parse)
        .filter((value) => value !== null),
    ),
  ].sort((a, b) => a - b);

export const normalizeVolumes = (values = []) =>
  uniqueSorted(values, (value) => decimalInteger(value));
const normalizeIds = (values = []) =>
  uniqueSorted(values, (value) => decimalInteger(value));
const normalizeSlugs = (values = []) =>
  [
    ...new Set(
      (Array.isArray(values) ? values : [values]).filter(
        (value) => typeof value === "string" && value.length,
      ),
    ),
  ].sort();
const variantType = (value) =>
  value === "decant" || value === "sealed" ? value : null;
const optionalBoolean = (value) =>
  value === true || value === "true"
    ? true
    : value === false || value === "false"
      ? false
      : undefined;

export const emptyFilters = {
  fragranceFamilies: [],
  brandIds: [],
  volumes: [],
  type: null,
  minVolume: null,
  maxVolume: null,
  priceRange: [null, null],
  inStock: null,
  original: null,
  gender: null,
  sort: "",
};

export const initialFilters = {
  draft: structuredClone(emptyFilters),
  applied: structuredClone(emptyFilters),
};

const resetField = (filters, key) =>
  key === "volumes"
    ? { ...filters, volumes: [], minVolume: null, maxVolume: null }
    : { ...filters, [key]: structuredClone(emptyFilters[key]) };

export function filtersReducer(state, action) {
  switch (action.type) {
    case "SET_ITEMS": {
      const items = state.draft[action.key] || [];
      const next = items.includes(action.value)
        ? items.filter((value) => value !== action.value)
        : [...items, action.value];
      return {
        ...state,
        draft: {
          ...state.draft,
          [action.key]:
            action.key === "volumes" ? normalizeVolumes(next) : next,
        },
      };
    }
    case "SET_ITEM":
      return {
        ...state,
        draft: { ...state.draft, [action.key]: action.value },
      };
    case "RESET_ONE":
      return { ...state, draft: resetField(state.draft, action.key) };
    case "RESET_ALL":
      return { ...state, draft: structuredClone(emptyFilters) };
    case "RESET_DRAFT":
      return { ...state, draft: structuredClone(state.applied) };
    case "APPLY_FILTERS":
      return { ...state, applied: structuredClone(state.draft) };
    case "TOGGLE_ITEM_APPLY": {
      const items = state.applied[action.key] || [];
      const next = items.some((value) => Number(value) === Number(action.value))
        ? items.filter((value) => Number(value) !== Number(action.value))
        : [...items, action.value];
      const value = action.key === "volumes" ? normalizeVolumes(next) : next;
      return {
        ...state,
        draft: { ...state.draft, [action.key]: value },
        applied: { ...state.applied, [action.key]: value },
      };
    }
    case "SET_ITEM_APPLY":
      return {
        ...state,
        draft: { ...state.draft, [action.key]: action.value },
        applied: { ...state.applied, [action.key]: action.value },
      };
    case "RESET_ONE_APPLY":
      return {
        ...state,
        draft: resetField(state.draft, action.key),
        applied: resetField(state.applied, action.key),
      };
    case "RESET_ALL_APPLY":
      return {
        draft: structuredClone(emptyFilters),
        applied: structuredClone(emptyFilters),
      };
    case "HYDRATE_FROM_URL":
      return {
        draft: structuredClone(action.payload),
        applied: structuredClone(action.payload),
      };
    default:
      throw new Error("Invalid filter action");
  }
}

const ownedParams = [
  "brandIds",
  "fragranceFamilies",
  "gender",
  "type",
  "volumes",
  "minVolume",
  "maxVolume",
  "sort",
  "minPrice",
  "maxPrice",
  "page",
  "inStock",
  "original",
];

export function buildQueryFromFilters(filters, currentSearchParams) {
  const params = new URLSearchParams(currentSearchParams.toString());
  ownedParams.forEach((key) => params.delete(key));
  normalizeIds(filters.brandIds).forEach((id) =>
    params.append("brandIds", String(id)),
  );
  normalizeSlugs(filters.fragranceFamilies).forEach((slug) =>
    params.append("fragranceFamilies", slug),
  );
  normalizeVolumes(filters.volumes).forEach((volume) =>
    params.append("volumes", String(volume)),
  );
  if (variantType(filters.type)) params.set("type", filters.type);
  if (filters.gender) params.set("gender", filters.gender);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.inStock === true) params.set("inStock", "true");
  if (filters.original === true) params.set("original", "true");
  const minVolume = decimalInteger(filters.minVolume);
  const maxVolume = decimalInteger(filters.maxVolume);
  const minPrice = decimalInteger(filters.priceRange?.[0]);
  const maxPrice = decimalInteger(filters.priceRange?.[1]);
  if (minVolume !== null) params.set("minVolume", String(minVolume));
  if (maxVolume !== null) params.set("maxVolume", String(maxVolume));
  if (minPrice !== null) params.set("minPrice", String(minPrice));
  if (maxPrice !== null) params.set("maxPrice", String(maxPrice));
  return params.toString();
}

export function getFiltersFromSearchParams(searchParams) {
  const types = searchParams.getAll("type");
  return {
    ...structuredClone(emptyFilters),
    brandIds: normalizeIds(searchParams.getAll("brandIds")),
    fragranceFamilies: normalizeSlugs(searchParams.getAll("fragranceFamilies")),
    volumes: normalizeVolumes(searchParams.getAll("volumes")),
    type: types.length === 1 ? variantType(types[0]) : null,
    gender: searchParams.get("gender") || null,
    sort: searchParams.get("sort") || "",
    inStock: searchParams.get("inStock") === "true" ? true : null,
    original: searchParams.get("original") === "true" ? true : null,
    minVolume: decimalInteger(searchParams.get("minVolume")),
    maxVolume: decimalInteger(searchParams.get("maxVolume")),
    priceRange: [
      decimalInteger(searchParams.get("minPrice")),
      decimalInteger(searchParams.get("maxPrice")),
    ],
  };
}

export const mergeVolumeOptions = (options, selected = []) =>
  normalizeVolumes([
    ...(Array.isArray(options) ? options : []),
    ...normalizeVolumes(selected),
  ]);

export const PRODUCT_LIST_DEFAULT_LIMIT = 12;
export const PRODUCT_LIST_MAX_LIMIT = 100;

// Raw URL page/limit never reach allocation, requests, or query keys unbounded.
export const normalizeProductListPage = (value) => decimalInteger(value) ?? 1;
export const normalizeProductListLimit = (value) => {
  const limit = decimalInteger(value);
  return limit !== null && limit <= PRODUCT_LIST_MAX_LIMIT
    ? limit
    : PRODUCT_LIST_DEFAULT_LIMIT;
};

// Error state is rendered separately; empty only after a successful response.
export const productListView = ({ isLoading, data }) => {
  if (isLoading && !data) return "loading";
  if (data && !data.data?.length) return "empty";
  return "products";
};

export function normalizeProductsQuery(query = {}) {
  const original = optionalBoolean(query.original);
  const inStock = optionalBoolean(query.inStock);
  const discounted = optionalBoolean(query.discounted);
  const brandIds = normalizeIds(query.brandIds);
  const fragranceFamilies = normalizeSlugs(query.fragranceFamilies);
  const volumes = normalizeVolumes(query.volumes);
  const campaignId = decimalInteger(query.campaignId);
  return {
    // Only present when set, so existing query keys keep their exact shape.
    ...(campaignId ? { campaignId } : {}),
    search: query.search || undefined,
    brandIds: brandIds.length ? brandIds : undefined,
    original,
    inStock,
    discounted,
    gender: query.gender || undefined,
    fragranceFamilies: fragranceFamilies.length ? fragranceFamilies : undefined,
    type: variantType(query.type) || undefined,
    volumes: volumes.length ? volumes : undefined,
    minVolume: decimalInteger(query.minVolume) ?? undefined,
    maxVolume: decimalInteger(query.maxVolume) ?? undefined,
    minPrice: decimalInteger(query.minPrice) ?? undefined,
    maxPrice: decimalInteger(query.maxPrice) ?? undefined,
    sort: query.sort || "newest",
    page: normalizeProductListPage(query.page),
    limit: normalizeProductListLimit(query.limit),
  };
}

export const productListKey = (query = {}) => [
  "products",
  "list",
  normalizeProductsQuery(query),
];
