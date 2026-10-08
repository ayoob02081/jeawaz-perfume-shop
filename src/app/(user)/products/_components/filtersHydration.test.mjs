// Product filter hydration. The root layout's CategorySidebar runs the same
// brand and storefront-category queries and can fill the cache before the
// products subtree hydrates; markup built from that data must match the server
// HTML until hydration ends. Narrow source checks: there is no DOM test
// environment.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const hook = read("../../../../hooks/useIsHydrated.js");
const filterSection = read("./FilterSection.jsx");
const filtersModal = read("./FiltersModal.jsx");

const occurrences = (source, name) =>
  source.match(new RegExp(`\\b${name}\\b`, "g"))?.length ?? 0;

test("useIsHydrated is false on the server and in the hydration render", () => {
  assert.match(hook, /const emptySubscribe = \(\) => \(\) => \{\};/);
  assert.match(
    hook,
    /useSyncExternalStore\(\s*emptySubscribe,\s*\(\) => true,\s*\(\) => false,?\s*\)/,
  );
});

test("the brand scroller shows the server skeletons until hydration ends", () => {
  assert.match(filterSection, /const isHydrated = useIsHydrated\(\);/);
  assert.match(filterSection, /brandsLoading=\{!isHydrated \|\| brandsLoading\}/);
  // Skeletons vs checkboxes still switch on that one flag.
  assert.match(filterSection, /\{brandsLoading\s*\?\s*Array\.from\(\{ length: 14 \}\)/);
});

test("FiltersModal gates every query-derived option list on hydration", () => {
  assert.match(filtersModal, /const isHydrated = useIsHydrated\(\);/);
  assert.match(
    filtersModal,
    /const hydratedOnly = \(data\) => \(isHydrated \? data : undefined\);/,
  );

  // Every brand/category query result is declared once and read once: inside
  // hydratedOnly, which yields the name the rest of the modal (all selected-
  // title paths and taxonomyOptions) uses.
  const queryResults = [...filtersModal.matchAll(/const \{ data: (\w+) \} =\s*use(?:GetStorefrontCategoriesByType|GetAllBrandCategories)\(/g)]
    .map(([, name]) => name);
  assert.deepEqual(queryResults.sort(), [
    "cachedBrandCategories",
    "cachedCharacterCategories",
    "cachedFragranceFamilyCategories",
    "cachedGenderCategories",
    "cachedOccasionCategories",
    "cachedSeasonCategories",
    "cachedTemperatureCategories",
  ]);
  for (const cached of queryResults) {
    const gated = cached.replace(/^cached(\w)/, (_, first) => first.toLowerCase());
    assert.equal(occurrences(filtersModal, cached), 2, cached);
    assert.match(filtersModal, new RegExp(`const ${gated} = hydratedOnly\\(\\s*${cached},?\\s*\\);`), gated);
  }

  // taxonomyOptions (gender, season, temperature, character, occasion) is
  // built from the gated names; static concentrations are never gated.
  assert.match(filtersModal, /seasons: seasonCategories,\s*temperature: temperatureCategories,\s*characters: characterCategories,\s*occasions: occasionCategories,\s*concentrations: concentrationOptions,\s*gender: genderCategories,/);
});
