# Mobile Spotlight search review

Validated 2026-10-16 against frontend a34ed2f5dc7b9b97ba253d593091ec339f4ecf82.
Backend f8759fbbb82105b7e1ef1ee6b85a8e8aa9195671 is unchanged.
No commit, push, deployment, production access, database or dependency change.
This is pre-commit evidence, not production release clearance.

## A. Confirmed bugs fixed

- HeaderLayout never consumed the existing suggestion hook or supplied results
  and a renderer to SearchSection. Typing could not request/render previews.
- SearchSection opened only when results already existed at focus time. Responses
  arriving after focus did not open it. The controlled reproduction and new
  component regression cover focus/type/results without a second focus.
- The small-screen search row clipped its absolutely positioned dropdown. The
  retained 481-639px row now allows overflow and stays visible while focused.
- Browser validation caught Tailwind max-[480px] excluding exactly 480px. An
  explicit inclusive max-width media query now matches the controller boundary.
- Base UI trap-focus mode did not emit aria-modal. The dialog explicitly declares
  aria-modal=true while trapping focus, hiding outside content from assistive
  navigation and covering it with its dismissible backdrop.
- A notch/short-viewport probe reproduced bottom overflow (412px in a 400px
  viewport). The final maximum height subtracts both safe-area margins; the
  same probe now ends at 366px, retaining the 34px bottom inset.

## B. Implementation and exact files

1. src/components/HeaderLayout.jsx — one shared suggestion controller/renderer,
   focus surface, mobile trigger, route/resize cleanup and focus restoration.
2. src/components/SearchSection.jsx — controlled disclosure, accessible input,
   inline/anchored results, composition guard and distinct status/error states.
3. src/components/MobileSearchOverlay.jsx — new installed Base UI Dialog wrapper.
4. src/app/Header.jsx — mobile-only reservation for the single-row header.
5. src/hooks/useProducts.js — optional enabled gate and query-owned AbortSignal.
6. src/services/productServices.js — optional signal forwarding, same endpoint.
7. src/utils/headerSearch.mjs — pure query gate and responsive surface helper;
   existing syncHeaderSearch/productSearchNavigation behavior is unchanged.
8. src/utils/headerSearch.test.mjs — retain URL assertions and allow one controller.
9. src/utils/headerSuggestions.test.mjs — new controller/component/API regressions.
10. src/utils/protectedLinkPrefetch.test.mjs — exact exception for new transient
    suggestion links; every existing public/protected link policy stays checked.
11. MOBILE_SEARCH_REVIEW.md — this report.

## C. Desktop/mobile behavior

At <=480px, a 44px search icon sits next to the owner's unchanged logo. The
existing category/cart controls remain in the same row. At 320px, measured
category/logo-group/cart bounds all fit within 16px side padding and share a
vertical center; header height is 88px. Only small-screen logo-wrapper padding
is reduced to fit the new icon. The owner's image source, h-8.5 size and 3:1
ratio block remain byte-identical to task start.

Above 480px, existing desktop/tablet/phone input layouts remain, with restored
anchored previews. At 481px the lower-row previews are visible and hit-testable.
Header spacing changes only at <=480px. No pagination, catalog layout, global
CSS, shared modal, sidebar or unrelated header controls were redesigned.

The new dialog is body-portaled, top-aligned, darkened/blurred and RTL. It uses
an explicit input focus ref and 16px input font; the installed dialog's default
touch behavior alone would focus the popup instead. Cancel, backdrop, Escape,
submission, result selection, pathname/query changes and crossing above 480px
close it. Dismissal restores the visible trigger; resize can restore the newly
visible inline input. Navigation deliberately does not steal destination focus.
The existing shared owner-counted scroll lock is the only lock used by this
component; Base UI uses trap-focus mode, avoiding a competing body-style lock.

## D. API, requests and race handling

Reuse GET /products/search/suggestions with search and limit=5. The public
response remains a plain array containing id, perTitle, enTitle and image.
Rows reuse AppImage, real numeric /products/{id} Next Links and one renderer.
Missing images retain AppImage's existing behavior. No price/stock claims or
extra detail API reads are required for previews.

A single hook in HeaderLayout serves all CSS-switched inputs. Requests require
an active visible surface, at least three trimmed characters and equality with
the 300ms debounced term. Otherwise the observer moves to a disabled empty key,
hiding old results immediately and detaching the previous request. React Query's
own signal is forwarded through Axios; no broad cache cancellation or timers
are used to mask races. Existing term/limit keys and 60-second freshness remain.
Pending and populated-cache cancellation are covered with real QueryObserver.

Loading, no results, network failures and HTTP 429 have separate messages.
Submission remains available when suggestions fail. No automatic retries or
window-focus refetches were added. Composition cannot submit a partial term.
Transient result links disable detail prefetch: the browser fixture demonstrated
speculative detail reads before that change; final checks show none before
selection. Other public links retain their prefetch behavior.

Existing submission still preserves URL filters/explicit sorting, resets
page=1&limit=12, replaces on /products and pushes from other pages. API contracts,
backend normalization/aliases, SSR catalog snapshots, canonical metadata,
sitemap and Product JSON-LD were not changed.

## E. Validation

- Focused final group: 34 passed, zero failed (search, scroll ownership, prefetch).
- Full final frontend suite: 891 passed, zero failed/skipped/cancelled.
- Final production build passed with NEXT_PUBLIC_API_URL=http://127.0.0.1:3341.
  This is a disposable in-memory public API fixture, not a backend/database.
- Final Safari 15.4 syntax gate passed: 81 client scripts / 5 startup scripts.
- Actual production-server Chrome checks passed at 320, 375, 390, 430, 480,
  481, 640 and 1024px. No document horizontal overflow; correct visible surface,
  modal semantics, focus, real image/product hrefs and no clipped preview links.
- No suggestion reads before interaction, below three characters or in the
  first 100ms after typing; exactly one suggestion read after the debounce.
- Real delayed slow -> fast responses: slow HTTP request aborted, fast results
  retained after the older response interval. Network/429/empty states passed.
- Keyboard Tab/Shift+Tab remain in the dialog; Escape/cancel/outside close and
  restore focus. Resize to 481px releases the lock and focuses a visible input.
- Actual Enter submission preserved gender and explicit sort and reset paging.
  Real product selection navigated to /products/105. Query-only route changes
  also dismissed the dialog. Console/hydration errors: zero.
- Light and dark themes passed with five results in a reduced 500px viewport.
  Dialog stayed within the viewport and scrolled internally; emulated scale=1.
- Final notch test: top=44px, bottom=366px in a 400px viewport with a 34px bottom
  inset. Trusted Chromium touch activation focused the input. Closing during
  a pending request aborted it and did not reopen the dialog after its delay.
- Raw production HTML retained public product/pagination anchors and initially
  closed search state, without a rendered modal. No new SSR price/stock cache.
- Frontend/backend git diff --check passed; indexes remain empty. Temporary
  verification processes were stopped after verification.

Intermediate failed checks are retained as development evidence. The initial
old header test intentionally forbade suggestion requests and was updated for
this authorized feature. Browser checks drove the inclusive boundary, explicit
modal declaration, prefetch and safe-area corrections. An Enter-driver fixture
needed the real carriage-return key text; the passing run exercises actual
form submission. The final logs above supersede earlier attempts.

## F. WIP preservation

Task-start fingerprints cover 527 frontend and 539 non-generated backend files.
Exactly eight intended existing frontend files changed, plus the three new
feature/test/report files above. All other 519 frontend files and all 539 checked
backend files remain byte-identical. This includes the complete uncommitted
pagination implementation/review, owner flower.svg, LoginForm, FiltersModal,
admin OrdersListTable and audit notes. Owner logo attributes in the deliberately
modified HeaderLayout remain byte-identical. Graphify output was not touched.
HEADs remain unchanged, nothing is staged and no release archive was modified.

Evidence:
C:/Users/Ayoob Mahmoudian/AppData/Local/Temp/jeawaz-mobile-search-20261016

Contains initial-manifest.json, original component snapshots, focused-final.log,
full-tests-final.log, build-final.log, safari-final.log, browser.json,
extra-browser.json, safe-area-before.json, safe-area-after.json, raw-products.html,
screenshots, preservation.json and validation-manifest.json. Test fixtures and
browser scripts remain outside the repository.

## G. Remaining manual QA

Physical iOS Safari keyboard appearance, focus zoom, VoiceOver, address-bar
transitions, safe areas, orientation and nested-overlay interactions remain
owner-run checks. Chromium touch/viewport emulation and a Safari syntax gate do
not establish those results. Verify production build-time HTTPS API origin,
server reachability and live Liara proxy/throttling configuration before release.
Existing production/release and unrelated historical gates remain separate.

Verdict: MOBILE SEARCH READY FOR PRE-COMMIT REVIEW.

## Final UI release correction — 2026-10-16

The owner explicitly approved the latest header UI and all seven other UI files
for the combined release. This appendix supersedes the earlier layout snapshot;
the previous validation history above is retained.

The owner now uses a branded full-width mobile search trigger and a single
inline input above 480px. Before correction, actual Chrome at 480px showed the
inline input instead of the trigger; at 481px and 639px typing made zero
suggestion requests. CSS used an exclusive max-[30rem] breakpoint while the
controller used <=480, and the removed phone input still had its own controller
surface. The correction uses explicit inclusive max-width:480px media variants
and maps 481-1023px to the existing tablet/inline surface. The owner's logo,
menu icon, spacing, notes and other intended UI are retained.

The original one failing test reproduced the CSS defect. After correction its
old header-spacing assertion was updated for the approved single-row layout,
and its prefetch assertion now tolerates JSX formatting without dropping the
prefetch=false requirement. Request keys, debounce, cancellation, navigation
and API contracts are unchanged.

Current validation: 48 focused tests and 891 full tests pass; production-mode
validation build and Safari 15.4 syntax gate pass (81 client / 5 startup scripts).
Chromium production-server checks pass at 320/375/390/430/480/481/640/1024px,
with extra 500/639px checks. There is no document overflow or console/hydration
error. Loading/empty/network/429 states, one-request debounce, slow-request
cancellation, result links, Enter, focus trap, dismissal, resize, themes and
scroll release pass. Actual Back/Forward navigation also passes.

Read-only checks against the owner-started localhost:3001 backend returned
200 [] for ابسولوتابس and an unmatched English query, and valid five-row
arrays for آمواژ and Amouage. No backend, migration or database changes were
performed. This resolves the earlier local API availability check only; no
production API or Liara configuration is independently verified.

See FINAL_UI_RELEASE_REVIEW.md for the exact combined scope and current gates.
Evidence: C:/Users/Ayoob Mahmoudian/AppData/Local/Temp/jeawaz-final-ui-release-20261016.
Physical iOS Safari/VoiceOver remain outstanding. Production API configuration
and actual Liara rollback version remain UNVERIFIED; no release ZIP is prepared.