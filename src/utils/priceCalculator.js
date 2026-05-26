export function normalizePrice(price) {
  return Math.floor(Math.round(price) / 1000) * 1000;
}

export function calculateProductPrice(product, mode, volume) {
  if (!product || !volume || volume <= 0) {
    return {
      basePrice: 0,
      finalPrice: 0,
      offValue: 0,
    };
  }

  let basePrice = 0;

  // ✅ 1. اگر variant مستقیم داشته باشیم
  const variant = product?.variants?.find(
    (v) => v.type === mode && v.volume === volume,
  );

  if (variant?.price) {
    basePrice = variant.price;
  }

  // ✅ 2. اگر دکانت باشد
  else if (mode === "decant" && product?.modes?.decant?.pricePerMl) {
    basePrice = product.modes.decant.pricePerMl * volume;
  }

  // ✅ 3. اگر sealed باشد
  else if (mode === "sealed") {
    const sealedVariant = product?.modes?.sealed?.variants?.find(
      (v) => v.volume === volume,
    );

    if (sealedVariant?.price) {
      basePrice = sealedVariant.price;
    }
  }

  // ✅ اگر هیچ قیمتی پیدا نشد
  if (!basePrice) {
    return {
      basePrice: 0,
      finalPrice: 0,
      offValue: product?.offValue || 0,
    };
  }

  const offValue = product?.offValue || 0;

  const finalPrice =
    offValue > 0
      ? basePrice - (basePrice * offValue) / 100
      : basePrice;

  return {
    basePrice: normalizePrice(basePrice),
    finalPrice: normalizePrice(finalPrice),
    offValue,
  };
}
