# Products accessibility corrections and bounded desktop profiling

2026-10-21. Baseline: bf65b2bf671f9e3d4e7231e04fcf8f6e392041f2, frontend 01-app-layout. Frontend initially clean. No commit, push, packaging, deployment, backend, dependency, API, filter, auth, Swiper, skeleton, or image changes. Performance work is observation only.

## Confirmed accessibility corrections

- FiltersModal: name all ten panel-navigation arrows with Persian action labels using their existing titles. Includes SingleCategoryFilter and VariantTypeFilter mobile arrows. No aria-expanded: these navigate between filter panels rather than expand a controlled element. Existing native buttons and handlers/classes retained.
- FilterSection: name the desktop brand-strip scroll button “نمایش برندهای بیشتر”; handler remains scrollTo(ref, "x", -400).
- ProductPagination: first/last unavailable-arrow spans now have role="link" with their existing aria-disabled and Persian names. They have no href, tabindex, or click handler. Live Next links, loading behavior, active marker, filters and URLs unchanged.
- Footer: both navigation headings changed from h3 to h2, preserving text-lg and all surrounding classes. Actual document heading sequence now h1 → h2 → h2. No text/color/layout redesign.

Baseline actual production-rendered DOM and Chrome AX tree confirmed unnamed filter/brand-strip buttons, generic disabled spans and the h1→h3 skip. Local initial source build predated the rebuild; final checks and both traces use the new build of current HEAD plus the four accessibility changes.

## Validation

- Three new filter-control tests initially failed against unchanged code; passed after corrections. An initial test-only expected-order mistake was corrected to the existing taxonomy order; no production behavior changed to accommodate it.
- 407 relevant regression tests passed, 0 failed, 0 skipped: accessibility, pagination/loading/URL contracts, taxonomy/filter flow, SSR snapshot/hydration, listing and brand SEO, protected links and OTP flow. Full suite was not repeated.
- Production build PASS with NEXT_PUBLIC_API_URL=https://api.jeawaz.com; 33 routes generated. Safari 15.4 syntax gate PASS, 83 client scripts / 5 startup scripts.
- Limited Chrome 155.0.8059.85 local production checks at 1440×900 and 390×844: AX has zero unnamed buttons, native Enter opens brand selection and Back returns to all ten named arrows; Cancel closes; no document overflow. First and last pagination disabled link roles/names/no-target confirmed. Last valid fixture page 3 self-canonical: https://jeawaz.com/products?page=3.
- No Runtime exceptions/hydration errors captured. Trace CLS 0 in both runs; separate unthrottled interaction run initial CLS 0.000257 (baseline smoke 0.000161), last page CLS 0. No material layout shift observed; this is not proof of zero CLS in production.
- Desktop and mobile screenshots inspected; fixture has synthetic product names, missing product imagery and one synthetic brand, so real content and full catalog visuals are not certified.
- Harness-only corrections: added the required Enter text event for native CDP activation; fixed last-page assumption from 5 to the actual 3 (31 products / limit 12). These failures did not justify application changes.
- git diff --check PASS. No full Lighthouse/axe audit or physical iOS Safari/VoiceOver run.

## Profiling environment and limits

Exactly TWO performance traces, each a 12-second initial-load observation. Both: local Next production build, /products, Windows Chrome 155, 1440×900 DPR1, 4× CPU slowdown, 10 Mbps down / 5 Mbps up / 40 ms latency, HTTP cache disabled, GPU enabled by default. Same Chrome process with fresh tabs; compiled-code/process caches may differ. Trace/profiler instrumentation adds overhead. Catalog fixture: 31 products, default page size 12, 3 pages; controlled in-memory public API. All client auth/users/cart traffic intercepted with synthetic guest outcomes; SSR API fetches redirected to loopback. No production account operations, SMS, or database access. Nonlocal third-party requests blocked. No desktop/mobile comparative trace and no production Lighthouse trace was supplied: the reported 920 ms versus 10 ms gap is NOT explained conclusively by these measurements.

| Evidence | Run 1 | Run 2 |
|---|---:|---:|
| Web Long Tasks API entries | 11 | 14 |
| Sum max(duration−50,0) across whole capture | 1781 ms | 1727 ms |
| Largest initial Layout event | 400.6 ms | 417.5 ms |
| Largest React-heavy RunTask | 548.4 ms | 343.3 ms |
| FunctionCall inside that React task | 480.0 ms | 303.7 ms |
| Total UpdateLayoutTree | 873.2 ms | 1067.5 ms |
| Total Layout | 643.2 ms | 721.9 ms |
| Total EvaluateScript | 342.3 ms | 483.1 ms |
| Turbopack module-instantiator sampled self time | 308.2 ms | 361.6 ms |
| FiltersModal function + synchronous callees, sampled inclusive | 26.5 ms | 14.4 ms |
| FilterSection function + synchronous callees, sampled inclusive | 50.8 ms | 8.5 ms |
| Closed-modal taxonomy network requests | 6 | 6 |
| Framework RSC-prefetch requests | 23 | 23 |

Whole-window long-task excess is NOT Lighthouse TBT (different measurement/window). Nested trace totals are not additive. FiltersModal times exclude separately rendered descendant components and browser layout; they are not a whole-subtree React Profiler measurement.

### Reliable attribution

- CPU call frames show React ax → ih/sw (renderWithHooks/beginWork/work loop) and mutation/deletion traversal ui/uf/up, including native removeChild. Attribution uses the executed function bodies (memoizedState, updateQueue, Fiber tags, deletion traversal), cross-checked with node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.production.js functions renderWithHooks, beginWork, commitDeletionEffectsOnFiber and commitMutationEffectsOnFiber. This proves React render/commit work; it does not identify the owning React subtree of the expensive deletion.
- Turbopack I function body reads the module registry, initializes module factories and reports “because it was required from module”. Its sampled self time is module-runtime work, not a single application component.
- FiltersModal is identified by its exact destructured props and six typed category hooks in the executed function P, compiled line 2:1196. FilterSection J is identified by useRouter/usePathname/useSearchParams, mode="all", useForm and its exact rendered filter UI, compiled line 5:5438. Their source files are in the manifest below; chunk hashes alone were NOT used as attribution.
- No advertised client source maps in Debugger.scriptParsed. Exact original-line app attribution is limited to these distinctive function bodies. No React profiling build/component-commit measurements were introduced.
- Large Layout/UpdateLayoutTree events had no captured JS stack or enclosing FunctionCall. No actionable forced-reflow initiator was established. Browser style/layout cost is confirmed; assigning it to FiltersModal, CSS, images or a particular selector would be speculative.
- Closed FiltersModal does mount its option tree and seven query observers (six typed categories + shared brands). Six typed GETs occur before opening; brands deduplicate with FilterSection's required query. Volumes are already isOpen-gated. This avoidable startup work is confirmed, but its share of the 920 ms production TBT is unproven.
- ProductsLayout retains its explicit next-page React Query prefetch. Framework link prefetch and RSC decoding are visible; 23 requests are not by themselves proof of accidental duplication. No expensive sort/filter calculation or specific auth/search/Swiper hot path was independently demonstrated.

## Ranked recommendations, no performance changes implemented

1. Smallest bounded experiment: delay mounting ONLY the FiltersModal body until first open, retaining its parent draft/form controls and existing shared Modal behavior. Preserve draft synchronization, Apply/Cancel/reset, URL state, hydration and first-open focus/latency. Keep FilterSection's brand/category queries and public caches. Measure the six avoidable category requests, hidden DOM and repeatable main-thread cost. Do not promise a 920 ms TBT reduction.
2. If React/style costs remain material, identify the expensive commit's DOM deletions and affected subtree using React component-level profiling, then make a separate evidence-backed change. Do not optimize auth, product cards, Swiper or shared providers by guesswork.
3. Treat link-prefetch changes as a separate experiment only if measured costs justify their navigation trade-off. Do not blanket-disable crawlable links or prefetch.

### Bounded Phase 2 implementation prompt

Using current frontend source, reproduce closed FiltersModal's six eager taxonomy requests and mounted option tree. Implement only first-open mounting of its body (or a smaller equivalent if demonstrated), preserving the existing Modal, parent draft/form state, Apply/Cancel/reset, selected values, focus, responsive design, URL/query keys, SSR and hydration. No shared-Modal/auth/SEO/API/dependency changes. Test initial closed state, first open, repeated close/reopen, URL-filter restoration, selected labels and request deduplication. Compare identical baseline/candidate catalog, viewport, throttle and capture window. Acceptance: no six modal-only category reads/option subtree before open; no duplicate reads on normal reopen; unchanged filters/URLs/layout; no new hydration errors; record actual long-task/layout and first-open latency changes. Keep any claimed performance gain conditional on measurement. No commit/push/deploy.

## Final source/test SHA-256 manifest

Hashes are raw working-file bytes, not Git-normalized blobs. Report is additional documentation (not self-hashed).

- `src/app/(user)/products/_components/FilterSection.jsx` — `f6801637859e584977106a2bf6c128b59a5a83d54ce457695825b391ad2a2e12`
- `src/app/(user)/products/_components/FiltersModal.jsx` — `2c16f2f1ab5fac100dac726760f2f580228bb0fd5dd16103d1559d1932cbc14d`
- `src/app/(user)/products/_components/ProductPagination.jsx` — `06b18f3d6b1ee89959accf7363dee1772d62591f89ffc034763b9a80c2bfbf8a`
- `src/app/Footer.jsx` — `2d4f4e98f58c097555eef947867a9cec1e06acd01caaa008270bd2a57ca0171f`
- `src/utils/footerAccessibility.test.mjs` — `11999bc96df77c57e742938c85e445e3e046072af68e440d5f3254f19dfbf2ce`
- `src/utils/productPagination.test.mjs` — `d2eb29b28f6ee71aaecf55f35456006efa9055d3b96412eb80b097482bc9f0f6`
- `src/utils/productsAccessibility.test.mjs` — `22d25534279c2615b7a22c9309b4027f60707043261304b1371ca05600c507d8`

## Preservation and remaining checks

Frontend changes are only the seven source/test paths above plus this report. Both repository HEADs and indexes unchanged; backend and every excluded tracked/untracked file are checked byte-for-byte against the pre-task snapshot. No source performance optimization implemented. Local harness processes closed. Existing Modal animation-class typo unchanged.

Outstanding: owner Lighthouse rerun under matched device/Chrome/throttle/network conditions; real-catalog long-task/component attribution; matched mobile trace if investigating the reported mobile/desktop discrepancy; physical iOS Safari and VoiceOver. No live production verification claimed.

Verdict: accessibility corrections READY FOR REVIEW; desktop TBT contributors measured, exact production desktop/mobile divergence remains unverified.
