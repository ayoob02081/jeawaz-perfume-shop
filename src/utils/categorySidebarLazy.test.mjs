// CategorySidebar lazy loading: the panel is mounted in the root layout on
// every route but rarely opened. Narrow source checks: there is no DOM test
// environment. The query reuse itself is covered with real QueryObservers in
// lib/storefrontCatalog.test.mjs.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const sidebar = read("../app/(user)/_components/CategorySidebar.jsx");
const context = read("../contexts/Sidebars/SidebarContext.jsx");
const header = read("../components/HeaderLayout.jsx");
const hooks = read("../hooks/useCategories.js");
const catalog = read("../lib/storefrontCatalog.mjs");

const CATEGORY_TYPES = [
  "gender", "fragrance_family", "season", "temperature", "character", "occasion",
];

test("the sidebar's seven category/brand queries wait for intent or opening", () => {
  assert.match(sidebar,
    /const sharedCategoryOptions = \{\s*enabled: useLatch\(isCategoryOpen \|\| isSidebarOpen \|\| categoryIntent\),\s*\};/);
  for (const type of CATEGORY_TYPES) {
    assert.match(sidebar,
      new RegExp(`useGetStorefrontCategoriesByType\\(\\s*"${type}",\\s*sharedCategoryOptions,?\\s*\\)`), type);
  }
  // Every storefront category call is gated; none starts on mount.
  assert.equal(sidebar.match(/useGetStorefrontCategoriesByType\(/g)?.length, CATEGORY_TYPES.length);
  assert.match(sidebar, /useGetAllBrandCategories\(sharedCategoryOptions\)/);
  // Volumes stay open-only.
  assert.match(sidebar, /useGetProductVolumeOptions\(isCategoryOpen\)/);
  // The obsolete home-only route gate is gone.
  assert.doesNotMatch(sidebar, /sidebarCategoryQueryEnabled|usePathname/);
  assert.doesNotMatch(catalog, /sidebarCategoryQueryEnabled/);
});

test("intent and the first opening are latched", () => {
  assert.match(sidebar,
    /function useLatch\(active\) \{\s*const \[latched, setLatched\] = useState\(false\);\s*if \(active && !latched\) setLatched\(true\);\s*return latched \|\| active;\s*\}/);
  assert.match(sidebar, /const hasOpened = useLatch\(isCategoryOpen\);/);
  assert.match(context, /const \[categoryIntent, setCategoryIntent\] = useState\(false\);/);
  assert.match(context,
    /const warmCategory = useCallback\(\(\) => \{\s*setCategoryIntent\(true\);\s*\}, \[\]\);/);
  // Nothing resets the intent.
  assert.equal(context.match(/setCategoryIntent\(/g)?.length, 1);
  const value = context.match(/const value = useMemo\(([\s\S]*?)\n  \);/)?.[1] ?? "";
  assert.match(value, /categoryIntent,\s*warmCategory,/);
  assert.match(value, /\[[\s\S]*categoryIntent,[\s\S]*warmCategory,\s*\]/);
});

test("the desktop trigger warms the panel on hover and focus", () => {
  const trigger = header.match(/<button[^>]*?onClick=\{toggleCategory\}[\s\S]*?>/)?.[0] ?? "";
  assert.match(trigger, /onPointerEnter=\{warmCategory\}/);
  assert.match(trigger, /onFocus=\{warmCategory\}/);
  assert.match(trigger, /disabled=\{isCategoryOpen\}/);
  assert.match(header, /warmCategory=\{warmCategory\}/);
});

test("the filter body mounts on first opening; the shell, header and logo gate stay", () => {
  const gate = sidebar.indexOf("{!hasOpened ? null : isLoadingCategories ? (");
  assert.ok(gate > 0, "loading/form body is gated");
  // Shell and mobile header stay mounted before the gate.
  assert.match(sidebar.slice(0, gate), /<div\s+data-scroll/);
  assert.ok(sidebar.indexOf('aria-label="بستن فیلترها"') < gate);
  // The eager, high-priority logo is only inside the gated body.
  const logo = sidebar.indexOf('src="/images/jeawaz-logo-v6.0-r.webp"');
  assert.ok(logo > gate, "no priority logo request while never opened");
  assert.equal(sidebar.match(/\bpriority\b/g)?.length, 1);
  // Never on the server or the hydration render: no hydration-only data view.
  assert.doesNotMatch(sidebar, /catalogInitialView|useIsHydrated/);
});

test("useGetAllBrandCategories takes optional options; defaults stay first", () => {
  assert.match(hooks,
    /export const useGetAllBrandCategories = \(options = \{\}\) =>\s*useQuery\(\{\s*queryKey: \["get-brands"\],\s*queryFn: getAllBrandsApi,\s*retry: false,\s*staleTime: 1000 \* 60 \* 5,\s*refetchOnWindowFocus: false,\s*\.\.\.options,\s*\}\);/);
});
