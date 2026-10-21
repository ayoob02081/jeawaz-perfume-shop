# Shared product skeleton and profile loading review

2026-10-21. Frontend baseline eb80f7b6f43ece6f265cce108716ff6b9a94eaad. Targeted implementation; no commit, push, package or deployment.

## Shared product skeleton

ProductCardSkeletons.jsx keeps its default export and count API. All 13 existing inner Skeleton shapes now use animate=false. One subtle white gradient overlay on the article animates only transform between translateX(-100%) and translateX(100%). The card is decorative (aria-hidden); overlay has no pointer target. Dark mode uses lower overlay opacity. prefers-reduced-motion removes the overlay entirely. No background-position animation or per-piece will-change promotion was added. Original card height/aspect ratio, min width, padding, border, shape classes and count behavior are retained. Actual ProductCard and its data/loading contracts are unchanged.

All usages inspected: RecentProducts, PopularProducts, CampaignsProducts use the shared count wrapper; ProductsLayout uses its default export with the normalized page limit. RelatedProducts is already a server-rendered section under Suspense fallback=null, using actual ProductCard; it does not use ProductCardSkeleton and is untouched. SingleProductPage's separate SingleProductSkeleton is also untouched.

## Profile loading

The actual profile data is client-loaded, so adding loading.jsx would create an unrelated Suspense layer. Instead two static ProfileSkeletons exports replace the existing ProfileInfo and AddressLayout spinner branches. The placeholders reuse Skeleton animate=false, have Persian live status labels, aria-busy and aria-hidden shapes, and no links/inputs or private values. Geometry follows the real responsive info fields and one address row. No new animation is introduced.

ProfileInfo shows its skeleton while authentication is loading with no confirmed user; retained user data remains visible during normal background confirmation. No user means no private info card. AddressLayout enables its existing address query only for a user with sessionReady; it hides cached addresses when no user exists. Initial data loading gets a skeleton; background refetch keeps populated data; errors and empty responses settle to the existing header/empty fallback. No new error masking or indefinite pending state. Existing proxy redirects, AuthContext, session-generation logic, API methods, query keys, address controls, shared exported Address component and order-status row are unchanged. The order-status row retains its own existing loading UI.

## Bounded browser/performance evidence

One before/after pair: actual component markup rendered with SWC/React and actual compiled application CSS; local-only harness; 12 cards; Chrome 155; Intel Arc GPU enabled; desktop 1440x900 DPR1; 4x CPU slowdown; four-second steady animation window after fonts are ready. This isolates skeleton animation, not homepage hydration, network or Lighthouse TBT. No production service was used.

- Declarative animated pieces: 13 -> 1 per card. Actual running animations: 144 -> 12 for 12 cards (92% reduction), at 375 and 1440 px. One responsive image branch per card is display:none, explaining 12 active old animations versus 13 declared pieces. Reduced-motion running animations: 0.
- Style recalculation: 13.532 -> 6.614 ms (about 51% lower). Main-thread RunTask sum: 70.957 -> 59.973 ms (about 15% lower). Layout: 0 -> 0 ms. Layer work: 3.623 -> 2.209 ms.
- Paint rose from 4.101 -> 11.482 ms. The larger overlay did not reduce every category. Both cases had zero >50 ms tasks and zero blocking-threshold excess. One pair is not statistically conclusive and establishes no homepage TBT or Lighthouse score gain.
- All 13 shape rectangles and card rectangles match before/after exactly. Desktop card 308x462; mobile 312x216. No overflow or observed fixture CLS. Screenshot inspected.
- Profile isolated fixtures: static/no animations, mobile/desktop geometry matches the structure. Header placeholders were aligned to actual 24px header text. Address counts/content are unknown until fetched; no claim of fixed CLS for every real account or address length.

Actual Next production-server browser scenarios, entirely synthetic loopback auth/address data: 375/1440 px initial SSR/client skeletons, held /users/me confirmation, no enabled address reads before confirmation, held addresses then success, focus/background confirmation with retained content, initial address 503 settling without skeleton, and unauthenticated route returning 307 /auth/login. No hydration exceptions or overflow. Observed CLS 0 mobile and 0.001289 desktop. Screenshots inspected. No real account, SMS, cookie or database verification claimed.

## Tests and build

- Added 14 focused rendered-component/CSS regressions; initial focused home/skeleton selection 27/27 passed. Final focused selection (new skeleton, checkout wiring, home loading contracts): 26/26 passed.
- Full frontend suite ran once as requested: 1,490 passed, 1 failed, 4 existing opt-in skips (1,495 total). The sole failure was a stale checkoutOrderPayload.test.mjs source assertion requiring the profile address book's old unconditional useGetAddresses(). It was updated to require Boolean(user) && sessionReady, preserving the checkout-specific assertions. The complete affected test file then passed 8/8, alongside 14/14 new skeleton cases. No unresolved test failure remains; the full command was not repeated after this test-only correction, respecting the one-run limit. Do not describe the original full run as zero-failure.
- Production build run once after final source changes with NEXT_PUBLIC_API_URL=https://api.jeawaz.com: PASS, 33/33 prerendered. Safari 15.4 gate PASS, 83 client scripts / 5 startup scripts.
- git diff --check and untracked test/component whitespace checks PASS. No dependencies changed.

## Preservation and remaining checks

Backend 605 files and frontend 589 excluded original files are byte-identical. Both HEADs and indexes unchanged. Existing owner globals.css formatting is preserved as an exact byte prefix; only the scoped product-card CSS block was appended. That owner formatting must be excluded from any future scoped commit unless separately approved. Auth/session, Swiper, actual cards, product API/data-loading behavior, SEO, dependencies and the pre-existing Modal typo remain untouched.

Physical iOS Safari/VoiceOver, real production accounts and a production homepage TBT comparison remain outstanding. One synthetic steady-state comparison should not be presented as a production score improvement. Test/build/browser task-owned services were stopped.

## Exact implementation manifest / hashes

| File | SHA-256 |
| --- | --- |
| src/app/(user)/_components/skeleton/ProductCardSkeletons.jsx | 865f1f88c4225f45101031c9bd6e557b4bea6bcda13bec6053eeccc80310711e |
| src/app/globals.css | 47383791a64186d1fb947662926d275138ac3115ce421cf13cc8b5623e174dca |
| src/app/(profile)/profile/_components/ProfileInfo.jsx | 6e55d6462b5d40119f3a43f71d9f2290b4ac4bad7ef7e24346f0a5ff0af6a922 |
| src/app/(profile)/profile/_components/AddressLayout.jsx | bd564f45e903f101122ffec3bccc03d4f5cc80951988c4489047bb9836c0c621 |
| src/app/(profile)/profile/_components/ProfileSkeletons.jsx | 238286e993b85850012ada9cf6d9e423d1465e7629714b3f3cf9e1fa7ea9e5da |
| src/utils/loadingSkeletons.test.mjs | 03350b27df5ec61c4c4243e9ddf930f2180eb9668e9c388916f371b8962dafa9 |
| src/utils/checkoutOrderPayload.test.mjs | 406ce0e0f82b868986d285e0382d3b0f92a9d78b1034bf698347bb8403e0d019 |

Plus this report, SHARED_SKELETONS_PROFILE_LOADING_REVIEW.md; its self-hash is recorded externally. No review doc was staged. Eight changed/new feature paths in total; globals.css also contains preserved owner-only formatting from before this task.

Evidence: C:/Users/AYOOBM~1/AppData/Local/Temp/jeawaz-shared-skeletons-20261021 (browser-results.json, before/after-animation-trace.json, production-browser-results.json, logs/screenshots, preservation.json, final-verification.json).

Verdict: SKELETON OPTIMIZATION VALIDATED. No commit/push/deploy.
