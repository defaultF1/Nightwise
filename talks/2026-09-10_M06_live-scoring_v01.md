# NightWise live scoring implementation and verification

M06 | 10 September 2026 | Android 0.9.0 live preview | Codex for the NightWise project owner

M06 delivers the remaining live-analysis code for the NightWise project owner. Version 0.9.0 adds evidence ranges, bounded scan refinement, missing-hours enrichment, clearer road diagnostics, a North Bengaluru service area and native recovery/clipping changes. Ground checks and reel production are excluded by the user; this report does not certify real-world recommendation accuracy.

Hosted software verification passed at 2026-09-10T09:25:55.299Z: 3 real routes, 3 score ranges, outcome insufficient.

## Delivered software

- Live activity scoring retains all six weights: open density 25, main-road share 20, help evidence 15, activity continuity 15, simplicity 15 and transport 10. Missing inputs widen the possible score; their weights are not redistributed. The range is an evidence bound, not a statistical confidence interval.

- A route is recommended only when its lower score exceeds every other eligible route’s upper score by at least 10 points. Extra-time preference is respected. Overlap keeps the fastest route selected and explains why no stronger recommendation is supported. When a winner exists, up to three supported differences explain it.

- Incomplete discovery is distributed across alternatives. Spare requests divide capped areas into four overlapping smaller circles covering the original footprint. Failed or still-capped children preserve partial status. Up to four targeted Place Details checks may improve missing hours; all calls use the persistent shared allowance.

- Opening times use estimated passing time, including step-duration distribution when Google provides it. Missing schedules show the user’s 9 am–8 pm IST planning estimate. Known closures, schedule conflicts and flagged special-day uncertainty are not overwritten. Assumed hours never raise confirmed-open counts or evidence confidence.

## Updated PDF requirement status

Works without login — Implemented. No account; live access uses the shared team code.

Enter a destination — Implemented. Search, chosen-place details, arbitrary in-area coordinates, saved places and swap remain available.

Get current location after permission — GPS validation and recovery implemented and tested with controlled readings. No connected phone was available for a new successful native fix.

Show at least two routes — Real alternatives have been demonstrated. Google can return fewer than two for a particular request; no alternative is invented.

Show time and distance — Implemented using Google values. Actual polyline bends remain provider geometry.

Scan places along each route — Improved scan allocation and refinement implemented. The feature works with incomplete results; exhaustive coverage is not guaranteed.

Return a Night Activity Score — Live score ranges implemented and automated tests passed. Hosted score ranges verified.

Identify the longest low activity stretch — Calculation returns an evidence-supported distance range when scans or hours are incomplete. This is not an exact claim that an unobserved road is empty.

Explain the recommended route — Decision and plain-language explanation implemented. Recommendations require separated bounds; overlap produces an honest no-recommendation explanation.

Open selected route in Google Maps — Handoff code and automated URL/launch-mock tests exist; earlier physical launches worked. Latest phone launch remains unverified. Maps URLs cannot guarantee preservation of an exact selected polyline.

## Area roads and Android changes

The service accepts endpoints within 10 km of the supplied AEOS pin, including ordinary unnamed GPS positions. Autocomplete uses this circle. Stale readings, accuracy worse than 150 m and uncertain boundary readings receive recovery guidance. Android actions open Location or App Settings for the user; the app does not silently turn GPS on.

The packaged OpenStreetMap extract contains 58,613 highway ways and 280,746 points in 14.48 MB, retaining source geometry and ODbL provenance. A local load check took 8.16 seconds and used about 212 MB RSS. Larger geographic coverage does not itself resolve parallel roads or flyovers. Unmatched, alignment, grade, parallel-road and unsupported-type distances are now reported separately.

Native map viewport clipping follows scrollable ancestors and hides maps behind other dialogs. The native container stays in its existing coordinate system. Compilation and viewport-intersection tests passed; physical clipping, GPS and Back-button acceptance require a connected phone. Help-point lists now include the same pharmacy, hospital, petrol, police and hotel categories used by the gap analysis; closing-soon entries do not shorten that estimate.

## Verification and publication

- 137 unit/backend tests passed across 13 files. The 18 focused live-improvement tests passed again after the final explanation change. Tests cover uncertain scores and supported winners, capped subdivision, shared detail accounting on success/failure, GPS validation, estimated hours, step passing time and road diagnostics.

- Browser coverage: initial full run passed 39 of 45 checks. Eighteen focused production-build checks then passed, covering all six initial failures and the new assumed-hours case. Across the runs, all 46 distinct browser cases passed. Provider requests were mocked or maps disabled for these browser checks; this does not verify native Google rendering.

- Frontend, backend and Android builds passed. APK 0.9.0-live-preview, code 21, passed signature verification, matching web assets, hosted URL, server-key absence and no background-location permission checks. Source pushed to codex/journey-updates at c70ffc9.

APK: output/apk/nightwise-0.9.0-team-debug.apk (9,534,317 bytes). SHA-256: 8866288f3f950f43b9aa8d0053c0f1b3895109ea9af546fb6246c8dd390a4ae6.

## Live result and limitations

Hosted software verification passed at 2026-09-10T09:25:55.299Z: 3 real routes, 3 score ranges, outcome insufficient.

Live comparison: Live activity scores are shown as ranges. They overlap or evidence is missing, so the fastest route stays selected. Choose a route using its travel time and listed help points.

- Fastest: 5381 m, 1038 seconds, 305 polyline points; score [58.70254416713999, 97.98086289376431]; complete scans 55.5%, known hours 69.5%, activity assessed 85.2%.

- Alternative 1: 4795 m, 1095 seconds, 303 polyline points; score [58.0152364214827, 92.51447872193086]; complete scans 50.0%, known hours 64.3%, activity assessed 87.5%.

- Alternative 2: 6091 m, 1129 seconds, 220 polyline points; score [53.040287007230795, 93.24616139767963]; complete scans 73.8%, known hours 60.4%, activity assessed 73.8%.

Shared request counter change: {"routeCalls": 1, "nearbyCalls": 117, "detailsCalls": 4, "scope": "Shared counter delta during this comparison; concurrent search requests may contribute."}. No allowance was increased. Exact charges remain a Cloud Billing question. Raw Google routes and individual listing payloads were not saved in this verification record.

## Failures and practical limits

One old backend test expected all scans to be skipped under a small allowance; it was updated to require bounded partial coverage. Browser failures included old scalar-score/gap expectations, a hard-coded test-server origin and a one-shot autoplay rejection that did not model React development remounts. The production rerun passed. A long multi-viewport test timed out under the earlier concurrent development/build run and passed in the focused production rerun; resource contention is suspected, not proven.

The browser-control tool failed locally, so the user changed Render environment settings. No phone was connected. Android emitted existing SDK metadata and flatDir warnings but compiled successfully. Provider-use review identified in the research report remains unresolved; no provider approval or field calibration is claimed.

Remaining acceptance work: a successful current-location fix, native sheet clipping and manual Back on a physical phone, latest Google Maps launch, and optional field calibration. Google may recalculate the handoff route and may omit shop hours or alternatives. Community submissions/voting remain excluded. None of these unknowns is converted to a green real-world verification tick.

## Example of the assumed hours display

![Actual browser screenshot with a controlled example listing. This is a UI test, not a real shop or a live opening-hours observation.](../tmp/browser-regression/M06/assumed-hours.png)

## Files and recovery

Primary changes: src/domain/live-scoring.ts, src/domain/activity.ts, src/domain/arrival.ts, src/domain/assumed-hours.ts, src/domain/location.ts, src/domain/roads.ts; server/app.ts, server/google.ts, server/scan.ts, server/search.ts, server/roads.ts; src/LiveScore.tsx, src/ShopHours.tsx, src/HelpPoints.tsx, src/ScoreBreakdown.tsx, src/maps/viewport.ts and native Android plugins. Expanded roads and provenance are under data/roads.

Canonical workspace: D:/Aevy TV ( Achina Mayya )/Nightwise. Verification records are in talks/records/live090-hosted-status.json, optional live090-hosted-comparison.json, road-load090.json and output/apk/nightwise-0.9.0-team-verification.json. Publishing checkout is tmp/github-publish; secrets and reports were excluded from the source export.
