# SEO Phase 1: crawlable card links

Validated 2026-10-15. Frontend baseline `b70c33d4b0574f2e8a8a1097be047b134c8e79ed`;
backend `f8759fbbb82105b7e1ef1ee6b85a8e8aa9195671` unchanged. No commit, push,
deploy, production access, database work or dependency change.

## Confirmed gap and call paths

ProductCard rendered a button calling router.push, with no product href. It is
shared by RecentProducts, PopularProducts, CampaignsProducts and the storefront
ProductsLayout, so the correction reaches both home sections and product lists.
GenderCategoriesLayout and AccordCategoriesLayout similarly used destination
buttons for gender and character query filters. These are the existing routes;
no category path or slug-based product route was introduced.

The new regression harness compiles the actual JSX with the already installed
Next SWC, then renders it with ReactDOM server and the real Next Link. Category
data hooks are supplied with deterministic fixtures; this is component rendering,
not an assertion that the full catalog page fetches server data. The initial six
checks ran before editing the components: four failed, two passed. They showed
missing product/category hrefs and the legacy nested-interactive price fallback.

## Changes and interaction safety

- ProductCard uses numeric `/products/{id}` Links for the brand/name, usable
  price/variant label and view/unavailable destination. Existing labels, grade,
  prices, availability rules, image regions and responsive classes are retained.
- PriceSection can render its own telephone link when a legacy positive raw price
  normalizes to zero. That branch stays inside a plain div, separate from product
  anchors. Its `tel:+989302125151` action is preserved. No anchor/button is nested
  inside another interactive navigation control.
- Category cards use Link with `/products?gender=...` or `/products?characters=...`.
  Gender uses the existing genderProductsHref helper; character uses URLSearchParams.
  Unicode, spaces, ampersands and slashes decode to the original slug. Encoding
  matches the sitemap's URLSearchParams output, including `+` for spaces.
- Tooltip controls remain their original buttons outside the links. Their click
  callback still toggles the label; non-button header uses remain noninteractive.
- Public links retain the repository's default Next prefetch policy. No custom
  onClick/onNavigate interception, target override, caching or navigation adapter
  was added. Initial prefetch=false overrides were removed after the existing
  protectedLinkPrefetch suite identified the public-link policy; that suite was
  not weakened or edited. Protected navigation remains unchanged.
- One existing category regression assertion was updated from requiring
  router.push to checking Link/query encoding; active-category and taxonomy
  assertions remain. Eight new rendered-markup/interaction checks were added.

## Before/after HTML

Abbreviated actual component-rendering output for synthetic data:

```html
<!-- Before: no product destination href -->
<button>...Product name EN...Product name...</button>

<!-- After: actual numeric detail destination -->
<a href="/products/105" class="block">...Product name EN...Product name...</a>
<!-- Price/variant and view affordances are sibling links to the same product. -->

<!-- Before: category destination existed only in the click handler -->
<button>...Gender category...</button>

<!-- After: existing query-filter routes, not invented category pages -->
<a
  href="/products?gender=%D8%B2%D9%86%D8%A7%D9%86%D9%87+%26+%D9%85%D8%B1%D8%AF%D8%A7%D9%86%D9%87%2F%D8%AE%D8%A7%D8%B5"
  >...Gender category...</a
>
<a
  href="/products?characters=%D8%B2%D9%86%D8%A7%D9%86%D9%87+%26+%D9%85%D8%B1%D8%AF%D8%A7%D9%86%D9%87%2F%D8%AE%D8%A7%D8%B5"
  >...Character category...</a
>
```

The HTML parser in the tests checks every generated anchor/button ancestry,
including the real PriceSection contact fallback. Available products have three
product destination anchors; unavailable products remain linked without a price
display. Loading/error/absent-product states do not invent product links.

**Important boundary:** initial raw HTTP HTML for `/` and `/products` still has
no individual catalog cards because the existing query hooks fetch on the client.
This phase makes populated card markup contain real hrefs. It does not add SSR
catalog fetching, remove that dependency on JavaScript, or fix pagination.

## Validation

- Final full configured `.test.mjs` suite: **836 passed, zero failed/skipped**,
  including all eight new tests. Those exercise rendered product/category hrefs,
  unavailable/legacy fallback branches, sitemap-identical category encoding,
  no nested interactive controls, default public Link props and the actual
  tooltip click callback's state updates. The tooltip callback check uses a
  small hook-state harness; it is not a browser event/device simulation.
- An initial full run identified two related failures: the old router.push-only
  category assertion and explicit public prefetch overrides. Both were resolved
  as described above; the final 836-test run covers the final source.
- Production build: **passed**, Next.js 16.3.4 Turbopack. Used the package build
  subprocesses directly, then the existing browser compatibility gate. Existing
  Google Inter download was allowed; API was pinned to disposable loopback data.
  No dependencies were installed, upgraded or changed.
- Safari 15.4 syntax gate: **81 client scripts / 5 startup scripts passed**.
- Actual local `next start`: home, listing, available/unavailable product detail,
  gender filter and character filter destinations all returned 200. Product
  canonical URLs and exactly one server Product JSON-LD block were preserved.
  Sitemap/robots returned 200; both category filter URLs and product destinations
  appeared in the synthetic sitemap (10 URLs: five static, three products, two
  categories). Fixture IDs/counts are not production catalog assertions.
- No connected browser was available (browser inventory empty). Hydrated browser
  clicks, visual/mobile layout and physical Safari checks are not claimed.
  Component HTML, Link prop behavior, callbacks, production build and destination
  responses were verified instead. A real-device visual smoke remains advisable.
- `git diff --check` passes, including new files. Existing pagination component,
  listing query/filter contracts, sitemap, canonical metadata, Product JSON-LD,
  shipping/returns policies and the audit report remain byte-identical.

## Exact changed files

1. `src/app/(user)/_components/ProductCard.jsx`
2. `src/app/(user)/_components/GenderCategoriesLayout.jsx`
3. `src/app/(user)/_components/AccordCategoriesLayout.jsx`
4. `src/utils/storefrontLinks.test.mjs` (new)
5. `src/utils/productFilterCorrectness.test.mjs` (one navigation assertion update)
6. `SEO_PHASE1_REVIEW.md` (this report)

At task start, fingerprints covered 515 frontend and 572 backend existing files.
The four intentional existing-file edits above are excluded from the preservation
comparison: **1,083 other files unchanged**, including owner flower.svg,
LoginForm.jsx, FiltersModal.jsx, SEO_AUDIT_REPORT.md and every backend file.
Git HEADs and staging remain unchanged. All local verification servers were stopped.

Evidence: `C:\Users\Ayoob Mahmoudian\AppData\Local\Temp\jeawaz-seo-phase1-20261015`
(before failures, final tests, production build/Safari logs, HTTP verification,
initial/final hashes). Synthetic fixture code stays outside the repository.

## Remaining findings and release boundary

Audit F1's three card destination controls are corrected. Pagination buttons (F2),
filter/search/sort indexing and canonical policy (F3), malformed-ID error handling
(F4), utility noindex/robots coordination (F5), heading/social metadata gaps and
client-only catalog rendering remain separate work. Production/Search Console
indexing effects and Core Web Vitals remain unverified. No claim that these links
alone guarantee Google discovery, indexing or improved rankings is made.

Verdict: **SEO PHASE 1 READY FOR PRE-COMMIT REVIEW**. No commit or deployment.
