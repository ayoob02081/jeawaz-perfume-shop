# Faceted SEO Phase 1 review

Date: 2026-10-17
Frontend baseline: f9e48a02d7b09eb38d679db557ef7b807fabafc4
Verdict: READY FOR PRE-COMMIT REVIEW. No commit, push, package or deployment.

## Exact file manifest

Production:
- src/app/(user)/products/page.jsx
- src/lib/listingSeo.mjs (new)
- src/lib/seo.mjs
- src/lib/storefrontCatalog.server.mjs

Tests:
- src/lib/listingSeo.test.mjs (new)
- src/lib/listingPage.test.mjs (new)
- src/lib/storefrontCatalog.test.mjs

Documentation:
- FACETED_SEO_PHASE1_REVIEW.md (new; this report)

## Policy

The classifier consumes the existing normalized storefront query and a successful
public catalog snapshot. It does not change filter parsing, requests, keys,
URLs, pagination, navigation, UI, prices, stock or client query freshness.

| State | Robots | Canonical |
| --- | --- | --- |
| Populated base listing | index,follow | https://jeawaz.com/products |
| Valid page 2+ | index,follow | Same collection with its actual page number |
| Active populated single category represented by the sitemap rule | index,follow | Same category filter; page retained when above 1 |
| Single-brand-only, populated/in-range, otherwise default listing | Existing behavior retained | No canonical introduced; no robots restriction introduced |
| Search, with or without explicit sort | noindex,follow | Omitted |
| Nondefault sort | noindex,follow | Omitted |
| Price, stock, discount, variant/volume, grade/concentration filters | noindex,follow | Omitted |
| Multiple brands, multiple categories, or brand plus category | noindex,follow | Omitted |
| Nondefault valid page size | noindex,follow | Omitted; never falsely mapped to a differently sized page |
| Successful empty/out-of-range result | noindex,follow; existing HTTP 200 preserved | Omitted |
| Upstream failure/invalid snapshot | Error; never classified as empty | No successful listing metadata |

The existing normalization removes duplicate filter values and ignores invalid
values as before. Canonicals omit page=1, limit=12, ordinary sort=newest and
ignored/tracking parameters. During search, explicit newest remains a distinct
request/key from omitted relevance sorting; both are noindex and have no canonical.
Meaningful filters are never dropped from an approved category canonical.

CATEGORY_TYPES is exported from seo.mjs and reused, preventing a second taxonomy
map. Category eligibility uses the same exact isActive/type/trimmed-slug rule as
sitemap generation, plus evidence of membership in a returned product. Since the
sitemap traverses the public product catalog, this proves active/populated single
category membership without a taxonomy read or full sitemap fetch. All six groups
(gender, fragranceFamilies, seasons, temperature, characters, occasions) are covered.
Sitemap coverage, caching and robots.txt rules are otherwise unchanged.

## SSR, errors and compatibility

A module-level React cache wrapper uses a stable serialized normalized-query key.
Its memo is request-scoped, not a persistent product cache. Metadata and rendering
share one snapshot even when passed separate searchParams promises. Rendering
passes that same snapshot to the unchanged ProductsLayout. Existing no-store,
anonymous fetch options, query keys and hydration/snapshot-race protections remain.
No category/name lookup, per-product fetch or additional successful catalog read.

fetchCatalogSnapshot gains opt-in throwOnError. Only listing SSR enables it:
HTTP/network/invalid payload failures propagate, rather than producing an empty
listing or successful indexing decision. The homepage's existing fallback remains
the default and is covered by the existing suite. Genuine successful empty results
remain client snapshots with their original metadata and recovery navigation.

Next's production error-render path made two upstream reads for injected 503s;
no application retry was added. The same two-read failure behavior exists on the
unchanged product-detail error path. All 98 successful listing-matrix requests
used exactly one catalog read shared by metadata and rendering.

## Before/after production HTTP evidence

Before evidence: the immediately preceding faceted audit, same baseline, actual
Next production server and synthetic API. Listings had static metadata, no
canonical and no page-level robots directive for all tested URL classes.

After evidence: clean isolated Next 16.3.4/Turbopack production build,
build ID z-fJ2EfhwgAeb4JkkCDst, confirmed build-time API URL https://api.jeawaz.com.
All runtime API I/O was redirected to local synthetic fixtures. No production
API requests, database operations or real product/customer data were used.

- 50 listing URL states x browser/Googlebot headers = 100 matrix requests.
  98 returned expected 200s; two injected upstream-503 cases returned actual 500s.
  Canonical/robots results matched across both user agents.
- Base, default aliases and ignored parameters canonicalize to /products.
- Page 2: canonical /products?page=2; raw HTML links to fixture IDs 117-128.
  Page 3: canonical /products?page=3; fixture IDs 129-140. Page 1 IDs 105-116.
- Category page 2 preserves its filter and page in the canonical; actual HTML
  correctly escapes query separators as &amp;.
- Empty/out-of-range pages retain their UI/recovery links and HTTP 200 but now
  emit noindex,follow without a canonical. Search and excluded filters do likewise.
- Populated single-brand pages on pages 1 and 2 retain no canonical and no robots
  directive. No brand sitemap entries were added.
- Each of 98 successful matrix responses contained exactly the expected zero/one
  canonical and robots tag; no duplicate declarations.
- Combined search/sort/gender/brand/volume/page query reached the API unchanged.
- Two additional same-URL requests rendered changed fixture data and each fetched
  once, proving there is no cross-request snapshot/price reuse.
- robots.txt and sitemap.xml returned 200. All six fixture category sitemap URLs
  had matching indexable self-canonical listing responses.
- Separately reran 115 production HTTP product-detail checks across five agents:
  malformed IDs remain 404 with zero API calls; valid/leading-zero products remain
  200 with correct metadata/canonical and one Product JSON-LD/default Offer;
  missing products remain 404 and genuine API failures remain server errors.

Total: 104 listing/freshness/robots/sitemap requests plus 115 product-detail
requests. User-agent HTTP checks are not physical/interactive browser automation.

## Tests and build

- 181 focused tests passed; zero failures/skips.
- Full frontend native Node suite: 1,018 passed; zero failures/skips.
- Includes 97 pure classifier cases, four real-route wiring tests and two strict
  snapshot tests. Route unit tests model one request's memo store; the real React
  scoping/request-count assertions are the production HTTP checks above.
- Production build passed: 13.1-second compilation, 33 static pages generated;
  /products remains dynamic. No production catalog data required at build time.
- Safari 15.4 syntax gate passed: 81 client scripts, five startup scripts.
- git -c core.safecrlf=false diff --check passed in both repositories.

Local validation evidence (not a release artifact):
C:/Users/Ayoob Mahmoudian/AppData/Local/Temp/jeawaz-faceted-seo-phase1-20261017

Evidence files: focused.log, route-tests.log, full-tests.log, build.log, safari.log,
http-policy.cjs, http-policy.log, http-observations.json, saved raw listing HTML,
robots.txt, sitemap.xml, http-product-404.cjs, product-404-http.log and
product-http-observations.json. Application feature source hashes match the build.

The isolated build reuses unchanged installed dependencies via local file links
and canonical junctions. No dependency installation or package/lockfile change.

## WIP and remaining decisions

1,124 pre-task repository files were SHA-256 snapshotted. Only the four existing
files in the manifest changed; the other 1,120 remain byte-identical. New files
are the classifier, two tests and this report. All backend WIP, untracked frontend
SEO_AUDIT_REPORT.md, product-404 source/tests, root handoff notes and unrelated UI
remain untouched. Both HEADs and indexes are unchanged; nothing is staged.

Deferred: single-brand canonical/indexing policy and brand sitemap inclusion;
unique facet landing metadata/content; curated merchandising exceptions; hard 404
for nonexistent pagination; internal URL cleanup and measured crawl-budget work.
Metadata does not block crawling or rewrite browser/pagination URLs. Google-selected
canonicals, actual indexing and production crawl costs require owner Search Console
checks. Interactive browser and physical-device checks remain unperformed.

No backend changes, migrations, database writes, dependency changes, commits,
pushes, release packaging or deployment. Nothing is claimed live in production.

## Validated file hashes

SHA-256 of application/test files (this report is not self-hashed):

| File | SHA-256 |
| --- | --- |
| `src/app/(user)/products/page.jsx` | `defbf44c06a778fc25be768d96eb414cfb1636911a087b40a10a1f2f9cdba9c6` |
| `src/lib/seo.mjs` | `dfb8d9601e6a711d357b05a9f94d45e7334453176632d36a08f7057157382541` |
| `src/lib/storefrontCatalog.server.mjs` | `ed33a58b77a392c6dbfe26f96b9f2b28aa3f02302df201cab4185c26c39134a6` |
| `src/lib/listingSeo.mjs` | `f08876c81ab903e9ed45287f0f3edc4934927b4825d3255942144dc8e3996212` |
| `src/lib/listingSeo.test.mjs` | `0bea55e50ec2f701e9a1bf9cf71ee3001032f02cf5e70bef6643976f302d6c0d` |
| `src/lib/listingPage.test.mjs` | `13f5376095efc27e70867eb9aa5b7182f3e67e19863fc99606f45a82ab9994a4` |
| `src/lib/storefrontCatalog.test.mjs` | `03cd07f9b63ab2f4662530312b27bac6128cfb199845b642dedd3752378a1233` |
