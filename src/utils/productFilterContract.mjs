import { PRODUCT_CONCENTRATIONS } from "./productConcentration.mjs";
import { gradesFromLegacyOriginal, normalizeGrades } from "./productGrade.mjs";

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
const normalizeConcentrations = (values = []) =>
  PRODUCT_CONCENTRATIONS.filter((value) =>
    (Array.isArray(values) ? values : [values]).includes(value),
  );
// A single-valued URL key: exactly one non-empty value, otherwise none.
const singleValue = (values) =>
  values.length === 1 && values[0] ? values[0] : null;
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
  // Canonical ProductGrade values (OR within); replaces the old `original` flag.
  grades: [],
  gender: null,
  // Product V2 taxonomy (Category slugs; OR within a group, AND across).
  seasons: [],
  temperature: null,
  characters: [],
  occasions: [],
  // Canonical ProductConcentration values.
  concentrations: [],
  // URL-only (footer/banner links): no modal control, but a visible,
  // resettable filter that Apply carries forward like any other.
  discounted: null,
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
  "grades",
  // Legacy key: read once (see getFiltersFromSearchParams), never written back.
  "original",
  "discounted",
  "seasons",
  "temperature",
  "characters",
  "occasions",
  "concentrations",
];

// Multi-value Category-slug taxonomies (repeated URL keys, OR within).
export const TAXONOMY_SLUG_FILTERS = ["seasons", "characters", "occasions"];

// One definition of the Product V2 taxonomy filter groups for every filter UI:
// filter/URL key, Category type (storefront options) and Persian label.
export const TAXONOMY_FILTER_GROUPS = [
  { key: "seasons", type: "season", label: "فصل", multiple: true },
  { key: "characters", type: "character", label: "شخصیت", multiple: true },
  {
    key: "occasions",
    type: "occasion",
    label: "موقعیت استفاده",
    multiple: true,
  },
  { key: "temperature", type: "temperature", label: "طبع", multiple: false },
  { key: "gender", type: "gender", label: "جنسیت", multiple: false },
];
export const CONCENTRATION_FILTER_LABEL = "غلظت";
export const GRADE_FILTER_LABEL = "نوع کیفیت";

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
  TAXONOMY_SLUG_FILTERS.forEach((key) =>
    normalizeSlugs(filters[key]).forEach((slug) => params.append(key, slug)),
  );
  normalizeConcentrations(filters.concentrations).forEach((value) =>
    params.append("concentrations", value),
  );
  normalizeGrades(filters.grades).forEach((grade) =>
    params.append("grades", grade),
  );
  if (variantType(filters.type)) params.set("type", filters.type);
  if (filters.gender) params.set("gender", filters.gender);
  if (filters.temperature) params.set("temperature", filters.temperature);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.inStock === true) params.set("inStock", "true");
  if (filters.discounted === true) params.set("discounted", "true");
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
  const grades = normalizeGrades(searchParams.getAll("grades"));
  return {
    ...structuredClone(emptyFilters),
    brandIds: normalizeIds(searchParams.getAll("brandIds")),
    fragranceFamilies: normalizeSlugs(searchParams.getAll("fragranceFamilies")),
    volumes: normalizeVolumes(searchParams.getAll("volumes")),
    type: types.length === 1 ? variantType(types[0]) : null,
    gender: searchParams.get("gender") || null,
    seasons: normalizeSlugs(searchParams.getAll("seasons")),
    temperature: singleValue(searchParams.getAll("temperature")),
    characters: normalizeSlugs(searchParams.getAll("characters")),
    occasions: normalizeSlugs(searchParams.getAll("occasions")),
    concentrations: normalizeConcentrations(
      searchParams.getAll("concentrations"),
    ),
    sort: searchParams.get("sort") || "",
    inStock: searchParams.get("inStock") === "true" ? true : null,
    // Old links (?original=true|false) still load; `grades` wins when present.
    grades: grades.length
      ? grades
      : gradesFromLegacyOriginal(singleValue(searchParams.getAll("original"))),
    discounted: searchParams.get("discounted") === "true" ? true : null,
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

// Price form (FilterSection's react-hook-form) ↔ applied priceRange. Empty and
// zero are "no bound", as in buildQueryFromFilters.
export const priceFormValues = (priceRange = []) => ({
  minPrice: decimalInteger(priceRange?.[0]),
  maxPrice: decimalInteger(priceRange?.[1]),
});

export const PRICE_RANGE_ERROR =
  "حداقل قیمت نمی‌تواند بیشتر از حداکثر قیمت باشد";

// The backend rejects maxPrice < minPrice with 400; block it before Apply.
export const validatePriceRange = (minPrice, maxPrice) => {
  const min = decimalInteger(minPrice);
  const max = decimalInteger(maxPrice);
  return min === null || max === null || min <= max || PRICE_RANGE_ERROR;
};

// Storefront filter options never offer inactive categories. The shared
// /categories/type/:type endpoint also serves admin, so this is applied only
// where the storefront consumes it. Order is preserved.
export const storefrontCategoryOptions = (categories) =>
  Array.isArray(categories)
    ? categories.filter((category) => category?.isActive !== false)
    : categories;

// Number of active filter groups (sort is not a filter). Used to enable the
// reset/apply controls; every owned filter, including URL-only discounted.
export const activeFilterCount = (filters = {}) =>
  [
    filters.brandIds?.length,
    filters.fragranceFamilies?.length,
    filters.volumes?.length,
    filters.minVolume !== null && filters.minVolume !== undefined,
    filters.maxVolume !== null && filters.maxVolume !== undefined,
    filters.type,
    filters.priceRange?.some((price) => price !== null && price !== undefined),
    filters.inStock,
    filters.grades?.length,
    filters.gender,
    filters.discounted,
    ...TAXONOMY_SLUG_FILTERS.map((key) => filters[key]?.length),
    filters.temperature,
    filters.concentrations?.length,
  ].filter(Boolean).length;

// The filters with one value of a multi-value group, or the single
// temperature, removed (active-filter badges).
export const withoutFilterValue = (filters, key, value) =>
  Array.isArray(filters[key])
    ? { ...filters, [key]: filters[key].filter((item) => item !== value) }
    : { ...filters, [key]: structuredClone(emptyFilters[key]) };

// Badge text for a selected Category slug: its Persian title, or the group
// label while categories load or when the slug is unknown.
export const categoryBadgeTitle = (categories, type, slug, fallback) =>
  (Array.isArray(categories)
    ? categories.find(
        (category) => category?.type === type && category?.slug === slug,
      )?.title
    : null) || fallback;

// Product-list heading: a resolved gender title, never "undefined".
export const productListHeading = (genderSlug, categories) => {
  if (!genderSlug) return "همه ادکلن‌ها";
  const title = Array.isArray(categories)
    ? categories.find(
        (category) =>
          category?.type === "gender" && category?.slug === genderSlug,
      )?.title
    : null;
  return title ? `ادکلن‌های ${title}` : "ادکلن‌ها";
};

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
  // `grades` only: a legacy `original` input is translated, never sent (the
  // backend rejects `grades` together with `original`).
  const requestedGrades = normalizeGrades(query.grades);
  const grades = requestedGrades.length
    ? requestedGrades
    : gradesFromLegacyOriginal(query.original);
  const inStock = optionalBoolean(query.inStock);
  const discounted = optionalBoolean(query.discounted);
  const brandIds = normalizeIds(query.brandIds);
  const fragranceFamilies = normalizeSlugs(query.fragranceFamilies);
  const volumes = normalizeVolumes(query.volumes);
  const campaignId = decimalInteger(query.campaignId);
  const seasons = normalizeSlugs(query.seasons);
  const characters = normalizeSlugs(query.characters);
  const occasions = normalizeSlugs(query.occasions);
  const concentrations = normalizeConcentrations(query.concentrations);
  const temperature =
    typeof query.temperature === "string" && query.temperature
      ? query.temperature
      : undefined;
  return {
    // Only present when set, so existing query keys keep their exact shape.
    ...(campaignId ? { campaignId } : {}),
    // Admin management opts out of the backend's availability-first ordering.
    ...(query.availabilityFirst === false ? { availabilityFirst: false } : {}),
    ...(seasons.length ? { seasons } : {}),
    ...(temperature ? { temperature } : {}),
    ...(characters.length ? { characters } : {}),
    ...(occasions.length ? { occasions } : {}),
    ...(concentrations.length ? { concentrations } : {}),
    ...(grades.length ? { grades } : {}),
    search: query.search || undefined,
    brandIds: brandIds.length ? brandIds : undefined,
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
