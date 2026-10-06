// POST /orders body (checkout/auth Phase 2B, audit T5): the carrier sent is
// the one the shipping radios show (the cart's own shippingMethod), never one
// inferred from the shipping cost. Before, a local copy only re-synced when
// the cost changed, so tipax → chapar (both free) still ordered tipax.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  DEFAULT_SHIPPING_METHOD,
  buildCheckoutOrderPayload,
  checkoutShippingMethod,
} from "./checkoutOrderPayload.mjs";

const read = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const form = {
  fullName: "علی رضایی",
  phoneNumber: "09121234567",
  ostan: "تهران",
  shahr: "تهران",
  addressLine: "خیابان آزادی، پلاک ۱۰",
  postalCode: "1234567890",
};

// The cart as GET /cart returns it after PATCH /cart/shipping-method.
const cartWith = (shippingMethod, shippingCost) => ({ shippingMethod, shippingCost });

const orderFor = (cart, useSavedAddress = false) =>
  buildCheckoutOrderPayload({
    useSavedAddress,
    addressId: 5,
    form,
    shippingMethod: checkoutShippingMethod(cart),
  });

test("tipax → chapar at the same (free) cost orders chapar", () => {
  assert.equal(orderFor(cartWith("tipax", 0)).shippingMethod, "tipax");
  assert.equal(orderFor(cartWith("chapar", 0)).shippingMethod, "chapar");
});

test("chapar → barbari at the same cost orders barbari", () => {
  assert.equal(orderFor(cartWith("barbari", 0)).shippingMethod, "barbari");
});

test("a carrier with another cost (post) is sent as itself; the cost never decides the carrier", () => {
  assert.equal(orderFor(cartWith("post", 150_000)).shippingMethod, "post");
  assert.equal(orderFor(cartWith("tipax", 150_000)).shippingMethod, "tipax");
});

test("a cart without a carrier falls back to the backend default", () => {
  assert.equal(DEFAULT_SHIPPING_METHOD, "tipax");
  assert.equal(checkoutShippingMethod({}), "tipax");
  assert.equal(checkoutShippingMethod(undefined), "tipax");
});

test("a saved address unchanged in the form is ordered by id", () => {
  assert.deepEqual(orderFor(cartWith("chapar", 0), true), {
    addressId: 5,
    shippingMethod: "chapar",
  });
});

test("typed receiver details are sent field by field", () => {
  assert.deepEqual(orderFor(cartWith("barbari", 0)), {
    receiverName: form.fullName,
    receiverPhone: form.phoneNumber,
    ostan: form.ostan,
    shahr: form.shahr,
    fullAddress: form.addressLine,
    postalCode: form.postalCode,
    shippingMethod: "barbari",
  });
});

test("CartLayout sends the cart's carrier and no longer keeps a cost-synced copy", () => {
  const layout = read("../app/(user)/cart/_components/CartLayout.jsx");
  assert.match(layout, /shippingMethod: checkoutShippingMethod\(cart\),/);
  assert.doesNotMatch(layout, /useState\("tipax"\)/);
  assert.doesNotMatch(layout, /setShippingMethod/);
  assert.doesNotMatch(layout, /\[cart\?\.shippingCost\]/);
  // The radios show the same server value the order sends.
  assert.match(layout, /const \{ shippingMethod \} = cart;[\s\S]*?checked=\{shippingMethod === value\}/);
});

// --- address query gating ----------------------------------------------------

test("checkout requests the account's addresses only when signed in and on step 2", () => {
  const layout = read("../app/(user)/cart/_components/CartLayout.jsx");
  const hooks = read("../hooks/useAddress.js");
  assert.match(
    layout,
    /useGetAddresses\(\{\s*enabled: isAuthenticated && step === 2,\s*\}\)/,
  );
  assert.match(
    hooks,
    /export const useGetAddresses = \(\{ enabled = true \} = \{\}\) =>\s*useQuery\(\{\s*queryKey: \["addresses"\],\s*queryFn: getAllAddressesApi,\s*enabled,/,
  );
  // The profile address book keeps fetching as before.
  assert.match(
    read("../app/(profile)/profile/_components/AddressLayout.jsx"),
    /useGetAddresses\(\)/,
  );
});
