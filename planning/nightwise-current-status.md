# Latest Android map scroll correction — 10 September 2026

Android 0.11.3-live-preview (code 29) built and package-verified. Source c016cf7 pushed to codex/journey-updates. A maintained patch for pinned Capacitor Google Maps 8.0.1 corrects the CSS-pixel versus physical-pixel size comparison that caused unnecessary requestLayout calls during scrolling. Native clipping now sends only the latest queued viewport position. Four focused scroll/queue tests passed; TypeScript, Vite and Android build passed. Signature, web assets, hosted HTTPS endpoint and absence of the server key passed package checks.

Physical smoothness acceptance is PENDING: no Redmi was visible over USB during this fix. No new phone screenshots, frame measurements or live Google requests. No budget or backend configuration changes. Reconnect and check route-option drags/flings, map clipping, confirmation sheet, panning, selection and rotation, reusing an existing comparison where possible.

APK output/apk/nightwise-0.11.3-team-debug.apk; 9,657,593 bytes; SHA256 20844e0986eea2785d2528f7f411b6e167928b258726741019d237cb1c120a52. Handoff talks/2026-09-10_M09_map-scroll-correction_v01.docx and matching Markdown. Earlier release checks below remain historical and do not establish 0.11.3 device acceptance.

# Latest Kanpur live journeys and search release — 10 September 2026

Android 0.11.2-live-preview (code 28) is built, package-verified and installed on Redmi 9. Source 3f710f6 is pushed to codex/journey-updates. Kanpur has a 20 km editorial service circle centred at 26.48,80.30; Bengaluru presets and the offline AEOS–Manyata tutorial remain unchanged. GPS fills the current origin and attempts an approximate native address. Cross-city journeys require a local destination. Search suggestions after a typing pause show real Google driving estimates when available. No community features.

Hosted backend 0.11.0 with Kanpur support was live-tested from client 0.11.1 at 2026-09-10T13:40:31.049Z. Actual Redmi GPS and address lookup passed. The Sharda Nagar Dr. Virendra Swarup school resolved correctly. One search estimate returned 1088 m / 209 s; the comparison returned three Google routes of 979–1094 m and 220–240 s. Complete scans 100%; usable hours 76.2–81.3%; activity assessed 59.1–73.1%; road matching approximately 99.6–100%. Score ranges overlap, so no activity winner. Map selection and Google Maps launch/return passed; exact road preservation and physical Back remain unverified. Other neighbourhoods are supported but not individually live-tested. No private home coordinate/address is published.

Kanpur OSM extract: 40,160 ways, 354,837 points, 15.7 MB, 22 km query, snapshot 2026-09-10T13:20:41Z. Loader keeps one city index; latitude projection adapts to Kanpur. Local mapped-street self-check passed at approximately 284 MB RSS; not independent ground validation.

155 unit/backend cases covered by passing runs. Two five-second timeouts during concurrent build/report work passed the unchanged 21-case rerun. Nine focused browser cases passed, including mocked Kanpur GPS-to-search and tutorial preservation. Seven final 0.11.2 phone smoke checks passed. Its only change after the full 0.11.1 live run clears a completed GPS message. First CDP attach after restart failed then succeeded; no paid retry. First short Maps focus probe was inconclusive; resumed-activity verification confirmed Maps launched and selection survived return.

Details cap increase to 100 is approved and active on Render. Routes/Nearby unchanged at 30/1500. Module usage: 2 route calculations (one matrix element plus one comparison), 15 Nearby, 1 Autocomplete, 5 Details. Totals 25/1307/3/25 against 30/1500/40/100; 5 route units remain. Matrix previews spend one route unit per pair and preserve one nominal comparison unit. Do not repeat paid checks or reset counters. No live pause was introduced. The user began a destination search after the final install, so that active search was left intact. Team access may need re-entry in Settings after app restart.

APK output/apk/nightwise-0.11.2-team-debug.apk; 9,657,409 bytes; SHA256 251a180322b245fa1491d87911a8542cd54e590717ef7cb8c139b51e81a5ce68. Handoff talks/2026-09-10_M08_kanpur-live-search_v01.docx and matching Markdown. Records phone011-location.json, phone011-live.json, phone011-handoff.json, phone0112-smoke.json and kanpur-road-index-check.json. Road/route evidence remains incomplete; ground/reel and community/voting excluded. Earlier notes below are historical.

# Latest offline tutorial and Android display release — 10 September 2026

Android 0.10.2-live-preview (code 25) is built, verified and installed on the Redmi 9. Source c7270fa is pushed to codex/journey-updates. Offline tutorial uses real bundled OSM streets for AEOS to Manyata and the independently routed return journey. One Tutorial mode label remains; activity is fixed fixture data. Live results lead with a conditional route decision. Light theme native black gaps and crowded business markers are fixed. Duplicate Android camera padding is removed; final phone header top is 8 CSS px inside the protected WebView.

Hosted backend 0.10.0-live-preview with partition-and-spatial-v1 is deployed and live-tested on Redmi with client 0.10.1 at 2026-09-10T12:34:24.149Z. Three real Google routes and three score ranges returned. Complete scans 92–93%; usable hours 60–69%; activity assessed 74–85%; road matching 76–90%. The score ranges overlap, so no activity winner is claimed. New scanner exercised; no controlled claim of improved coverage from this single run.

142 unit/backend tests and passing coverage of all 47 browser cases precede the final UI changes. Final UI verification: three marker tests, four focused browser tests, 16 live Redmi checks and three screenshot background checks passed. 11 offline checks and outside-area native GPS passed on 0.10.0. Final 0.10.2 smoke is in phone0102-smoke.json. Physical Back, in-area GPS and exact Google Maps road preservation remain unverified. Field/reel and community/voting are excluded.

Latest live request: 1 Routes / 117 Nearby / 2 Details. Shared totals 23 / 1292 / 2 / 20 against caps 30 / 1500 / 40 / 20. No cap increase. Details allowance is exhausted; scans retain missing hours as unknown. Earlier 0.10.0 live run used 1 / 94 / 4 against the old backend. No new route request for the spacing-only 0.10.2 change. Map loads are separate.

APK: output/apk/nightwise-0.10.2-team-debug.apk. SHA256 931be1372d2f188c16f8cd53fd9f872fac73959ca5239f5545cde5e8d7901d97. Handoff: talks/2026-09-10_M07_offline-tutorial-and-live-scans_v01.docx and matching Markdown. Detailed PDF table: planning/2026-09-10_0100-pdf-checklist.md. Older notes below are historical.

# Latest Redmi and live acceptance follow up — 10 September 2026

Android 0.9.1-live-preview (code 22) is built, verified and installed on the Redmi 9 Android 10. Source correction 6b14b60 is pushed to codex/journey-updates. It fixes unreadable transparent Mono Light help/shop panels and limits dense business pins to a representative maximum of 48. Dense pin selection is unit-tested; no new full live comparison was sent after that display-only correction.

The phone's authenticated 0.9.0 live comparison at 2026-09-10T10:00:16.156Z returned three provider routes and score ranges. Native GPS returned an out-of-area result consistent with the user's Kanpur location and retained AEOS. Native map clipping and rounded confirmation worked. Google Maps opened Alternative 1; returning via activity resume preserved results. MIUI denied ADB hardware key injection, so physical Back and exact Maps road preservation remain unverified. No in-area GPS journey was possible at this location. Ground/reel and community/voting remain excluded.

138 unit/backend tests passed. 44/46 browser cases passed on the live-enabled local build; both pause-specific cases passed on isolated paused-map port 4174 (all 46 covered). Six final 0.9.1 phone smoke checks passed, including backend readiness, theme persistence, panel opacity and native endpoint map. Panel opacity used tutorial content with native-map CSS forced; it is not a second live scan. Full live acceptance belongs to 0.9.0; final package smoke to 0.9.1.

Phone live usage: 1 Routes / 117 Nearby / 4 Details. Snapshot totals: 20 Routes / 987 Nearby / 2 Autocomplete / 10 Details against 30 / 1500 / 40 / 20. No cap increase. Activity ranges overlap, so outcome remains insufficient with no activity winner. Complete scans 50–74%; known hours 60–70%; activity assessed 74–85%; roads matched 76–90%. Map loads are separate; exact charges require Cloud Billing.

APK: output/apk/nightwise-0.9.1-team-debug.apk. SHA256 ebb0c784bfee508443ae9ce2125b5cf454eac993167031562bc391566b0f31d7. Handoff: talks/2026-09-10_M06_phone-acceptance_v01.docx and matching Markdown. Records: talks/records/phone090-acceptance.json and phone091-smoke.json. Mono Dark was restored and persists on the device. Older states below are historical.

# Latest live scoring implementation — 10 September 2026

Hosted scoring is enabled and the new 10 km OSM snapshot was exercised. Latest shared ledger after the one verification request: 19 Routes / 870 Nearby / 2 Autocomplete / 6 Details. Existing caps remain 30 / 1500 / 40 / 20. Score ranges overlap, so no activity winner was selected. M06 Word handoff rendered to five pages and every page was visually inspected.

Version 0.9.0-live-preview (code 21), source c70ffc9 on codex/journey-updates. Live evidence ranges, conservative recommendation explanations, balanced/refined scanning, up to four missing-hours details checks, 10 km service area, GPS recovery and native clipping are implemented. User-requested 9 am–8 pm fallback is labelled assumed and excluded from confirmed evidence. Hosted software verification passed at 2026-09-10T09:25:55.299Z: 3 real routes, 3 score ranges, outcome insufficient.

137 unit/backend tests passed; 18 focused live-improvement tests passed after final explanation changes. 39/45 initial browser cases plus 18/18 focused reruns cover all 46 current cases successfully. First failures and their fixes are recorded in the M06 Word report. Frontend/backend/APK builds and APK verification passed. Phone absent; native GPS/Back/clipping and physical Maps handoff are unverified. Field and reel excluded, community/voting excluded. Provider-use review remains unresolved.

APK: output/apk/nightwise-0.9.0-team-debug.apk. SHA-256 8866288f3f950f43b9aa8d0053c0f1b3895109ea9af546fb6246c8dd390a4ae6. Read talks/2026-09-10_M06_live-scoring_v01.docx and matching Markdown; planning/2026-09-10_live-scoring-deliverables.md has the requested table. No cap changes. Hosted details are in talks/records/live090-hosted-status.json and live090-hosted-comparison.json if present. All older statements below are historical.

# Remaining deliverables research completed — 10 September 2026

R01 desk research is complete: `talks/2026-09-10_R01_remaining-research_v01.docx` and its matching Markdown, with the canonical research brief at `research/2026-09-10_remaining-deliverables-research.md`. It covers remaining PDF requirements and agreed additions with 32 source entries, proposed implementation decisions and acceptance checks. This is research completion, not implementation or 100% PDF acceptance. Read this before historical checkpoints below.

Public evidence is unchanged in scope: 21 operator records, 671 OSM hours elements and the larger road extract. New isolated parser audit: 632/671 expressions parse; 39 fail, including 34 holiday rules unsupported for India. These are not verified opening states. Geometry prototypes establish a covering refinement and expose the gap caused by naive radius shrinking. Synthetic interval/gap arithmetic passes its stated examples; no real scoring accuracy is claimed. See `research/evidence/2026-09-10/README.md` for all artifacts.

Next: settle account-specific permission for Google-derived scoring/storage (six-question support draft prepared, not sent); implement bounded diagnostic experiments and uncertainty handling; fix native map clipping/GPS recovery; run physical/field acceptance using the 16-case protocol. Ordinary in-area GPS locations qualify under the proposed AEOS 10 km circle. Mall of Asia and Palace coordinate candidates are inside but public entrances remain unverified. Community/voting stays excluded.

No Google requests, cap changes, app-source edits, APK builds, deploys or pushes occurred in this research pass. The 13:22 IST hosted comparison below remains the baseline. No physical device or Bengaluru field acceptance was added. Historical test counts are not new test runs.

# Latest hosted evidence follow-up — 10 September 2026

The supplied team code is saved in ignored .env.evidence. One authenticated Render/Redis AEOS–Manyata comparison succeeded at 13:22 IST, returning three real routes. Hours coverage 63.5/69.3/60.2%; complete scans 50.0/51.7/73.8%; road classification coverage 90.0/83.6/76.2%. No scores. Expanded OSM research subsets produced identical road-classification coverage; a larger geographic extract alone does not fix these route gaps. No production changes or field validation. Hosted counters now 18/753/2/2 with caps 30/1500/40/20; exact nearby delta not inferred without atomic before-snapshot. Read talks/2026-09-10_hosted-evidence-followup.md and research/evidence/2026-09-10/README.md. This supersedes missing-code and no-hosted-check statements below.

# Latest evidence collection checkpoint — 10 September 2026

User requested collecting evidence first. New public research package: research/evidence/2026-09-10/README.md. It contains 21 operator records (14 clear weekly schedules plus coordinates, six ambiguous schedules, one coordinate conflict), 671 OSM opening-hours elements, and 58,613 OSM highway ways for a 10 km radius query around AEOS. Only four OSM entries have explicit hours-check dates; 143 have indoor/floor tags. These are research candidates, not new measured route coverage. Existing hours function projected 14/12/1 of the clear operator schedules open at 21:00/22:30/23:30 IST; no field confirmation or route association is claimed.

No new Google calls, app changes, APK, deployment or scoring enablement. Hosted access code requested through ignored .env.evidence but still absent. Expanded road extract is separate from production. Read talks/2026-09-10_public-evidence-checkpoint.md. This is an incomplete research checkpoint; roadmap acceptance remains as in the strict audit.

# Hosted team APK checkpoint

Render Free backend is ready at https://nightwise-f5fu.onrender.com with Routes, search and activity enabled, experimental scoring off, access-code protection on and the migrated Upstash Redis allowance healthy. Approved total caps were set to 30 Routes and 1500 nearby for the approximately ten-person tutorial; the Redis counter began at 16/641/2/2. No hosted Google request has yet been sent because the access code remains private.

Android 0.8.1-team-preview (code 20) was built for the Render HTTPS endpoint. It waits up to 65 seconds for a sleeping Free service to wake and up to 170 seconds for the first comparison. APK signature, matching web assets, hosted URL presence, server-key absence and absence of background location permission passed. SHA-256: ea62b380c5e7461fffa653b276b83d651ed6239adaee30b884d910882dd4adb3. APK: output/apk/nightwise-0.8.1-team-debug.apk. No phone was connected, so provider/device acceptance is pending install, team-code entry and one live route. Free Render cold-start behaviour also remains to be observed on the phone.

# Free hosting setup in progress

User chose Render Free plus Upstash Redis Free in Mumbai. Render https://nightwise-f5fu.onrender.com is online but Google calls are paused and no server key is configured. Latest source 6a63aa1 adds atomic persistent Redis budgets; it is pushed and awaits Render deployment. User saved REST credentials in Render and was instructed to remove surrounding quotes. All 116 unit/backend tests and the local concurrent Lua emulator check passed. No Google calls used; ledger remains 16/641/2/2. The old local API remains live-enabled; freeze it before importing a final snapshot into Redis with NX. Do not seed zeros or overwrite an existing counter. Current APK 0.7.8 still targets the laptop. Read talks/2026-09-10_free-hosting-checkpoint.md before continuing. Hosting acceptance and Word handoff remain pending deployment, migration and an HTTPS APK/device test.

# Latest opening hours and explanation checkpoint

10 September 2026: Android 0.7.8-preview (code 18) is installed and tested on the Redmi. Current and regular Google schedules, closed days, special dates and next opening/closing times are requested. Dated current schedules take priority; regular weekly fallback is labelled and never overrides conflicting current information. The schedule list and activity-strip explanation are expandable without extra requests. Unknown coverage is explicitly explained.

One fresh AEOS to Manyata phone comparison returned three real routes (303/220/305 vertices). Listing hours coverage: 63.5/60.7/69.4%; complete search coverage: 50.0/73.8/51.7%; activity coverage by distance: 20.8/29.5/7.4%. No regular fallback was used in this result, and Google returned no special dates for these listings. It was a morning check, not night-time field validation. Live scoring remains withheld.

Verification: 110 unit/backend tests passed; 43 browser checks passed in the full run and the two pause-specific checks passed on a separate map-disabled preview (45 overall). Their initial failure was a live-versus-paused test configuration mismatch. A duplicate-name selector in an earlier new browser test was scoped to its schedule section. Frontend/APK and backend builds passed; APK signature, web assets and absence of server key verified. Phone screenshots were visually inspected.

This live recheck used 1 Routes and 69 nearby requests. Cumulative ledger: 16 Routes, 641 nearby, 2 autocomplete, 2 details. Nearby cap was raised once from 600 to 720 after explicit approval for 120 more; route cap remains 21. Live maps, requests, search and activity analysis REMAIN ENABLED for personal testing. Do not reset ledger or repeat this 120 increase. Remaining at this checkpoint: 5 Routes and 79 nearby; user testing can change these counts. Map usage is separate and exact charges require Cloud Billing.

Read talks/2026-09-10_M04_hours-and-explanations_v01.docx and its Markdown companion, plus talks/records/hours-live078.json. APK: output/apk/nightwise-0.7.8-debug.apk. Source branch: https://github.com/defaultF1/Nightwise/tree/codex/journey-updates . Reports/screenshots/private configuration are excluded from source export.

Still unresolved: capped/missing evidence, calibrated live scoring, PDF field journeys and reel demos, actual public entrances, exact Maps handoff, native GPS/manual Back, HTTPS service hosting and native map painting beyond the confirmation-sheet top during scroll. Community shops/voting remain excluded. No additional keys needed now. These current statements supersede all older checkpoint states below.

---

# Current implementation and phone checkpoint

Latest UI follow-up: 0.7.7 adds padded rounded endpoint cards, wrapped text, rounded sheet corners and extra clearance below Confirm and compare. Six browser layout checks passed at 320/390 px across all three themes. Version 0.7.7 is now installed and visually checked on the Redmi. Endpoint text wraps, cards are rounded and the full confirmation button has 48.6 CSS px bottom clearance. No Routes or Places requests were used. Native map still paints above the sheet top edge during scroll; that clipping issue remains. See talks/2026-09-10_confirmation-layout-fix.md. Published source commit 30291bc. Version 0.7.7 is the latest physically installed build.

Personal testing resumed at the user's request on 10 September 2026. ENABLE_LIVE_REQUESTS, ENABLE_PLACE_SEARCH, ENABLE_ACTIVITY_ANALYSIS and the local browser map build are enabled. Experimental scoring remains withheld. The cumulative route cap was raised from 11 to 21 for ten additional user-triggered requests; the existing nearby cap and search caps remain unchanged. Ledger at activation: 11 Routes, 296 nearby, 2 autocomplete, 2 details. No provider request was sent to verify activation. API status reports ready, search and activity enabled. The phone was disconnected at activation and must reconnect by USB with adb reverse tcp:8787 tcp:8787 for this local backend. The existing 0.7.6 APK already permits native maps. This supersedes the paused state in the historical handoff below.

10 September 2026. Version 0.7.6-preview is installed on the Redmi Android 10. All seven agreed journey features, persistent themes, immersive layout, real route selectors, native sheet-scroll fixes and category pin colours are implemented. Community submissions and voting remain deferred by the latest user reply.

All 98 unit/backend tests passed. The full browser run passed 43 tests before final map refinements; 11 focused browser checks passed after pin changes. APK signature, matching web assets and absence of the server key passed verification. Blue/red endpoint colours and legend were visually verified on 0.7.6. Specialty business colours were unit tested, without further Places scans.

Fresh Google routes were verified on 0.7.3: 303/305 vertices, 4795 m / 602 s and 5381 m / 717 s. Latest code retains provider road bends. In-memory transfer attempts across APK installation failed; the real result is NOT retained on the latest phone build. No successful replay is claimed.

The user is in Kanpur. Location permission is granted but no fix returned; the app displayed recovery. Real Bengaluru GPS, manual Back, public entrances, exact external Maps route preservation and field journeys remain acceptance work. Live scoring remains withheld because evidence is incomplete. HTTPS backend hosting needs a destination. This is not 100 percent PDF acceptance.

Ledger: 11 Routes, 296 nearby, 2 autocomplete, 2 details. This enhancement work used 4 Routes and 155 nearby requests. The user authorized exactly one extra Routes request with zero shop scans after the original ten-route allowance; it was used, and cap 11 is exhausted. Never reset the ledger. Requests and scoring are paused; browser maps are paused after packaging. Native map instances incur separate usage. No further paid routes or scans without authorization.

Source published to https://github.com/defaultF1/Nightwise/tree/codex/journey-updates at a914d5a. It excludes private files, APKs and reports. Latest APK: output/apk/nightwise-0.7.6-debug.apk. Read talks/2026-09-10_M05_journey-updates_v01.docx and its Markdown companion. Older entries below are historical.

> Latest live validation, 10 September 2026: Google browser maps in all three themes, forward and reverse routes, autocomplete, place resolution, route selection and handoff URL checks passed. Two full activity scans completed but all five alternatives had partial evidence. Live activity scoring is NOT accepted. Known-hours coverage was 42–55%, complete scan coverage 50–74%, and road matching 31–95%. All live switches and the browser build are paused again. No phone was connected; native and field tests remain pending. This checkpoint supersedes older live-pending statements below.

## Live validation checkpoint

All 85 unit/backend tests and all 38 browser regressions passed. APK 0.6.3 signature, matching web assets and absence of the server key were verified again. No application source changed in this run. The current APK was not physically tested.

This run used five Routes, 141 nearby (one malformed test-harness request), two autocomplete and two detail requests, plus three browser map instances. The cumulative ledger is 7 Routes / 141 nearby / 2 autocomplete / 2 details; original limits were not reset or raised. These are request counts, not a billing amount. The malformed smoke test was corrected to send only coordinates; subsequent nearby requests succeeded.

Next work: distinguish current opening status from arrival-time uncertainty; review how capped searches can support a transparent comparison; improve or constrain road coverage before scoring acceptance. Do not lower evidence requirements simply to produce a score. Physical Android checks, public entrances, exact Google Maps route preservation, 10–20 real journey validations and proven reel demonstrations remain pending. GitHub and hosting remain explicitly deferred.

Read [live validation report](../talks/2026-09-10_M04_live-validation_v01.docx), its matching Markdown, and talks/records/live-validation.json plus live-activity-validation.json for measured evidence. No additional credentials are needed now.

# NightWise current implementation status

Updated 10 September 2026. Canonical project: D:/Aevy TV ( Achina Mayya )/Nightwise. The PDF offline implementation is complete to the documented data and policy boundaries; final packaging records accompany version 0.6.3. This is not live acceptance. All Google Cloud API calls and embedded map creation remain paused.

## Latest user decisions

Prioritize the PDF. Defer the seven proposed improvements: expanded journey selection and swap, explicit endpoint confirmation, standalone confidence indicator, interactive help-point map, extra-time preference, saved places and dedicated freshness control. Existing related behavior and the PDF-required help-gap calculation remain in scope.

The user resumed local status notes and Word reports on 10 September. Do not push to GitHub or deploy hosting now. The fresh-install appearance is black, with persistent Light and Blue options. The intro has no Skip button; retain media-failure and reduced-motion recovery. Android is required, iOS optional, for no more than ten tutorial users.

## PDF modules

| Module | Local implementation | Remaining acceptance |
| --- | --- | --- |
| 1 Frontend | No-login inputs, cards, rank display, evidence, Google map adapter and grouped low-activity labels | Real web/native map rendering |
| 2 Backend | Private credentials, pause gates, input limits, request ledger, packaged Node server | Live integration and eventual HTTPS deployment |
| 3 Route fetcher | Alternatives, geometry, duration, distance, retained step distances/maneuvers/polylines | Actual returned alternatives and endpoint gates |
| 4 Sampler | Approximately 200 m spacing and capped query plan | Real-path coverage |
| 5 Places scanner | Requested listing categories, opening-hour handling, attribution and result caps | Actual hours and coverage |
| 6 Deduplication | Per-route place IDs and shared exact-query deduplication | Verify real examples |
| 7 Activity analyzer | Open/closed/unknown counts, density, staffed-category proxy, help points including petrol pumps, transport | Category data cannot verify actual staff |
| 8 Gap detector | Longest and total low activity; longest help gap; unknown boundaries kept separate | Calibrate threshold of fewer than two open listings |
| 9 Road analyzer | North Bengaluru OSM main/internal classes and estimated turns entering internal roads | Provider-step matching and local accuracy |
| 10 Score | Six components, help/staff/gap effects, internal-turn penalty, full rank order, time/detour gates | Permitted-use review and calibration |
| 11 Explanation | Plain-language tradeoff, deeper evidence, proxy and missing-data disclosures | Real recommendation quality |
| 12 Handoff | Endpoint URL, up to three provider-route corridor points, Android Maps intent | Exact corridor preservation and public entrances |

General Places caching is deliberately not added because current provider policy restricts it. See planning/pdf-implementation-decisions.md. Place selection already resolves coordinates; standalone Geocoding remains the PDF's optional fallback. Missing signals are disclosed and rescaled over the same common components, never invented. Six wired signals do not mean six observed signals on every live route.

## Latest verification

85 unit/backend tests passed. The 37 existing browser checks plus the new PDF-specific check passed; seven affected checks passed again after the final model changes. The production frontend and Node backend build successfully. The packaged backend was checked while paused. The latest APK and source verification records are under output/apk and output/handoff.

Version 0.6.2 previously passed 21 recorded Redmi 9 checks, including full intro playback with no Skip, black default, theme persistence, scenarios, rotation and Google Maps opening. That does not test NightWise live Google APIs. The new 0.6.3 APK has not been tested on a physical phone; no phone is currently visible. Android Back and native GPS permission grant/denial remain manual checks. Automated Android Back injection was blocked by Redmi security, so it was not bypassed.

No Google Cloud calls were made during this work. The local ledger remains one earlier failed route request and zero nearby, autocomplete or details calls. Configured credentials are private and must not be printed. No billing was enabled. No GitHub remote or hosted endpoint has been created.

## Local deliverables

- App preview: http://localhost:4173/
- Android review build: output/apk/nightwise-0.6.3-debug.apk
- APK verification: output/apk/nightwise-0.6.3-verification.json
- Source package: output/handoff/nightwise-prebilling-source.zip
- Report: talks/2026-09-10_PDF_offline-completion_v01.docx and matching Markdown
- Analysis decisions and deviations: planning/pdf-implementation-decisions.md
- Offline tests: tests/unit/pdf-gaps.test.ts and tests/browser/pdf-gaps.spec.ts
- Deployment recipe: planning/M07-hosting-and-team-handoff.md

## After billing

Confirm billing before enabling provider requests. Start with a single bounded route request; check restricted keys, exact AEOS and Manyata public entrances, map rendering, explicit place search and capped nearby scans separately. Live scoring remains off until provider-use review and local calibration are resolved. Review usage before increasing the initial allowances for broader testing.

Run 10 to 20 Bengaluru journeys, including reverse travel, commercial-to-residential, metro-to-home and main-road versus internal-road examples after dark. Prepare two or three genuine reel demos only after validation. Tutorial paths, durations, scores and road fixtures remain illustrative. Road data coverage is North Bengaluru even though the enabled map can show all Bengaluru.

Reconnect the phone for version 0.6.3 regression and the two remaining manual checks. Hosting and GitHub remain deferred by user instruction; they are not blocked by Google billing itself. Permanent use away from USB requires an HTTPS backend and a build pointing to it. Docker is not installed here, so the prepared container image is not locally verified.

Opening-hours handoff completion: all three final Word pages were rendered and visually reviewed. Source commit 6f0c6ae was pushed to codex/journey-updates. Final API status: ready true, paused false, search/activity true, scoring false. Ledger unchanged at 16 Routes / 641 nearby / 2 autocomplete / 2 details after verification.
