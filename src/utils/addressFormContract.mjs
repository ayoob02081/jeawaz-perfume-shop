// Profile address form contract (POST /addresses, PATCH /addresses/:id —
// CreateAddressDto / its PartialType). The global ValidationPipe rejects
// unknown keys, so the payload carries exactly these fields plus isDefault.

export const ADDRESS_FIELDS = [
  "label",
  "fullName",
  "phoneNumber",
  "ostan",
  "shahr",
  "postalCode",
  "addressLine",
];

export function addressToFormValues(address) {
  return Object.fromEntries(
    ADDRESS_FIELDS.map((field) => [field, address?.[field] ?? ""]),
  );
}

export function buildAddressPayload(values, isDefault) {
  return {
    ...Object.fromEntries(
      ADDRESS_FIELDS.map((field) => [field, values?.[field] ?? ""]),
    ),
    isDefault: Boolean(isDefault),
  };
}

// Only an address loaded from the API with a real id may be edited; a missing
// or failed load must never become PATCH /addresses/undefined.
export function isEditableAddress(address) {
  return Number.isSafeInteger(address?.id) && address.id > 0;
}

// Identity of the authoritative address the edit form was built from. The
// edit page keys the form by it, so the form (values and isDefault) is rebuilt
// only when the server data actually changes: stale cached data corrected by
// a refetch, or another address. Re-renders and refetches returning the same
// data keep the key, so they never discard what the user is typing.
export function getAddressFormKey(address) {
  return JSON.stringify([
    address?.id ?? null,
    ...ADDRESS_FIELDS.map((field) => address?.[field] ?? ""),
    Boolean(address?.isDefault),
  ]);
}

// Clears the city when the USER picks another province: the old city belongs
// to the previous province. Registered as the province field's RHF onChange,
// which runs only for input events — never for defaultValues or reset().
export function createProvinceChangeHandler(setValue) {
  return () => setValue("shahr", "", { shouldDirty: true });
}

// Never rejects: the mutation hooks already toast API errors, so a failure
// only has to keep the form open and usable.
export async function submitAddressForm({
  addressToEdit,
  values,
  isDefault,
  createAddress,
  editAddress,
}) {
  const payload = buildAddressPayload(values, isDefault);

  if (!addressToEdit) {
    try {
      return { ok: true, mode: "create", data: await createAddress(payload) };
    } catch (error) {
      return { ok: false, mode: "create", error };
    }
  }

  if (!isEditableAddress(addressToEdit)) {
    return { ok: false, mode: "edit", error: new Error("Invalid address id") };
  }

  try {
    return {
      ok: true,
      mode: "edit",
      data: await editAddress({ addressId: addressToEdit.id, data: payload }),
    };
  } catch (error) {
    return { ok: false, mode: "edit", error };
  }
}
