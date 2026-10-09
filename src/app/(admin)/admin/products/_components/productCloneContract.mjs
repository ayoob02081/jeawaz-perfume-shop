import { initialProductFormValues } from "./productFormContract.js";
import { productGrade } from "../../../../../utils/productGrade.mjs";

// Duplicate Product ("ساخت محصول مشابه"): /admin/products/add?copyFrom=<id>
// prefills the normal create form from an existing Product. It is create mode
// only — the source is never passed as productToEdit, never PATCHed, and its
// IDs, Variant snapshot and server-owned state are never sent.

export const COPY_FROM_PARAM = "copyFrom";

// A positive INT id, or null (malformed). Absent/empty means "not copying".
export function parseCopyFromId(value) {
  if (typeof value !== "string" || !/^[1-9]\d{0,9}$/.test(value)) return null;
  const id = Number(value);
  return id <= 2_147_483_647 ? id : null;
}

export const isCopyRequested = (value) =>
  typeof value === "string" && value.trim() !== "";

// What the Add page shows. A requested copy never silently falls back to a
// blank form: a malformed id or a failed/empty source request is an explicit
// error with a "start blank" action.
export function duplicateView({ copyFrom, isLoading, error, source }) {
  if (!isCopyRequested(copyFrom)) return { view: "blank" };
  if (parseCopyFromId(copyFrom) === null) {
    return { view: "error", message: "شناسهٔ محصول منبع معتبر نیست." };
  }
  if (error) {
    return {
      view: "error",
      message:
        error?.response?.status === 404
          ? "محصول منبع پیدا نشد."
          : "دریافت محصول منبع ناموفق بود؛ دوباره تلاش کنید.",
    };
  }
  if (isLoading || !source) return { view: "loading" };
  if (!source.id) {
    return { view: "error", message: "اطلاعات محصول منبع ناقص است." };
  }
  return { view: "ready" };
}

// Create rejects inactive Categories, so a copy never carries them.
const isActive = (category) => Boolean(category?.id) && category.isActive !== false;
const activeOne = (category) => (isActive(category) ? category : null);
const activeMany = (categories) =>
  Array.isArray(categories) ? categories.filter(isActive) : [];
const copyList = (list) => (Array.isArray(list) ? [...list] : []);

// Explicit whitelist (never a spread of the source). Reset: grade (blank, the
// admin must choose), every Variant price (blank), stock (0) and offValue
// (empty = no discount), so a copy can never inherit the source's price,
// inventory or discount. printName is copied but flagged for review in the UI.
// Not copied: id, slug, timestamps, Variant ids, inventory, campaign,
// representativeVariant, history, original/grade.
export function mapProductToCloneDefaults(product) {
  const categories = product?.categories ?? {};
  const source = {
    perTitle: product?.perTitle,
    enTitle: product?.enTitle,
    description: product?.description,
    notesDescription: product?.notesDescription,
    notes: {
      top: copyList(product?.notes?.top),
      middle: copyList(product?.notes?.middle),
      base: copyList(product?.notes?.base),
    },
    // Same image URLs: images are shared references, never re-uploaded.
    images: copyList(product?.images),
    brand: product?.brand?.id ? { id: product.brand.id } : null,
    categories: {
      gender: activeOne(categories.gender),
      temperature: activeOne(categories.temperature),
      fragranceFamilies: activeMany(categories.fragranceFamilies),
      seasons: activeMany(categories.seasons),
      characters: activeMany(categories.characters),
      occasions: activeMany(categories.occasions),
    },
    releaseYear: product?.releaseYear,
    country: product?.country,
    concentration: product?.concentration,
    perfumer: product?.perfumer,
    printName: product?.printName,
    performance: product?.performance,
    variants: (product?.variants ?? []).map(({ type, volume }) => ({
      type,
      volume,
      price: "",
    })),
  };

  return {
    ...initialProductFormValues(source),
    grade: "",
    stock: 0,
    offValue: "",
  };
}

// Banner context for the copy: the source title and its grade.
export const cloneSourceSummary = (product) => ({
  id: product?.id,
  title: product?.enTitle || product?.perTitle || "",
  grade: productGrade(product),
});
