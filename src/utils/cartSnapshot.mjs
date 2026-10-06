// Checkout-relevant view of a GET /cart response, taken before an in-place
// login and compared with the cart the server returns after it. The backend
// merge may add the account's earlier lines, merge duplicates, clamp or skip
// guest lines (sellable stock), and prices are recomputed on every read, so a
// successful login says nothing about whether the cart is unchanged.
//
// Shipping is left out on purpose: the carrier is chosen on the checkout step
// itself, and a guest cart and an account cart may simply hold different
// defaults. Totals are compared without the shipping cost for the same
// reason.

const numberOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const compareValues = (left, right) => {
  if (left === right) return 0;
  if (left === null) return -1;
  if (right === null) return 1;
  return left < right ? -1 : 1;
};

const LINE_ORDER = ["productId", "mode", "volume", "quantity", "unitPrice", "lineTotal"];

function snapshotLine(item) {
  return {
    productId: numberOrNull(item?.product?.id ?? item?.productId),
    mode: item?.mode ?? null,
    volume: numberOrNull(item?.volume),
    quantity: numberOrNull(item?.quantity),
    unitPrice: numberOrNull(item?.unitPrice),
    lineTotal: numberOrNull(item?.lineTotal),
  };
}

export function cartSnapshot(cart) {
  if (!cart) return null;

  const lines = (Array.isArray(cart.items) ? cart.items : [])
    .map(snapshotLine)
    .sort((left, right) => {
      for (const field of LINE_ORDER) {
        const order = compareValues(left[field], right[field]);
        if (order) return order;
      }
      return 0;
    });
  const payable = numberOrNull(cart.payableTotal);
  const shipping = numberOrNull(cart.shippingCost) ?? 0;

  return {
    lines,
    totalProducts: numberOrNull(cart.totalProducts),
    itemsTotal: numberOrNull(cart.itemsTotal),
    totalPriceBeforeDiscount: numberOrNull(cart.totalPriceBeforeDiscount),
    discountAmount: numberOrNull(cart.discountAmount),
    coupon: cart.coupon
      ? {
          code: cart.coupon.code ?? null,
          discount: numberOrNull(cart.coupon.discount),
        }
      : null,
    payableWithoutShipping: payable === null ? null : payable - shipping,
  };
}

// True when the two snapshots differ in anything the shopper would pay for.
// A missing side (no cart before, or the fresh cart could not be loaded)
// counts as changed, so the shopper reviews instead of continuing blind.
export function cartSnapshotsDiffer(before, after) {
  if (!before && !after) return false;
  if (!before || !after) return true;
  return JSON.stringify(before) !== JSON.stringify(after);
}
