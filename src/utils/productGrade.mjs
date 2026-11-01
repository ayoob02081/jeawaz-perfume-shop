// Product grade: the canonical wire values of the backend ProductGrade enum
// (Product.grade, admin ProductForm, the GET /products `grades` filter) and
// their Persian display labels. This is the only frontend copy of both.
// «سفارش اروپا» is the former name of SUPER_MASTER; «سوپر مستر» is canonical.

export const PRODUCT_GRADES = ["ORIGINAL", "SUPER_MASTER"];

export const GRADE_LABELS = {
  ORIGINAL: "اورجینال",
  SUPER_MASTER: "سوپر مستر",
};

export const isProductGrade = (value) => PRODUCT_GRADES.includes(value);

// An unknown or missing grade has no label (never guessed as a known grade).
export const gradeLabel = (value) => GRADE_LABELS[value] ?? "";

// Known grades only, deduplicated, in canonical order (filters, URL, queries).
export const normalizeGrades = (values = []) =>
  PRODUCT_GRADES.filter((grade) =>
    (Array.isArray(values) ? values : [values]).includes(grade),
  );

// A legacy `original` filter value as grades: true = ORIGINAL, false = every
// non-original grade; anything else = no grade filter.
export const gradesFromLegacyOriginal = (value) =>
  value === true || value === "true"
    ? ["ORIGINAL"]
    : value === false || value === "false"
      ? PRODUCT_GRADES.filter((grade) => grade !== "ORIGINAL")
      : [];

// The grade of a Product response. Transitional fallback for a payload that
// predates `grade`: the deprecated boolean `original` (true = ORIGINAL,
// false = SUPER_MASTER). Anything else is unknown (null).
export const productGrade = (product) => {
  if (isProductGrade(product?.grade)) return product.grade;
  if (product?.original === true) return "ORIGINAL";
  if (product?.original === false) return "SUPER_MASTER";
  return null;
};
