// Product concentration: the canonical wire values of the backend
// ProductConcentration enum (Product.concentration, admin ProductForm, the
// GET /products `concentrations` filter) and their Persian display labels.
// This is the only frontend copy of both.

export const PRODUCT_CONCENTRATIONS = [
  "PARFUM",
  "EXTRAIT_DE_PARFUM",
  "EAU_DE_PARFUM",
  "EAU_DE_TOILETTE",
  "EAU_DE_COLOGNE",
  "PERFUME_OIL",
  "BODY_MIST",
  "OTHER",
];

export const CONCENTRATION_LABELS = {
  PARFUM: "پارفوم",
  EXTRAIT_DE_PARFUM: "اکستریت د پارفوم",
  EAU_DE_PARFUM: "ادو پرفیوم",
  EAU_DE_TOILETTE: "ادو تویلت",
  EAU_DE_COLOGNE: "ادو کلن",
  PERFUME_OIL: "روغن عطر",
  BODY_MIST: "بادی میست",
  OTHER: "سایر",
};

export const isProductConcentration = (value) =>
  PRODUCT_CONCENTRATIONS.includes(value);

export const concentrationLabel = (value) =>
  CONCENTRATION_LABELS[value] ?? value;
