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

export function calculateProductPrice(product, mode, volume) {
  if (!product || !volume || volume <= 0) {
    return {
      basePrice: 0,
      finalPrice: 0,
      offValue: 0,
    };
  }

  // --------------------------------------------------
  // BASE PRICE
  // --------------------------------------------------

  let basePrice = 0;

  // 1. Variant مستقیم
  const variant = product?.variants?.find(
    (v) => v.type === mode && Number(v.volume) === Number(volume),
  );

  if (variant?.price > 0) {
    basePrice = Number(variant.price);
  }

  // 2. Decant
  else if (mode === "decant" && product?.modes?.decant?.pricePerMl > 0) {
    basePrice = Number(product.modes.decant.pricePerMl) * Number(volume);
  }

  // 3. Sealed
  else if (mode === "sealed") {
    const sealedVariant = product?.modes?.sealed?.variants?.find(
      (v) => Number(v.volume) === Number(volume),
    );

    if (sealedVariant?.price > 0) {
      basePrice = Number(sealedVariant.price);
    }
  }

  if (basePrice <= 0) {
    return {
      basePrice: 0,
      finalPrice: 0,
      offValue: 0,
    };
  }

  // --------------------------------------------------
  // DISCOUNT
  // --------------------------------------------------

  const campaignDiscount =
    mode === "decant"
      ? Number(product?.campaign?.decant?.discountPercent ?? 0)
      : Number(product?.campaign?.sealed?.discountPercent ?? 0);

  const productDiscount = Number(product?.offValue ?? 0);

  // Campaign has priority over normal product discount
  const offValue = campaignDiscount > 0 ? campaignDiscount : productDiscount;

  // --------------------------------------------------
  // FINAL PRICE
  // --------------------------------------------------

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
