# Session and Cart Lifecycle — Phase 1 Review

Status: COMMIT-READY after the four-blocker correction. No commit, push, deployment or packaging.

## Scope and baseline

Frontend 59133f3de03ba1f12af37a11cd8d43cf6dbf6b5b; backend a952b98962342ee81a1cf74157d7751d58561e28. Frontend-only correction of audit findings #1, #2, #3 and #6. Backend merge/session transaction finding #4 and initial guest-cookie coordination finding #5 are explicitly deferred and unchanged. No dependency, schema, backend or production operation.

## A. Reproduction and corrections

| Finding | Before, reproduced from unchanged source | Final behavior |
| --- | --- | --- |
| #1: cross-account 401 replay | A cart POST received a delayed 401; the interceptor refreshed B and replayed the POST as B. | Requests capture a shared generation. Superseded dispatch, refresh outcomes and retry are rejected. Same-generation refresh remains single-flight and does not advance identity generation. Old refresh cleanup cannot clear a newer single flight. Public non-401 error contracts remain intact. |
| #2: cross-tab stale identity | A mounted provider retained A after shared cookie authority switched to B. | Local credential transitions invalidate synchronously. Credential-free started/settled markers use storage and BroadcastChannel with deduplication; receiving tabs clear private caches and confirm /users/me. Focus/pageshow also reconcile. Known definitive session loss is announced without a guest refresh loop. Unknown identity suspends cart mutations; failed reads do not count as successful confirmation. |
| #3: late mutation cache/state pollution | A delayed add result replaced B cart data and showed success after A-to-B cleanup. | Capture generation at mutate(), before queueing; check at dispatch and completion, suppress stale cache/feedback/follow-up callbacks, retain cleanup-only settlement. Abort old cart transports promptly, forwarding caller cancellation. Quantity state and cleanup are generation guarded; B controls do not inherit A optimistic quantities. |
| #6: pending guest query adoption | Invalidation reused a pending first guest fetch; its result became fresh for five minutes after login. | Cancel captured old cart work synchronously, await only that barrier before enabling confirmed cart work, forward AbortSignal, and guard results. No delayed cancellation targets a newer request. Existing guest data can remain visible while reconciliation is pending, but cannot become a fresh account snapshot through the old request. |

## B. Integration details

- Auth service URLs, methods, payloads and public response shapes are unchanged. Login ignores response credentials and confirms the user through /users/me. Automatic and explicit confirmation share one in-flight request per generation. Accepted OTP retry and all Login/modal components remain unchanged.
- Both password/OTP login, logout and verified phone-change completion enter the shared session boundary. Ordinary access-token refresh does not change generation.
- Initial/failed identity confirmation remains fail-closed for cart mutations. Same-account focus checks can settle in-flight results after confirmation; failures settle readiness waiters without dangling promises. Unmount releases waiters.
- Public catalog caches are retained. Existing private query roots are reset at transition start; active private queries are invalidated after confirmation.
- Cart mutation envelopes and callbacks are internal only; HTTP payloads and callback variables retain their previous shape. Line scopes and stock rules are unchanged.
- Checkout retains its last cart view for the existing session-expiry re-login prompt even after synchronous cache cleanup; its retained reference is discarded on a different confirmed account. Stale coupon rejection is consumed without false success.
- The browser held-response check exposed optimistic quantity remaining at one with no matching line in either account. The correction adds cart/generation resynchronization and guards old flow state writes. The final browser run proves no stale quantity/success feedback.

## C. Initial Phase 1 validation (historical)

- Complete maintained frontend suite: 1,233 passed, zero failed; one opt-in browser test skipped in that run and executed separately below. Command: node --test --test-timeout=30000 --test-reporter=spec over all src/**/*.test.mjs. The historical Jest-style socketService.test.js is not part of this maintained Node test command and was not modified.
- Focused deterministic concurrency suite: 44 passed per run, five consecutive repeated runs (220 passes), no timing-based race assumptions. Deferred promises, captured cancellations, simulated storage events and real QueryClient/MutationObserver exercise the production modules.
- Isolated final production build: PASS. Build-only NEXT_PUBLIC_API_URL=http://127.0.0.1:3437 points to a synthetic memory-only API, never a real backend. Existing matching pnpm dependencies were reused with byte-identical lockfile; no install or dependency change. All 13 built production files match current source SHA-256.
- Safari 15.4 syntax gate: PASS, 82 client scripts / 5 startup scripts. Physical Safari is not implied.
- Existing production browser regression: 23 scenario groups PASS (320/375/390/430/480/481/1024 widths, keyboard/focus, confirmation 401/500/network, retry without OTP replay, dismissal/drag/native Back).
- Actual two-tab headless Chrome production run: seven groups PASS: login, logout, account switch, focus, pageshow, failed confirmation/recovery, old held cart transport aborted with no stale cart/feedback and current controls released. Storage/BroadcastChannel and actual DOM interactions were exercised against synthetic server identity, not real production cookies/accounts.
- Eleven production HTTP smoke checks PASS: homepage, base/filtered/sorted listing, valid pagination, listing/product 404, sitemap, robots and Product JSON-LD/SSR anchors. Fixture-based evidence, not production verification.
- Both repository diff checks PASS. No full backend suite or database operation was necessary for this frontend-only phase.

Temporary evidence: C:/Users/Ayoob Mahmoudian/AppData/Local/Temp/jeawaz-session-cart-phase1-20261018 (before-probes.cjs/frontend-probes.json, full-final.log, repeat-1..5.log, build-final.log, browser.json, browser-multitab.json, http-smoke.json, WIP_PRESERVATION.json).

## D. Limitations and deferred work

1. Aborting or rejecting browser work cannot undo a request already executed by the server or an already-processed Set-Cookie. Late credential responses trigger reconciliation of actual browser identity; this is not server-side session transactionality.
2. Cross-tab markers carry no credentials/private identity. If storage and BroadcastChannel are both unavailable, focus/pageshow provide reconciliation; hidden tabs are not polled. Production cookie/domain and background-tab behavior still require owner QA.
3. Auth attempt failures can cause a bounded identity recheck because HTTP outcome may be ambiguous. Confirmation does not retry indefinitely; a later explicit retry/focus event can recover.
4. Backend transaction issue #4 and guest initialization issue #5 remain outstanding. Inventory rules, OTP consumption and backend security fixes were not changed.
5. Physical iOS Safari, VoiceOver/TalkBack and live cookie/SMS behavior are outstanding. Existing intentional checkout form retention/review behavior is preserved; this phase does not redesign forms or backend session revocation.

## E. Exact changed-file manifest

13 production files, 11 tests, and this report. The report itself is excluded from its hash manifest.

| File | Kind | SHA-256 |
| --- | --- | --- |
| src/app/(user)/cart/_components/CartLayout.jsx | production | 941f91dd43bb54183247a0f150b22a165675f8cb86afd0a14d366a5315a16a18 |
| src/app/(user)/cart/_components/CartSummery.jsx | production | 002635be88d161b2e299a2b280209dd3004630e6b899de12861a87d2248fb8e0 |
| src/app/Providers.jsx | production | e1d82253716335623473a0a2a620f8b577addc4c5d49ed66a8eb6fef35f3ca2e |
| src/contexts/auth/AuthContext.jsx | production | d254f32ac088e22bf0ae7f1d9e50e47136004aeaf97b144df8e48afecef4776d |
| src/hooks/useCart.js | production | 301184094b312226669e9a1d6bce69c2504b4d0d7a14acd49b2831b0e802a648 |
| src/hooks/useQuantityHandler.js | production | bd20d14aa69315eb1a0668cdb90d2d02752021993ce942f777e1917ab8e5b94f |
| src/services/authServices.js | production | 239614718a8b55d2ac7e00b198334e9a307da78ef9c20925c32ec81f689528f2 |
| src/services/cartServices.js | production | a8ba3a6b837cc7f8b2004ea08fbf2b31b3551767fb719d7fd0a1c1c25a39116a |
| src/services/httpClient.js | production | 96c9a85324e1ea1bf64733cbfaa7aaaa6d55f0c5d56e284479d50d78e6a0ca43 |
| src/utils/authIdentityCache.mjs | production | 9aa9fd5200986b11ebebb1321da0684acf8e9ace89c0aa25d45a48a3aa7da41d |
| src/utils/cartQuantityFlow.mjs | production | 0ce9b90b2bdfa651371ce42984fbceb3170e54e5b53b22d5197c4398d9ad6232 |
| src/utils/sessionLifecycle.mjs | production | bff1c6efffdde693c5c260c3ccdca5f2930ae6700b0e3a281b164cb1a00af241 |
| src/utils/sessionCartMutation.mjs | production | 1b68ef3f4cf8f43f89a339f353d83c9ffd969dee34320a8fdfedc678d37b3e73 |
| src/services/authCredentialRetry.test.mjs | test | bac2c82ea31185eafea183a83ec27e535fd5c750d3432def37e2567b5d3816c6 |
| src/services/authLoginContract.test.mjs | test | 6ad53ea03854a22b6b0c1fc183952769dd0d0a42b74497a910310dfcf34a96a3 |
| src/services/httpClient.test.mjs | test | 9ab796e7db81afb2f3aed558bfe2b8ed3eb2050e3133b39fa73ca744e467ed80 |
| src/services/phoneChangeApi.test.mjs | test | 3ad53ea69b7aacad52ba23181f75fffbf17e7d43a5058d4e976ea5480df4d9d4 |
| src/utils/addedToCartContract.test.mjs | test | b5f81d98e97216fa2c591dd4f32fd81161009f1fc97edec289dd7c7df96b6e5f |
| src/utils/authIdentityCache.test.mjs | test | bebf1448b30f3f388c54d3336ba42f4c5bfce0640134b24984f59e2bba4a52e5 |
| src/utils/cartQuantityFlow.test.mjs | test | f0a35cd9def3265635dddb99f061dcc78808bc5bdbe8dcc40c7fff4572421c51 |
| src/utils/checkoutAuthFlow.test.mjs | test | c447c84e1b50ca3afb2ece9b9cc04545aca2753cf59d847af6a8217125982b33 |
| src/utils/otpAuthConfirmation.test.mjs | test | 7a552072e22d3eabb360c8c1de8f8bdb65049c8207ad1c34e94688813887ac81 |
| src/utils/productAvailability.test.mjs | test | 583910279f4ea3226a95a8707c3d2eddf0ff1cb900dd5950d190b2f26517bfa7 |
| src/utils/sessionLifecycle.test.mjs | test | 02959568a9c655113d2ef871945fed788704db7ae47f08fec0139fa0cfa37506 |

## F. WIP preservation

All 591 backend files and its status/index/HEAD are byte-identical. All 528 excluded frontend files are byte-identical, including SEO_AUDIT_REPORT.md; package files/lockfile are unchanged. Both indexes remain empty; HEADs remain at the baselines above. Only the 24 production/test files in the manifest and this new report are changed. Root handoff documents were read and remain untouched. No source from owner WIP entered the isolated build.

Verdict: superseded by the final correction evidence below.


## G. Final pre-commit correction — 2026-10-18

The four independently reviewed blockers are corrected. This section supersedes the initial validation snapshot in section C; that historical evidence is retained.

### Reproduction before production edits

The new deterministic tests were run against the unchanged Phase 1 implementation first: 58 cases, 46 passed and 12 failed (before-regressions.log). The failures cover same-turn request invocation, an asynchronous interceptor, pending remote login plus focus/pageshow and successful/failed settlement, both confirmation continuation gaps, suspended coupon dispatch and stale coupon success/error feedback. Valid confirmation-generation increments and ordinary coupon behavior were passing controls.

### Minimal production corrections

| Blocker | Root cause | Correction |
| --- | --- | --- |
| Axios capture | The default asynchronous request interceptor read the generation after invocation, allowing an A-origin operation to be tagged as B. | Capture in Axios's synchronous runWhen chain-construction hook, retaining the original tag on dispatch, refresh and retry. The asynchronous dispatch check still rejects superseded work. No Axios wrapper, changed payload, new adapter or dependency. Callable/request/get/post forms with an additional delayed interceptor are tested. |
| Remote readiness | Focus/pageshow checked only local changes, so a receiver could confirm the old account during another tab's pending login. | Reuse the same credential-free transition id for started/settled; deduplicate by phase/id, track all known pending remote transitions, and refuse confirmation until local and known remote transitions settle. Re-read the marker on mount/focus/pageshow for missed delivery. A 30-second recovery timer invalidates old work and requests a fresh identity read; it never assumes success or restores an identity on its own. Late settlement rechecks again. Cancelled/dequeued recovery callbacks are inert after settlement/unmount. |
| Confirmation continuations | Generation could change between the cancellation barrier's check and user-state writes, or between confirmation and strict promise completion. | Assert the accepted generation immediately before state writes and strict success. Retain the generation after the workflow's own legitimate identity increment. Apply the same guarded readiness boundary to logout/session-expiry continuations. |
| Coupon guard | useApplyCoupon bypassed the shared guarded mutation mechanism. | Use the existing useCartMutation helper. Unknown/suspended identity blocks dispatch; superseded completion cannot show success/error feedback or invalidate B's cart. Raw coupon variables and response contracts remain unchanged. |

No other production files were changed during this correction.

### Exact correction files and size

Production, relative to the reviewed pre-correction source:

- src/services/httpClient.js: +7 / -1
- src/utils/sessionLifecycle.mjs: +47 / -10
- src/contexts/auth/AuthContext.jsx: +20 / -6
- src/hooks/useCart.js: +1 / -1

Production total: +75 / -18.

Tests:

- src/services/httpClient.test.mjs: +32 / -0
- src/utils/sessionLifecycle.test.mjs: +145 / -0

Documentation: this existing report, including refreshed hashes for the six corrected source/test files. The complete Phase 1 manifest remains 13 production files, 11 tests and this report. The tracked otpAuthDialog.browser.test.mjs was restored to its exact pre-correction bytes; browser-harness experiments remain in the isolated evidence folder.

### Final validation

- Focused deterministic suite: 66/66, five consecutive final runs (330 passes), zero failures/skips. Includes all original 44 cases and 22 added cases. Explicit promises/microtask boundaries and controlled timers cover remote overlap, missing start/settled notifications, abandoned-tab recovery, success/failure recovery, late start/duplicate markers, local/remote overlap and dequeued-timer cleanup.
- Complete maintained frontend suite: 1,255 passed, zero failed; one opt-in browser invocation skipped there and executed separately. 1,256 total. No backend or database suite was needed.
- Isolated production build and Safari 15.4 syntax gate: PASS; 82 client scripts / five startup scripts. All 13 production-file hashes match the built source. The build API was the synthetic loopback http://127.0.0.1:3437, not production.
- The matching existing pnpm graph was reused without dependency/lockfile changes. The pnpm wrapper stopped at its automatic copied-install status check; the exact package build commands (next build, then check-browser-compat.mjs) were executed directly and passed. No dependency install/update was needed.
- Actual two-tab headless Chrome: 13 groups passed twice. Seven retained groups plus pending remote focus/pageshow with successful/failed settlement, overlapping transitions and missed-notification recovery. No premature identity request during a known pending remote transition; no hydration errors.
- Actual OTP/mobile browser: all 23 existing groups passed against the final build using an isolated harness with exact-document loading, initial identity, committed OTP input and native-focus barriers. The assertions and scenarios were retained. Earlier instrumented runs also passed all 23 groups.
- Eleven existing production-server HTTP smoke checks: PASS (public catalog, filtering/sorting, pagination, product/listing 404, sitemap, robots, Product JSON-LD and SSR anchors). Synthetic fixtures, not live production verification.
- Both repository diff checks: PASS. HEADs and empty indexes remain unchanged.

### Browser-run instability, kept separate

The unmodified single-tab OTP browser harness intermittently times out at OTP transport/input steps. This also reproduced on the unchanged pre-correction production build (browser-otp-baseline-3.log), after two baseline passes; it is not introduced by these four corrections. A failed transport attempt did not reach the synthetic /auth/request-otp route. Its underlying transport cause is not conclusively established.

The existing harness assumes navigation/React input readiness at several boundaries; isolated diagnostic versions add explicit load/input/focus barriers without changing application code or weakening assertions. The final hardened harness passed all 23 groups. Do not describe the raw browser runner as uniformly green or treat the baseline comparison as proof of a production transport defect. Stabilizing that historical harness or investigating the synthetic transport further remains separate work; its tracked file is unchanged.

### Safety and remaining limits

- Same-session refresh remains single-flight and does not advance generation. Stale request dispatch/replay, queued cart work, mutation feedback and confirmation writes are rejected.
- Public caches and legitimate guest data remain subject to the existing Phase 1 policy. Pending guest cart requests are cancelled before the confirmed account fetch; no older cancellation targets a newer request.
- Marker contents remain only version, phase and random transition id; no account identity, cookies or credentials.
- Recovery's 30-second timer is a scheduled bound; a suspended browser may run it later. Recovery requires an actual /users/me result. Failed identity reads keep mutations suspended.
- Browser cancellation cannot undo server execution or processed Set-Cookie. This implementation does not claim server-side session transactionality.
- Deferred backend finding #4 and guest-initialization finding #5 remain unchanged. Physical iOS Safari, VoiceOver/TalkBack, real cookie/domain behavior and background-tab suspension remain owner QA.
- No commit, push, packaging, deployment, production request, SMS, database, migration or dependency change.

Evidence: C:/Users/Ayoob Mahmoudian/AppData/Local/Temp/jeawaz-session-cart-correction-20261018 (before.json, before-regressions.log, repeat-1..5.log, full.log, build.log, browser-multitab.json and run2 log, browser-otp-hardened.log/browser.json, baseline browser logs, http-smoke.json, WIP_PRESERVATION.json). Diagnostic failures are retained, not discarded.

Verdict: COMMIT-READY for the bounded four-blocker correction. Baseline browser-run instability and the manual checks above remain explicitly outstanding.
