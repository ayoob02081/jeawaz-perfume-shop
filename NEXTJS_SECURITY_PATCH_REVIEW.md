# Next.js October 2026 security patch review

Date: 2026-10-17. Status: READY FOR PRE-COMMIT REVIEW. No commit, push, release package or deployment.
Owner-confirmed deployed frontend baseline: 6676865323a146808bd62e630e2562e71d992fdf. Git HEAD remains this baseline; the patch is NOT DEPLOYED.

## Scope and package manager

The frontend has no package-lock.json. README.md declares pnpm-lock.yaml authoritative. The owner explicitly confirmed keeping pnpm, superseding the initial npm/npm ci wording. No npm lockfile was created. Clean-install equivalent used: pnpm install --frozen-lockfile --strict-peer-dependencies.
Changed files: package.json, pnpm-lock.yaml and this report. No application/test/configuration changes. The exact dependency diff has only 37 package-name families in Next/Sharp trees; all other importer entries and package/snapshot records are unchanged. package.json changes one Next range. Git diff: package.json +1/-1; pnpm-lock.yaml +160/-160 (native-platform matrix included).

## Exact versions

| Component | Before | After |
| --- | --- | --- |
| package.json Next range | ^16.2.12 | ^16.4.1 |
| next (lock and node_modules) | 16.3.4 | 16.4.1 |
| @next/env and eight @next/swc platform packages | 16.3.4 | 16.4.1 |
| sharp and @img/sharp platform binaries | 0.35.4 | 0.35.5 |
| @img/sharp-libvips platform packages | 1.3.3 | 1.3.4 |
| loaded native libvips | 8.18.6 | 8.18.7 |
| loaded native librsvg | 2.62.91 | 2.63.2 |
| react / react-dom | 19.2.8 / 19.2.8 | unchanged |

The React and React DOM declaration ranges (^19.2.6) also remain unchanged. Next requires Node >=20.9.0, unchanged from the installed baseline. Validation used Node v24.20.0 and pnpm 11.25.0.
RSC implementations are vendored inside Next, not separately installed npm react-server-dom dependencies. Their bundled package.json files have no standalone version field. The regular webpack/turbopack bundled metadata changes embedded React peer identity from 19.3.0-canary-cbb046ab-20260731 to 19.3.0-canary-278794d7-20261002. This is an identity field, not a claim that a standalone npm RSC 19.2.9/19.3.1 package is installed. The security guarantee is the officially patched Next 16.4.1 distribution, including its bundled fixes. Bundled server-code SHA-256 fingerprints are retained in the validation evidence.

## Official security assessment

- [Next 16.4.1 release](https://github.com/vercel/next.js/releases/tag/v16.4.1) explicitly fixes the two Critical RCE issues and High Server Actions DoS below. 16.4.2 has additional non-security fixes; 16.4.1 is the smallest vendor-listed patched 16.x release for this task.
- [GHSA-673q-mjm6-r5xr](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr): use-cache/typed-array RCE; Next 16.0.0 through 16.4.0 affected, patched in 16.4.1.
- [GHSA-p3m5-59mp-jv5r](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r): App Router Server Actions DoS; patched in 16.4.1.
- [GHSA-2464-fhr4-w9xw](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw): SVG image-optimization RCE; patched Next 16.4.1 requires Sharp >=0.35.5.
- [Sharp GHSA-wq5f-xc86-pv6w](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w): Sharp >=0.35.5 supplies patched librsvg 2.63.2. Loaded Windows native versions meet both bounds; Linux deployment is not claimed to have been tested.
- React RSC advisories [GHSA-xqc2-xf4c-x3h3](https://github.com/react/react/security/advisories/GHSA-xqc2-xf4c-x3h3) and [GHSA-h3gv-c5rc-p453](https://github.com/react/react/security/advisories/GHSA-h3gv-c5rc-p453) list standalone patched RSC versions 19.0.9, 19.1.10, 19.2.9 and 19.3.1. They target react-server-dom packages, not an independent requirement to upgrade this app public React/React DOM pair. Next supplies the patched vendored implementations.

No exploit or denial-of-service payload was executed. The baseline falls in vendor affected-version ranges; this report does not claim compromise or prove every exploit precondition in this app.

## Fresh validation

- Clean isolated frozen pnpm installation with strict peer checks: PASS. No peer conflict or unrelated dependency resolution change.
- Full frontend suite: 1200 total, 1199 passed, one opt-in browser test skipped in that invocation. The browser test ran separately and passed 23 production-server scenario groups.
- Real headless Chrome with synthetic loopback API: widths 320/375/390/430/480/481/1024; strict confirmation failure/retry, no OTP replay, pending dismissal, drag+Escape/outside, late callbacks, native Back, reopening, focus containment/restoration, scroll lock and no horizontal overflow. No matched hydration/runtime errors.
- Fresh isolated Next 16.4.1 production build with NEXT_PUBLIC_API_URL=https://api.jeawaz.com: PASS. Separate fixture build used only http://127.0.0.1:3347 for interactive auth testing. Both Safari 15.4 syntax gates pass: 82 client scripts / 5 startup.
- Real production-server HTTP regression: 206 checks passed (140 listings, 64 product pages, sitemap and robots), browser/Googlebot variants. Covers SSR links, one listing snapshot fetch, filters, pagination, canonical/noindex, empty page 1, real invalid-product/listing 404s, genuine upstream failures remaining errors, product JSON-LD and brand links.
- Synthetic verified brand fixture: sitemap has exactly 21 approved populated brand URLs, excludes Creed 20 and includes KAYALI 22; 150 total fixture sitemap URLs. These are fixture results, not current production inventory checks.
- Image optimizer: local PNG -> HTTP 200 WebP, actual native Sharp 0.35.5/librsvg 2.63.2; unapproved remote hostname rejected with 400. The generated PNG exists only in isolated validation source and is not included in working changes.
- Working node_modules synchronization: PASS using the same frozen graph. Initial normal install hit tarball error (23) retries for Next/SWC in its D: store. Only the verified task-owned installer was stopped; an offline install from the validated C: cache recreated generated node_modules successfully (502 packages, no version re-resolution). No package-manager config or source workaround was introduced.
- git -c core.safecrlf=false diff --check: PASS. No broad suite rerun beyond the required full frontend suite.

## Separate unchanged audit findings

pnpm audit --prod --json reports 10 advisories: 1 Critical, 5 High, 4 Moderate. None names next, sharp or a standalone react-server-dom package. Unchanged reported packages: fast-uri 3.1.7; ip-address 10.7.0; brace-expansion 5.0.9; braces 3.0.3; source-map-js 1.2.1; proxy-addr 2.0.7; @modelcontextprotocol/sdk 1.30.0.
Most paths originate from the existing shadcn CLI dependency. source-map-js also occurs below Next/PostCSS and autoprefixer. All these versions are byte-equivalent in the lockfile to the baseline; no broad audit fix was attempted. Their runtime reachability/exploitability was not audited. This scoped patch is not a clean-bill-of-health claim for the entire dependency tree.

## Preservation, remaining checks and verdict

All 545 other frontend and 591 backend snapshotted files remain byte-identical, including excluded SEO_AUDIT_REPORT.md, backend configuration/lockfiles, Graphify and Phase 12 scripts. Both Git HEADs/indexes unchanged. No backend, database, migration, commit, push, packaging or deployment operation.
Remaining owner checks: physical iOS Safari keyboard/autofill/swipe and VoiceOver/TalkBack; Liara Linux native package/runtime verification and normal production cookie/SMS smoke after a separately approved deployment. Do not serve old .next output after installing new Next: stop/restart the local development server or rebuild/restart the production process as appropriate. No existing owner server was stopped by this task.
Current production remains the owner-confirmed old baseline until a separate release/deployment; this uncommitted patch does not protect that running deployment.
Evidence directory: C:\Users\Ayoob Mahmoudian\AppData\Local\Temp\jeawaz-next-security-20261017 (full-tests.log, install.log, dependency-diff.json, resolved-versions.json, security-assessment.json, browser.json/browser.log, build-fixture.log, build-production.log, http-observations.json/http-smoke.log, image-smoke.json, working-install-offline.log, final-verification.json).

Verdict: READY FOR PRE-COMMIT REVIEW. No confirmed compatibility regression or unresolved targeted security-version/peer conflict.

## Validated dependency-file SHA-256

| File | SHA-256 |
| --- | --- |
| package.json | b443d68bf1abac852c0364dedc5d3f7cb0f4f6b35ebb41c6288d6a2e988f4fe1 |
| pnpm-lock.yaml | 1be620e03caea3b5dc25556a8330ba9d2e7e3d1607c88486c7c4221d930438ea |
