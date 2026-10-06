import { PRODUCT_CONCENTRATIONS } from "../../../../../utils/productConcentration.mjs";

export const concentrationOptions = PRODUCT_CONCENTRATIONS;

export const longevityOptions = ["LOW", "MODERATE", "HIGH", "VERY_HIGH"];
export const projectionOptions = ["WEAK", "MODERATE", "STRONG", "VERY_STRONG"];
export const sillageOptions = ["LOW", "MODERATE", "HIGH", "VERY_HIGH"];
export const variantTypes = ["decant", "sealed"];

// Mirrors the authoritative backend write contract; the backend still validates.
export const PRODUCT_STOCK_MAX = 2_147_483_647;
export const VARIANT_PRICE_MAX = 2_147_483_647;
// Cart/Order persist volume as FLOAT; 2^24 keeps every volume exact.
export const VARIANT_VOLUME_MAX = 16_777_216;
// Optional admin short name for order Excel/print; empty = use enTitle.
export const PRINT_NAME_MAX = 100;

const isEmpty = (value) => value === "" || value === null || value === undefined;
const inIntegerRange = (value, min, max) =>
  Number.isInteger(value) && value >= min && value <= max;

const categorySelections = [
  ["fragranceFamilyIds", "fragranceFamilies"],
  ["seasonIds", "seasons"],
  ["characterIds", "characters"],
  ["occasionIds", "occasions"],
];

const optionalText = (value) => {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
};

const invalid = (field, message) => ({ field, message });

export function initialProductFormValues(product) {
  const categories = product?.categories ?? {};
  const images = (product?.images ?? [])
    .filter((image) => typeof image === "string" && image.trim())
    .map((url) => ({ url }));

  return {
    perTitle: product?.perTitle ?? "",
    enTitle: product?.enTitle ?? "",
    description: product?.description ?? "",
    notesDescription: product?.notesDescription ?? "",
    releaseYear: product?.releaseYear ?? "",
    country: product?.country ?? "",
    concentration: product?.concentration ?? "",
    perfumer: product?.perfumer ?? "",
    printName: product?.printName ?? "",
    images: [...images, { url: "" }],
    offValue: product?.offValue ?? "",
    stock: product?.stock ?? 0,
    original: product?.original ? "original" : false,
    notes: {
      top: product?.notes?.top?.length ? product.notes.top : [""],
      middle: product?.notes?.middle?.length ? product.notes.middle : [""],
      base: product?.notes?.base?.length ? product.notes.base : [""],
    },
    variants: product?.variants?.length
      ? product.variants.map(({ type, volume, price }) => ({
          type,
          volume,
          price,
        }))
      : [{ type: "decant", volume: "", price: "" }],
    genderId: categories.gender?.id ? String(categories.gender.id) : "",
    temperatureId: categories.temperature?.id
      ? String(categories.temperature.id)
      : "",
    fragranceFamilyIds:
      categories.fragranceFamilies?.map(({ id }) => String(id)) ?? [],
    seasonIds: categories.seasons?.map(({ id }) => String(id)) ?? [],
    characterIds: categories.characters?.map(({ id }) => String(id)) ?? [],
    occasionIds: categories.occasions?.map(({ id }) => String(id)) ?? [],
    brandId: product?.brand?.id ? String(product.brand.id) : "",
    performance: {
      longevity: {
        level: product?.performance?.longevity?.level ?? "",
        minHours: product?.performance?.longevity?.minHours ?? "",
        maxHours: product?.performance?.longevity?.maxHours ?? "",
      },
      projection: product?.performance?.projection ?? "",
      sillage: product?.performance?.sillage ?? "",
    },
  };
}

export function buildProductFormPayload(data, originalVariants) {
  const errors = [];
  const stock = isEmpty(data.stock) ? Number.NaN : Number(data.stock);
  // An empty discount clears it (null), never silently becomes 0.
  const offValue = isEmpty(data.offValue) ? null : Number(data.offValue);
  const releaseYear =
    data.releaseYear === "" || data.releaseYear == null
      ? null
      : Number(data.releaseYear);
  const country = optionalText(data.country);
  const perfumer = optionalText(data.perfumer);
  // Empty clears the override (null); enTitle is never copied in.
  const printName = optionalText(data.printName);
  const concentration = data.concentration || null;

  if (!inIntegerRange(stock, 0, PRODUCT_STOCK_MAX)) {
    errors.push(invalid("stock", "موجودی باید عدد صحیح و غیرمنفی باشد"));
  }
  if (offValue !== null && !inIntegerRange(offValue, 0, 100)) {
    errors.push(invalid("offValue", "تخفیف باید عدد صحیح بین ۰ و ۱۰۰ باشد"));
  }
  if (
    releaseYear !== null &&
    (!Number.isInteger(releaseYear) ||
      releaseYear < 1700 ||
      releaseYear > new Date().getFullYear() + 1)
  ) {
    errors.push(invalid("releaseYear", "سال عرضه معتبر نیست"));
  }
  if (country && country.length > 100) {
    errors.push(invalid("country", "کشور نباید بیش از ۱۰۰ نویسه باشد"));
  }
  if (perfumer && perfumer.length > 150) {
    errors.push(invalid("perfumer", "عطرساز نباید بیش از ۱۵۰ نویسه باشد"));
  }
  if (printName && printName.length > PRINT_NAME_MAX) {
    errors.push(
      invalid("printName", "نام کوتاه برای چاپ نباید بیش از ۱۰۰ نویسه باشد"),
    );
  }
  if (concentration && !concentrationOptions.includes(concentration)) {
    errors.push(invalid("concentration", "غلظت معتبر نیست"));
  }

  const variants = (data.variants ?? []).map((row, index) => {
    const type = row.type;
    const volume = Number(row.volume);
    const price = Number(row.price);
    if (!variantTypes.includes(type)) {
      errors.push(invalid(`variants.${index}.type`, "نوع معتبر نیست"));
    }
    if (!inIntegerRange(volume, 1, VARIANT_VOLUME_MAX)) {
      errors.push(invalid(`variants.${index}.volume`, "حجم باید عدد صحیح مثبت و معتبر باشد"));
    }
    if (!inIntegerRange(price, 1, VARIANT_PRICE_MAX)) {
      errors.push(invalid(`variants.${index}.price`, "قیمت باید عدد صحیح مثبت و معتبر باشد"));
    }
    return { type, volume, price };
  });
  if (!variants.length) {
    errors.push(invalid("variants", "حداقل یک گونهٔ قابل فروش لازم است"));
  }
  const seenVariants = new Set();
  variants.forEach(({ type, volume }, index) => {
    if (!variantTypes.includes(type) || !Number.isInteger(volume) || volume <= 0) return;
    const key = `${type}:${volume}`;
    if (seenVariants.has(key)) {
      errors.push(invalid(`variants.${index}.volume`, "نوع و حجم تکراری است"));
    }
    seenVariants.add(key);
  });

  const genderId = Number(data.genderId);
  const temperatureId = data.temperatureId ? Number(data.temperatureId) : null;
  if (!Number.isInteger(genderId) || genderId <= 0) {
    errors.push(invalid("genderId", "انتخاب جنسیت ضروری است"));
  }
  if (temperatureId !== null && (!Number.isInteger(temperatureId) || temperatureId <= 0)) {
    errors.push(invalid("temperatureId", "دما معتبر نیست"));
  }
  const categoryIds = [genderId];
  if (temperatureId !== null) categoryIds.push(temperatureId);
  for (const [field] of categorySelections) {
    for (const rawId of data[field] ?? []) {
      const id = Number(rawId);
      if (!Number.isInteger(id) || id <= 0) {
        errors.push(invalid(field, "شناسهٔ دسته‌بندی معتبر نیست"));
      } else {
        categoryIds.push(id);
      }
    }
  }
  if (new Set(categoryIds).size !== categoryIds.length) {
    errors.push(invalid("categoryIds", "دسته‌بندی تکراری است"));
  }

  const longevity = data.performance?.longevity ?? {};
  const level = longevity.level || null;
  const minProvided = longevity.minHours !== "" && longevity.minHours != null;
  const maxProvided = longevity.maxHours !== "" && longevity.maxHours != null;
  const minHours = minProvided ? Number(longevity.minHours) : null;
  const maxHours = maxProvided ? Number(longevity.maxHours) : null;
  if (level && !longevityOptions.includes(level)) {
    errors.push(invalid("performance.longevity.level", "ماندگاری معتبر نیست"));
  }
  if ((minProvided || maxProvided) && !level) {
    errors.push(invalid("performance.longevity.level", "برای بازهٔ ساعت، سطح ماندگاری را انتخاب کنید"));
  }
  if (minProvided !== maxProvided) {
    errors.push(invalid("performance.longevity.maxHours", "هر دو کران بازهٔ ساعت لازم است"));
  }
  if (
    minProvided &&
    (!Number.isInteger(minHours) || minHours < 0 || minHours > 168)
  ) {
    errors.push(invalid("performance.longevity.minHours", "ساعت باید عدد صحیح بین ۰ و ۱۶۸ باشد"));
  }
  if (
    maxProvided &&
    (!Number.isInteger(maxHours) || maxHours < 0 || maxHours > 168 || maxHours < minHours)
  ) {
    errors.push(invalid("performance.longevity.maxHours", "بیشینهٔ ساعت معتبر نیست"));
  }
  const projection = data.performance?.projection || null;
  const sillage = data.performance?.sillage || null;
  if (projection && !projectionOptions.includes(projection)) {
    errors.push(invalid("performance.projection", "پخش بو معتبر نیست"));
  }
  if (sillage && !sillageOptions.includes(sillage)) {
    errors.push(invalid("performance.sillage", "رد بو معتبر نیست"));
  }

  const brandId = Number(data.brandId);
  if (!Number.isInteger(brandId) || brandId <= 0) {
    errors.push(invalid("brandId", "انتخاب برند ضروری است"));
  }
  if (errors.length) return { payload: null, errors };

  return {
    errors: [],
    payload: {
      enTitle: data.enTitle,
      perTitle: data.perTitle,
      description: data.description,
      notesDescription: data.notesDescription,
      releaseYear,
      country,
      concentration,
      perfumer,
      printName,
      stock,
      offValue,
      original: Boolean(data.original),
      brandId,
      categoryIds,
      images: (data.images ?? [])
        .map((image) => typeof image === "string" ? image : image?.url)
        .filter((url) => typeof url === "string" && url.trim() !== ""),
      notes: {
        top: (data.notes?.top ?? []).filter(Boolean),
        middle: (data.notes?.middle ?? []).filter(Boolean),
        base: (data.notes?.base ?? []).filter(Boolean),
      },
      variants,
      ...(originalVariants !== undefined ? {
        expectedVariants: originalVariants.map(({ type, volume, price }) => ({
          type, volume: Number(volume), price: Number(price),
        })),
      } : {}),
      performance: {
        longevity: level
          ? {
              level,
              ...(minProvided && maxProvided ? { minHours, maxHours } : {}),
            }
          : null,
        projection,
        sillage,
      },
    },
  };
}
