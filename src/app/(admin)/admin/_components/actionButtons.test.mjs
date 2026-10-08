// Admin form action buttons. Below sm they show only an icon (the text label
// is display:none), so every button needs an accessible name that does not
// depend on that hidden text. Narrow source checks: there is no DOM test
// environment.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const actionButtons = read("./ActionButtons.jsx");
const bannerForm = read("../banners/_components/BannerForm.jsx");

// Opening tags only; their closing ">" is on its own line (arrow functions in
// props contain ">").
const buttons = (source) => source.match(/<button\b[\s\S]*?\n\s*>/g) ?? [];

test("ActionButtons submit and back buttons have accessible names", () => {
  const [submit, back] = buttons(actionButtons);
  assert.match(submit, /type="submit"/);
  assert.match(submit, /aria-label=\{confurmLabel \|\| "ذخیره"\}/);
  assert.match(back, /type="button"/);
  assert.match(back, /aria-label="بازگشت"/);
});

test("Banner toggle and delete buttons have accessible names", () => {
  const toggle = buttons(bannerForm).find((b) => b.includes("onClick={handleToggle}"));
  assert.ok(toggle);
  assert.match(toggle, /type="button"/);
  assert.match(
    toggle,
    /aria-label=\{\s*bannerToEdit\.isActive \? "غیرفعال کردن بنر" : "فعال کردن بنر"\s*\}/,
  );

  const remove = buttons(bannerForm).find((b) => b.includes("handleModal(bannerToEdit)"));
  assert.ok(remove);
  assert.match(remove, /type="button"/);
  assert.match(remove, /aria-label="حذف بنر"/);
});

test("action labels and icons inherit the button color", () => {
  // A child text-* utility beats the .btn--* hover colors (components layer),
  // so labels vanished on hover (white on white, primary on primary).
  const childColor = /<(?:p|\w+Icon)\b[^>]*className="[^"]*\btext-(?:white|primary)\b/;
  assert.doesNotMatch(actionButtons, childColor);
  const bannerActions = bannerForm.slice(bannerForm.indexOf("<ActionButtons"), bannerForm.indexOf("</ActionButtons>"));
  assert.ok(bannerActions.length > 0);
  assert.doesNotMatch(bannerActions, childColor);
});

test("Banner action icons carry no misspelled color class", () => {
  assert.doesNotMatch(bannerForm, /text-priam/);
});
