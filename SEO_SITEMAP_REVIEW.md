# Sitemap and robots implementation review

Validated 2026-10-15. Frontend baseline `4025a5899042bfe3b2ccee9586d9e99cc8ecadbc`; backend `f8759fbbb82105b7e1ef1ee6b85a8e8aa9195671` remains unchanged. No commit, push, deploy, dependency change or production access.

## Routes and data authority

Actual App Router/ProductCard links use `/products/[id]`, with numeric Product IDs, not Product.slug. Categories are real query filters on `/products`, not separate category paths. The five public static entries are `/`, `/products`, `/page/about-us`, `/page/contact-us`, `/page/terms`.

Sitemap reads the existing public `GET /products` API with page/limit=100, sort=oldest and availabilityFirst=false, then includes every returned product, including out-of-stock pages. There is no draft/published/status field in the current Product entity or public contract; no unsupported publication filter was invented. Only this public listing determines product inclusion.

Active categories represented by public products contribute one URL each for the actual `gender`, `fragranceFamilies`, `seasons`, `temperature`, `characters` and `occasions` filter keys. Inactive, unknown or empty categories are omitted, values are URL encoded, and duplicates are removed. No sample product IDs or categories are hardcoded in application data.

All URLs use `https://jeawaz.com`. Valid product update/create dates supply lastModified; category-filter dates use the latest known category/matching-product update. Invalid dates and unknown static-page dates are omitted. Product page metadata uses the same canonical numeric URL. The existing root metadataBase already has the production origin.

## Caching, pagination and crawler policy

`src/app/sitemap.js` is a dynamic metadata route; it does not require a catalog connection during build. Next's `unstable_cache` caches the entire successful snapshot for 3,600 seconds, keyed by API base URL. It uses the existing non-Cache-Components configuration; no framework/config migration is introduced. Private cookies and user state are never read or forwarded. Background revalidation may retain a prior successful snapshot if the API is unavailable.

Each API request has a 10-second timeout. Pagination metadata, row counts and distinct Product counts are validated. A changing total, repeated/missing products, malformed pagination, invalid IDs or upstream failure causes generation to fail rather than caching a misleading partial sitemap. Requests are bounded to the single-sitemap 50,000-URL limit; larger catalogs need split sitemaps. This is not a transactional catalog snapshot: concurrent edits/deletions and the normal cache lifetime can temporarily retain previously valid URLs until regeneration. Stable ordering disables stock-based reshuffling, and detectable pagination drift triggers a retry.

Robots allows `/` and rendering assets; disallows private/admin/auth/cart/payment prefixes; points to `https://jeawaz.com/sitemap.xml`. No private URLs are listed. Robots rules guide crawlers; they are not access control or a guarantee of removal from search results. Existing auth/proxy and payment-result noindex behavior are unchanged.

## Validation

- Focused sitemap/robots tests: **11 passed**; cover pagination, public/out-of-stock products, active categories, encoding/deduplication, dates, empty catalogs, upstream failure, changing/malformed pagination, invalid IDs/configuration, oversized catalogs and robot policy.
- Full configured `.test.mjs` frontend suite on final source: **814 passed, zero failed/skipped**. Unconfigured Jest-style `.test.js` files are not claimed as run.
- `pnpm run build`: **passed** with Next.js 16.3.4. The initial sandboxed attempt could not download the existing Inter font; retry with network permission passed without source/font/dependency changes. API URL was pinned to a loopback fixture; **zero catalog requests during build**.
- Existing Safari 15.4 syntax gate: **81 client scripts / 5 startup scripts passed**. No device/browser UX claim is made.
- Actual `next start` HTTP verification: `/sitemap.xml` **200 application/xml**, `/robots.txt` **200 text/plain**. XML parsed with the standard sitemap namespace; every URL has the production HTTPS origin, valid dates/priorities where present, and no private URLs.
- An isolated 205-product API fixture yielded **212 URLs = 5 static + 205 products + 2 active populated category filters**, across three API pages. These are synthetic verification counts, not a production catalog count or hardcoded production entries.
- A second sitemap HTTP read returned identical XML without another catalog fetch. A cold API 503 yielded a sitemap 500; after API recovery it generated successfully, proving failures do not become cached static-only successes.
- All five static public pages, a real filter URL and a fixture product route returned 200 on the production server; product canonical was `https://jeawaz.com/products/205` for that fixture. Test API requests carried no Cookie header.
- Both local verification servers were stopped afterwards. XML, HTTP observations, build/test logs and WIP fingerprints are retained in `C:\Users\Ayoob Mahmoudian\AppData\Local\Temp\jeawaz-seo-20261015`.

## Changed files

1. `src/app/sitemap.js` (new)
2. `src/app/robots.js` (new)
3. `src/lib/seo.mjs` (new)
4. `src/lib/seo.test.mjs` (new)
5. `src/app/(user)/products/[id]/page.jsx` (canonical only)
6. `README.md` (deployment/SEO notes)
7. `SEO_SITEMAP_REVIEW.md` (this report)

## Deployment requirements

No deployment was performed; public jeawaz.com HTTP behavior has not been changed or tested against production. Build with the correct `NEXT_PUBLIC_API_URL`, keep that public API reachable from the frontend server, and verify the two metadata endpoints after deployment. Confirm actual production product IDs/category filters and Search Console sitemap submission. No backend changes, database work, credentials or new dependencies are required. Source URL coverage adapts to the public catalog after successful cache revalidation; live product/category counts were not fetched in this task. Large catalogs beyond the documented limit require a separate split-sitemap change.
