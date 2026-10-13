// POST /orders body built by the checkout form.
//
// The carrier is the cart's own `shippingMethod`: the server state that the
// shipping radios display and that PATCH /cart/shipping-method updates. It is
// never derived from the shipping cost, because several carriers cost the
// same (tipax, chapar and barbari are all free).

export const DEFAULT_SHIPPING_METHOD = "tipax";

export function checkoutShippingMethod(cart) {
  return cart?.shippingMethod || DEFAULT_SHIPPING_METHOD;
}

// `useSavedAddress`: the form still shows the selected saved address
// unchanged, so the order refers to it by id; otherwise the typed receiver
// details are sent. `customer` (checkoutBuyerContract.buyerNamePayload) adds
// the buyer's name, independent of the receiver; null sends nothing new.
export function buildCheckoutOrderPayload({
  useSavedAddress,
  addressId,
  form,
  shippingMethod,
  customer = null,
}) {
  if (useSavedAddress) return { addressId, shippingMethod, ...customer };

  return {
    receiverName: form.fullName,
    receiverPhone: form.phoneNumber,
    ostan: form.ostan,
    shahr: form.shahr,
    fullAddress: form.addressLine,
    postalCode: form.postalCode,
    shippingMethod,
    ...customer,
  };
}
