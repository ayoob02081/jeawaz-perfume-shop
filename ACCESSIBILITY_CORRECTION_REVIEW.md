# Accessibility correction review

2026-10-21. Frontend baseline: a911b41b9d19353cdb39b4c6fe8e8639668b327a; uncommitted Performance Phase 1 preserved. No commit, push, package or deployment.

## Confirmed defects and minimal fixes

1. Footer navigation had ul > div > li: actual Chrome DOM contained two invalid direct list children and eight list items with non-list parents. Kept the original block wrapper as div, moved the existing grid classes to ul, and left headings outside the lists. All eight destinations, order, profile prefetch opt-out, spacing classes, RTL, responsive columns and link behavior remain intact. Browser geometry for all eight links is exactly unchanged at 375/1440 px, both themes (0 px drift).
2. The footer background remains stone-950, computed RGB(12,10,9). Paragraphs and navigation used stroke-600; dark mode also applied 50% foreground alpha (element opacity remained 1). Contact helper used stroke-550 / dark stroke-200. Reused existing palette: text-stroke-500 / dark:text-stroke-250 gives RGB(127,127,136) at full alpha in both themes. Only the footer's own classes changed. Existing red link hover/active remains red, with a narrowly lightened #d4504d (212,80,77) to meet AA. No global palette values or unrelated components changed.
3. Search was a native type=search field with aria-expanded but no combobox interaction: suggestions are real links traversed with Tab, with ordinary form submission. Kept that interaction model. Added a named role=search form, named role=region for results, and aria-describedby pointing to its existing polite status. Kept global aria-controls while results exist. Removed only unsupported expanded state from the searchbox; closed fields have no dangling controls/description IDs. No listbox/options, active descendant or incomplete combobox was introduced. All event handlers, debounce, cancellation, suggestions, navigation helpers and API code are unchanged.

## Before / after contrast

WCAG sRGB relative luminance, with foreground alpha composited over the computed footer background. Normal-size text threshold is 4.5:1. Measurements are from the local production build, not guessed theme token names.

| Text | Before light | Before dark | After both |
| --- | --- | --- | --- |
| Paragraph / Contact Us and other navigation | approximately 3.14:1 | approximately 2.83:1 | 4.97996:1 |
| Contact helper | 3.90265:1 | 3.90265:1 | 4.97996:1 |
| Link hover / active | #cc312d, calculated 3.805:1 | same | #d4504d, browser verified 4.75453:1 |

Before light foreground: RGB(96,96,96). Before dark computed foreground: oklab(0.734145 0.00267521 -0.026133 / 0.5), approximately RGB(164,168,186) at half alpha, compositing to roughly RGB(88,89,97). Helper: RGB(95,112,134), full alpha. Browser JSON retains exact sampled color strings, alpha, effective RGB and unrounded ratios. The normal-text scan found no remaining sub-threshold footer text; large telephone numerals retain their original red and use the WCAG large-text threshold.

## Tests / browser evidence

- New footer semantic tests and new search semantic checks reproduced failures before production edits. Focused regression selection: 46 passed, 0 failed.
- Full frontend suite run once: 1,477 passed, 0 failed, 4 existing opt-in skips (1,481 total). Previous 1,473 passes plus four new tests; no tests removed. Existing header test now rejects the invalid aria-expanded instead of requiring it; new associations and keyboard cases strengthen coverage.
- Production build run once, NEXT_PUBLIC_API_URL=https://api.jeawaz.com: PASS, 33/33 prerendered pages. Safari 15.4 syntax gate: PASS, 83 client scripts / 5 startup. No dependency or lockfile changes.
- Local Chrome production-server baseline and candidate use an in-memory API; external account/SMS calls are intercepted. Four footer cases: 375/1440 px, light/dark. Valid DOM lists, every normal-size sample >=4.5, hover >=4.5, unchanged link positions/sizes, and no document overflow. Before/after screenshots inspected: only intended text lightening; grid, links, dark background and spacing retained.
- Five search cases: real desktop/mobile suggestions; Chrome AX searchbox with Persian name; named results region and polite status; Tab input -> submit -> product link; Enter product navigation; Enter search URL preserved (/products?search=rose&page=1&limit=12); mobile Escape, focus restoration and scroll unlock. No hydration or unhandled browser errors.
- Recorded candidate CLS: 0 for mobile light/dark and desktop light; desktop dark 0.00431877, exactly the same residual recorded in the pre-change baseline. Do not claim global zero CLS. Footer link geometry is unchanged; no new shift detected.
- Phase 1 CDN removal and footer preload removal verified again in SSR HTML. Its image/animation regressions pass.
- git diff --check and new-file whitespace checks: PASS.

Browser fixture/selector refinements were limited to the temporary harness, including Chrome Enter's required carriage-return text event; no corresponding application correction was needed. No production Lighthouse rescore or physical assistive-technology verification is claimed.

## Scope and preservation

This pass changes only three production files (Footer.jsx, globals.css footer--link rule, SearchSection.jsx), one existing search regression file, one new footer test, and this report. Existing Performance Phase 1 is preserved: Header/home image code/tests/report are byte-identical; the entire animation block is byte-identical; footer logo remains lazy and trust badge retains lazy loading. Shared Modal.jsx, Swiper, auth/session, API, SEO, dependencies, backend and all excluded WIP are untouched. No Graphify command/cache update this turn. Both HEADs unchanged, empty indexes; backend 605 excluded files and frontend 588 excluded files verified byte-identical.

The pre-existing trailing brace in Modal entrance classes remains unchanged, as explicitly requested by the owner. Physical iOS Safari/VoiceOver and deployed trust-badge timing remain manual checks. Remaining desktop TBT/LCP profiling and other deferred performance work are not expanded into this pass. This is readiness for review, not an assertion that every site-wide accessibility issue or Lighthouse score is resolved.

## Combined uncommitted manifest / final hashes

Footer.jsx and globals.css have additional reviewed accessibility changes, so their older Phase 1 report hashes are historical; use this combined manifest for current content. The Phase 1 report itself remains untouched.

| File | SHA-256 |
| --- | --- |
| src/app/Header.jsx | a062c672e6e8c78cd4971c67500c9518d1a780dc10910b5c813f35a605dc2957 |
| src/app/globals.css | 3192071a92fff6c3928622ddc8b6fa6d8e6649e5bded4a32db27a85a4e639b74 |
| src/app/(user)/page.jsx | 4c58c9399208e8a558766f8f6533078452cfa74b6b0ac3eb3dd000280f565d02 |
| src/app/Footer.jsx | dd028e44c672af419f0cc7cef6a6650a2279b310d56e1c715cf7b9e6b6ec8628 |
| src/lib/homeLcp.test.mjs | d5e9cf4257545698be211b990de9e9517e464b88ede87d29427659948f4c3ad8 |
| src/lib/performancePhase1.test.mjs | a46c6b674cb4cae2c5f10a28ec989a16865e8f6830a46e6be62826abc15dd95e |
| PERFORMANCE_PHASE1_REVIEW.md | 95d053b14f5539f144a04edd8fd586c1a161d487a08b88f042a082e7111fe413 |
| src/components/SearchSection.jsx | da5becb510bb8eb75374e515328d53a4f0ecae58becfc499e12f5ae57d83c35a |
| src/utils/headerSuggestions.test.mjs | 39e3b787da396ccba4fe7f5e151bd63024f6591eddafcc053c5d20cfd7031df2 |
| src/utils/footerAccessibility.test.mjs | 672cfda28faa57e8cfa8349369a3a8b59c206914726bdb0feb80c235ca55ba3d |

Plus this report, ACCESSIBILITY_CORRECTION_REVIEW.md: self-hash recorded externally in FINAL_VERIFICATION.json. Combined working scope is 11 files; this accessibility pass introduces 6 changed/new paths.

Evidence: C:/Users/AYOOBM~1/AppData/Local/Temp/jeawaz-accessibility-correction-20261021 (before-browser.json, browser-results.json, screenshots, validation.json/logs, FINAL_VERIFICATION.json). Task-owned browser/services stopped.

Verdict: PERFORMANCE + ACCESSIBILITY READY FOR RELEASE REVIEW.
