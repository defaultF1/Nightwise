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
