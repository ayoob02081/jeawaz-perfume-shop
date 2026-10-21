# Performance Phase 1 review

Baseline: frontend a911b41b9d19353cdb39b4c6fe8e8639668b327a. Date: 2026-10-21. Uncommitted; no push, package or deployment.

## Scope and decisions

Only three optimizations: remove the external animate.css stylesheet, deliver homepage flowers through existing Next local-image optimization, and stop eager footer image loading. No Swiper, auth/session, API, metadata, backend, database, dependency or original image-asset changes. The initial frontend tree was clean.

- Header.jsx removes the CDN stylesheet. globals.css retains only fadeIn, fadeOut, fadeInRightBig and fadeInUpBig, with animation-fill-mode both, original ease timing, 400 ms default / 200 ms fadeOut, and original 1 ms reduced-motion/print behavior. Existing Modal and Backdrop source remains unchanged.
- Homepage uses next/image for the three /images/flower.webp decorations, with original 843x1200 intrinsic ratio, accurate 96/104 CSS-pixel sizes, existing position/rotation classes, height auto, loading lazy, fetchPriority low, empty decorative alt. No preload. Original 309,204-byte asset is untouched; existing optimizer selects and caches a smaller response. No new image pipeline or upload-variant changes.
- Footer logo loses priority; the trust badge gains loading=lazy. Existing source, link, target, referrer policy, classes and sizing are unchanged.

## Measured resource results

Local production-server Chrome at 375x900 and 1440x900, DPR 2, selected a 256x364 WebP: 41,124 bytes versus 309,204 bytes (86.70% reduction). Alpha transparency is present. Original/optimized screenshots were compared at the rendered size; no material visual loss observed. These are measured optimizer bytes at the tested DPR, not universal sizes or promised Lighthouse savings. The three decorations share the same image URL; do not multiply transfer savings by three. Other raw flower consumers, including auth artwork, remain out of scope.

The 71,750-byte decoded CDN stylesheet is no longer referenced/requested. Main compiled CSS grew from the audited baseline 175,606 bytes to 176,293 (+687 decoded bytes); the other two CSS chunks are unchanged. Compression and timings vary; no claim of guaranteed 780/200 ms savings. Initial SSR HTML and actual browser requests contain no external animate.css, and no footer logo/trust-badge image preloads. The necessary header logo preload remains.

## Tests and browser validation

- Five new rendered-HTML/CSS regressions initially failed against the unchanged baseline, then pass. One existing home-LCP source wiring assertion now recognizes Next Image instead of img.
- Focused image/hero/Swiper/performance regression selection: 30 passed, 0 failed. Full Node frontend suite: 1,473 passed, 0 failed, 4 opt-in skips (1,477 total).
- Production build using NEXT_PUBLIC_API_URL=https://api.jeawaz.com: PASS, 33/33 prerendered pages. Safari 15.4 syntax gate: PASS, 83 client scripts / 5 startup. No package or lockfile changes.
- Local production server with synthetic in-memory API, all external browser account/SMS calls intercepted: 16 browser result groups. Mobile/desktop flower geometry and alpha, hero priority, footer links/lazy attributes, Escape/outside dismissal, initial focus and scroll unlock passed. Initial recorded CLS=0 in both viewports; no horizontal overflow, hydration errors or unhandled browser exceptions.
- Four used animation classes sampled at start/midpoint/end in RTL: compiled local CSS exactly matches original animate.css 4.1.1 + existing duration overrides, for both normal and reduced motion (8 comparisons).
- Headless screenshots: flower-original-optimized.png, modal-375.png, modal-1440.png. Screenshots inspected. No physical Safari/iOS claim. No real production account, SMS or database operation.
- git diff --check: PASS.

## Pre-existing finding kept separate

The shared Modal template contains an extra literal closing brace after its entrance class: animate__fadeInUpBig} / animate__fadeInRightBig}. The original CDN selector does not match these names, so the real login popup's entrance animation computes to none before and after Phase 1. This is pre-existing, not caused by the local CSS. Valid local class definitions match the original effects; the Backdrop still uses its valid fade classes. Modal.jsx was deliberately not changed, preserving actual existing behavior. An optional one-character correction was presented to the owner separately; it is not included in this manifest. No assertion claims the malformed existing popup class plays a fade-in.

## Remaining limits

Desktop long-task attribution, eager closed-sidebar/below-fold work and exact production LCP breakdown remain deferred. No Lighthouse comparison was run because the local fixture is not comparable with the owner's PageSpeed production reports. Physical iOS/Safari, production optimizer cache/warm-up and deployed trust-badge timing remain owner checks. No source refactoring or session/cookie behavior change.

## Exact manifest and validated hashes

| File | SHA-256 |
| --- | --- |
| src/app/Header.jsx | a062c672e6e8c78cd4971c67500c9518d1a780dc10910b5c813f35a605dc2957 |
| src/app/globals.css | 98e2973c94cce5949433c79d15641caa07cd3a24e112258bfefa9c9c27bf72cb |
| src/app/(user)/page.jsx | 4c58c9399208e8a558766f8f6533078452cfa74b6b0ac3eb3dd000280f565d02 |
| src/app/Footer.jsx | f2d383a779dea6bb8a9507a1077004989f0df5e3cebdd4ca9e57378965521a20 |
| src/lib/homeLcp.test.mjs | d5e9cf4257545698be211b990de9e9517e464b88ede87d29427659948f4c3ad8 |
| src/lib/performancePhase1.test.mjs | a46c6b674cb4cae2c5f10a28ec989a16865e8f6830a46e6be62826abc15dd95e |

Also this report: PERFORMANCE_PHASE1_REVIEW.md (self-hash recorded externally). Excluded backend files (605) and frontend files (585), both HEADs and empty indexes were verified unchanged. Source asset and all lockfiles are byte-identical. Graphify was not run in this implementation turn and its cache is unchanged. Evidence: C:/Users/AYOOBM~1/AppData/Local/Temp/jeawaz-performance-phase1-20261021 (validation.json/logs, browser-results.json, screenshots, FINAL_VERIFICATION.json).

Verdict: PHASE 1 VALIDATED — READY FOR REVIEW.
