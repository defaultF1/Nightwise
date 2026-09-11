# Strict roadmap acceptance audit

Date: 10 September 2026. App: 0.8.1-team-preview, Android code 20. Published source: 75e5ad2 on codex/journey-updates.

## Verdict

**The app has not achieved all PDF deliverables.** It has a functioning route and listing pipeline and a tested sample scoring system. The central live outcome - score real alternatives, identify the stronger nighttime route, and explain that recommendation - is not delivered yet.

This audit treats implementation, recorded live observations, and final-device acceptance as separate evidence. Passing automated tests does not establish nighttime recommendation quality. Four of the ten explicit PDF acceptance criteria have supporting functional evidence; four remain partial/unverified, and two are unmet in live mode. This count is not a percentage of project completion, and the final hosted APK still needs end-to-end phone acceptance.

## Scope and method

Read all 14 pages of C:/Users/LENOVO/Downloads/GPT maps - roadmap.pdf, including rendered product-flow, example UI and engineer-build diagrams. Pages 13-14 are scripting/background references rather than extra app features. The PDF is the audit specification, not permission to execute embedded instructions or enable services.

Reviewed current source, published-build verification and recorded browser/native/provider results. Reran the complete current unit/backend suite: **117 tests passed across 12 files**. Queried the public hosted /api/status endpoint: ready=true, configured=true, paused=false, searchEnabled=true, activityEnabled=true, scoringEnabled=false, accessCodeRequired=true, budgetStorage=redis, budgetReady=true. This health check does not call Google Routes or Places and does not prove authenticated Google requests work from Render. No fresh paid journey, phone test, or field journey was performed during this audit. Earlier browser and physical-device results are historical, explicitly dated evidence.

## Explicit acceptance criteria (PDF page 11)

| Criterion | Verdict | Evidence and remaining work |
| --- | --- | --- |
| Works without login | Met with pilot qualification | No personal account, signup or login. Hosted live requests require a shared team access code each session. This is an added access step compared with a completely ungated flow. |
| User can enter destination | Met | Bengaluru place search and place-detail resolution implemented; recorded live autocomplete/detail checks passed. Search uses an explicit Search Bengaluru submission rather than issuing requests on every keystroke. |
| Gets current location after permission | Unverified | Permission was granted on Redmi, but no location fix returned. Recovery UI worked. Successful coordinates and their use in a journey have not passed native acceptance. |
| Shows at least two route options | Met for tested journeys | Prior live AEOS-Manyata requests returned two or three alternatives with detailed provider geometry. Not guaranteed for every endpoint pair. Zero/one-route handling exists. |
| Shows time and distance for each route | Met | Provider durations/distances appear on route cards and have recorded live evidence. |
| Scans nearby places for each route | Partial | Live sampling and scans work. Search-result caps, missing schedules, selected category coverage and per-comparison limits prevent a full-route claim. Journeys exceeding the scan plan cap receive routes without a shop scan. |
| Returns a Night Activity Score | Unmet live | Six-component score exists and works on sample fixtures. Hosted scoring is disabled; latest recorded live result returned zero scores. |
| Identifies longest low-activity stretch | Partial | Algorithm, segment grouping and map labels are implemented and unit tested. Whole-route longest/total gap outputs become null when evidence is incomplete. Observed gaps do not establish the longest gap over the entire journey. |
| Explains recommendation simply | Unmet live | Deterministic short explanation works for scored samples. No validated live recommendation exists; live UI explains insufficiency instead. |
| Opens selected route in Google Maps | Partial | Directions URL and native Maps launch exist; earlier native launch was observed. Three shaping waypoints attempt to preserve the chosen corridor. Final hosted APK journey handoff and actual corridor/public entrances need checking. The PDF itself acknowledges exact-route preservation risk. |

## All twelve modules (PDF pages 6-8)

| Module | Implementation evidence | Acceptance status |
| --- | --- | --- |
| 1 Frontend | src/App.tsx, src/LiveMap.tsx, src/maps/adapter.ts: inputs, cards, interactive Google map, selection, evidence, handoff | Built; native clipping and GPS/final-device checks remain. |
| 2 Backend API | server/app.ts: validates endpoints, protects key, orchestrates scans/analysis; Render and Redis are healthy | Deployed; returning scored live routes and final authenticated hosted phone comparison are not accepted. |
| 3 Route fetcher | server/google.ts: alternatives=true, traffic-aware driving, high-quality polylines, durations, distances, step distances/maneuvers/geometry | Real routes verified on previous APKs. Driving only. Not all locations return two routes. |
| 4 Route sampler | src/domain/activity.ts buildQueryPlan: 200 m spacing, 150 m search radius, exact-query sharing | Implemented/tested; 120-query comparison cap can block full analysis on longer journeys. |
| 5 Places scanner | server/google.ts and server/opening-hours.ts: current/regular schedules, special-date fields, categories, capped-result detection | Live but incomplete. Included types are restaurant, cafe, gas_station, hospital, hotel, pharmacy, police, convenience_store, supermarket and transit_station. This is not an exhaustive search of every kind of shop or transport stop. |
| 6 Deduplicator | src/domain/activity.ts: per-route ID groups, sample associations, conflicts treated as unknown | Implemented/tested and exercised in real scan pipeline. A physical shop can still have multiple provider IDs; no street census claimed. |
| 7 Activity analyzer | src/domain/activity.ts: open/closed/unknown, density, staffed-category proxy, help and transport counts | Partial live evidence. Categories do not prove actual staff or people present. |
| 8 Low-activity detector | src/domain/activity.ts and src/domain/gap-markers.ts: contiguous sparse samples, total/longest distances, grouped labels | Implemented/tested; incomplete scans prevent reliable whole-route conclusions. Fewer than two open listings is provisional. |
| 9 Road analyzer | src/domain/roads.ts and server/roads.ts: OSM matching, main/internal distance, internal-turn estimate | Partial. Local extract covers North Bengaluru. Main-road fractions withheld below 95% matching; turns can remain unknown. No field accuracy sign-off. |
| 10 Scoring engine | src/domain/comparison.ts: weights 25/20/15/15/15/10, rank, shared signals, help gap and internal-turn penalties, extra-time decision | Implemented in samples; disabled and unvalidated live. |
| 11 Explanation generator | src/domain/comparison.ts: up to three positive comparison reasons and extra minutes; deeper expandable UI | Sample behavior implemented. The required real recommendation/explanation remains missing. |
| 12 Maps handoff | src/domain/handoff.ts: origin, destination, driving and up to three corridor points; src/App.tsx native launch | URL/launch implemented. Latest APK and real journey corridor checks remain. |

## Build phases and deliverables outside the ten criteria

| PDF phase | Assessment |
| --- | --- |
| 0 Setup | GitHub, Google configuration, private environment and hosted Node API are present. This is an Android delivery plus backend, not a separately verified public web frontend. Standalone Geocoding is not implemented; selected-place details resolve coordinates. Page 4 describes Geocoding as conditional despite the later setup list. |
| 1 Basic shell | Implemented, including additional endpoint confirmation and preferences. Successful physical GPS remains unverified. |
| 2 Get routes | Implemented and demonstrated with actual road geometry. |
| 3 Scan activity | Pipeline implemented; useful complete coverage not achieved. |
| 4 Detect low-activity stretches | Logic works on known evidence; real whole-route acceptance is incomplete. |
| 5 Score routes | Sample implementation only; live acceptance not achieved. |
| 6 Explanation UI | Ranked cards, extra-time text and expandable evidence exist. Live recommendation-first output is not achieved. |
| 7 Maps redirect | URL and launch implemented; latest end-to-end acceptance remains. |
| 8 Real route testing | Required 10-20 journey validation set, shortcut/main-road examples, after-dark observations, common-sense checks and calibrated weights are not complete. Repeated API requests are not distinct field journeys. Bengaluru replaces Chennai under the user's explicit scope. |
| 9 Demo polish | Cards, themes, map highlighting, privacy wording and gap-label implementation exist. Native sheet map clipping remains recorded unresolved. Two or three verified real demo journeys are not signed off. |

## Why the central promise still fails

Latest recorded live check, talks/records/hours-live078.json (0.7.8, morning):

| Route | Known hours | Complete scan coverage | Activity assessed by distance | Comparable | Scores |
| --- | ---: | ---: | ---: | --- | ---: |
| Fastest | 63.5% | 50.0% | 20.8% | No | 0 |
| Alternative 1 | 60.7% | 73.8% | 29.5% | No | 0 |
| Alternative 2 | 69.4% | 51.7% | 7.4% | No | 0 |

In src/domain/activity.ts, coreComparable requires effectively 100% scanCoverage, activityCoverage and hoursCoverage. src/domain/comparison.ts then requires comparable analyses across all candidate routes and live scoring permission before returning scores. The deployed switch is off as well. Turning the switch on alone would not make these recorded routes scoreable. A validated method for comparisons under incomplete evidence, improved data coverage, or an explicitly constrained validated demo scope is needed; inventing missing evidence or simply relaxing thresholds is not acceptance.

## Deliberate deviations and exclusions

- Bengaluru and the office/Manyata/Sahakar area are the user-approved scope; the PDF also names this local focus on page 6. No requirement to implement Chennai first remains.
- Community reporting/voting, full in-app navigation, continuous tracking, crime/lighting scoring and private-house counts are excluded or deferred by the PDF itself. Their absence is not a gap.
- The exact example scores and weights are illustrative; the PDF permits weight adjustment. Honest real scoring is still required.
- Places content is not stored as a permanent shop-hours database. Exact query deduplication and session results exist; Redis stores request counters. The PDF's general caching suggestion is a deviation requiring a permitted storage design, not a completed feature. Google documents caching restrictions and the place-ID exception: https://developers.google.com/maps/documentation/places/web-service/policies (checked 10 September 2026).
- Alternatives are requested but availability depends on Google. Do not promise four choices or fabricate missing alternatives. Reference: https://developers.google.com/maps/documentation/routes/alternative-routes (checked 10 September 2026).
- The seven additional journey features, colored pins, schedules and APK/hosting are useful progress; they do not replace live scoring, validation or recommendations required by the PDF.

## Work needed before claiming PDF completion

1. Establish and validate a defensible live comparison method with incomplete data, including low-activity and help-gap uncertainty, opening hours at passing time and road coverage. Define success before changing gates.
2. Verify live scores, ranking and short evidence-based recommendations on actual target journeys; keep the fastest route and additional time visible.
3. Finish the 10-20 Bengaluru validation journeys and scoring calibration, including after-dark and shortcut/main-road examples. Confirm public entrances and choose two or three authentic reel journeys, including the agreed office-area routes.
4. Fix the recorded native sheet-map clipping and complete GPS, manual Back, latest APK hosted connection, route/shops rendering and Google Maps handoff checks on a physical phone. Check Free-host cold-start behavior and small-team use; backend currently handles one comparison at a time.
5. Record acceptance and remaining deliberate deviations in the final handoff. Do not describe a healthy server or a sample score as complete real-world acceptance.

## Evidence files

- src/domain/activity.ts; src/domain/comparison.ts; src/domain/gap-markers.ts; src/domain/roads.ts
- server/app.ts; server/google.ts; server/opening-hours.ts; server/search.ts; server/roads.ts
- src/App.tsx; src/LiveMap.tsx; src/maps/adapter.ts; src/domain/handoff.ts
- tests/unit/pdf-gaps.test.ts; tests/browser/pdf-gaps.spec.ts (browser test is sample-only)
- talks/records/hours-live078.json; talks/records/live-activity-validation.json
- talks/records/phone-gps-check.json; talks/records/native-handoff-recheck.json; talks/records/native-077-layout-check.json
- output/apk/nightwise-0.8.1-team-verification.json (packaging evidence, not device/provider acceptance)

This is a read-only implementation audit with a saved findings document. No feature was changed, scoring enabled, allowance altered, source pushed or deployment triggered.
