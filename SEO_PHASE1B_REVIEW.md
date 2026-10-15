# SEO Phase 1B: server-rendered catalog links

**Current correction status (2026-10-15):** the final review's in-flight request
race is corrected. Current validation is **866 full-suite tests passed**, plus
production build, Safari gate and production-server HTTP checks. The correction
section below supersedes the original 851-test cache-race conclusions; the
original Phase 1B implementation and measurement record is retained.

Validated 2026-10-15 against frontend HEAD
`b70c33d4b0574f2e8a8a1097be047b134c8e79ed`, including the existing uncommitted
Phase 1 links. Backend HEAD `f8759fbbb82105b7e1ef1ee6b85a8e8aa9195671` is unchanged.
No commit, push, deploy, production access, database operation or dependency change.

## Confirmed gap and bounded correction

Before this change, complete HTTP responses from the existing production build
contained **zero individual product anchors** on `/`, `/products` and a filtered
listing. Home queries ran on the client; the listing read `useSearchParams` inside
a static page and bailed out to client rendering. Phase 1 had already corrected
the populated card markup; those links are retained.

- Home now renders at request time using `connection()`. It makes three parallel
  anonymous public reads: `/products?inStock=true&sort=newest&page=1&limit=8`,
  `/categories/type/gender` and `/categories/type/character`. RecentProducts and
  both category sections receive those snapshots. Popular/campaign/banner
  loading and their existing queries remain unchanged.
- The listing awaits Next's page `searchParams`, then makes one `/products`
  request for that exact normalized page/filter query. Default limit remains 12;
  the existing maximum remains 100. There is no all-catalog crawl, next-page
  server prefetch, product-detail N+1, alternate route or added provider.
- The existing URL-to-query mapping moved intact into
  `productsQueryFromSearchParams` in productFilterContract.mjs. Both server and
  client call it. Repeated keys, legacy original-to-grade conversion, numeric
  bounds, omitted relevance sort and explicit sorts retain the same contract.
  Native server requests use the browser Axios client's repeated-key array
  encoding (`indexes:null`), with parity checked against actual Axios output.
- Reads use `cache:no-store`, omit credentials and forward no incoming cookies
  or client-IP headers. Each has a five-second timeout. Failed/invalid responses
  are not seeded as successful empty lists. Other successful sections survive;
  the existing client loading, error and explicit retry paths remain available.
  Logs contain only fixed endpoint paths, without search terms or credentials.
- Category arrays keep the full existing type-endpoint response and order;
  active-only selection remains storefront-specific. These endpoints do not
  support pagination, so their record counts are not artificially truncated
  under an existing shared query key. The number of server requests is fixed.

## React Query seeding and hydration safety

The existing Providers QueryClient, productListKey and category keys are reused.
Missing queries receive `initialData` and its server `initialDataUpdatedAt`.
Public Recent/listing observers use a 30-second staleTime, matching the existing
next-page prefetch window. Category freshness remains five minutes. This changes
only browser query freshness; no persistent server price/stock cache was added.
Admin product observers and their legacy/Bulk Price key contracts are unchanged.

Two cache-order cases required explicit handling:

1. The root sidebar can observe category queries before the page, or hydrate
   after the page has filled them. `catalogInitialView` and the existing
   `useIsHydrated` hook keep each first hydration render identical to its own
   server snapshot/skeleton. Live query data takes over afterwards. On the
   closed homepage, the sidebar defers only its two shared gender/character
   reads to the page. Opening it early still enables normal fetching. Other
   routes retain their existing request behavior.
2. `initialData` alone does not replace a populated stale cache. A real observer
   reproduction displayed old product 105 and started one extra client request
   despite a fresh server snapshot containing 106. The small
   useCatalogSnapshotOptions hook now pauses that matching observer until a
   commit effect applies the newer snapshot. It never mutates another observer
   during render, never applies a snapshot to a different key, and never
   overwrites already-newer cached client data in those original checks. The
   after-test observes 106 with **zero** extra client requests. Missing queries
   still seed immediately during SSR. The later review found the separate
   outstanding-request completion race corrected below.

Fresh mount and seeded navigation checks produce no duplicate client fetch.
Expired snapshots can refetch normally. Existing placeholder behavior, real
retry, absolute page/filter state, pagination buttons and next-page prefetch are
preserved. Next RSC navigation still performs one fresh server read; an existing
browser next-page prefetch can therefore precede a later server revalidation of
that page. No claim of cross-request/browser-server request coalescing is made.

## In-flight request correction - 2026-10-15

The final review independently reproduced a gap in the original cache seeding:
disabling an observer does not cancel a fetch/prefetch already running for its
shared query. `setQueryData` also leaves that request able to write its result.
Response-arrival timestamps can make the older response appear newer than SSR.

Before changing production code, the two new delayed-response tests failed for
both pending and populated caches. In both, the adopted product price 200,000
and `isAvailable:false` reverted to 100,000 and `isAvailable:true` when an older
transport completed. The same reproduction after the fix retains 200,000 and
false, with one original request, no cancellation error in cache and idle fetch
state. These values are deterministic fixtures, not production prices.

The correction stays in the existing snapshot helper/hook:

- `prepareCatalogSnapshot` captures the eligible snapshot and the request for
  its exact query before useQuery can fill a pending query with initialData.
  It records the data-write count/timestamp at that request's completion, so an
  older response completing between render and the effect can still be
  identified without treating a genuinely newer cache write as that response.
- Adoption calls and awaits the SDK's `cancelQueries({queryKey, exact:true})`
  only while the captured request still owns that query. Then it seeds the
  snapshot. Awaiting cancellation also handles results already queued to finish;
  no delay, timer, polling, new provider or request retry was added.
- The existing commit effect remains the adoption boundary. Capturing during
  render neither cancels nor changes queries. A stable plan survives cache
  updates; pending and populated observers stay disabled on the snapshot view
  until adoption completes. Normal query behavior resumes afterwards. Effect
  cleanup suppresses component state updates after unmount/plan replacement.
- Other query keys, newer client cache writes, and replacement requests started
  after the captured request are preserved. Concurrent server adoptions cannot
  restore the older snapshot. Existing cancellation/revert behavior is retained.
- Transports consuming AbortSignal receive cancellation. Existing adapters that
  ignore it can still finish their HTTP work, but their cancelled query result
  cannot overwrite the adopted snapshot. No transport/API contract was changed.

Only these four existing feature files changed in this correction:

1. `src/lib/storefrontCatalog.mjs`
2. `src/hooks/useCatalogSnapshotOptions.js`
3. `src/lib/storefrontCatalog.test.mjs`
4. `SEO_PHASE1B_REVIEW.md`

Current correction validation:

- **38 focused tests passed**: 30 snapshot/query tests and 8 existing rendered
  Link/interaction checks. **866 full configured tests passed**, zero failures,
  skips or cancellations (851 previous + 15 new race/cancellation regressions).
- New cases cover both cache states; delayed completion after adoption, before
  the effect and already queued before cancellation; exact query-key isolation;
  abort-aware and abort-ignoring transports; newer client writes before/during
  adoption; replacement fetches; overlapping snapshots; absent/older snapshots;
  raw shared category data and active selection; and uncommitted navigation.
  Original filter, sort, pagination, freshness and first-render checks pass.
- Production build passed with the API pinned to disposable loopback data.
  Safari 15.4 syntax gate passed: **81 client scripts / 5 startup scripts**.
- The final `next start` checks again find 8 homepage product destinations and
  both category anchors, 12 default listing destinations, the exact two filtered
  page-2 products, valid empty/out-of-range states, sitemap/robots 200 and product
  105's production canonical with exactly one Product JSON-LD block. API failure
  fallback and the five-second timeout remain intact.
- Server request counts remain three parallel reads on home and one per listing.
  QueryObserver race checks start no replacement fetch. Browser query freshness
  (30 seconds / category five minutes), no-store SSR and existing next-page
  prefetch are unchanged. No extra product/detail requests or payload fields.
- Repeated local HTTP measurement: immediate-API medians home/list/filtered
  **59.3 / 55.4 / 48.4 ms**; with 50 ms API delay **108.4 / 108.0 / 105.1 ms**.
  Five-worker, 20-listing run: p95 **236.4 ms**, **28.5 responses/second**, exactly
  20 API reads. Raw HTML byte counts match the previous record. These small
  synthetic runs vary and do not isolate the correction's CPU cost or establish
  production capacity. The added cancellation bookkeeping compares metadata,
  not full product payloads, and runs no additional server query.
- `git diff --check` passes. At correction start, fingerprints covered 522
  frontend and 572 backend existing files. The four files above are intentional;
  **1,090 other files remain byte-identical**. All owner WIP and earlier SEO
  files outside this subset remain unchanged, as do both HEADs and empty staging.
- No browser is connected; actual hydrated-browser console/network, mobile
  interactions and physical Safari remain owner-run checks. Query-state and
  first-render regressions do not establish browser/device verification.

Correction evidence:
`C:\Users\Ayoob Mahmoudian\AppData\Local\Temp\jeawaz-seo-phase1b-race-20261015`:
`before-reproduction.log`, `before-tests.log`, `after-reproduction.json`,
`focused-final.log`, `full-tests-final.log`, `build-final.log`, `safari-final.log`,
`http-final.json`, `performance-final.json`, final raw HTML and preservation
fingerprints. The prior evidence directory below remains historical.

The confirmed race blocker is resolved. Production API/Liara configuration,
text-search capacity, real-browser checks and the other deferred SEO work below
remain outstanding. No commit, push, deploy, database or dependency operation.

## Before/after production-server HTML

These are local `next build` + `next start` checks against an in-memory HTTP API,
not production catalog observations. Script blocks were removed before counting
anchors, so Flight JSON containing URL strings cannot satisfy the assertions.

| Complete response | Before | After, 30-product fixture |
| --- | --- | --- |
| `/` | 0 product anchors | 8 distinct real product destinations; both category destinations |
| `/products` | 0 product anchors | 12 distinct product destinations |
| gender + character + repeated season/brand filters, oldest, page 2, limit 2 | no product cards | exact fixture products 132 and 131; one API call with those normalized parameters |
| unmatched gender / out-of-range page | no product cards | successful empty state; no invented product anchors |
| text search without sort / explicit oldest | no product cards | omitted API sort / explicit oldest preserved, with expected fixture products |

Abbreviated anchor tags from complete responses (other attributes omitted):

```html
<a href="/products/105">...Perfume 105...</a>
<a href="/products?gender=women+%26+men%2Fspecial">...</a>
<a href="/products?characters=women+%26+men%2Fspecial">...</a>
```

The category slug containing spaces, ampersand and slash round-trips correctly;
Persian slugs are also covered by the actual JSX/Next Link regression renderer.
Both category destinations and product 105 occur in the fixture-generated
sitemap. Product `/105` retains canonical
`https://jeawaz.com/products/105` and exactly one server Product JSON-LD block.
Sitemap and robots endpoints return 200. No listing/category canonical policy
or metadata change was made; that audit follow-up remains separate.

All tested listing responses lack the client-rendering bailout marker. A
100-product request produced exactly 100 linked products, with no unbounded
allocation from an invalid URL limit. Invalid page/limit inputs retain their
existing normalization. Product-only and category-only API failures both return
usable 200 pages with the unaffected section intact. A real six-second API stall
returns the listing skeleton after approximately **5,055 ms**, without claiming
an empty catalog or hanging indefinitely.

## Performance evidence

Complete-response timing, one warm-up then ten sequential samples, same local
three-product fixture. P95 below is the largest of these ten samples. These are
small synthetic measurements, not Googlebot, database capacity, mobile LCP or
production p95 measurements.

| Route | Before median / p95 ms | Final, immediate API median / p95 ms | Final, 50 ms API delay median / p95 ms |
| --- | --- | --- | --- |
| `/` | 14.9 / 25.6 | 44.9 / 58.7 | 98.8 / 107.8 |
| `/products` | 16.5 / 25.6 | 36.3 / 50.9 | 103.7 / 107.9 |
| filtered listing | 14.3 / 17.8 | 38.5 / 46.9 | 102.5 / 109.5 |

Home's three API calls run concurrently; latency follows the slowest call,
rather than the sum of three sequential delays. The added latency buys actual
server product HTML; it is not a latency optimization. Raw response sizes for
the three-product fixture changed from 150,597 to 157,628 bytes on home and from
58,688 to 121,295 bytes on the listing. SSR cards and serialized initial data add
payload, and dynamic rendering also removes the listing/chrome CSR bailout.

Final concurrent check: 30-product fixture, default 12-item listing, 50 ms API
delay, five workers, 20 requests: median **131.9 ms**, p95 **169.0 ms**, **36.4
responses/second**, exactly **20** public API reads, all 200. A maximum-limit
100-card response was 745,906 uncompressed bytes and completed in 89.9 ms in one
local sample. Real product payloads and upstream SQL/network latency can differ.

## Validation

- Original full configured `node --test --test-isolation=none 'src/**/*.test.mjs'`:
  **851 passed, zero failed/skipped** (836 existing + 15 new).
- New tests use real QueryClient, QueryObserver, React useQuery and server
  rendering. They cover normalized record/URL/request/key parity, parallel and
  bounded reads, anonymous no-store options, missing/pending/stale/newer cache
  cases, duplicate-fetch suppression, first-render cache races, inactive
  categories, changed filters/keys, placeholder semantics, freshness expiry,
  empty/out-of-range data, 429/timeout/partial failures, error/retry, configuration
  rejection and request isolation. Actual JSX/Next Link href, nesting, tooltip
  and normal navigation tests are retained.
- Existing source assertions were adapted to the shared filter helper and
  snapshot wrappers; behavioral assertions were not removed. The JSX harness
  now provides the same real CJS Query context as its compiled modules.
- Final production build: **passed**, installed Next.js 16.3.4. Home/listing are
  dynamic; catalog content is not frozen into a static build. API configuration
  was pinned to a disposable loopback fixture. Only the existing Google Inter
  download required network build access; no dependency installation occurred.
- Final Safari 15.4 syntax gate: **81 client scripts / 5 startup passed**.
- Final actual production-server HTTP assertions and performance run: **passed**.
- `git diff --check`, including all new files: **passed**.
- Browser inventory is empty. Real hydrated-browser console checks, clicks,
  network waterfalls, mobile layout and physical Safari have **not** been run.
  Query-state/first-render tests and raw HTTP proof do not replace those checks.

## Exact Phase 1B files

Application changes:

1. `src/app/(user)/page.jsx`
2. `src/app/(user)/products/page.jsx`
3. `src/app/(user)/products/_components/ProductsLayout.jsx`
4. `src/app/(user)/_components/RecentProducts.jsx`
5. `src/app/(user)/_components/GenderCategoriesLayout.jsx`
6. `src/app/(user)/_components/AccordCategoriesLayout.jsx`
7. `src/app/(user)/_components/CategorySidebar.jsx`
8. `src/hooks/useCategories.js`
9. `src/utils/productFilterContract.mjs`
10. `src/hooks/useCatalogSnapshotOptions.js` (new)
11. `src/lib/storefrontCatalog.mjs` (new)
12. `src/lib/storefrontCatalog.server.mjs` (new)

Validation/report changes:

13. `src/lib/storefrontCatalog.test.mjs` (new)
14. `src/utils/storefrontLinks.test.mjs` (existing Phase 1 harness extended)
15. `src/utils/productFilterContract.test.mjs`
16. `src/utils/productFilterCorrectness.test.mjs`
17. `src/utils/productFilterTaxonomy.test.mjs`
18. `src/utils/productGradeFilter.test.mjs`
19. `src/utils/productListErrorRecovery.test.mjs`
20. `src/utils/productListPagination.test.mjs`
21. `SEO_PHASE1B_REVIEW.md` (new, this report)

## Preservation and remaining checks

Task-start fingerprints cover 517 existing frontend and 572 backend files.
Exactly 16 existing frontend files above were intentionally extended; **1,073
other existing files remain byte-identical**, with no missing files. Owner
flower.svg, LoginForm.jsx and FiltersModal.jsx are unchanged, as are all backend
files, dependencies, ProductCard.jsx, sitemap/robots, product detail/JSON-LD,
policies, SEO_AUDIT_REPORT.md and SEO_PHASE1_REVIEW.md. Earlier Phase 1 category
anchor markup and behaviors are retained; their components/tests were extended
for snapshot seeding. Git HEADs and staging remain unchanged.

Remaining verification/release limits:

- Owner must verify the real public HTTPS NEXT_PUBLIC_API_URL at build time and
  server-side API reachability from Liara. Production configuration and deployed
  frontend rollback SHA remain unverified; expected e2492f3 is not confirmation.
- Check real browser hydration warnings and network calls on direct home/list
  load, filtered navigation, stale cached-page return, Back/Forward and early
  mobile category-panel opening; repeat the existing iOS Safari device smoke.
- Backend source applies the 60/min/IP list search budget **only to nonempty
  normalized text searches**, not ordinary/category lists. SSR text searches may
  share a frontend egress IP. Owner must verify actual Liara trust/ingress and
  traffic capacity; no proxy-header bypass or backend throttle change was made.
- Request-time SSR adds API/SQL load and removes static-page serving for home
  and listing. API failures/timeouts can still leave that response without
  product links until the browser query recovers. No production performance or
  indexing improvement is claimed.
- Only the bounded recent-product row is newly server-seeded on home. Campaign,
  popular and banner sections retain client fetching. Larger category arrays
  remain unpaginated under the existing API contract.
- Pagination SEO, filter/search canonical policy, malformed-ID handling, utility
  noindex/robots coordination, remaining headings/social metadata and Search
  Console/Core Web Vitals evidence remain separate audit work.

Evidence directory:
`C:\Users\Ayoob Mahmoudian\AppData\Local\Temp\jeawaz-seo-phase1b-20261015`.
Final evidence: `full-tests-final.log`, `build-final.log`, `safari-final.log`,
`http-final.json`, `performance-final.json`, final raw HTML, `verify-http.cjs`,
`initial-manifest.json` and `wip-comparison.json`. Fixture IDs and timings are
synthetic; verification servers are stopped after validation.

Verdict: **SEO PHASE 1 READY FOR FINAL REVIEW**. This is a local implementation
and validation verdict, not permission to commit or production release clearance.
