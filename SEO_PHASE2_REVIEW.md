# SEO Phase 2: crawlable storefront pagination

Validated 2026-10-15 against frontend HEAD
6f89b62c1aacada4be74cccfc302ae5ceb9bfc72, including the existing protected owner
WIP. Backend f8759fbbb82105b7e1ef1ee6b85a8e8aa9195671 is unchanged.
No commit, push, deployment, production access, database work or dependency change.

## Confirmed gap and bounded implementation

The existing shared PagesNumber rendered navigation buttons. Before editing,
the existing production build returned the correct 12 products on each of pages
1, 2 and 3, but zero pagination hrefs in their initial HTML. The storefront used
router.replace to change page; React Query keys and SSR snapshots already included
the normalized page, limit, filters and sorting.

A storefront-only ProductPagination now renders real Next Link anchors. The
shared PagesNumber and every admin/profile caller remain byte-identical.

- Numbered links and previous/next arrows use the existing /products route.
- productPageHref copies the current query parameters, removes all old page
  parameters and adds exactly one positive page parameter for pages 2+.
  Page 1 omits page, matching the existing /products and single-category sitemap
  destinations. Repeated filter order, search text, Unicode, page size, explicit
  sorts and omitted relevance sort remain intact. Other parameters retain their
  existing URL behavior; this is not a new filter or tracking normalization policy.
- Current page is an aria-current=page span; boundary arrows and ellipses have no
  fabricated href. The nav and links have Persian accessible labels. Existing
  RTL order, spacing, responsive classes and button styling are retained.
- Loading links keep their crawlable href but expose aria-disabled, leave the tab
  order and prevent activation. Enabled links retain normal/modified-click and
  new-tab behavior. Next Link replace and scroll=false, plus onNavigate smooth
  scrolling, retain the previous history/scroll behavior. Pagination deliberately
  does not add a history entry per page, just as before.
- Page state remains derived from useSearchParams. There is no extra local page
  state, fetch, provider, cache, effect, API parameter or query key.
- Zero-result and normal single-page lists have no pager. Valid out-of-range
  requests remain successful empty responses under the existing contract. Their
  pager offers only real in-range recovery destinations, including page 1 for a
  one-page catalog; it does not silently substitute another page's products.
- Invalid page/limit inputs retain the existing normalization. The server loader,
  no-store requests, anonymous fetch options, five-second timeout, snapshot
  adoption/cancellation logic and existing next-page React Query prefetch are
  unchanged.

## Before/after production-server HTML

Local next start against an in-memory 36-product catalog; scripts/Flight JSON
were excluded before inspecting hrefs. These are not production catalog claims.

| Request | Products before and after | Before pager | After pager destinations |
| --- | --- | --- | --- |
| /products | IDs 105-116 | buttons, zero hrefs | /products?page=2 and page=3 |
| /products?page=2 | IDs 117-128 | buttons, zero hrefs | /products and /products?page=3 |
| /products?page=3 | IDs 129-140 | buttons, zero hrefs | /products and /products?page=2 |

Abbreviated actual page-2 HTML, attributes/text omitted:

~~~html
<nav aria-label="...">
  <a href="/products" rel="prev">...</a>
  <a href="/products">...</a>
  <span aria-current="page">...</span>
  <a href="/products?page=3">...</a>
  <a href="/products?page=3" rel="next">...</a>
</nav>
~~~

A combined search/gender/character/repeated season/repeated brand/oldest/limit=2
request on page 2 returned IDs 138 and 137. Related combined-filter pages 1 and 3
returned 140/139 and 136/135. Pager URLs preserve all non-page URL parameters;
the API normalizes brand order exactly as before. Search without sort still sends
no sort. Initial server HTML, current-page state and API parameters agree.

Checks also cover invalid page/limit, empty results, page=999, one-page catalogs,
one-page out-of-range recovery, and API failure skeleton fallback. Every listing
made exactly one API read. A page-3 RSC response returned text/x-component and used
one page-3 API read. Product 105's numeric HTTPS canonical and exactly one Product
JSON-LD block remain present; sitemap product/category coverage and robots 200
remain unchanged.

## Canonical and indexing behavior

Listing metadata currently emits no explicit canonical. This phase preserves
that behavior: no page-1 canonical is added to pages 2+, no filtered/sorted page
is declared equivalent to an unfiltered page, and no robots/noindex directive or
sitemap policy changes. Generated pagination links consolidate page=1 to the
existing base/filter URL and collapse duplicate page parameters. Existing inbound
aliases are not redirected.

The broader F3 decision remains outstanding: choose useful category/filter
landing states and a normalization/indexing policy for sort, page size, internal
search, tracking and other filter combinations. A future reviewed policy can add
self-canonicals for distinct useful pages and consolidate proven equivalents.
Applying one unfiltered canonical to every pagination/filter state would be
misleading. That broader policy is not required to expose these real links and
was not implemented here. Existing out-of-range 200/empty behavior also remains;
there is no claim that every such URL should be indexed or that this phase alone
prevents duplicate indexing.

## Validation

- Focused regression group: 64 passed, zero failed/skipped/cancelled.
- Full configured node --test --test-isolation=none src/**/*.test.mjs:
  876 passed, zero failed/skipped/cancelled (866 existing plus 10 new).
- New tests execute actual JSX with the installed Next SWC and real Next Link.
  They cover query preservation, implicit/explicit sort, page-1 URL consistency,
  bounded windows, invalid/empty/out-of-range states, raw component SSR hrefs,
  non-nesting, accessible current/disabled state, loading activation, modified
  clicks, scroll/history props and URL-driven return navigation. Real QueryClient
  and QueryObserver checks preserve snapshot/key parity without a duplicate fetch.
- Existing first-render/hydration and delayed-response race regressions pass.
  Two existing source assertions were updated only from PagesNumber to
  ProductPagination; their empty/loading/error/pagination assertions are retained.
  The first full run exposed those two assertion-name failures; final run passes.
- Production build passed, installed Next.js 16.3.4. Build-time
  NEXT_PUBLIC_API_URL was pinned to http://127.0.0.1:3341. Existing Google font
  download was permitted; no dependency install/change or production call.
- Safari 15.4 syntax gate passed: 81 client scripts / 5 startup scripts.
- Production-server HTML/RSC/destination and boundary checks passed.
- git diff --check, including new files, passed.
- Node prints a module-type warning when the new test imports the existing
  toPersianNumbers.js helper. This is test execution output, not a build failure;
  package module mode/dependencies were not changed.

These are component, query-state and HTTP checks. Actual browser hydration
console, keyboard focus, Back/Forward, mobile layout, network waterfalls and
physical iOS Safari checks have not been run and remain owner-run release checks.

## Performance and requests

Same loopback fixture, 36 products, default 12-item pages, one warm-up plus seven
samples per sequential row. Milliseconds are complete response timings; the
reported p95 is the largest of seven samples. Two after runs are retained rather
than selecting a favorable sample. No production/Core Web Vitals claim is made.

| Route | Before median, immediate API | After run 1 / run 2 median | Before median, 50 ms API | After run 1 / run 2 median, 50 ms API |
| --- | --- | --- | --- | --- |
| page 1 | 43.5 | 63.6 / 64.3 | 98.3 | 112.6 / 102.4 |
| page 2 | 44.6 | 58.8 / 50.0 | 102.5 | 105.1 / 99.5 |
| page 3 | 35.9 | 45.9 / 51.0 | 104.7 | 100.8 / 105.3 |

Five workers, 15 requests (pages 1-3 per worker), 50 ms API delay:

| | Before | After run 1 | After run 2 |
| --- | --- | --- | --- |
| p95 ms | 173.4 | 242.0 | 267.3 |
| responses/second | 39.2 | 25.1 | 24.5 |
| API reads | 15 | 15 | 15 |

The samples show higher immediate/concurrent response cost, not a demonstrated
performance improvement. They do not isolate code cost from host/run variation.
No additional server API/SQL reads were introduced. Uncompressed complete HTML
grew only 140 / 127 / 133 bytes on pages 1 / 2 / 3. The bounded pager has at most
nine numbered/ellipsis entries plus two arrows; it never fetches another page.

Next Link retains the existing public default prefetch policy. Next's installed
guidance says dynamic-route automatic prefetch can be skipped/partial; this is
not a measured browser waterfall. Existing next-page React Query prefetch and
one fresh SSR read on a navigation can still both occur, as documented in Phase
1B. Real browser/production throughput and text-search egress-IP throttling need
verification before release. The observed concurrent slowdown is explicitly
retained for pre-commit review; it is not characterized as negligible or a new
API fan-out.

## Exact Phase 2 files

1. src/app/(user)/products/_components/ProductsLayout.jsx
2. src/app/(user)/products/_components/ProductPagination.jsx (new)
3. src/utils/productPagination.mjs (new)
4. src/utils/productPagination.test.mjs (new)
5. src/utils/productListErrorRecovery.test.mjs (one component-name assertion)
6. src/utils/productListView.test.mjs (one component-name assertion)
7. SEO_PHASE2_REVIEW.md (new, this report)

## Preservation, evidence and remaining release checks

Task-start fingerprints cover 522 frontend and 572 backend files. Three existing
files above intentionally changed; 1,091 other existing files remain
byte-identical, including all backend files and owner flower.svg, LoginForm.jsx,
FiltersModal.jsx and SEO_AUDIT_REPORT.md. The new files above are task-scoped.
The shared pager, Phase 1 reports, snapshot helper/hook, metadata, sitemap,
JSON-LD, dependencies and shipping/return policies are unchanged. Both HEADs and
empty staging are unchanged. Both temporary verification servers were stopped.

Evidence directory:
C:/Users/Ayoob Mahmoudian/AppData/Local/Temp/jeawaz-seo-phase2-20261015

Includes initial-manifest.json, preservation.json, validation-manifest.json,
before/after raw HTML, before-http.json, after-http-run1.json, after-http.json,
boundaries.json, focused-final.log, full-tests-final.log, build.log and safari.log.
Temporary fixture/verification scripts remain outside the repository.

Before release: verify real-browser/mobile/Safari behavior, production build-time
HTTPS API origin and Liara reachability, actual deployed rollback SHA, and search
capacity/proxy topology. Production configuration and rollout are unverified.
Broader canonical/filter indexing, malformed product IDs, utility noindex,
headings/social metadata, Search Console and historical backend follow-ups remain
separate work. No shipping/return policy was changed.

Verdict: SEO PHASE 2 READY FOR PRE-COMMIT REVIEW.
This is not production release clearance. No commit, push or deploy.
