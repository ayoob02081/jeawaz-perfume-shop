// CategorySidebar mobile layout wiring. Narrow source checks: there is no DOM
// test environment, and real viewport behaviour needs device testing.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const sidebar = read("../app/(user)/_components/CategorySidebar.jsx");
const modal = read("../components/Modal.jsx");

// The opening tag of the [data-scroll] scroll owner.
const scrollOwner = sidebar.match(/<div\s+data-scroll[\s\S]*?>/)?.[0] ?? "";

test("the mobile panel has one viewport-sized box: the fixed Backdrop", () => {
  // No second viewport measurement in the category path.
  assert.doesNotMatch(sidebar, /\b(min-)?h-dvh\b/);
  const categoryWrapper = modal.match(/category \? "([^"]*)"/)?.[1] ?? "";
  assert.ok(categoryWrapper.includes("max-lg:h-full"), categoryWrapper);
  assert.doesNotMatch(categoryWrapper, /dvh|vh\b|svh|lvh/);

  // The panel fills the Backdrop, which does not scroll itself on mobile.
  assert.match(sidebar, /className="max-lg:h-full"\s+backdropClassName="max-lg:overflow-hidden"/);
  // No viewport measurement in JavaScript.
  assert.doesNotMatch(sidebar, /innerHeight|visualViewport/);
});

test("[data-scroll] is the contained vertical scroll owner", () => {
  assert.match(scrollOwner, /max-lg:overflow-auto/);
  assert.match(scrollOwner, /\boverscroll-y-contain\b/);
  assert.match(scrollOwner, /max-lg:h-full/);
});

test("the inner filter area scrolls instead of the no-op typo", () => {
  assert.doesNotMatch(sidebar, /overflow-y-aut\b/);
  assert.match(sidebar, /flex flex-wrap items-start justify-start size-full overflow-y-auto/);
});

test("the closed panel is inert, the open panel is a modal dialog", () => {
  assert.match(scrollOwner, /inert=\{!isCategoryOpen\}/);
  assert.match(scrollOwner, /role=\{isCategoryOpen \? "dialog" : undefined\}/);
  assert.match(scrollOwner, /aria-modal=\{isCategoryOpen \? "true" : undefined\}/);
  assert.match(scrollOwner, /aria-label="دسته بندی محصولات"/);
});

test("the mobile header is pinned to the top and its back arrow is named", () => {
  assert.match(sidebar, /className="fixed top-0 z-10 flex items-center justify-between px-4 w-full py-6 lg:hidden/);
  assert.match(
    sidebar,
    /onClick=\{cancelCategory\}\s+aria-label="بستن فیلترها"\s*>\s*<ArrowRightIcon className="size-5 text-stroke-800" \/>/,
  );
});

test("no safe-area or viewport-fit handling was added", () => {
  assert.doesNotMatch(sidebar, /safe-area|viewport-fit/);
});
