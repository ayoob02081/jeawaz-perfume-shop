// CouponForm eligible-user picker wiring. Narrow source checks: there is no
// DOM test environment; behaviour lives in utils/entityPickerContract.mjs.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const couponForm = readFileSync(new URL("./CouponForm.jsx", import.meta.url), "utf8");

test("the raw user-ID input is gone", () => {
  assert.doesNotMatch(couponForm, /آی‌دی کاربران/);
  assert.doesNotMatch(couponForm, /name="userIds"/);
  assert.doesNotMatch(couponForm, /\.split\(","\)/);
});

test("the user picker renders outside the form", () => {
  const formEnd = couponForm.lastIndexOf("</form>");
  assert.ok(formEnd > 0);
  assert.ok(couponForm.indexOf("<UserPicker") > formEnd);
});

test("selected users are required, prefilled from allowedUsers and sent as IDs", () => {
  assert.match(couponForm, /values\.target !== COUPON_TARGETS\.SELECTED_USERS \|\|\s+value\.length > 0/);
  assert.match(couponForm, /couponUserSnapshots\(couponToEdit\)/);
  assert.match(couponForm, /\.\.\.buildCouponTargetPayload\(/);
});

test("the coupon form uses the backend target enum", () => {
  assert.match(couponForm, /value=\{COUPON_TARGETS\.SELECTED_USERS\}/);
  assert.doesNotMatch(couponForm, /"USERS"/);
  assert.match(couponForm, /label="سقف کل استفاده"/);
  assert.doesNotMatch(couponForm, /تعداد کاربرهای مجاز/);
});

test("coupon submit leaves navigation to the mutation success handlers", () => {
  const onSubmit = couponForm.slice(
    couponForm.indexOf("const onSubmit"),
    couponForm.indexOf("const handleDelete"),
  );
  assert.ok(onSubmit.length > 0);
  assert.doesNotMatch(onSubmit, /router\.(back|push)/);
});
