// No profile dialog after OTP login; checkout asks a nameless buyer for their
// name and sends it with POST /orders (customerFirstName/customerLastName).
// The receiver stays a separate person: defaults only fill empty fields.

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  BUYER_FIRST_NAME,
  BUYER_LAST_NAME,
  accountPhoneForForm,
  buyerFullName,
  buyerNamePayload,
  hasAccountName,
  isValidBuyerNamePart,
  knownBuyerNameParts,
  needsBuyerName,
  receiverDefaultsToApply,
  receiverDefaultsToClear,
  withoutBuyerFields,
} from "./checkoutBuyerContract.mjs";
import { buildCheckoutOrderPayload } from "./checkoutOrderPayload.mjs";

const read = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const section = (source, start, end) => {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `missing ${start}`);
  const to = source.indexOf(end, from);
  return source.slice(from, to === -1 ? undefined : to);
};

const nameless = { id: 7, firstName: null, lastName: null, phoneNumber: "989121234567" };
const named = { id: 8, firstName: "علی", lastName: "رضایی", phoneNumber: "989121234567" };

// --- who is asked ----------------------------------------------------------

test("only a signed-in user without a complete name is asked for the buyer name", () => {
  assert.equal(needsBuyerName({ isAuthenticated: true, user: nameless }), true);
  assert.equal(
    needsBuyerName({ isAuthenticated: true, user: { ...nameless, firstName: "  ", lastName: "" } }),
    true,
  );
  // A partial name is incomplete: asked, and the backend still never overwrites it.
  assert.equal(needsBuyerName({ isAuthenticated: true, user: { ...named, lastName: null } }), true);
  assert.equal(needsBuyerName({ isAuthenticated: true, user: named }), false);
  assert.equal(needsBuyerName({ isAuthenticated: false, user: null }), false);
  assert.equal(needsBuyerName({ isAuthenticated: true, user: null }), false);
  assert.equal(hasAccountName(named), true);
  assert.equal(hasAccountName(nameless), false);
});

test("a partly named account shows its present part, so only the missing one is typed", () => {
  assert.deepEqual(knownBuyerNameParts({ ...named, lastName: null }), {
    [BUYER_FIRST_NAME]: "علی",
  });
  assert.deepEqual(knownBuyerNameParts({ ...named, firstName: "  " }), {
    [BUYER_LAST_NAME]: "رضایی",
  });
  assert.deepEqual(knownBuyerNameParts(nameless), {});
  assert.deepEqual(knownBuyerNameParts(null), {});
  // A part the backend would reject as a buyer name stays editable.
  assert.deepEqual(knownBuyerNameParts({ ...nameless, firstName: "Ali" }), {});
});

test("buyer name parts are validated trimmed, as the backend does", () => {
  assert.equal(isValidBuyerNamePart(" علی "), true);
  assert.equal(isValidBuyerNamePart(" ع"), false);
  assert.equal(isValidBuyerNamePart("ع".repeat(51)), false);
  assert.equal(isValidBuyerNamePart("Ali"), false);
  assert.equal(isValidBuyerNamePart(null), false);
});

// --- receiver defaults -----------------------------------------------------

test("the account phone is offered as 09XXXXXXXXX", () => {
  assert.equal(accountPhoneForForm("989121234567"), "09121234567");
  assert.equal(accountPhoneForForm("+989121234567"), "09121234567");
  assert.equal(accountPhoneForForm("09121234567"), "09121234567");
  assert.equal(accountPhoneForForm(""), "");
  assert.equal(accountPhoneForForm(undefined), "");
  assert.equal(accountPhoneForForm("12345"), "");
});

test("an empty receiver follows the buyer name and gets the account phone", () => {
  const desired = { fullName: buyerFullName(" علی ", "رضایی "), phoneNumber: "09121234567" };
  assert.equal(desired.fullName, "علی رضایی");
  assert.deepEqual(
    receiverDefaultsToApply({ current: { fullName: "", phoneNumber: "" }, applied: null, desired }),
    { fullName: "علی رضایی", phoneNumber: "09121234567" },
  );
});

test("a defaulted receiver name keeps following the buyer name as it is typed", () => {
  assert.deepEqual(
    receiverDefaultsToApply({
      current: { fullName: "علی رض", phoneNumber: "09121234567" },
      applied: { fullName: "علی رض", phoneNumber: "09121234567" },
      desired: { fullName: "علی رضایی", phoneNumber: "09121234567" },
    }),
    { fullName: "علی رضایی" },
  );
});

test("a typed receiver (another person) is never overwritten", () => {
  assert.deepEqual(
    receiverDefaultsToApply({
      current: { fullName: "مریم احمدی", phoneNumber: "09351234567" },
      applied: { fullName: "علی", phoneNumber: "09121234567" },
      desired: { fullName: "علی رضایی", phoneNumber: "09121234567" },
    }),
    {},
  );
});

test("a saved-address receiver is never overwritten, even if it equals an old default", () => {
  // Selecting a saved address resets `applied` to null (CartLayout).
  assert.deepEqual(
    receiverDefaultsToApply({
      current: { fullName: "علی رضایی", phoneNumber: "09351234567" },
      applied: null,
      desired: { fullName: "علی رضایی نو", phoneNumber: "09121234567" },
    }),
    {},
  );
});

test("'someone else receives it' clears only the filled-in defaults", () => {
  assert.deepEqual(
    receiverDefaultsToClear({
      current: { fullName: "علی رضایی", phoneNumber: "09121234567" },
      applied: { fullName: "علی رضایی", phoneNumber: "09121234567" },
    }),
    { fullName: "", phoneNumber: "" },
  );
  assert.deepEqual(
    receiverDefaultsToClear({
      current: { fullName: "مریم احمدی", phoneNumber: "09121234567" },
      applied: { fullName: "علی رضایی", phoneNumber: "09121234567" },
    }),
    { phoneNumber: "" },
  );
  assert.deepEqual(
    receiverDefaultsToClear({
      current: { fullName: "سارا کریمی", phoneNumber: "09351234567" },
      applied: null,
    }),
    {},
  );
});

// --- payloads --------------------------------------------------------------

const form = {
  label: "خانه",
  fullName: "مریم احمدی",
  phoneNumber: "09351234567",
  ostan: "تهران",
  shahr: "تهران",
  addressLine: "خیابان آزادی، پلاک ۱۰",
  postalCode: "1234567890",
  [BUYER_FIRST_NAME]: " علی ",
  [BUYER_LAST_NAME]: "رضایی",
};

test("the buyer fields never reach POST /addresses", () => {
  assert.deepEqual(withoutBuyerFields(form), {
    label: "خانه",
    fullName: "مریم احمدی",
    phoneNumber: "09351234567",
    ostan: "تهران",
    shahr: "تهران",
    addressLine: "خیابان آزادی، پلاک ۱۰",
    postalCode: "1234567890",
  });
});

test("the buyer name is sent trimmed, and only when asked for", () => {
  assert.deepEqual(buyerNamePayload(form, true), {
    customerFirstName: "علی",
    customerLastName: "رضایی",
  });
  assert.equal(buyerNamePayload(form, false), null);
});

test("a different recipient is sent as the receiver, the buyer as the customer", () => {
  assert.deepEqual(
    buildCheckoutOrderPayload({
      useSavedAddress: false,
      addressId: null,
      form,
      shippingMethod: "tipax",
      customer: buyerNamePayload(form, true),
    }),
    {
      receiverName: "مریم احمدی",
      receiverPhone: "09351234567",
      ostan: "تهران",
      shahr: "تهران",
      fullAddress: "خیابان آزادی، پلاک ۱۰",
      postalCode: "1234567890",
      shippingMethod: "tipax",
      customerFirstName: "علی",
      customerLastName: "رضایی",
    },
  );
});

test("a saved address is still ordered by id, with the buyer name beside it", () => {
  assert.deepEqual(
    buildCheckoutOrderPayload({
      useSavedAddress: true,
      addressId: 5,
      form,
      shippingMethod: "chapar",
      customer: buyerNamePayload(form, true),
    }),
    { addressId: 5, shippingMethod: "chapar", customerFirstName: "علی", customerLastName: "رضایی" },
  );
});

test("a user with a name sends exactly the previous payload", () => {
  assert.deepEqual(
    buildCheckoutOrderPayload({
      useSavedAddress: true,
      addressId: 5,
      form,
      shippingMethod: "chapar",
      customer: buyerNamePayload(form, false),
    }),
    { addressId: 5, shippingMethod: "chapar" },
  );
});

// --- wiring ----------------------------------------------------------------

const header = read("../components/HeaderLayout.jsx");
const profileLinks = read("../components/ProfileLinks.jsx");
const cartLayout = read("../app/(user)/cart/_components/CartLayout.jsx");
const checkout = section(cartLayout, "function Checkout({", "function ShippingOption(");

test("no profile dialog is mounted after login", () => {
  assert.doesNotMatch(header, /CompleteUserData/);
  assert.doesNotMatch(header, /profileCompleted/);
  assert.equal(existsSync(new URL("../components/CompleteUserData.jsx", import.meta.url)), false);
});

test("a nameless user is shown by phone, never as \"null null\"", () => {
  for (const source of [header, profileLinks]) {
    assert.match(source, /formatFullName\(/);
    assert.doesNotMatch(source, /firstName \+ " " \+/);
  }
  assert.match(header, /accountName !== "-"\s*\?\s*accountName\s*:\s*toPersianNumbers\(user\?\.phoneNumber\)/);
  assert.match(profileLinks, /accountName !== "-"\s*\?\s*accountName\s*:\s*normalizeIranPhone\(phoneNumber\)/);
});

test("checkout asks for the buyer name only when needed, with the shared name rule", () => {
  assert.match(checkout, /const askBuyerName = needsBuyerName\(\{ isAuthenticated, user \}\);/);
  const fields = section(checkout, "{askBuyerName && (", "<AddressForm");
  assert.match(fields, /name=\{BUYER_FIRST_NAME\}[\s\S]*validationSchema=\{buyerNameRules\("نام"\)\}/);
  assert.match(fields, /name=\{BUYER_LAST_NAME\}[\s\S]*validationSchema=\{buyerNameRules\("نام خانوادگی"\)\}/);
  assert.match(fields, /checked=\{isForSelf\}\s*onChange=\{toggleForSelf\}/);
});

test("known name parts are prefilled read-only; the rule checks the trimmed length", () => {
  assert.match(checkout, /const knownBuyer = knownBuyerNameParts\(user\);/);
  const fields = section(checkout, "{askBuyerName && (", "<AddressForm");
  assert.match(fields, /name=\{BUYER_FIRST_NAME\}\s*readOnly=\{Boolean\(knownFirstName\)\}/);
  assert.match(fields, /name=\{BUYER_LAST_NAME\}\s*readOnly=\{Boolean\(knownLastName\)\}/);
  const rules = section(cartLayout, "const buyerNameRules", "const shippingOptions");
  assert.match(rules, /String\(value \?\? ""\)\.trim\(\)\.length >= 2/);
});

test("checkout sends the buyer name with the order and never with the address", () => {
  assert.match(checkout, /createAddress\(withoutBuyerFields\(data\)\)/);
  assert.match(checkout, /customer: buyerNamePayload\(data, askBuyerName\),/);
});

test("selecting a saved address keeps the typed buyer name and stops receiver defaults", () => {
  const effect = section(checkout, "filledAddressIdRef.current = selectedAddress.id;", "}, [selectedAddress");
  assert.match(effect, /appliedReceiverRef\.current = null;/);
  assert.match(effect, /\[BUYER_FIRST_NAME\]: getValues\(BUYER_FIRST_NAME\)/);
  assert.match(effect, /\[BUYER_LAST_NAME\]: getValues\(BUYER_LAST_NAME\)/);
});

test("receiver defaults apply only for an order the buyer receives", () => {
  assert.match(checkout, /if \(!askBuyerName \|\| !isForSelf\) return;/);
  assert.match(checkout, /phoneNumber: accountPhoneForForm\(user\?\.phoneNumber\),/);
});
