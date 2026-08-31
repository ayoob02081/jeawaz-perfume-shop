export function getDiscountPercent(basePrice, finalPrice) {
  const base = Number(basePrice) || 0;
  const final = Number(finalPrice) || 0;

  if (base <= 0 || final <= 0 || final >= base) {
    return 0;
  }

  return Math.round(((base - final) / base) * 100);
}
