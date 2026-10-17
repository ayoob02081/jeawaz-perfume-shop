# OTP authentication UX and accessibility correction

Date: 2026-10-17. Frontend baseline: 74474e415024c832afcb31d19ec2c08bb15ca355.
Status: uncommitted. COMMIT-READY after dismissal race correction. No deployment or release artifact.

## Dismissal race correction - 2026-10-17 (current)

The independent review found two Medium-severity races in the initial version below. This section supersedes its dismissal-readiness claims; the original validation snapshot is retained as history.

### Root causes and before/after reproduction

- Escape/outside dismissal called the parent callback directly, bypassing Login.close's immediate invalidation. Before correction, a held successful confirmation resolved before unmount produced a welcome toast and two navigation calls. After correction, every opted-in dismissal invalidates the shared lifecycle before calling the parent; the held success/failure is ignored locally, and navigation occurs once.
- Drag close scheduled an untracked 300ms callback. Before correction, another dismissal followed by unmount still allowed that queued callback to call history.back again. After correction, cancellation clears both drag/transition timers and increments a generation guard, so even a callback already dequeued before cancellation is inert.

### Exact scope of this correction

Four production files changed relative to the prior validated OTP UX snapshot:

| File | Added lines | Deleted lines |
| --- | ---: | ---: |
| src/components/Modal.jsx | 62 | 5 |
| src/hooks/useDragToClose.js | 32 | 5 |
| src/app/(user)/auth/_components/Login.jsx | 12 | 3 |
| src/app/(user)/auth/_components/AuthLayout.jsx | 5 | 1 |

The opt-in accessible Modal exposes a generic dismissal context, not authentication logic. All close paths use the same idempotent handler. Login's local attempt guard checks that lifecycle; the terms-navigation action dismisses through it before its existing destination navigation. Native Back/Forward invalidates without requesting another history transition. Reopening resets the per-open lifecycle. Login also rejects a late WebOTP callback before it can fill the dismissed form.

The drag hook has only one direct consumer, Modal. Its normal threshold, 300ms close animation, 400ms reset, touch gestures and scroll-container guard are retained. Generic enabled/unmount cleanup stops stale timers. Legacy Modal consumers do not get a dismissal provider, new dialog semantics or login-specific handling. Existing active legacy drag behavior is regression-tested.

Five test/fixture files updated in this correction:
- src/utils/otpAuthConfirmation.test.mjs
- src/utils/checkoutAuthFlow.test.mjs
- src/utils/otpInputContract.test.mjs
- src/utils/otpAuthDialog.browser.test.mjs
- src/utils/fixtures/otpAuthApi.cjs

No AuthContext, OTP request/verification service, retry/refresh contract, backend, dependency or schema change in this correction. AuthContext's previously validated bytes are unchanged. Local dismissal prevents stale form outcomes; an already-admitted server confirmation may still finish and update global authenticated state, as before.

### Current validation

- 127 focused tests passed, zero failures/skips. The confirmation/accessibility file now has 36 cases, including 17 added race/callback regressions.
- Full native frontend suite: 1,199 passed, zero failed; one opt-in browser test skipped in that invocation and run separately with success.
- Real Next production-server/headless Chrome: 23 scenario groups passed. These include pending Escape/outside dismissal followed by success/500/network failure; held drag followed by Escape/outside; forced invocation of the dequeued callback after unmount; reopening; and native Back with no extra history call.
- Existing widths 320/375/390/430/480/481/1024px, focus restoration, Tab/Shift+Tab, OTP autofocus, >=44px mobile close target, drag/outside dismissal, scroll unlock and no-overflow checks all passed. No hydration/React runtime errors matched.
- Unit tests control actual callbacks with deferred promises/fake timers, including the exact before-unmount order. Browser races use server-side held-request barriers and captured drag callbacks, not an arbitrary 300ms sleep. Chrome's automatic retry of a disrupted GET initially stalled the synthetic fixture; release now retains the selected failure mode and exposes the pending-request barrier. This was a fixture correction, not a production error.
- Final isolated production build PASS. All eight production files match the working source byte-for-byte. Safari 15.4 syntax gate PASS: 82 client scripts / 5 startup scripts.
- git -c core.safecrlf=false diff --check PASS.

All HTTP/auth tests used the synthetic loopback frontend fixture. No real OTP, SMS, account, backend or database operation. The browser harness checks fixture identity and blocks other origins.

Current evidence: C:/Users/AYOOBM~1/AppData/Local/Temp/jeawaz-otp-dismissal-20261017 (before.json, race-tests.log, focused.log, full-tests.log, browser.log, browser.json, build.log and WIP_PRESERVATION.json).

Physical iOS Safari soft keyboard/autofill/swipe and VoiceOver/TalkBack remain owner-run checks. No commit, push, release packaging or deployment.

## A. Confirmed root causes and changes

- OTP verification awaited a best-effort AuthContext check that swallowed /users/me failures, then announced success and navigated. Reproduced with mocked 401, 500 and network errors before correction (see preceding OTP UX audit).
- checkAuth now accepts an opt-in requireUser flag. Strict callers reject failed, malformed or superseded confirmation; bootstrap/background callers keep their previous best-effort behavior and return contract. Generation protection remains in place.
- Login remembers accepted OTP attempts in component memory. Once accepted, manual retry calls only /users/me; it never repeats /auth/verify-otp or requests another OTP. Existing verification guard suppresses concurrent submissions. Confirmation errors have distinct Persian status/retry UI, not invalid-OTP messaging. Editing/resending/WebOTP stop after acceptance. Closing and unmounting suppress late UI outcomes; explicit close is idempotent before route completion.
- The existing password branch in this same Login component had the equivalent swallowed-error success path. It also opts into strict confirmation, via an optional AuthContext.login flag; other callers retain their defaults. No password UI redesign or backend contract change.
- Login supplies the existing PersianOTPInput label prop. Close/back controls have Persian accessible names. A browser check exposed the existing mobile close button's zero hit area when its icon was hidden; minimum 44px dimensions restore a transparent hit target while retaining the visible handle.
- All shared Modal consumers were inspected: intercepted login, Cart login, phone-change dialog, address list, filters, added-to-cart, category sidebar, ConfirmModal and its admin callers, entity picker, price recovery and Bulk Price dialogs. Some already own inner dialog semantics. The new accessibleLabel prop is opt-in ONLY at intercepted login and Cart login. Other consumers retain the legacy section, outside-click and DOM semantics.
- Opted-in login modals reuse installed Base UI Dialog for one named dialog, Escape/outside dismissal, focus containment and restoration. Existing layout, mobile drag handlers and owner-counted scroll lock remain. Base UI uses trap-focus mode so it does not add a competing scroll lock.
- Production-browser testing found Base UI fallback focus overriding OTP autofocus after removal of the phone field. A synchronous popup-only focus handler forwards fallback focus to the replacement input, without delays or overriding focus on child controls.

## B. Exact changed files

Eight production files:
- src/contexts/auth/AuthContext.jsx
- src/app/(user)/auth/_components/Login.jsx
- src/app/(user)/auth/_components/LoginForm.jsx
- src/app/(user)/auth/_components/AuthLayout.jsx
- src/components/Modal.jsx
- src/hooks/useDragToClose.js
- src/app/@modal/(.)auth/login/page.jsx
- src/app/(user)/cart/_components/CartLayout.jsx

Nine test/fixture files:
- src/services/authLoginContract.test.mjs
- src/utils/addedToCartContract.test.mjs
- src/utils/checkoutAuthFlow.test.mjs
- src/utils/otpLoginFlow.test.mjs
- src/utils/otpInputContract.test.mjs
- src/utils/productFilterFlow.test.mjs
- src/utils/otpAuthConfirmation.test.mjs
- src/utils/otpAuthDialog.browser.test.mjs
- src/utils/fixtures/otpAuthApi.cjs

Documentation: OTP_AUTH_UX_REVIEW.md (this report). No root handoff documents changed.
Existing structural assertions were updated only for the intentional strict-confirmation, close guard and opt-in modal wiring. New tests execute compiled real callbacks/components with controlled dependencies; they do not copy the production confirmation logic.

## C. Authentication behavior

1. Invalid/expired OTP: existing API error handling and code-entry retry remain intact.
2. OTP succeeds and /users/me confirms a user: one success toast and one navigation/callback.
3. OTP succeeds and /users/me returns 401, 500, network failure or missing user: no success/navigation; explicit session-confirmation retry remains available.
4. Retry after accepted OTP: only user confirmation repeats; the consumed code is not replayed.
5. Pending or duplicate submit: existing guard refuses duplicates synchronously. No automatic retry loop was added; existing HTTP refresh semantics are unchanged.
6. Closed/unmounted or superseded attempt: no late toast/navigation. A valid server response may still update global authenticated state after the form closes; it does not reopen or navigate the closed form.
7. Routes, request bodies, cookies, OTP lifetime, signup behavior, resend cooldown, digit conversion, paste and WebOTP contracts are unchanged.

## D. Initial validation snapshot (historical; current results above)

- Focused suite: 110 passed, zero failed/skipped (19 new confirmation/accessibility tests plus 91 existing OTP/API/checkout checks).
- Full native frontend suite: 1,182 passed, zero failed; one opt-in browser test skipped in that invocation and separately executed successfully.
- Real Next production-server/headless Chrome regression: one browser test containing 13 scenario groups passed. Widths: 320, 375, 390, 430, 480, 481, 1024px.
- Browser checks: one named dialog, initial phone focus, OTP step focus, 12 Tab and 12 Shift+Tab transitions per width, Escape, trigger focus restoration, no horizontal overflow, actual mobile close target >=44px, outside click, scroll unlock, native touch drag, confirmation 401/500/network failures, retry with exactly one OTP verification, and held confirmation released only after closure. No hydration/React runtime errors matched.
- Delayed-response tests use explicit deferred promises/held-response release barriers. Polling waits observe actual UI conditions rather than fixed sleeps for the race.
- Isolated production build: PASS; production source bytes verified against all seven current production files.
- Safari 15.4 syntax gate: PASS, 82 client scripts / 5 startup scripts. This is a syntax gate, not a physical Safari test.
- git -c core.safecrlf=false diff --check: PASS.
- Build-only declaration error was corrected before final validation. A Windows short/long temporary-path Turbopack error was resolved using canonical isolated paths and a fresh isolated build cache. No configuration/dependency workaround was committed.

Validation used NEXT_PUBLIC_API_URL=http://127.0.0.1:3347 with a synthetic, memory-only frontend fixture. No real backend, OTP, SMS, database or production endpoint was exercised. The persisted browser test validates fixture identity and loopback URLs and blocks browser network traffic to other origins.
Evidence directory: C:/Users/AYOOBM~1/AppData/Local/Temp/jeawaz-otp-ux-20261017 (build.log, focused-final.log, full-final.log, browser-final.log, browser.json, WIP_PRESERVATION.json).

### Reproducing the browser check

1. Run node src/utils/fixtures/otpAuthApi.cjs (loopback :3347 only).
2. Build an isolated current-source copy with NEXT_PUBLIC_API_URL=http://127.0.0.1:3347; start it on 127.0.0.1:3360.
3. Start an isolated Chrome profile with remote debugging on 127.0.0.1:9337 and touch emulation available.
4. Set OTP_AUTH_BROWSER_ORIGIN=http://127.0.0.1:3360, OTP_AUTH_BROWSER_API=http://127.0.0.1:3347 and OTP_AUTH_BROWSER_CDP=http://127.0.0.1:9337. Optionally set OTP_AUTH_EVIDENCE_DIR to an existing temporary output directory.
5. Run node --test src/utils/otpAuthDialog.browser.test.mjs. Never substitute a real API, real phone or live account.

## E. WIP preservation and boundaries

Current correction: only the four production files, five tests/fixture files and this report changed relative to its starting snapshot. All other owner WIP is verified byte-identical; both HEADs and indexes are unchanged. See current WIP_PRESERVATION.json.

Initial implementation snapshot (retained):

Backend HEAD a952b98962342ee81a1cf74157d7751d58561e28 unchanged; all 591 snapshotted backend files byte-identical, including lock/config files, excluded Phase 12 scripts, Graphify and reports.
Frontend: only the 12 intended pre-existing production/test files changed; 531 other snapshotted files are byte-identical, including owner SEO_AUDIT_REPORT.md. Three new test/fixture files and this report are added. Both Git HEADs remain unchanged; both indexes remain empty. No backend, migration, dependency, commit, push, packaging or deployment operation.

## F. Remaining manual checks

Physical iOS Safari keyboard/zoom/autofill behavior and VoiceOver/TalkBack announcements remain outstanding. Real SMS delivery and production cookie/auth integration were deliberately not tested. Existing unrelated auth/security and SEO work remains separate.

## Validated SHA-256 manifest (current correction)

The report's own hash is intentionally excluded.

| File | SHA-256 |
| --- | --- |
| `src/contexts/auth/AuthContext.jsx` | `93ea7d6697a0cdf44daceeb28aaf6c9443ed293793fd911d1ed47c4944ab0b6d` |
| `src/app/(user)/auth/_components/Login.jsx` | `1d8a36d1794b32d21be389b2ec35f06e2dc30df6c151597dba07f9ca10256dcf` |
| `src/app/(user)/auth/_components/LoginForm.jsx` | `e4a0ed7ac578b5f659e3f13590816081116d949189f5b3a31103f41ad2262b14` |
| `src/app/(user)/auth/_components/AuthLayout.jsx` | `891614efccbd92d198870b63e7e3a617f9c80dd5a7dca7739df1f44bd7e1787f` |
| `src/components/Modal.jsx` | `eb6c9c7bb95c30626a62d3bbf293922210d8fdb9b23f0ebb43e9d2b9ab27f1e2` |
| `src/hooks/useDragToClose.js` | `f45b5f3f714db55a16f6fc1868fec1fa4f278594611e4f41d19c269cb5938bcc` |
| `src/app/@modal/(.)auth/login/page.jsx` | `288bae9f0f292df674911edc6f45b583696d77af9c575e23b2ee483b1a0d0b2c` |
| `src/app/(user)/cart/_components/CartLayout.jsx` | `fcdde9e7c08ef6067f275c13ea7fe92989024eaddb8f5f333d26222ce6032928` |
| `src/services/authLoginContract.test.mjs` | `b7f6e5b3b922e58ccc7f96d269ed002eda7576728632ec9596ece5eac59acf19` |
| `src/utils/addedToCartContract.test.mjs` | `1fea0488313e089d3f4266ae776072882160699c9ea55772de8bfd6e9f98e2f6` |
| `src/utils/checkoutAuthFlow.test.mjs` | `11f4eb20382cc666397a83445cb7d0e1bb9f710c85fca3dcf16f560437a9bbe3` |
| `src/utils/otpLoginFlow.test.mjs` | `0d506bdcfb6232db6ef3ecaae44439a8c774bd4ebbb1bf1d1d154fc19651a774` |
| `src/utils/otpInputContract.test.mjs` | `6abc5e5c94dc8ad44b06acbe4c577c67d1d586e16f725137147ecf61d50d8d0d` |
| `src/utils/productFilterFlow.test.mjs` | `5f2a4e46c8541ab1a24ce60453438ea630d4a787c6ff8af7b4f40ef16a508c97` |
| `src/utils/otpAuthConfirmation.test.mjs` | `1260710890afb7ff0aedd256126e05579ef3a3064b6f78843b8013862d6d825b` |
| `src/utils/otpAuthDialog.browser.test.mjs` | `b41b588b6d509b3dfc58ae70778c882a17aa12adc928433a000d6aa18a3a33ee` |
| `src/utils/fixtures/otpAuthApi.cjs` | `c07ffcce8ecb8081ae25af45147854aa1049527b2cefdb97641a6d297417fb92` |
