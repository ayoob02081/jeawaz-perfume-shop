import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createFormControl } from "react-hook-form";
import {
  ADDRESS_FIELDS,
  addressToFormValues,
  buildAddressPayload,
  createProvinceChangeHandler,
  getAddressFormKey,
  isEditableAddress,
  submitAddressForm,
} from "./addressFormContract.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const formLayoutSource = read(
  "../app/(profile)/profile/_components/AddressFormLayout.jsx",
);
const editPageSource = read(
  "../app/(profile)/profile/me/address/edit/[id]/page.jsx",
);
const addressFormSource = read("../components/AddressForm.jsx");
const cartLayoutSource = read("../app/(user)/cart/_components/CartLayout.jsx");
const useAddressSource = read("../hooks/useAddress.js");

const address = {
  id: 5,
  label: "خانه",
  fullName: "رضا کریمی",
  phoneNumber: "09121234567",
  ostan: "تهران",
  shahr: "تهران",
  postalCode: "1234567890",
  addressLine: "خیابان ولیعصر، پلاک ۱۵",
  isDefault: true,
};

const formValues = {
  label: "خانه",
  fullName: "رضا کریمی",
  phoneNumber: "09121234567",
  ostan: "تهران",
  shahr: "تهران",
  postalCode: "1234567890",
  addressLine: "خیابان ولیعصر، پلاک ۱۵",
};

// --- hydration --------------------------------------------------------------

test("a fetched address maps into exactly the form fields", () => {
  assert.deepEqual(addressToFormValues({ ...address, user: { id: 1 } }), formValues);
  assert.deepEqual(
    addressToFormValues(undefined),
    Object.fromEntries(ADDRESS_FIELDS.map((field) => [field, ""])),
  );
  assert.equal(addressToFormValues({ ...address, label: null }).label, "");
});

test("the form key changes exactly when the authoritative address changes", () => {
  const stale = { ...address, isDefault: true };
  const fresh = { ...address, isDefault: false };

  assert.notEqual(getAddressFormKey(stale), getAddressFormKey(fresh));
  assert.notEqual(
    getAddressFormKey(address),
    getAddressFormKey({ ...address, shahr: "ری" }),
  );
  assert.notEqual(
    getAddressFormKey(address),
    getAddressFormKey({ ...address, id: 6 }),
  );
  // Same data in a new object (refetch, re-render): same key, no reset.
  assert.equal(getAddressFormKey(address), getAddressFormKey({ ...address }));
});

test("a refreshed address replaces stale cached values in the edit form", () => {
  const stale = { ...address, fullName: "نام قدیمی", isDefault: true };
  const fresh = { ...address, isDefault: false };

  // The edit page keys the form by the authoritative data, so a fresh
  // response mounts a new form built from it.
  assert.match(editPageSource, /key=\{getAddressFormKey\(address\)\}/);
  assert.match(formLayoutSource, /defaultValues: addressToFormValues\(addressToEdit\)/);
  assert.match(formLayoutSource, /useState\(!!addressToEdit\?\.isDefault\)/);

  const staleForm = createFormControl({ defaultValues: addressToFormValues(stale) });
  const freshForm = createFormControl({ defaultValues: addressToFormValues(fresh) });
  assert.equal(staleForm.getValues("fullName"), "نام قدیمی");
  assert.deepEqual(freshForm.getValues(), formValues);
  assert.notEqual(getAddressFormKey(stale), getAddressFormKey(fresh));
});

// --- province / city --------------------------------------------------------

const createAddressForm = (values) => {
  const form = createFormControl({ defaultValues: values });
  const ostan = form.register("ostan", {
    required: "استان الزامی است",
    onChange: createProvinceChangeHandler(form.setValue),
  });
  form.register("shahr", { required: "شهر الزامی است" });
  return { form, ostan };
};

test("initial edit hydration and reset keep the saved city", () => {
  const { form } = createAddressForm(formValues);
  assert.equal(form.getValues("shahr"), "تهران");

  form.reset({ ...formValues, ostan: "فارس", shahr: "شیراز" });
  assert.equal(form.getValues("ostan"), "فارس");
  assert.equal(form.getValues("shahr"), "شیراز");
});

test("a user province change clears the city", async () => {
  const { form, ostan } = createAddressForm(formValues);

  await ostan.onChange({
    type: "change",
    target: { name: "ostan", value: "فارس" },
  });

  assert.equal(form.getValues("ostan"), "فارس");
  assert.equal(form.getValues("shahr"), "");
});

test("the city clear is wired only into the profile address form", () => {
  assert.match(
    formLayoutSource,
    /onProvinceChange=\{createProvinceChangeHandler\(setValue\)\}/,
  );
  assert.match(
    addressFormSource,
    /onProvinceChange \? \{ onChange: onProvinceChange \} : \{\}/,
  );
  // Checkout keeps its existing AddressForm behavior.
  assert.doesNotMatch(cartLayoutSource, /onProvinceChange/);
});

// --- failed load / id safety ------------------------------------------------

test("only a loaded address with a real id is editable", () => {
  assert.equal(isEditableAddress(address), true);
  for (const value of [
    undefined,
    null,
    {},
    { id: undefined },
    { id: "5" },
    { id: 0 },
    { id: -1 },
    { id: Number.NaN },
    { id: 1.5 },
  ]) {
    assert.equal(isEditableAddress(value), false, JSON.stringify(value));
  }
});

test("a failed address load renders the error state, never an edit form", () => {
  assert.doesNotMatch(editPageSource, /data \|\| \{\}/);
  assert.match(editPageSource, /if \(!isEditableAddress\(address\)\) return <Error \/>;/);
});

test("an edit submission without a real id never issues PATCH /addresses/undefined", async () => {
  const calls = [];
  const editAddress = async (input) => calls.push(input);
  const createAddress = async (input) => calls.push(input);

  for (const addressToEdit of [{}, { id: undefined }, { id: "undefined" }]) {
    const result = await submitAddressForm({
      addressToEdit,
      values: formValues,
      isDefault: false,
      createAddress,
      editAddress,
    });
    assert.equal(result.ok, false);
  }
  assert.deepEqual(calls, []);
});

// --- submit / errors / pending ----------------------------------------------

test("create and edit send the whitelisted DTO payload", async () => {
  const created = [];
  const edited = [];

  const createResult = await submitAddressForm({
    addressToEdit: undefined,
    values: { ...formValues, id: 99, isDefault: true, extra: "x" },
    isDefault: false,
    createAddress: async (payload) => (created.push(payload), { id: 7 }),
    editAddress: async () => assert.fail("create must not edit"),
  });
  assert.deepEqual(createResult, { ok: true, mode: "create", data: { id: 7 } });
  assert.deepEqual(created, [{ ...formValues, isDefault: false }]);

  const editResult = await submitAddressForm({
    addressToEdit: address,
    values: formValues,
    isDefault: true,
    createAddress: async () => assert.fail("edit must not create"),
    editAddress: async (input) => (edited.push(input), address),
  });
  assert.equal(editResult.ok, true);
  assert.deepEqual(edited, [
    { addressId: 5, data: { ...formValues, isDefault: true } },
  ]);
  assert.deepEqual(Object.keys(buildAddressPayload(formValues, 1)), [
    ...ADDRESS_FIELDS,
    "isDefault",
  ]);
});

test("create and edit failures resolve without an unhandled rejection", async () => {
  const unhandled = [];
  const onUnhandled = (reason) => unhandled.push(reason);
  process.on("unhandledRejection", onUnhandled);

  try {
    const failure = Object.assign(new Error("Request failed"), {
      response: { status: 400, data: { message: "خطا" } },
    });
    const reject = async () => {
      throw failure;
    };

    const created = await submitAddressForm({
      values: formValues,
      isDefault: false,
      createAddress: reject,
      editAddress: reject,
    });
    const edited = await submitAddressForm({
      addressToEdit: address,
      values: formValues,
      isDefault: false,
      createAddress: reject,
      editAddress: reject,
    });

    assert.deepEqual([created.ok, created.error], [false, failure]);
    assert.deepEqual([edited.ok, edited.error], [false, failure]);
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(unhandled, []);
  } finally {
    process.off("unhandledRejection", onUnhandled);
  }

  // Navigation happens only on success; the hooks own the error toasts.
  assert.match(formLayoutSource, /if \(result\.ok\) router\.back\(\);/);
});

test("pending state names match the mutation hook outputs", () => {
  assert.match(useAddressSource, /return \{ isCreating, createAddress \};/);
  assert.match(useAddressSource, /return \{ isUpdating, editAddress \};/);
  assert.match(formLayoutSource, /const \{ createAddress, isCreating \} = useCreateAddress\(\);/);
  assert.match(formLayoutSource, /const \{ editAddress, isUpdating \} = useEditAddress\(\);/);
  assert.match(
    formLayoutSource,
    /const isPending = isSubmitting \|\| isCreating \|\| isUpdating;/,
  );
  assert.match(formLayoutSource, /disabled=\{isPending\}/);
  assert.doesNotMatch(formLayoutSource, /isAdding|isEditing/);
});
