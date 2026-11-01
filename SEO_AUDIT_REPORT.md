# Jeawaz storefront SEO audit

Audit date: 2026-10-15 (Asia/Tehran). Read-only application audit; this report is
the only repository file created. No implementation, commit, push, deployment,
dependency change, database access or policy change was performed.

## Evidence boundary

- Frontend inspected: `b70c33d4b0574f2e8a8a1097be047b134c8e79ed` on
  `01-app-layout`, plus the explicitly preserved existing owner WIP.
- Backend inspected: `f8759fbbb82105b7e1ef1ee6b85a8e8aa9195671`.
- Read CLAUDE.md, AGENTS.md, project context/current state and frontend rules.
  Older root-document frontend SHAs do not override verified Git HEAD.
- Production reference: `https://jeawaz.com`. CLAUDE.md prohibits contacting
  production from this workspace, so no live site/API requests were made.
  Deployed SHAs, production API configuration and actual product 105 remain
  unverified. No Search Console access, exports, screenshots or traffic data
  were supplied. No indexing loss, ranking penalty or traffic gain is asserted.
- Inspected actual routes, components, helpers and backend parameter validation.
  Reused the previously verified exact-commit clean production build, without
  rebuilding or rerunning full suites. Started it locally against an in-memory
  catalog; inspected initial HTTP HTML and status codes. Synthetic products and
  category/brand query examples are not claims about the production catalog.
- For malformed IDs, the local fixture modeled backend 400 behavior, separately
  confirmed by executing the installed Nest ParseIntPipe without a database.
  Numeric missing IDs were separately modeled as 404. This is a contract-level
  reproduction, not an end-to-end production/backend-database test.

## A. Current SEO architecture

### Routes and metadata

| URL family | Source behavior | SEO state observed locally |
| --- | --- | --- |
| `/` | `src/app/(user)/page.jsx`; inherits root title/description | 200; brand title, store description; no explicit canonical, Open Graph or h1; product sections fetch on client |
| `/products` and query variants | `src/app/(user)/products/page.jsx:4`; static metadata and Suspense-wrapped client listing | 200; identical listing title/description for filters, sort and pagination; no canonical/noindex; initial HTML contains no individual product links |
| `/products/{numericId}` | Server fetch + generateMetadata in `src/app/(user)/products/[id]/page.jsx:8` | Product title/description, numeric HTTPS canonical, product content and one Product JSON-LD script in initial HTML |
| `/page/about-us`, `/page/contact-us`, `/page/terms` | Each public page exports its own title/description | 200; distinct page titles/descriptions and h1; no explicit canonical/Open Graph |
| `/cart`, `/auth/login` | Cart metadata; login inherits root metadata | Publicly loadable utility pages; robots disallows prefixes, but pages emit no noindex |
| `/admin/**`, `/profile/**` | `src/proxy.js` applies navigation auth checks | Private routes omitted from sitemap and disallowed by robots; no layout-level noindex; backend authorization remains separate |
| `/payment/result` | `src/app/(user)/payment/result/page.jsx:4` | Explicit noindex/nofollow exists; robots also disallows payment prefix |
| Unmatched routes / missing numeric products | Global not-found / getProduct maps API 404 to notFound | Local controls returned 404 with no Product JSON-LD |

Root metadata is in `src/app/layout.jsx:12`: Persian title template, store
description and `metadataBase = https://jeawaz.com`. metadataBase resolves URLs;
it does not itself emit a canonical. No Open Graph or Twitter metadata definition
was found in the current app sources.

### Catalog, taxonomy and structured data

- Actual public product links use numeric IDs. Product.slug exists in the backend
  (`backend/src/product/entities/product.entity.ts:48`) but there is no public
  slug route. Numeric URLs are not an SEO defect; no URL migration is warranted
  solely to make URLs descriptive. Leading-zero numeric URLs locally canonicalize
  correctly to the API's real numeric ID.
- Categories are query filters: gender, fragranceFamilies, seasons, temperature,
  characters and occasions. Brands are `brandIds` filters. There are no dedicated
  public brand/category landing routes in the App Router inventory. Admin brand
  pages are not public landing pages. This is an architecture description, not
  proof that separate landing pages would generate traffic.
- Detail content is fetched server-side and passed into the client UI. Using a
  client component does not mean the detail content is absent from server HTML;
  the local response contains the product name, description, price and JSON-LD.
- `src/lib/productJsonLd.mjs:35` builds one Product and at most one Offer for
  the initial selected variant. Existing selection/pricing helpers determine its
  package and final price. IRR = final IRT x10 with integer bounds; explicit
  `isPurchasable === true` is required. SUPER_MASTER retains its grade without a
  brand manufacture claim. Missing/invalid offers are omitted, not invented.
- No related-product section was found in SingleProductPage. Breadcrumbs link
  home, the product list and the current product using real Link components
  (`src/ui/BreadCrumb.jsx:9`). Missing related products or BreadcrumbList JSON-LD
  is an optional opportunity, not an established indexing failure.

### Sitemap and robots

`src/lib/seo.mjs:3,29,44` and `src/app/sitemap.js:6` implement canonical HTTPS
static URLs, all numeric public-catalog product URLs and active populated category
filter URLs. Public API pagination is validated; stock does not hide public pages.
No publication flag exists in the current Product contract. Complete successful
snapshots are cached for one hour. Cold upstream failure returns an error rather
than a misleading static-only success; background failure can retain a prior
snapshot. It is not a transactional catalog snapshot. The 50,000-total-URL limit
fails explicitly and needs split sitemaps only if actual size reaches it.

Robots allows `/` and rendering assets, disallows admin/profile/auth/cart/payment
prefixes, and references `https://jeawaz.com/sitemap.xml`. No confirmed rule
accidentally blocks public products. The sitemap's inclusion of category filters
is a discovery hint; it does not establish distinct content or Google indexing.

## B. Confirmed source findings

Priorities reflect technical reach and likely usefulness of correction, not a
measured production traffic effect. These are mostly existing storefront gaps;
they do not invalidate the narrower reviewed sitemap/JSON-LD implementation.

### F1. High — Product and category cards use action buttons instead of destination links

**Evidence:** `src/app/(user)/_components/ProductCard.jsx:100` renders a button
calling `router.push('/products/' + id)`. Gender category cards at
`GenderCategoriesLayout.jsx:68` and character cards at
`AccordCategoriesLayout.jsx:68` use the same button/navigation pattern. The
ProductCard has no anchor carrying the product destination.

**Reproduction/root cause:** inspect a card after data loads: its destination
exists only inside a click handler, not `<a href>`. Initial home/listing HTML also
contains no individual product anchors. Google does not generally trigger these
user actions to discover destinations. [Google JavaScript guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)

**Impact:** the main merchandising surfaces do not provide ordinary crawlable
product links or their contextual anchor text. Sitemap discovery mitigates this;
it is incorrect to call every product undiscoverable or proven orphaned.

**Smallest fix:** use Next Link for actual card destinations, preserving styling,
numeric URLs, grade labels and interactions; keep action buttons as buttons and
avoid nesting interactive controls. Do the same for category destination cards.
Expected impact: restore explicit contextual discovery edges, not guaranteed ranks.

### F2. High — Pagination does not expose sequential page links

**Evidence:** `src/components/PagesNumber.jsx:50,65,80` renders only buttons;
`src/app/(user)/products/_components/ProductsLayout.jsx:40` changes query state
with router.replace. No next-page href is generated.

**Reproduction/root cause:** render a catalog with multiple pages and inspect the
pager: numbered/next/previous controls have click handlers but no page URLs.

**Impact:** a crawler cannot follow the listing's pagination through these
controls. This is independent of whether Google can render the first page.
Product sitemap entries help, but do not establish the catalog's internal graph.

**Smallest fix:** introduce storefront-specific Link pagination preserving active
filters and page-size semantics; leave shared admin behavior intact. Each real
page must have a stable URL. Self-canonicalize useful paginated pages; do not
canonicalize every page to page 1. Identical titles within pagination alone are
not an error. [Google pagination guidance](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading)

### F3. Medium — Listing/filter relevance and duplicate-URL policies are unspecified

**Evidence:** `src/app/(user)/products/page.jsx:4` exports one fixed title and
description and does not read searchParams. `src/app/layout.jsx:12` supplies no
canonical. `src/lib/seo.mjs:93` nevertheless advertises category filter URLs.
Footer links at `src/app/Footer.jsx:70,74,83` expose alternative sort URLs.

**Reproduction:** `/products`, `?gender=female`, `?brandIds=1`, `?sort=oldest`
and `?page=2` all returned the same listing title/description and no canonical or
noindex in local initial HTML. Slugs/IDs in these probes were synthetic examples;
the fixed metadata applies equally to real production filter values. Tracking
and ignored query parameters also have no declared consolidation policy.

**Impact:** there is no distinct metadata for category/brand intent and no explicit
policy separating chosen landing pages from search/sort/filter combinations.
Actual duplicate indexing, wasted crawl volume or canonical disagreement is
unverified. Absence of a canonical does not itself make a URL invalid.

**Smallest fix:** decide a bounded whitelist of useful existing single-filter
landing states, then resolve real taxonomy names for server metadata and explicit
canonicals. Give equivalent sort/tracking states a considered consolidation rule;
exclude unwanted search/filter combinations from indexing where appropriate.
Keep valid pagination distinct. Change sitemap coverage only after this policy is
chosen; do not blindly remove every category or canonicalize every filter to the
unfiltered list. [Google faceted-navigation guidance](https://developers.google.com/crawling/docs/faceted-navigation)

### F4. Medium — Malformed product IDs become server errors rather than not-found responses

**Evidence:** `src/app/(user)/products/[id]/page.jsx:8,15` sends the route string to
the API and maps only API 404 to null. `backend/src/product/product.controller.ts:71`
uses ParseIntPipe, which rejects nonnumeric IDs with 400. Other failures are thrown.

**Reproduction:** installed Nest parser returned 400 for `not-a-number`. The clean
frontend, with that response modeled locally, returned 500 for
`/products/not-a-number`; a missing numeric ID returned 404. The valid product
control returned 200 and one Product schema.

**Impact:** malformed, mistyped or unsupported slug-like product links create
avoidable crawl/server errors. This is not evidence that valid numeric products
return 500 in production.

**Smallest fix:** validate positive numeric route IDs in the shared server
getProduct path before fetching and return notFound for invalid IDs. Preserve
existing treatment of genuine API outages as server errors; do not blanket-map
all backend 400/500 responses to 404. [Google status-code guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)

### F5. Medium — Utility-page exclusion depends on robots crawl blocking alone

**Evidence:** `src/app/(user)/cart/page.jsx:3` defines no noindex; login's page and
client layout inherit root metadata. Admin/profile layout metadata similarly
lacks noindex. `src/lib/seo.mjs:35` disallows all these prefixes in robots.

**Reproduction:** local anonymous `/cart` and `/auth/login` both returned 200
without a robots meta tag. Login also reused the homepage title/description.
No production X-Robots-Tag/CDN policy was available to inspect.

**Impact:** application-level rules do not guarantee exclusion of those utility
URLs from the index if Google learns them elsewhere. This is not a demonstrated
private-data leak or proof they are currently indexed; protected routes still
have authentication boundaries.

**Smallest fix:** add noindex at suitable server boundaries for cart/login and
defense-in-depth for private layouts, preserving guards. For publicly accessible
utility pages, coordinate robots rules so Google can see the exclusion directive;
adding noindex behind Disallow alone cannot remove an indexed URL. Never open
private data for crawling. Use owner Search Console evidence for any removal
workflow. [Google noindex requirements](https://developers.google.com/search/docs/crawling-indexing/block-indexing)

### F6. Low — Primary product/home/listing headings are not semantic main headings

**Evidence:** product name is a paragraph at
`src/app/(user)/products/_components/SingleProductPage.jsx:197`; homepage has
section h2s but no h1. Local product/home/listing HTML contains zero h1 elements.
The three static information pages have their own h1s.

**Impact:** weaker explicit main-topic/heading structure. This is not a proven
ranking penalty; Google can understand other visible text.

**Smallest fix:** use an appropriate h1 for each primary page topic, preserving
classes/layout and real product/landing names. No template redesign required.
[Google title-link guidance](https://developers.google.com/search/docs/appearance/title-link)

### F7. Low — Explicit Open Graph/social metadata is absent

**Evidence:** no openGraph/Twitter definition in app metadata; local public-page
HTML has no `og:*` tags, including product details. Root metadataBase is not a
replacement for those tags.

**Impact:** shared-link preview fields are left to platform inference. No Google
discovery/indexing failure or direct ranking effect is claimed for this gap.

**Smallest fix:** when prioritized, reuse actual page/product names, descriptions,
canonical URLs and representative public images for explicit previews. Omit
unknown images rather than creating placeholders. This is optional after the
discovery/indexing work, not a release blocker for current JSON-LD.

## C. Suspected risks and checks requiring verification

| Risk / source-confirmed mechanism | What is not established | Verification and minimal next action |
| --- | --- | --- |
| Client-only home/listing catalog data: `RecentProducts.jsx:15`, `PopularProducts.jsx:15`, `ProductsLayout.jsx:82`, React Query provider without server hydration in `src/app/Providers.jsx:49` | Google rendering failure, non-indexability, or a measurable render delay | Inspect Google-rendered HTML and API resource failures. Initial local HTML has no product names/cards on these surfaces, but Google can execute JS. If evidence warrants it, server-prefetch the first public catalog page into the existing client flow; no storefront rewrite is required. |
| Empty/out-of-range filter pages keep a static 200 route and client empty-state (`ProductsLayout.jsx:129`) | Actual soft-404 classification or empty combinations in Google's index | Compare actual rendered empty URLs and Page Indexing examples. Deliberately handle impossible categories/page numbers server-side while preserving normal empty user-search UX; do not indiscriminately convert valid searches to 404. |
| Facet combinations, search terms, limits, sort and tracking produce many URL states | Material crawl-budget exhaustion or duplicate-page counts | Crawl Stats and Page Indexing examples by parameter, then implement F3's bounded policy. No blanket robots wildcard changes are justified yet. |
| No explicit canonical on home/static pages | Host, www, HTTP/HTTPS or slash variants actually serving duplicates in production | Owner checks redirect/header/canonical behavior on production. Add accurate per-page canonicals where useful; do not add a global homepage canonical that propagates to every page. |
| Product description/brand/image fields can be missing in the API contract | Which real products have missing/duplicate/poor metadata or thin content | Owner exports non-sensitive product IDs/titles/descriptions/image presence and GSC examples. Use real editorial content, not generated claims or fake reviews. [Google snippet guidance](https://developers.google.com/search/docs/appearance/snippet) |
| Upload images bypass Next optimization (`src/components/AppImage.jsx:52`); each card's mobile/desktop images use priority (`ProductCard.jsx:49,93`) | Actual oversized transfers, duplicate downloads, failed LCP/INP/CLS, or Google Images crawl problems | Collect real image dimensions/bytes/cache headers and a mobile network trace. Optimize only measured offenders; retain aspect-ratio stability and prioritize only the actual critical image. No image-pipeline/dependency change is authorized here. |
| Shared chrome loads an external animate.css stylesheet (`src/app/Header.jsx:6`); client providers/overlays run on public pages | Render blocking, excessive JS, layout shift or mobile usability failure | Real browser trace and device checks, followed by a scoped fix only when causality is shown. Safari syntax success does not prove device UX or CWV. |
| JSON-LD covers one default offer; old API flags/missing images can omit Offer/image | Production Product/merchant-listing eligibility, image representativeness or Google acceptance | Owner tests actual product 105 and a purchasable control with Rich Results Test/URL Inspection. Do not invent offers/availability, GTIN, shipping or returns to silence warnings. |
| One-hour sitemap cache and 50,000-URL bound | Stale/deleted URL accumulation, timeout failures or limit proximity for the actual catalog | Compare production sitemap to public catalog and logs. Split only if needed. Deleted URLs correctly returning 404 during a normal cache window do not by themselves make the sitemap design broken. |
| No public brand/category editorial pages or related-product section | Search demand, commercial value or actual orphan URLs | Use GSC query/page evidence and catalog data to select a few useful landings; add related links only where there is a real relevance/discovery need. No speculative large route expansion. |

### Performance evidence boundary

No production Lighthouse, PageSpeed/CrUX, Core Web Vitals, server latency or mobile
network measurements were obtained. Existing clean artifact evidence proves 828
tests, a production build and Safari syntax checks for 81 client / 5 startup
scripts; it does not prove speed. Local synthetic HTTP responses are correctness
checks, not production performance benchmarks. No confirmed CWV failure is reported.

Owner should obtain field LCP, INP and CLS for representative mobile/desktop groups,
then use lab traces for diagnosis. Google targets are approximately LCP 2.5 s,
INP 200 ms and CLS 0.1; absent field data is not proof of passing or failing.
[Google CWV guidance](https://developers.google.com/search/docs/appearance/core-web-vitals)

## D–E. Ranked fix order and expected impact

| Order | Priority | Work | Expected technical improvement |
| --- | --- | --- | --- |
| 1 | High | F1: Link-based product/category destination cards | Crawlable contextual edges into real catalog URLs |
| 2 | High | F2: Storefront Link pagination | Sequential access to deeper catalog pages without user clicks |
| 3 | Medium | F3: Curated landing metadata + explicit URL/indexing policy | Clear category/brand relevance and fewer ambiguous duplicate states |
| 4 | Medium | F4: Route-ID validation | Correct 404 for malformed product URLs; fewer avoidable 5xx responses |
| 5 | Medium | F5: Utility noindex and coordinated robots policy | Explicit index exclusion without weakening authorization |
| 6 | Evidence-dependent | Server catalog prefetch or measured image/performance fixes | Reduce proven rendering/transfer costs, if owner evidence confirms them |
| 7 | Low | F6 and F7: Main headings / real social metadata | Clearer semantic structure and predictable share previews |

Expected impact is qualitative. No ranking or revenue estimate is supported by
the available evidence. No migration, numeric-to-slug rewrite, backend redesign,
new dependencies or shipping/return-policy edits are recommended by default.

## F. Required owner Search Console / production checks

No account access is assumed. Supply screenshots or exports with dates, property
name, filters and device/country context; redact personal data. Do not share login
credentials. Useful evidence is:

| Report / check | Required sample or export | Question it resolves |
| --- | --- | --- |
| URL Inspection, indexed + live test | `/`, `/products`, `/products/105`, another purchasable product, one real populated category/brand filter, page 2, one absent product | User vs Google canonical, indexing allowed, last crawl, HTML/screenshot, loaded resources, rendered products and links |
| Page Indexing | Summary and sample URL exports for Crawled/Discovered currently not indexed, Duplicate/Google chose different canonical, soft 404, server error, blocked by robots, excluded by noindex | Whether source gaps cause real exclusion/duplication and which parameter patterns matter |
| Sitemaps | Submission status, last read, fetched errors and discovered URL counts | Whether the committed dynamic sitemap is actually deployed and consumed; reconcile with current public catalog, not fixture counts |
| Performance: Search results | Last 3 months vs previous period; longer seasonal comparison if available; queries/pages/device/country/search appearance | Brand vs non-brand demand, product/category intent, impressions/clicks/CTR and landing-page gaps; average position alone is not a diagnosis |
| Links | Internal Links export, especially product and deep-list URLs | Possible weak/orphan discovery; combine with a rendered crawl because this report is not a complete crawl graph |
| Product snippets / Merchant listings, if available | Valid/error/warning counts and representative item details | Whether Google recognizes actual Product/Offer fields and which required values fail; absent reports alone do not prove invalid schema |
| Core Web Vitals | Mobile/desktop URL groups, failing metric, example URLs and collection date | Field speed/stability, then mobile/desktop PSI lab traces for causality; no-data groups remain unknown |
| Settings → Crawl stats | Host status, response-code/content-type breakdown, request history and example URLs | Real 5xx patterns, API/resource failures visible to Google and parameter crawl volume |
| Manual Actions / Security Issues | Current status screen | Whether an external restriction exists; none is assumed here |
| Owner production checks outside GSC | Liara deployed frontend/backend SHAs and build-time public API origin; HTTPS/www redirects, response headers, image URLs, actual robots/sitemap | Establish what is live and whether infrastructure adds canonical/noindex/cache policies not present in source |

The [Page Indexing report](https://support.google.com/webmasters/answer/7440203?hl=en)
provides exclusion reasons and examples. [CWV report documentation](https://support.google.com/webmasters/answer/9205520?hl=en)
explains its field-data and sampling limits. Google Rich Results Test and Search
Console checks remain unexecuted owner actions, not findings of this audit.

## G. Recommended implementation phases

1. **Establish live evidence:** confirm deployed versions/configuration and gather
   the representative GSC/HTML/redirect/image checks above. Preserve the known-good
   previous frontend release; Git HEAD does not establish deployment.
2. **Repair discovery without changing contracts:** F1 and storefront-scoped F2.
   Verify anchors exist after rendering, pager URLs preserve filters and deeper
   products are reachable. Preserve admin pagination, search ranking, stock and
   bulk-price behavior. Keep the current product canonical and JSON-LD intact.
3. **Resolve URL/indexing intent:** implement F3 with real category/brand names,
   F4's malformed-ID handling and F5's utility exclusion. Validate canonical/noindex
   behavior across pagination, search, sorting and tracking; no blanket rules.
4. **Strengthen useful landing content/rendering:** only for demonstrated demand
   or Google rendering problems. Prefer the existing query architecture and small
   server-data handoffs; do not create empty/thin routes in bulk. Address F6/F7 as
   small metadata/semantic changes when scheduled.
5. **Measure and improve performance:** choose fixes from actual field and network
   evidence, not guesses about client components or image formats. Recheck search,
   product selection, price/availability/schema parity and real mobile devices.

Each phase needs a separate bounded implementation request and review. No work in
these phases is implemented by this report.

## Verified strengths, limitations and preservation

- Existing public information links and product breadcrumbs are real anchors.
- Numeric product metadata/canonical and one safely serialized server Product
  JSON-LD block were verified locally; no confirmed regression in that feature.
- Positive and missing-numeric-product controls returned 200/404 respectively;
  unknown top-level routes returned 404 with automatic noindex.
- Product availability and prices continue to rely on backend flags and existing
  calculation helpers; no fabricated review/rating or shipping/returns markup.
- Robots allows public products and assets. Dynamic sitemap validates all public
  product pages, not just static entries; its existing isolated tests cover
  pagination, API failure and caching. Live catalog counts remain unknown.
- No full test suite/build rerun was necessary for a report-only task. Local
  HTTP checks reused the exact-commit clean release build with no source edits.
- All 1,086 pre-existing tracked/nonignored files across both repositories were
  fingerprint-checked, including owner WIP and the five committed JSON-LD files.
  No pre-existing file changed. Only `frontend/SEO_AUDIT_REPORT.md` was added.
  Git HEADs and staging remain unchanged. Local audit servers were stopped.

Verdict: actionable source gaps are confirmed, led by internal discovery and
pagination. Production discovery/indexing/visibility health cannot be certified
without the owner checks above. This is an audit deliverable, not release approval.
