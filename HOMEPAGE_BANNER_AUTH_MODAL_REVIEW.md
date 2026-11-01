# Homepage banners and mobile auth-modal correction

Status: COMMIT-READY. Bounded frontend implementation; no commit, push, release packaging or deployment.
Date: 2026-10-18. Frontend baseline/owner-confirmed deployed: dd9b2c2799e51c8e3ff6fb2dd47eb6e6ce3978a6. Backend remains a952b98962342ee81a1cf74157d7751d58561e28.

## A. Confirmed banner root cause and reproduction

Home renders PrimaryBannerLayout and SecondaryBannerLayout. Their useGetActiveBanners queries call GET /banners/active with primary/secondary type. The homepage SSR catalog snapshot seeds products/categories, not banners. Banner fetches start during client mounting; Swiper is mounted only after data exists.

The Phase1 Axios request interceptor captured generation synchronously but rejected every superseded request at asynchronous dispatch, including public banners. On a hard load with the normally persisted last session-transition marker, AuthProvider connects and reads that marker, advancing generation after child banner-query invocation. Both banner requests reject before reaching the adapter/server. useGetActiveBanners had retry:false and refetchOnWindowFocus:false; homeBannerView maps query errors to hidden and both layouts return null. This removes entire sections before image/carousel initialization; it is not merely missing images.

Deterministic pre-production-change tests: 77 total, 70 passed, seven failed. Failures reproduced primary/secondary delayed-dispatch rejection, an inappropriate refresh on public-banner401, missing bounded transient recovery, no failed-query focus recovery and the existing mobile close hit area. Final tests additionally cover real sessionLifecycle.connect reading a stored marker with failed/expired /users/me bootstrap.

Actual headless-Chrome production baseline comparison used the unchanged baseline build and a memory-only API. The document initialization deliberately seeds a settled marker, representing a returning browser after login/logout. Three hard loads at390px and three at1024px all produced zero primary/secondary banner cards and zero banner API calls. Client-side navigation from /products back home rendered two primary slides and two secondary cards. A completely clean profile without a marker is not claimed to fail on every refresh.

Candidate under the same six hard-load conditions renders two primary slides and two secondary cards, with one successful API call per type and every visible banner image loaded. Client navigation is preserved. A transient503 retries once and recovers (two calls/type); a persistent two-attempt failure remains a real error, then recovers on visibility/focus return. Empty200 arrays remain hidden without fabricated cards. Ten candidate browser groups pass with no hydration errors.

Public read-only HTTP health at check time: primary and secondary APIs returned200, each with two records; eight sampled desktop/mobile image HEAD requests returned200 image/webp. This is API/image transport evidence, not a claim about every device or historical outage. Local browser image checks use synthetic SVG fixtures, not production accounts.

## B. Exact corrections and safety boundaries

Production code: three files, +11/-5 lines.

- src/services/httpClient.js: exempt only method=get plus exact URL=/banners/active from pre-dispatch generation rejection. Mutations, detail/other paths, cart and auth requests retain their existing guards. This exact public read never invokes auth refresh/replay; real401/403/503 responses propagate as their original API errors. No general public-URL exemption, request payload, cancellation or refresh single-flight change.
- src/hooks/useBanners.js: one bounded retry for network/5xx failures; no retry for400/401/403/429 or cancellation/superseded errors. Failed banner queries may refetch on focus; healthy queries do not gain focus refetches. Existing query keys, successful/empty/error shapes and reconnect/remount behavior remain. Persistent failures are still errors and keep the existing hidden-section presentation after the retry budget; no polling or manufactured success.
- src/app/(user)/auth/_components/LoginForm.jsx: make the entire close button screen-reader-only below the existing md breakpoint, rather than hiding only its icon. Remove the mobile44px hit area; retain the noninteractive drag handle. At768px+ the existing40px desktop close control and its appearance/actions remain. Shared Modal, drag hook, Login attempt/confirmation logic and all other consumers are unchanged.

## C. Mobile/desktop dismissal behavior

The Persian named close action remains in Chrome's accessibility tree while clipped on mobile. Browser hit testing verifies no mobile pointer target at its bounds. Screen-reader/keyboard activation still uses the existing guarded close action; Escape remains available. Desktop X is visible and clickable with focus restoration. Backdrop and downward swipe still dismiss; the existing greater-than120px threshold and guarded300ms completion are unchanged. Body scroll lock ownership, initial focus, Tab/Shift+Tab containment, Escape/Back, OTP confirmation retry and synchronous dismissal invalidation remain intact. No duplicate close/navigation was added.

Modal consumers inspected include intercepted login, checkout login, address/filter/category/added-to-cart dialogs, phone change, admin pickers, bulk/recovery and confirmation dialogs. Only LoginForm styling changed; legacy Modal semantics were not broadened.

## D. Validation

- Initial red regression run:77 tests,70 passed,7 failed before production edits.
- Final focused suite:160 passed,0 failed. Includes actual Axios/app modules, actual compiled banner hook with QueryClient/QueryObserver, stored-marker bootstrap401/500, exact-path/method exclusion controls, bounded recovery, real error/empty states, private-session replay/cancellation, coupon/queue/guest-fetch protections, modal races and checkout re-login.
- Full maintained frontend suite:1275 passed,0 failed,1 opt-in browser invocation skipped there and executed separately. 1276 total. This adds20 maintained tests to the1255 baseline. Final later changes only added desktop/browser assertions and clarified a test title; no application code changed after this full run. The focused suite and final browser cases were rerun.
- Production build in isolated baseline source with only the seven scoped source/test overlays:PASS. Fresh offline frozen pnpm install with strict peers:PASS; no dependency/package/lockfile changes. Build-only API=http://127.0.0.1:3457 (memory fixture), not a release artifact.
- Safari15.4 syntax gate:PASS,82 client scripts/five startup scripts. Physical Safari is not implied.
- Banner production browser:seven baseline observations and ten candidate groups; repeated hard loads, navigation, image loading, retry, persistent-error focus recovery and empty responses.
- OTP/mobile production browser:26 groups PASS. Widths320/375/390/430/480/481/767/768/1024. Checks initial focus, Tab/Shift+Tab containment, clipped mobile close dimensions/no hit area, accessibility-tree name, desktop X/focus restoration, backdrop, mobile swipe, Escape, confirmation401/500/network and retry without OTP replay, late dismissal responses, queued drag cancellation, reopening and native Back.
- Two-tab session/cart production browser:13 groups PASS, including account switches, late cart transport, pending/overlapping/missed remote transitions and failed confirmation recovery.
- Existing local production HTTP smoke:11 checks PASS (homepage/listing, filters/sort, pagination, product/listing404, sitemap, robots, Product JSON-LD and SSR links).
- Frontend/backend diff checks:PASS. New untracked test/report whitespace checked separately. No backend or database suite was needed.

Browser harness qualification: the previously documented raw OTP browser runner intermittently times out at transport/input readiness on the baseline. This task does not claim that runner is now stable. Final26-group evidence uses the existing isolated hardened document/input/focus harness with the same updated close assertions and scenarios. No app timing delays were added to mask races. Real cookie/domain/account behavior, physical iOS Safari, VoiceOver/TalkBack and background-tab suspension remain owner QA. No real OTP/SMS/account operation was performed.

## E. Exact changed-file manifest

Three production files, four test files and this report. SHA-256 below is for the final working-file bytes. The report's own hash is stored externally in FINAL_VERIFICATION.json to avoid a self-referential hash.

| File | Kind | SHA-256 |
| --- | --- | --- |
| src/services/httpClient.js | production | 4d14834b4b2ce4c85b5da60b6dc2aa7469b62ead8ccb86ef3f1418cf16fd25de |
| src/hooks/useBanners.js | production | e6c3349015124f039cc88200e0372f571c66ffc754af4a10d7c3baee53986fcc |
| src/app/(user)/auth/_components/LoginForm.jsx | production | 26c29def75ee1f92a6d907fe747a0ee9b6d4f99d29481fc7bb4e374e8cd9609c |
| src/services/httpClient.test.mjs | test | af4c9629454befd4e624f0328f9e540b2c409d03ee366a4a89f4e22a4759a89e |
| src/hooks/useBanners.test.mjs | test | 20d9b8b4ec7897e0b901a583c7374fa21d21cb0e415371a8651174a07a1cfe09 |
| src/utils/otpAuthConfirmation.test.mjs | test | f182d6eb8d2bc2b7906ddc904d0283f41294d7d02841f6d1c6f341a6f9e23d1d |
| src/utils/otpAuthDialog.browser.test.mjs | test | 150af7f178be33f5dbdd829d1f10148d41bba6c00c65a155ae3a8cd52fc0b0e1 |

Documentation: HOMEPAGE_BANNER_AUTH_MODAL_REVIEW.md.

## F. WIP preservation and remaining limits

All 547 excluded existing frontend files remain byte-identical, including SEO_AUDIT_REPORT.md, package files and lockfile. All591 backend files, its status/index/HEAD and all four root handoff documents remain byte-identical. Both indexes remain empty and HEADs unchanged. The only new/modified repository files are the seven scoped source/tests and this report. Task-owned synthetic servers and headless browser were stopped; existing user services/browser were not changed.

Session/Cart findings #4 and #5 remain deferred. Client cancellation cannot reverse server work or processed Set-Cookie. The banner exception does not alter other public endpoints' dispatch policy. Persistent upstream errors are not converted into empty200 data. Physical mobile accessibility and actual production rollout checks remain outstanding.

Evidence: C:/Users/Ayoob Mahmoudian/AppData/Local/Temp/jeawaz-banner-modal-fix-20261018 (before.json, before-regressions.log, focused.log, full.log, build.log, public-banner-http.json, browser-banner-baseline.json, browser-banner-candidate.json, browser-otp-hardened.log, browser-multitab.json, http-smoke.json, FINAL_VERIFICATION.json). Browser-harness readiness/visibility-target diagnostics are retained; they were corrected in external harnesses, not in application code.

Verdict: COMMIT-READY for pre-commit review. No commit/push/packaging/deployment is authorized by this implementation task.
