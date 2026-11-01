// Item rows of SingleOrderPage. Both order responses carry the purchased
// variant type from the OrderItem snapshot (purchaseMode: "sealed" | "decant",
// null for items ordered before the snapshot existed), under different keys:
//   admin    GET /orders/admin/:id  items[].mode
//   customer GET /orders/:id        items[].variantType
export function getOrderItemType(item, { admin = false } = {}) {
  return (admin ? item?.mode : item?.variantType) ?? null;
}
