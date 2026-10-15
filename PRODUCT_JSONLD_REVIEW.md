# Product JSON-LD implementation review

Validated 2026-10-15. Frontend baseline `e2492f3918d00137c8b355dfc690fac2d1a9c0e5`;
backend `f8759fbbb82105b7e1ef1ee6b85a8e8aa9195671` unchanged. No commit, push,
deploy, database access, dependencies or API/UI changes.

## Scope and schema

`src/lib/productJsonLd.mjs` is a pure builder and serializer. The numeric product
server page uses the same already-fetched Product for the JSON-LD and visible UI.
There is one Product, with at most one Offer, for the UI default: existing helpers
choose the first purchasable mode (decant before sealed), then its smallest
purchasable volume. No eligible default is replaced just to advertise an offer.
The existing UI fallback for old APIs is preserved, but schema never infers
availability from physical stock: only exact boolean `isPurchasable === true`
can create an InStock offer. False may represent inventory/price problems, so
OutOfStock is not guessed. With no valid offer, factual Product identity remains.

The visible perTitle, actual variant label/volume and known grade describe the
item. SUPER_MASTER is explicitly named and has no brand/manufacturer assertion;
unknown-grade items also omit brand. ORIGINAL uses the actual associated brand
title (value fallback). Description and product-image paths come from the API.
Images reuse AppImage's source resolver, convert root-relative assets to the site
origin and upload paths to the configured API origin, remove duplicates and
reject malformed/non-HTTP/credential URLs. No placeholder images are invented.
Production image accessibility still requires owner verification; pure URL
validation is not an external reachability probe.

Existing calculateVariantPrice supplies campaign-over-product-discount precedence
and both thousand-toman rounding steps. Raw base price, final IRT price and IRR
x10 result must be positive safe integers. No locale formatting, cart coupon,
shipping cost or gateway-specific minimum is added. Zero/invalid/unsafe prices
omit the offer. No ratings, reviews, SKU/GTIN/MPN, itemCondition, validity date,
shipping/return policy, seller identity, ProductGroup or selectable variant URLs
are fabricated. Existing fetching/memoization is unchanged; no cache is added.

Serialization escapes `<`, `>`, `&`, U+2028 and U+2029, retaining exact JSON string
values while preventing script-breakout text. 404 and API failures retain their
existing behavior and do not produce Product JSON-LD.

## Synthetic example (not a production catalog assertion)

An ORIGINAL fixture with a 5 ml decant at 125,999 IRT, product discount 50% and
active decant campaign 17% produces: normalized base 125,000; discounted 103,750;
final displayed 103,000 IRT; Offer price 1,030,000 IRR. Product name includes
`Fixture perfume — دکانت ۵ میل`, size `5 ml`, numeric canonical
`https://jeawaz.com/products/1`; Offer name is `دکانت ۵ میل`, currency `IRR`,
availability `https://schema.org/InStock`. Full generated fixture JSON is in
the evidence directory's `schema-example.json`; its loopback image origin is
for isolated testing only and is not production configuration.

## Validation

- Focused builder, availability and sitemap regression: **42 passed** (14 new
  JSON-LD tests). Covers default vs list representative/cheapest variant, sealed
  fallback, reserved stock, campaign scopes/rounding, safe conversion boundaries,
  old APIs, empty/invalid data, image resolution, SUPER_MASTER and script XSS.
- Full configured `.test.mjs` suite: **828 passed, zero failures/skips**. No
  unconfigured Jest-style tests are claimed as run.
- Production build: **passed**, Next.js 16.3.4 Turbopack. Ran the exact package
  build subprocesses directly (`node node_modules/next/dist/bin/next build`, then
  `node scripts/check-browser-compat.mjs`) without installing dependencies. The
  existing Google Inter download was allowed; API pinned to loopback 3331.
- Safari 15.4 syntax gate: **81 client scripts / 5 startup scripts passed**.
  This is not a physical-device UX verification.
- Actual `next start` HTML, no browser execution: eight fixture products each
  returned 200 with exactly one parseable JSON-LD script and matching canonical.
  Tested decant and sealed defaults, unavailable/old-API/invalid-price offer
  omission, SUPER_MASTER brand omission, missing optional fields and malicious
  closing-script text. Visible prices matched schema after exact x10 conversion.
- Fixture image HTTP 200. One subsequent API reprice changed rendered UI and
  JSON-LD from 103,000 IRT / 1,030,000 IRR to 207,000 IRT / 2,070,000 IRR on the
  next request, confirming no new cross-request offer cache. API 503 -> page 500;
  missing product -> 404; both without a JSON-LD script. API requests had no Cookie.
- Source/dependency/owner-WIP fingerprints and `git diff --check` verified.
  Existing frontend WIP (flower.svg, LoginForm.jsx, FiltersModal.jsx) and all
  backend files remain unchanged. Both local verification servers were stopped.

Evidence: `C:\Users\Ayoob Mahmoudian\AppData\Local\Temp\jeawaz-product-jsonld-20261015`
(test/build/Safari logs, initial/final fingerprints, raw HTML, schema example,
HTTP verification). Synthetic fixture data is outside the repository.

## Changed files and remaining gates

1. `src/lib/productJsonLd.mjs` (new builder/serializer)
2. `src/lib/productJsonLd.test.mjs` (new regressions)
3. `src/app/(user)/products/[id]/page.jsx` (server script only)
4. `README.md` (usage/limitations)
5. `PRODUCT_JSONLD_REVIEW.md` (this report)

Google Rich Results Test and Search Console have not been run. Before release,
the owner must confirm the live API's availability fields and image accessibility,
build with the actual public HTTPS NEXT_PUBLIC_API_URL, validate generated HTML in
Rich Results Test and, after approved deployment, use URL Inspection. Product
offers/images may be absent when unknown; those pages are not promised merchant
listing eligibility. Only the default variant is covered: no complete variant
eligibility or ProductGroup claim. A valid payload never guarantees Google display.

References: https://nextjs.org/docs/app/guides/json-ld and
https://developers.google.com/search/docs/appearance/structured-data/merchant-listing

Verdict: PRODUCT JSON-LD READY FOR PRE-COMMIT REVIEW (local implementation/validation;
production and Google checks remain owner-run gates).
