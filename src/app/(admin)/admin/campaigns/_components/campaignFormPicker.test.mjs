// CampaignForm product picker wiring. Narrow source checks: there is no DOM
// test environment; behaviour lives in utils/entityPickerContract.mjs.

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const url = (path) => new URL(path, import.meta.url);
const campaignForm = readFileSync(url("./CampaignForm.jsx"), "utf8");

test("the raw product-ID input is gone", () => {
  assert.doesNotMatch(campaignForm, /آی‌دی محصولات/);
  assert.doesNotMatch(campaignForm, /name="productIds"/);
  assert.doesNotMatch(campaignForm, /\.split\(","\)/);
});

test("the product picker renders outside the form", () => {
  const formEnd = campaignForm.lastIndexOf("</form>");
  assert.ok(formEnd > 0);
  assert.ok(campaignForm.indexOf("<ProductPicker") > formEnd);
});

test("manual products are sent as IDs and seeded only from a manual Campaign", () => {
  assert.match(campaignForm, /payload\.products = toCampaignProductsPayload\(data\.selectedProducts\)/);
  assert.match(campaignForm, /campaignProductSnapshots\(campaignToEdit\)/);
  assert.match(campaignForm, /values\.selectionMode !== "manual" \|\|\s+value\.length > 0/);
  assert.match(campaignForm, /forcedType=\{campaignScopeProductType\(scope\)\}/);
  assert.match(campaignForm, /همه محصولات فعلی در زمان ذخیره/);
});

test("the unused CampaignProductSelector is removed", () => {
  assert.equal(existsSync(url("./CampaignProductSelector.jsx")), false);
});
