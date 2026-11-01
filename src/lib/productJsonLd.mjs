import { productUrl, SITE_ORIGIN } from "./seo.mjs";
import {
  getDefaultPurchaseVolume,
  getPreferredPurchaseMode,
} from "../utils/productAvailability.mjs";
import {
  calculateVariantPrice,
  getMatchingVariant,
  getVariantLabel,
} from "../utils/priceCalculator.js";
import { gradeLabel, productGrade } from "../utils/productGrade.mjs";
import { resolveImageSrc } from "../utils/appImageSource.mjs";

const text = (value) => typeof value === "string" ? value.trim() : "";
const positiveInteger = (value) => Number.isSafeInteger(value) && value > 0;

function imageUrl(value, apiUrl) {
  const source = text(value);
  if (!source || (source.startsWith("/uploads") && !text(apiUrl))) return null;
  const resolved = resolveImageSrc(source, apiUrl);
  if (!resolved) return null;
  try {
    // AppImage accepts absolute URLs and root-relative public assets.
    if (!resolved.startsWith("/") && !/^https?:\/\//i.test(resolved)) return null;
    const url = new URL(resolved, SITE_ORIGIN);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password
      ? url.href : null;
  } catch {
    return null;
  }
}

// Same snapshot and default selection as SingleProductPage. Never choose another
// offer just because the displayed default lacks authoritative availability.
export function buildProductJsonLd(product, apiUrl) {
  if (!text(product?.perTitle)) return null;
  let url;
  try {
    url = productUrl(product.id);
  } catch {
    return null;
  }
  const mode = getPreferredPurchaseMode(product);
  const volume = getDefaultPurchaseVolume(product, mode);
  const variant = getMatchingVariant(product, mode, volume);
  const validVolume = positiveInteger(volume);
  const label = variant && validVolume ? getVariantLabel(variant) : null;
  const grade = productGrade(product);
  const gradeText = gradeLabel(grade);
  const name = [text(product.perTitle), label, grade === "SUPER_MASTER" ? gradeText : null]
    .filter(Boolean).join(" — ");
  const images = [...new Set((Array.isArray(product.images) ? product.images : [])
    .map((image) => imageUrl(image, apiUrl)).filter(Boolean))];
  const description = text(product.description);
  // A catalog brand association on a non-original/unknown-grade item is not
  // proof of manufacture by that brand. Keep the visible grade, omit that claim.
  const brandName = grade === "ORIGINAL"
    ? text(product.brand?.title) || text(product.brand?.value) : "";
  const result = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    url,
    ...(description ? { description } : {}),
    ...(images.length ? { image: images } : {}),
    ...(brandName ? { brand: { "@type": "Brand", name: brandName } } : {}),
    ...(label ? { size: `${volume} ml` } : {}),
    ...(gradeText ? { additionalProperty: [{
      "@type": "PropertyValue", name: "کیفیت", value: gradeText,
    }] } : {}),
  };
  if (variant?.isPurchasable !== true || !validVolume ||
      !positiveInteger(Number(variant.price))) return result;
  const { finalPrice } = calculateVariantPrice(product, variant);
  const priceIrr = finalPrice * 10;
  if (!positiveInteger(finalPrice) || !positiveInteger(priceIrr)) return result;
  result.offers = {
    "@type": "Offer",
    name: label,
    url,
    price: priceIrr,
    priceCurrency: "IRR",
    availability: "https://schema.org/InStock",
  };
  return result;
}

// JSON.stringify alone does not stop </script> from escaping a script element.
export function serializeProductJsonLd(value) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => ({
    "<": "\\u003c", ">": "\\u003e", "&": "\\u0026",
    "\u2028": "\\u2028", "\u2029": "\\u2029",
  })[character]);
}
