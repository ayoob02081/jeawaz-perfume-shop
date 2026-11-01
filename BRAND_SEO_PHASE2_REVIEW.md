# Brand SEO Phase 2 review

Date: 2026-10-17
Frontend baseline: 58fedcd9b751b582528b467facf670d0bf834bf2
Verdict: READY FOR PRE-COMMIT REVIEW. NOT COMMITTED OR DEPLOYED.

## Exact changed-file manifest

Production (five files):
- src/lib/brandSeo.mjs
- src/lib/listingSeo.mjs
- src/lib/seo.mjs
- src/components/BrandLandingLink.jsx
- src/app/(user)/products/_components/SingleProductPage.jsx

Tests (four files):
- src/lib/brandSeo.test.mjs
- src/lib/listingSeo.test.mjs
- src/lib/listingPage.test.mjs
- src/utils/protectedLinkPrefetch.test.mjs

Fixture (one file):
- src/lib/fixtures/brands.mjs

Documentation:
- BRAND_SEO_PHASE2_REVIEW.md (this report)

No route loader, filter/query contract, React Query hook, pagination, product-404
predicate, Product JSON-LD builder, package, lockfile, backend or root handoff
file was changed. Existing owner notes remain intact.

## Approved policy and inventory provenance

The owner explicitly approved IDs 1-19, 21 and 22. KAYALI is 22; Creed is 20
and is excluded. The pure brandSeo.mjs helper is shared by listing metadata,
sitemap eligibility and existing product-logo destination links. It contains
IDs only, never a runtime hardcoded name table. The fixture records the public
/brands inventory verified in the preceding live audit on 2026-10-17: 22 brands,
21 populated, 123 listed products; counts matched independent public catalog and
rendered storefront pagination counts. This implementation run reused that
inventory and made no production API or database requests.

Approval is an editorial decision, not an isActive flag (Brand has no persisted
activation field), and not proof of demand, indexing, trademark accuracy or stock.
All names come from the returned brand.title. Only positive decimal primitive
IDs on the allowlist and nonempty Persian/Arabic-script titles qualify. No
English-only, guessed, missing or historical-name fallback exists. Every row
of a successful brand listing must confirm the requested ID and same trimmed
title. Missing, mismatched or conflicting identity produces noindex,follow
without a canonical, rather than borrowing another product's brand name.

| Listing state | Policy |
| --- | --- |
| Approved populated single-brand page, default filters/limit/sort | index,follow, real-name metadata, normalized self-canonical |
| Valid page 2+ of that brand | Same policy, preserving its actual page number |
| Repeated identical IDs, leading zeros, page=1, limit=12, ordinary newest and ignored tracking | Existing normalization; equivalent canonical |
| Search, nondefault sort, prices, stock/discount, variants, grade/concentration, nondefault page size, multiple brands or brand/category combinations | Existing Phase 1 noindex,follow exclusions take precedence; no canonical |
| Empty/out-of-range success | Existing HTTP 200 and noindex,follow; no canonical |
| Populated unapproved/future brand | Existing Phase 1 behavior retained; no new metadata/canonical/robots policy |
| API/network/malformed snapshot failure | Existing error propagation; never fabricated empty success |

Malformed brand query values still follow existing filter normalization and can
be ignored as before; they are not promoted to a named brand page. Stock on the
current page never controls collection eligibility. An unavailable-only second
page stays indexable when populated. No future brand is approved automatically.

Example for real KAYALI data:
- Title field: عطر و ادکلن کایالی
- Rendered title: جیاواز پرفیوم | عطر و ادکلن کایالی
- Description: مشاهده عطر و ادکلن کایالی در جیاواز پرفیوم؛ بررسی قیمت، حجم و وضعیت موجودی محصولات.
- Canonical: https://jeawaz.com/products?brandIds=22
- Page 2 canonical: https://jeawaz.com/products?brandIds=22&page=2

No blanket ORIGINAL/authenticity claim, guaranteed availability, brand biography,
price or invented commercial policy was added. Next/React escape metadata and
link attributes; hostile text escaping is covered by focused tests.

## Crawlable links and preserved UI

Existing mobile and desktop product-detail brand logos now use BrandLandingLink.
The original image props, sizing, responsive classes, spacing and RTL layout stay
in place. Approved named brands render accessible real Next Link anchors to the
brand's normalized first page. Missing/unapproved brands retain the original div
wrapper. No anchor is nested in a checkbox, button or another anchor. Existing
multiselect brand controls are untouched; links intentionally navigate to a clean
single-brand collection rather than carrying unrelated current filters.

Prefetch is explicitly false for the logo links: viewing a product must not issue
extra catalog reads for two responsive logos. The pre-existing repository-wide
prefetch test initially flagged this new reviewed opt-out. Its narrow wrapper
manifest was extended and now explicitly requires prefetch=false for this exact
component; protected-route and other public-link checks remain intact. No other
application correction was needed. Normal browser link/modifier behavior comes
from Next Link; no navigation click handler intercepts it.

## Sitemap and caching

Existing product traversal supplies brand membership and real names. Brands are
deduplicated and added only if approved and represented by listed public products
with consistent identity. Only first-page brand URLs are emitted. Existing static,
product and category coverage, pagination validation, failure behavior, 50,000 URL
limit and successful-result one-hour sitemap cache remain unchanged. Brand
lastModified derives from real product/brand timestamps, never generation time.

The traversal retains only identity/timestamps for validation, not complete
product variants/images. No per-brand or /brands requests are introduced. The
123-product fixture requires the same two catalog pages and emits exactly 150
URLs: five static + 123 products + one category + 21 brands. The unit suite also
checks malformed/unapproved/conflicting brands do not drop product URLs.
These fixture totals are not a claim about live sitemap category coverage.

Listing metadata still shares the existing request-scoped no-store snapshot with
rendering. There is no new persistent listing, price or availability cache, no
new query key, and no hydration/adoption/cancellation change.

## Final validation

- Focused regression suite: 309 passed, zero failures/skips.
- Full frontend native Node suite: 1,131 passed, zero failures/skips (1,018 baseline
  plus 113 added cases). Final suite rerun after the small primitive-ID guard and
  sitemap memory bound; existing price/default variant/filter/mobile/search tests
  remain included.
- Isolated production build passed with NEXT_PUBLIC_API_URL=https://api.jeawaz.com.
  Build ID: fKuwcWMsFFzXir89Ae_uP. Production application file hashes match the
  working files exactly. The isolated copy has no owner .env or unrelated WIP.
- Safari 15.4 syntax gate passed: 81 client scripts, five startup scripts.
- Real local Next production server: 181 HTTP checks passed, with browser and
  Googlebot headers. 115 listing responses, 64 product-detail responses and two
  sitemap/robots responses. All runtime API I/O was redirected to local fixtures;
  unexpected external requests were blocked. No DB, production or backend changes.
- All 21 brand first pages and four valid second pages have exactly one correct
  canonical and index,follow. Each has real-name titles/descriptions and the correct
  product-link count; second-page canonicals preserve page=2 and unavailable items.
- All 21 product detail pages render both responsive brand logo anchors. One
  Product JSON-LD with the correct default Offer remains server-rendered, with IRR
  price and canonical unchanged. Leading-zero product URLs remain supported.
- Malformed product IDs return actual 404 with zero API calls; missing valid IDs
  return 404; genuine upstream 400/500 detail failures remain actual server errors.
- Excluded filter combinations, Creed, unknown IDs, empty and out-of-range states,
  duplicate/default aliases and corrupted brand identity match the policy above.
- Successful listings: 113 responses, exactly one catalog read each,
  shared by metadata/rendering. No brand lookup or N+1 reads. Changing fixture data
  between same-URL requests is visible, proving request isolation. Injected upstream
  failures remain 500; Next's existing failure render may perform two reads.
- Local synthetic diagnostic for 56 successful canonical brand requests:
  p50 21.2 ms,
  p95 44.2 ms,
  maximum 217.4 ms (includes cold request). This sequential
  local sample is not a before/after capacity benchmark or a production latency claim.
- git -c core.safecrlf=false diff --check passed in both repositories.

Evidence directory (local validation only, not a release package):
C:/Users/AYOOBM~1/AppData/Local/Temp/jeawaz-brand-seo-phase2-20261017
Includes focused.log, full-tests.log, build.log, http-brands.cjs,
http-brands.log, http-observations.json, raw response HTML, sitemap.xml,
before.json and validated-hashes.json. Expected synthetic upstream-failure stack
traces in http-brands.log are deliberate negative tests. An early fixture failure
was corrected so invalid identity is injected after filtering, rather than being
removed by the fixture's brand filter; it was not an application defect.

## Owner WIP preservation and remaining checks

Before edits, 1,128 files were SHA-256 snapshotted across both repositories.
Only six pre-existing frontend files changed, all in the manifest. The other
1,122 files remain byte-identical, including all 591 backend files and excluded
frontend SEO_AUDIT_REPORT.md. New files are the helper, link component, test,
brand fixture and this report. Both Git HEADs and indexes are unchanged.
Dependencies were reused from the existing verified installation via an isolated
copy; no install, lockfile changes, migration, commit, push, packaging or deployment.

Not performed: interactive browser/mobile navigation or physical iOS Safari /
VoiceOver checks. The HTTP checks use user-agent headers and do not prove visual,
focus, hydration-console or device behavior. Existing hydration/query-state tests
pass and their implementation is untouched. Owner release smoke checks should
cover logo navigation, filters, Back/Forward, pagination, RTL/responsive layout
and browser console. Search Console selected canonicals, actual indexing and
query demand remain owner checks; no ranking/indexing guarantee is made.

Deferred Phase 1 decisions (pagination hard 404, deeper landing copy, broader
indexing policy and measured crawl-budget work) remain separate. A future brand
or an unapproved populated brand is not silently deindexed or auto-approved.
No production deployment status is inferred from local Git.

## Validated SHA-256 manifest

The report is intentionally not self-hashed.

| File | SHA-256 |
| --- | --- |
| src/lib/brandSeo.mjs | f56c0acdbda89404a56c07e6ba3171323ee62f062c92daf71f703898057b7b9f |
| src/lib/listingSeo.mjs | b60a335bba2341c0f200f164705393f3b3196e7a07904c21cebf1c37f459ad45 |
| src/lib/seo.mjs | 849b854bd563354cc1b97c2e80ae6cad9c1f2d39cf6d6e48e9555611859edc20 |
| src/components/BrandLandingLink.jsx | 440d4d37ad6c44944ddb299bbd0f748db447c902ecafcb6c242426d874755dd9 |
| src/app/(user)/products/_components/SingleProductPage.jsx | ddaaf69c8d1afa787da4ddbc80c9d31f43ac387b625f89137907adb3dabf4079 |
| src/lib/brandSeo.test.mjs | c95507a457659c0f9cdd55adc37089d4b5e98669ab9de1b0fde3b5ef6005f5a7 |
| src/lib/listingSeo.test.mjs | 850b38bc5ff1f3c213937712700088afade9334c9e7cf1c7b97537281e914da8 |
| src/lib/listingPage.test.mjs | 05332cc0a5b547aa96324ddc7d33478c04b84670c187f32a441951a076379b03 |
| src/utils/protectedLinkPrefetch.test.mjs | 21cb228ee26d7d9388e146e37319cde75fc927ceb39469b016ab7b1bc1d37579 |
| src/lib/fixtures/brands.mjs | bcb025f8aa1cd7da80b7b022d9fb7fb62fa5abe21a3eafcd78249be064411881 |
