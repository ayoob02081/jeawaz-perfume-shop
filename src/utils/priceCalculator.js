// src/utils/priceCalculator.js

export function normalizePrice(price) {
  return Math.floor(Math.round(price) / 1000) * 1000;
}

export function calculateDiscountedPrice(basePrice, discountPercent) {
  if (basePrice <= 0) {
    return 0;
  }

  const safeDiscount = Math.min(Math.max(Number(discountPercent) || 0, 0), 100);

  if (safeDiscount === 0) {
    return normalizePrice(basePrice);
  }

  const discounted = basePrice - (basePrice * safeDiscount) / 100;

  return normalizePrice(discounted);
}

export function getVariantsByType(product, type) {
  return (Array.isArray(product?.variants) ? product.variants : [])
    .filter(
      (variant) =>
        variant?.type === type &&
        Number.isInteger(Number(variant.volume)) &&
        Number(variant.volume) > 0 &&
        Number(variant.price) > 0,
    )
    .sort(
      (a, b) =>
        Number(a.volume) - Number(b.volume) ||
        (Number(a.id) - Number(b.id) || 0),
    );
}

export function getMatchingVariant(product, type, volume) {
  return (
    getVariantsByType(product, type).find(
      (variant) => Number(variant.volume) === Number(volume),
    ) ?? null
  );
}

export function calculateProductPrice(product, mode, volume) {
  const variant = getMatchingVariant(product, mode, volume);
  return calculateVariantPrice(product, variant);
}

export function calculateVariantPrice(product, variant) {
  if (!variant) {
    return {
      basePrice: 0,
      finalPrice: 0,
      offValue: 0,
    };
  }

  const basePrice = Number(variant.price);

  const campaignDiscount = Number(product?.campaign?.[variant.type]?.discountPercent ?? 0);

  const productDiscount = Number(product?.offValue ?? 0);

  // Campaign has priority over normal product discount
  const offValue = campaignDiscount > 0 ? campaignDiscount : productDiscount;

  const normalizedBasePrice = normalizePrice(basePrice);

  const finalPrice =
    offValue > 0
      ? calculateDiscountedPrice(normalizedBasePrice, offValue)
      : normalizedBasePrice;

  return {
    basePrice: normalizedBasePrice,
    finalPrice,
    offValue,
  };
}
