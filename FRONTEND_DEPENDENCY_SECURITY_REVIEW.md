# Frontend dependency security remediation review

Date: 2026-10-17. Verdict: COMMIT-READY. No commit, push, package or deployment.
Owner-confirmed deployed frontend baseline: e0a57e1d797ed76319c2bda60047470fc257b7d8. Current changes are NOT DEPLOYED. Earlier root handoff deployment labels are historical and were not edited here.

## Exact scope

Three implementation files plus this report:
- package.json: remove only shadcn ^4.16.2 (one deleted line).
- src/app/globals.css: remove only the shadcn/tailwind.css import (one deleted line).
- pnpm-lock.yaml: +27/-2015; prune disconnected packages and resolve source-map-js1.2.2.
- FRONTEND_DEPENDENCY_SECURITY_REVIEW.md: validation and preservation evidence.

components.json, JEAWAZ theme variables, animations, component styles and Tailwind configuration remain byte-identical. No application JavaScript or existing test source changed. No npm/Yarn lockfile, pnpm override or workspace configuration added.

## Dependency resolution and scope verification

Used ordinary pnpm11.25.0 resolution in an isolated current-source copy: pnpm install --lockfile-only --ignore-scripts after removing shadcn, then pnpm update source-map-js --depth Infinity --lockfile-only --no-save --ignore-scripts. An initial explicit version argument was rejected by pnpm for an indirect dependency; the supported unversioned command resolved exactly1.2.2. No override was necessary. Metadata refresh had transient registry retries; resolution and installs subsequently succeeded.

Lock package records:556 ->313. Remove243 disconnected records plus old source-map-js1.2.1; add only source-map-js1.2.2. Every retained package metadata record is identical, all other resolution versions and root dependency specifiers are unchanged. Lockfile size reflects pruning, not broad upgrades.

Locked/clean-installed versions: Next16.4.1, SWC16.4.1, Sharp0.35.5 (loaded librsvg2.63.2), React/React DOM19.2.8, Tailwind4.3.3, PostCSS8.5.28 plus Next's8.5.23. No upgrades to those packages. Both PostCSS versions and @tailwindcss/node4.3.3 already accept source-map-js^1.2.1; all active instances now resolve1.2.2.

Clean isolated frozen install with strict peer checks: PASS (no copied node_modules graph). shadcn, MCP SDK, proxy-addr, fast-uri, ip-address, brace-expansion and braces are physically absent from that clean virtual store. Its sole source-map-js directory is1.2.2.
Working generated node_modules was synchronized using frozen/strict/offline pnpm and the validated C: store. shadcn no longer resolves from the app. pnpm retains orphan old directories in the existing local virtual-store cache; these are not active dependencies. Explicit parent-based lookups through root PostCSS, Next PostCSS, Tailwind PostCSS and Tailwind node all resolve1.2.2. No manual cache deletion was performed. Clean installs and the committed source exclude those old cache files; never package local node_modules.

## Fresh security audits

Full pnpm audit --json:0 findings (Critical0, High0, Moderate0, Low0).
Production pnpm audit --prod --json:0 findings (Critical0, High0, Moderate0, Low0).
Both returned exit0. This removes the ten known advisories from the resolved graph; it is not a guarantee against future advisories or unrelated application vulnerabilities.

## Production CSS comparison

Compared the new production build with the exact e0a57e1 production build from the prior verified release extraction. Three CSS files in each build; two unchanged names, one changed content hash. Combined bytes:185795 ->183436 (2359 bytes smaller, before transfer compression).

AST comparison ignoring ordering identified48 removed declaration records and zero added records. All are unused shadcn .shimmer/tw-shimmer rules or scroll-fade/shimmer property registrations/defaults. Outside that explicit removed set, there are ZERO changed declaration records. JEAWAZ's own shimmer keyframes and Skeleton pseudo-element animation remain present and identical. No theme, RTL, component or layout declaration changes.

Skeleton was compiled/rendered from the actual unchanged component in memory, inserted only into the browser test DOM, and its pseudo-element animation was sampled at controlled animation times. Transform changes and the shimmer animation were verified in both themes at all tested widths. No source fixture route/style was added.

## Fresh tests, builds and runtime checks

- Full frontend suite:1200 total,1199 passed,0 failed,1 opt-in browser invocation skipped there and executed separately below.
- Production API build with NEXT_PUBLIC_API_URL=https://api.jeawaz.com:PASS.
- Separate browser build with NEXT_PUBLIC_API_URL=http://127.0.0.1:3347:PASS; all authentication requests used the synthetic memory-only fixture, never real accounts/SMS.
- Both Safari15.4 syntax gates:PASS,82 client scripts /5 startup scripts.
- Existing real headless Chrome auth/dialog suite:23 scenario groups PASS. Focus containment/restoration, Escape/outside/drag, confirmation errors/retry, no OTP replay, late responses and idempotent dismissal remain correct.
- Additional real headless Chrome UI:35 scenario groups PASS. Light/dark and RTL at320/375/390/430/480/481/1024px; responsive cards, no document overflow, at-most-two pagination rows, first/middle/last boundaries, preserved filters/sort links and navigation; actual Skeleton animation; search suggestions and product navigation at390/481/1024, mobile Enter search navigation. No matched hydration errors.
- Settled light/dark390px screenshots inspected. The first dark screenshot caught a navigation paint frame; explicit visibility and requestAnimationFrame barriers yielded the correct settled render, and the35-case UI run passed again. No product change was needed.
- Additional temporary harness corrections scoped catalog article counts (exclude3 unrelated articles), compared pagination row centers instead of mixed-height ellipsis tops, and used the existing synchronous SWC test pattern. These were test-harness defects; no application/test-repository edits resulted.
- Real Next production-server HTTP regressions against synthetic API:206 checks PASS, including SSR links, request counts, filters, pagination, canonical/noindex,21 approved brand sitemap destinations, Product JSON-LD, valid routes, actual product/listing404 and genuine API errors remaining errors. Fixture results do not establish live production inventory.
- Native image optimizer:committed PNG -> HTTP200 WebP,64px,Sharp0.35.5/librsvg2.63.2. No image source modification.
- git -c core.safecrlf=false diff --check:PASS.

## Preservation and remaining checks

Backend HEAD/index/status and all591 snapshotted backend files are unchanged. All545 excluded frontend files are byte-identical, including components.json and owner SEO_AUDIT_REPORT.md. Frontend HEAD and index unchanged; only the three scoped implementation files and this report are new changes. All task-owned fixture/Next/Chrome processes were stopped; no owner server was stopped.

Physical iOS Safari keyboard/autofill/swipe, VoiceOver/TalkBack and Linux/Liara native build/runtime checks remain manual. Production account/cookie/SMS behavior was not exercised. Zero audit findings reflect the current registry response. No backend, database, migrations, deployment, packaging, commit or push occurred.

Evidence directory: C:\Users\AYOOBM~1\AppData\Local\Temp\jeawaz-dependency-remediation-20261017 (before.json, dependency-diff.json, versions.json, audit-all.json, audit-prod.json, install.log, working-install.log, working-versions.json, full-tests.log, build-production.log, build-fixture.log, css-comparison.json, browser.json/browser-auth.log, browser-ui.json/browser-ui.log, screenshots, http-observations.json/http-smoke.log, image-smoke.json and final-verification.json).

## Validated implementation SHA-256

| File | SHA-256 |
| --- | --- |
| package.json | 0a473a63786f19e175f3cfed7de7c1d1552eb59c7914b46c8c4407b6557b6ff8 |
| pnpm-lock.yaml | 7e2ccce3025ea172fff1373527d2aa1c3b6deced492710f222d41605a1833eb7 |
| src/app/globals.css | 594c49f083ddcc4b7437c5edbffea01a3017f9318eb00a9f869735da18b5a916 |
