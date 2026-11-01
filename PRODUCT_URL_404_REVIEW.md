# Product URL 500 to 404 correction

Date: 2026-10-17
Frontend baseline: e3426d5ee9c78c6629f7b5cbf43cea04fb641473
Verdict: COMMIT-READY. No commit, push, package or deployment performed.

## Root cause and bounded correction

The shared SSR product loader forwarded unchecked route IDs to the API. The
backend rejected some malformed IDs with 400; the loader correctly propagated
non-404 API failures, so Next returned 500 for those malformed storefront URLs.
The existing productUrl validator already defined the intended public-ID contract.

Export that unchanged predicate as isValidProductId and reuse it in productUrl
and at the beginning of the React-cached SSR loader. Invalid IDs return null
before HTTP access, allowing the existing page notFound() to produce 404.
Both generateMetadata and Page still share the same loader. No API-error catch,
cache policy, product UI, canonical, sitemap or JSON-LD construction was changed.
Only ASCII decimal digits representing a positive safe integer are accepted;
leading zeros remain supported. This does not introduce a database INT-size cap.

## Exact changed files

- src/app/(user)/products/[id]/page.jsx: early ID guard and validator import.
- src/lib/seo.mjs: expose and reuse the existing ID predicate.
- src/lib/seo.test.mjs: shared validation and canonical compatibility cases.
- src/lib/productPage.test.mjs: 23 behavioral regressions executing the real page
  and metadata exports through Next's installed SWC; HTTP/notFound boundaries are
  replaced. Request-cache behavior is checked separately on the production server.
- PRODUCT_URL_404_REVIEW.md: this review and validation evidence.

Production diff: 8 additions / 2 deletions across two files. No backend changes.

## Before and after HTTP evidence

Before evidence comes from the immediately preceding audit of the identical
committed product-page implementation. After evidence uses the newly built
Next.js 16.3.4 production server, not a development server or a displayed error
page. Tests read actual HTTP status, complete HTML and upstream request counts.

| Case | Before | After | After API calls per request |
| --- | --- | --- | --- |
| abc, 1.5, 400-digit ID | 500 | 404 | 0 |
| 105.0, 0x69 (formerly coerced aliases of fixture 105) | 200 | 404 | 0 |
| 1e3, zero, negative, unsafe integer | 404 via API | 404 locally | 0 |
| Existing fixture 105 and leading-zero 00105 | 200 | 200 | 1 |
| Valid missing numeric ID, including a delayed API 404 | 404 | 404 | 1 |
| Genuine upstream 500 | 500 | 500 | Existing error-path behavior |
| Genuine upstream 400/503 on valid numeric IDs | Not separately measured | 500 | Existing error-path behavior |

After: 23 URL cases x 5 user agents = 115 successful HTTP assertions:
90 expected 404, 10 expected 200, 15 expected 500. Browser-style, Firefox,
Googlebot, Bingbot and Twitterbot headers were sent to the real local server.
These are HTTP user-agent checks, not interactive browser automation.

Every malformed route skipped the API. Valid and missing product requests used
one shared upstream load across metadata and rendering. Missing/invalid products
had noindex, no canonical link and no Product JSON-LD. Existing fixtures retained
title/description, canonical https://jeawaz.com/products/105, exactly one Product
schema, InStock and the correct IRR 1,000,000 default Offer. No product data was
cached across requests by this change. Existing non-404 failures still propagate.

The API fixture used the actual compiled Nest ProductController, ProductService,
ValidationPipe and exception filter with an in-memory repository. All outbound
product HTTP requests were redirected to loopback; other external API I/O was
blocked. No real accounts, database connections or production API requests.

## Validation

- Before correction: new page suite 7 passed / 16 failed because invalid IDs
  reached the HTTP boundary. After correction: all 23 passed.
- Focused page, sitemap and JSON-LD suites: 48 passed, zero failures/skips.
- Full frontend native Node suite: 915 passed, zero failures/skips.
- Clean isolated production build: PASS, Next.js 16.3.4/Turbopack; compiled in
  17.5 seconds, 33 static pages generated. NEXT_PUBLIC_API_URL was the confirmed
  https://api.jeawaz.com. Dynamic product/catalog routes did not fetch production
  data during build.
- Safari 15.4 syntax gate: PASS, 81 client scripts including five startup scripts.
- Production-server build ID: 63jkC2cWEKulHIj12onL-; 115 HTTP assertions passed.
- git -c core.safecrlf=false diff --check: PASS in both repositories.

Validation directory (local, not a release artifact):
C:/Users/Ayoob Mahmoudian/AppData/Local/Temp/jeawaz-product-url-correction-20261017

Evidence: before-tests.log, focused-tests.log, full-tests.log, build.log,
safari-gate.log, http-regressions.cjs, http-regressions.log,
http-observations.json and saved per-request HTML. Previous audit HTTP evidence:
../jeawaz-product-id-audit-20261017/http-observations.json.

Windows validation setup initially failed on dependency junctions and equivalent
short/long TEMP paths. A physical dependency copy with canonical junction targets,
canonical TEMP/TMP and a fresh isolated build cache resolved it. No source or
package workaround was required. No dependency install or dependency change.

## WIP preservation and remaining scope

Before work, 1,122 tracked/untracked files across the independent repositories
were SHA-256 snapshotted. Exactly the three listed tracked frontend files changed;
the other 1,119 files remain byte-identical, including all backend WIP and the
untracked frontend SEO_AUDIT_REPORT.md. The test and this report are new files.
Both HEADs and indexes remain unchanged; nothing is staged.

No backend, environment, dependency, migration, root handoff, pagination, search
or unrelated UI changes. The isolated build leaves the owner's .next untouched.
Direct backend numeric-validation behavior is outside this correction. Production
and physical-device checks were not performed; no deployment is claimed.

## Validated feature hashes

SHA-256 of the four application/test files (this report is not self-hashed):

| File | SHA-256 |
| --- | --- |
| `src/app/(user)/products/[id]/page.jsx` | `4da66b3fa9005b5ac493af8427bade2774b08fc4d57d9443af31b67034e2efec` |
| `src/lib/seo.mjs` | `e4e65d1d07f9ce852f563f15bcb84d23faf30518619a5b816cb7cf7f7e23fa4b` |
| `src/lib/seo.test.mjs` | `52a9727a2ff8d6c46ff947b390137c93d20154e54986f5b97db00f5f17a452f9` |
| `src/lib/productPage.test.mjs` | `bc1addaeb5bc7faec4a58704cf7921a09b11804a4e304b48699c180111ba63eb` |
