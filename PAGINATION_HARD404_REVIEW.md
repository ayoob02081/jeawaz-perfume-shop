# Product-list pagination hard-404 review

Date: 2026-10-17
Frontend baseline: 55dc97e52a015dc6ce29aa51e7baea48cf318d7c
Verdict: READY FOR PRE-COMMIT REVIEW. NOT COMMITTED OR DEPLOYED.

## Exact file manifest and scope

Production:
- src/app/(user)/products/page.jsx

Tests:
- src/lib/listingPage.test.mjs

Documentation:
- PAGINATION_HARD404_REVIEW.md (this report)

Production diff: six added lines, one deleted line. Test diff: 73 added,
four deleted lines. No new dependency, helper abstraction, route architecture,
UI, filter normalization, backend, schema, API contract or caching policy.

## Root cause and before reproduction

The shared loadListing() normalized the URL and awaited a strict successful
catalog snapshot, but passed it to metadata and ProductsLayout without checking
whether the requested page existed. listingSeoMetadata correctly marked empty/
out-of-range results noindex,follow; that alone cannot change HTTP status.

Before editing, the existing matching production build (brand Phase 2 build
fKuwcWMsFFzXir89Ae_uP) was served locally with a controlled synthetic API. The
listing source matched the committed baseline. 45 URL states under both browser
and Googlebot headers (90 document requests) reproduced HTTP 200 for nonexistent
pages, including page=999, brand, category, combined-filter and empty collections.
No production endpoint, real account or database was used.

## Smallest correction

The route imports Next notFound(). After the existing strict no-store catalog
fetch completes, loadListing checks normalized page > 1 AND page > totalPages.
Only then does it invoke notFound(), before either metadata construction or
page/Suspense rendering. Both entry points use this same decision and the same
request-scoped cached snapshot. No separate count request or next-page fetch.

An empty first page remains valid even though totalPages is zero. Requests for
page 2+ of an empty collection are nonexistent. The result is based on totalPages
from the existing validated successful API payload, not an empty items array or
an assumed default. HTTP/network/JSON/validation failures propagate before the
new check and never become a fabricated empty collection or notFound result.

The existing pure classifier's noindex fallback for empty/out-of-range payloads
is deliberately retained. Routing now rejects nonexistent pages before calling
it; legitimate empty page 1 still uses that noindex,follow policy. Malformed
page/limit normalization, first-value handling, defaults, filters, search sort
semantics, pagination hrefs and React Query snapshot adoption remain unchanged.

## Before/after document HTTP results

The fixture has 36 products (default limit 12), 18 KAYALI products (ID 22),
24 products in the women category, and six products in selected search/variant
filter fixtures. These are controlled test populations, not live inventory claims.

| Case | Before | After | After canonical/robots |
| --- | --- | --- | --- |
| Base listing last page, page=3 | 200 | 200 | Self-canonical page=3; index,follow |
| Base listing page=4 or page=999 | 200 | 404 | No canonical; noindex |
| KAYALI page=2 | 200 | 200 | brandIds=22&page=2; index,follow |
| KAYALI page=3 or page=999 | 200 | 404 | No canonical; noindex |
| Women category page=2 | 200 | 200 | gender=women&page=2; index,follow |
| Category page=3 or page=999 | 200 | 404 | No canonical; noindex |
| Combined brand/category last page | 200 | 200 | Existing noindex,follow; no canonical |
| Combined filters beyond last | 200 | 404 | No canonical; noindex |
| Search/variant filtered last page | 200 | 200 | Existing noindex,follow; no canonical |
| Search/variant filters beyond last | 200 | 404 | No canonical; noindex |
| Empty page 1, including Creed=20 | 200 | 200 | noindex,follow; no canonical |
| Page 2+ of empty collection | 200 | 404 | No canonical; noindex |
| Nondefault limit=24, last valid page=2 | 200 | 200 | Existing noindex,follow; no canonical |
| Malformed page values normalizing to 1 | 200 | 200 | Existing normalization/SEO retained |
| Genuine API errors or malformed responses | 500 | 500 | Error, never 404 |

Browser and Googlebot status, canonical and robots results matched for every
matrix URL. These checks inspected actual response status lines and complete
production-server HTML, not only the displayed error text.

## Streaming/navigation distinction

Three additional real Next RSC requests checked valid page 3, nonexistent page 4
and empty page 1. Valid/empty navigation returns a normal text/x-component result;
page 3 contains the correct product snapshot. Nonexistent RSC navigation is an
HTTP 200 streamed transport containing NEXT_HTTP_ERROR_FALLBACK;404 for Next's
HTTPAccessFallbackBoundary. It is not an ordinary HTML document response, and it
must not be reported as transport-level 404. Every RSC case used one catalog read.

This is Next's documented notFound streaming behavior: before streaming, the HTTP
status can be 404; once streaming starts, it remains 200 and carries the not-found
result. See https://nextjs.org/docs/app/api-reference/file-conventions/not-found.
No framework/proxy rewrite was added to alter the internal Flight protocol.
All checked ordinary browser/Googlebot document requests were real HTTP 404 for
nonexistent pages. Interactive browser navigation remains a manual release check.

## Final validation

- 329 focused tests passed, zero failures/skips.
- 1,163 full frontend tests passed, zero failures/skips: previous 1,131 plus
  32 new route regressions. The previous empty page=999 success test was replaced
  with a genuine empty-first-page case, while out-of-range rejection is now tested
  through both real route entry functions using concurrent callers.
- Focused tests cover last pages, the immediate next page, page=999, brand,
  category, combined/search/volume filters, nondefault page sizes, zero totals,
  malformed-page aliases, HTTP errors, network failures and invalid/missing totals.
- Metadata and rendering share one normalized snapshot/read in the route tests.
- Isolated production build passed with NEXT_PUBLIC_API_URL=https://api.jeawaz.com.
  Build ID: 6jRPUUYzk8mOZAitCiAaK. Both changed source/test files match the isolated
  build copy byte-for-byte; production source SHA-256 is recorded below.
- Safari 15.4 syntax gate passed: 81 client scripts, five startup scripts.
- Final local production-server run: 115 HTTP checks passed: 90 listing documents,
  three RSC responses, 20 product-detail responses and sitemap/robots.
- Listing documents: 44 HTTP 200, 38 HTTP 404 and eight deliberate HTTP 500 cases.
  All 82 non-error listing document requests, including 404s, fetched exactly one
  catalog snapshot. No extra successful catalog request was introduced. The
  existing Next error-render path may read twice for upstream failures.
- 20 product checks across browser/Googlebot: valid and leading-zero IDs retain
  HTTP 200, canonical product URL, one Product JSON-LD/default Offer (IRT-to-IRR
  price preserved) and real brand links. Malformed IDs return 404 without API
  calls; missing numeric IDs return 404; genuine upstream failures remain 500.
- Sitemap/robots remain HTTP 200. The 36-product fixture sitemap retains both
  populated approved brands and category coverage. Its first cold execution
  required one catalog page; repeated runs correctly reused the existing sitemap
  cache with zero reads. The committed all-21-brand sitemap tests also pass.
- git -c core.safecrlf=false diff --check passed in both repositories.

No production API or database requests, real-user probes, dependency installation,
source-repository build output, commits, pushes, release packages or deployment.
The isolated build reused unchanged installed dependencies; canonical React
module identity was checked. The raw HTML, local fixture server and request counts
are validation evidence, not a production capacity or actual-browser QA claim.

Evidence directory:
C:/Users/AYOOBM~1/AppData/Local/Temp/jeawaz-pagination-hard404-20261017

Files include before.json, before-http.log, before-observations.json,
focused.log, full-tests.log, build.log, after-http.log, after-observations.json,
first-after-observations.json (cold sitemap pass), http-pagination.cjs, raw
before/after HTML, RSC payloads, sitemap.xml and validated-hashes.json. Expected
synthetic upstream-error stack traces are negative tests. Temporary test-harness
checks were adjusted for Windows stdin encoding, the documented RSC transport
contract and reuse of the existing warm sitemap cache; no extra application fix.

## Preservation and remaining risks

1,133 repository files were SHA-256 snapshotted before edits. Only the two
pre-existing frontend files in this manifest changed. The other 1,131 remain
byte-identical, including all 591 backend files and excluded frontend
SEO_AUDIT_REPORT.md. The only new repository file is this report. Frontend HEAD
remains 55dc97e52a015dc6ce29aa51e7baea48cf318d7c and both indexes remain empty.
Root CLAUDE.md/CURRENT_STATE.md and all historical review reports are untouched.
The brand sitemap, helper, link UI, product-404 predicate/route and JSON-LD builder
are unchanged. No backend, migration, dependency, policy or shipping/returns edit.

This intentionally changes direct navigation to nonexistent page 2+ from a
successful empty listing to the existing Next not-found boundary. Empty first
pages keep their existing filter/search UI. No redirect or URL rewriting was
introduced. Inventory/catalog changes between requests can naturally change the
last page; eligibility is decided from that request's fresh validated snapshot.

Remaining owner checks: real-browser Back/Forward, filter changes and link
navigation across valid/missing pages; mobile/physical iOS Safari/VoiceOver;
post-release document statuses/noindex/canonicals and Search Console inspection.
No production deployment status, real-device success or indexing outcome is claimed.
The documented streamed-RSC 200 transport is an explicit framework limitation,
not a successful catalog-page response or a claim of universal HTTP 404 delivery.

## Validated SHA-256

The report is not self-hashed.

| File | SHA-256 |
| --- | --- |
| src/app/(user)/products/page.jsx | bf9d7f92e78f38b2130ae5727bb3290aa6fd324c8aa219e9b16b4f21eabd1571 |
| src/lib/listingPage.test.mjs | da39d08c1b361f52928593f3fb00a9aa5e95b9c3da564a8d24fce2e7b815c4af |
