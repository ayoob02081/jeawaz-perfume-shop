// Admin Products list wiring. Narrow source checks: there is no DOM test
// environment; behaviour lives in utils/adminProductsListContract.mjs and is
// exercised end to end by productsList.browser.test.mjs (opt-in).

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");
const page = read("../page.jsx");
const layout = read("./ProductsLayout.jsx");
const filters = read("./ProductsFilters.jsx");
const fields = read("./ProductFilterFields.jsx");
const table = read("./ProductsListTable.jsx");
const hooks = read("../../../../../hooks/useProducts.js");

test("the list state is read from the URL, never kept only in component state", () => {
  assert.match(page, /<Suspense fallback=\{<Loading \/>\}>\s*<ProductsLayout \/>\s*<\/Suspense>/);
  assert.match(layout, /useSearchParams\(\)/);
  assert.match(layout, /parseAdminProductsQuery\(searchParams\)/);
  assert.match(layout, /useGetAllProducts\(adminProductsListParams\(query\)\)/);
  assert.doesNotMatch(layout, /useState\(1\)|\bsetFilters\(|initialFilters|setPage\(1\)/);
  assert.match(layout, /page=\{query\.page\}/);
});

test("user actions push history entries; automatic corrections replace", () => {
  assert.match(layout, /if \(replace\) router\.replace\(href, \{ scroll: false \}\);\s*else router\.push\(href, \{ scroll: false \}\);/);
  assert.match(layout, /if \(next === searchRef\.current\) return;/);
  assert.match(layout, /canonicalAdminProductsSearch\(search\);\s*if \(canonical !== null\) navigate\(canonical, \{ replace: true \}\)/);
  assert.match(layout, /correctedAdminProductsPage\(\{[\s\S]*?navigate\(nextAdminProductsSearch\(searchRef\.current, \{ page: target \}\), \{\s*replace: true,\s*\}\)/);
  // The correction waits for the requested page's own answer.
  assert.match(layout, /if \(isFetching \|\| isPlaceholderData \|\| !meta \|\| meta\.page !== query\.page\) return;/);
  for (const action of ["applyFilters", "resetFilters", "setPage"]) {
    const body = layout.match(new RegExp(`const ${action} = useCallback\\(([\\s\\S]*?)\\[navigate\\]`))?.[1];
    assert.ok(body, action);
    assert.doesNotMatch(body, /replace/, `${action} must create a history entry`);
  }
});

test("bulk price targets the filters the URL shows", () => {
  assert.match(layout, /const filters = useMemo\(\(\) => adminProductsApiFilters\(query\), \[query\]\);/);
  assert.match(layout, /<BulkPriceDialog[\s\S]*?filters=\{filters\}/);
});

test("rows are numbered from the backend total, not their page index or id", () => {
  assert.match(layout, /const rowNumbers = adminProductRowNumbers\(data\);/);
  assert.match(layout, /rowNumbers=\{rowNumbers\}/);
  assert.doesNotMatch(table, /index \+ 1/);
  assert.equal(table.match(/<p>\{rowLabel\(rowNumbers, index\)\}<\/p>/g)?.length, 2);
});

test("a successful edit returns to the originating list URL and refetches it in place", () => {
  const edit = hooks.match(/export function useEditProduct[\s\S]*?\r?\n}\r?\n/)[0];
  assert.match(edit, /queryClient\.invalidateQueries\(\{ queryKey: productKeys\.all \}\)/);
  assert.match(edit, /router\.back\(\);/);
  assert.doesNotMatch(edit, /router\.push\("\/admin\/products"\)/);
  assert.match(table, /href=\{`\/admin\/products\/edit\/\$\{product\.id\}`\}/);
});

test("desktop keeps the inline form; mobile gets a counted button and an accessible sheet", () => {
  assert.match(filters, /className="max-md:hidden flex flex-col/);
  assert.match(filters, /<div className="md:hidden flex items-center gap-2">/);
  assert.match(filters, /aria-haspopup="dialog"/);
  assert.match(filters, /aria-expanded=\{sheetOpen\}/);
  assert.match(filters, /countActiveAdminProductFilters\(query\)/);
  assert.match(filters, /accessibleLabel=\{MOBILE_FILTER_SHEET_LABEL\}/);
  assert.match(filters, /<Modal[\s\S]*?scrollable/);
  // Apply is a submit button in the sheet's bottom bar, Reset beside it.
  assert.match(filters, /border-t border-stroke-250 shrink-0[\s\S]*?type="submit"[\s\S]*?اعمال فیلتر[\s\S]*?onClick=\{resetSheet\}/);
});

test("closing the sheet without Apply keeps the applied filters", () => {
  assert.match(filters, /const openSheet = \(\) => \{[\s\S]*?setSheetDraft\(draftFromAdminProductsQuery\(query\)\);\s*setSheetOpen\(true\);/);
  assert.match(filters, /onClose=\{\(\) => setSheetOpen\(false\)\}/);
  const close = filters.match(/aria-label="بستن فیلترها"/);
  assert.ok(close);
  assert.doesNotMatch(filters.match(/const openSheet[\s\S]*?const applySheet/)[0], /onApply|onReset/);
});

test("both layouts reuse one set of filter controls", () => {
  assert.equal(filters.match(/<ProductFilterFields/g)?.length, 2);
  assert.match(filters, /variant="sheet"/);
  for (const name of ["search", "brandId", "grade", "gender"]) {
    assert.match(fields, new RegExp(`name="${name}"`));
  }
  assert.doesNotMatch(layout, /<select|<input/);
});
