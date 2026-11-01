// Admin entity picker wiring. Narrow source checks: there is no DOM test
// environment; behaviour lives in utils/entityPickerContract.mjs. Each form's
// picker integration is checked next to that form.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const modal = read("./EntityPickerModal.jsx");
const list = read("./SelectedEntityList.jsx");
const productPicker = read("./ProductPicker.jsx");
const userPicker = read("./UserPicker.jsx");
const useProducts = read("../../../../../hooks/useProducts.js");
const useUsers = read("../../../../../hooks/useUsers.js");

const buttonTags = (source) => source.match(/<button\b[\s\S]*?>/g) ?? [];

test("every picker and selected-list button is type=button", () => {
  const tags = [...buttonTags(modal), ...buttonTags(list)];
  assert.ok(tags.length >= 8, String(tags.length));
  for (const tag of tags) assert.match(tag, /type="button"/, tag);
});

test("the picker dialog has dialog semantics and modal safety", () => {
  assert.match(modal, /role="dialog"/);
  assert.match(modal, /aria-modal="true"/);
  assert.match(modal, /aria-labelledby=\{titleId\}/);
  assert.match(modal, /<h2 id=\{titleId\}/);
  assert.match(modal, /aria-label="بستن"/);
  assert.match(modal, /aria-live="polite"/);
  assert.match(modal, /type="checkbox"/);
  // Existing Modal system, scroll mode, contained scrolling, footer outside it.
  assert.match(modal, /import Modal from "@\/components\/Modal"/);
  assert.match(modal, /^\s+scrollable\r?$/m);
  assert.match(modal, /h-\[85dvh\]/);
  assert.match(modal, /flex-1 min-h-0 overflow-y-auto overscroll-contain/);
  assert.match(modal, /shrink-0 px-4 md:px-6 py-3 space-y-2/);
  assert.doesNotMatch(modal, /@base-ui|el-dialog/);
});

test("Escape cancels, focus moves in and back, Enter never submits", () => {
  assert.match(modal, /event\.key !== "Escape"/);
  assert.match(modal, /searchRef\.current\?\.focus/);
  assert.match(modal, /opener\.focus/);
  assert.match(modal, /if \(event\.key === "Enter"\) event\.preventDefault\(\)/);
});

test("a backdrop click never discards a changed draft", () => {
  assert.match(modal, /onClose=\{handleBackdropDismiss\}/);
  assert.match(
    modal,
    /const handleBackdropDismiss = \(\) => \{\s+if \(isDirty\) setDismissBlocked\(true\);\s+else onClose\(\);/,
  );
  // Only Confirm reaches the form.
  assert.equal(modal.match(/onConfirm\(/g)?.length, 1);
  assert.match(modal, /onConfirm\(confirmDraft\(draft\)\)/);
});

test("picker queries use distinct infinite-query keys and abort signals", () => {
  assert.match(useProducts, /picker: \(params\) => \[\.\.\.productKeys\.all, "picker", params\]/);
  assert.match(useProducts, /useInfiniteQuery\(\{\s+queryKey: productKeys\.picker\(params\)/);
  assert.match(useUsers, /list: \(params\) => \["users", "picker", params\]/);
  assert.match(useUsers, /useInfiniteQuery\(\{\s+queryKey: userPickerKeys\.list\(params\)/);
  for (const source of [useProducts, useUsers]) {
    assert.match(source, /queryFn: \(\{ pageParam, signal \}\)/);
  }
  assert.match(productPicker, /enabled: isOpen/);
  assert.match(userPicker, /enabled: isOpen/);
});

test("the user picker shows identification only and sends no account filters", () => {
  for (const field of ["totalSpent", "totalPurchases", "addressesCount", "ordersCount", "lastLogin"]) {
    assert.doesNotMatch(userPicker, new RegExp(field), field);
  }
  for (const source of [userPicker, useUsers]) {
    assert.doesNotMatch(source, /isBanned|phoneVerified=|minOrders|role:/);
  }
  assert.match(userPicker, /dir="ltr"/);
});
