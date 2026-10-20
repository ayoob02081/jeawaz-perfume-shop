import { toPersianNumbers } from "./toPersianNumbers.js";

// Image alt text from the product's own names. A missing name never becomes
// "undefined"; a missing product still gets a neutral label.
const clean = (value) => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const persianName = (product) => clean(product?.perTitle) || clean(product?.enTitle);

// The Persian name with the English one when it adds something.
function fullName(product) {
  const persian = clean(product?.perTitle);
  const latin = clean(product?.enTitle);
  return persian && /[a-z]/i.test(latin) && latin.toLowerCase() !== persian.toLowerCase()
    ? `${persian} (${latin})` : persian || latin;
}
const position = (index) =>
  toPersianNumbers(Number.isSafeInteger(index) && index >= 0 ? index + 1 : 1);

// Product card: the image links to the product, so it names the product.
export function productCardImageAlt(product) {
  const name = persianName(product);
  return name ? `تصویر ${name}` : "تصویر محصول";
}

// Gallery slide and its full-screen view.
export function productGalleryImageAlt(product, index) {
  const name = fullName(product);
  return name ? `${name} - تصویر ${position(index)}` : `تصویر ${position(index)} محصول`;
}

// A thumbnail is the only content of its button: what pressing it shows.
export function productThumbnailAlt(product, index) {
  const name = persianName(product);
  return name ? `نمایش تصویر ${position(index)} از ${name}` : `نمایش تصویر ${position(index)}`;
}

// Brand logo: the brand's own name, or empty (decorative) when unknown.
export function brandLogoAlt(brand) {
  const name = clean(brand?.title);
  return name ? `لوگوی ${name}` : "";
}
