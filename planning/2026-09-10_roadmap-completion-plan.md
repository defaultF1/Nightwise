# Plan to complete the live roadmap

Status: proposed implementation sequence, not completed work. Based on the strict audit and the user's request on 10 September 2026. Target remains a working North Bengaluru Android pilot; every green acceptance tick requires evidence.

## 1. Service area and current location

Initial proposed boundary: a 10 km straight-line radius centered on the supplied AEOS office pin (13.0628268, 77.5940888). Verify the actual Sahakar Nagar, Manyata, Bengaluru Palace and specifically named Phoenix property/entrance against that boundary. This is an operational pilot boundary, not an administrative definition of North Bengaluru. Show the boundary in the app. Resolve ambiguous mall names rather than inventing pins. Expand deliberately if the agreed anchors require it.

Separate endpoint eligibility from provider geometry/data bounds. Both endpoints must be eligible, but a legitimate driving detour may extend beyond the circle. Cover a routing buffer in the road dataset and assess every returned route's evidence; do not cut polylines or misclassify out-of-coverage stretches. Apply the same area model to frontend pins, search selection, GPS and backend requests.

Use coordinates for eligibility, not landmark names. A person on an unnamed street inside the area can use current location or drop a map pin and select AEOS as destination. Confirm both pins/entrances. Retain manual Bengaluru selection for the user testing from Kanpur; actual Kanpur GPS must be recognized as outside the area.

Android flow: check location settings, show the standard location-enable resolution dialog if needed, request permission, obtain a fresh sufficiently accurate fix, then check region membership. Provide distinct recovery for service off, denial, permanent denial, timeout, stale/coarse fix and uncertain boundary position. Offer Settings, retry and manual pin selection as appropriate. Resume after Settings without losing the destination. Android enables location only with user action, not silently.

Acceptance: automated boundary/accuracy cases plus physical location-off/on, allow/deny and successful location tests. A real North Bengaluru teammate must demonstrate an ordinary street-to-AEOS trip. Kanpur testing verifies GPS and outside-area handling but cannot substitute for in-area physical acceptance.

## 2. Route and road evidence

Keep Google's actual high-quality geometry and synchronized route/card selection. Expand/refresh road data to cover the service region and routing buffer. Improve ambiguous matches using route direction and continuity; keep unresolved flyover/service-road distinctions unknown. Verify public entrance pins and main/internal labels on known corridors.

Request available alternatives and handle zero/one honestly. Green acceptance means agreed demo journeys provide at least two real options, not a fabricated guarantee for every endpoint pair.

## 3. Shop discovery and hours

Continue sampling approximately every 200 m. Measure scan coverage on equal terms for every candidate route. For capped searches, evaluate smaller search areas and category-separated searches; deduplicate IDs and preserve sample associations. Broaden relevant shop and transport coverage with explicit categories. Use targeted place-detail requests for missing schedules when useful and affordable, without assuming Details always returns data absent from Nearby.

Evaluate current dated schedules, regular weekly fallback, closed days, overnight hours, 24-hour service and exceptional dates at estimated passing time. Keep closures and unknown hours distinct. Do not assert staff presence from a business category.

First compare alternative scanning plans on a bounded pilot journey, measuring useful coverage gained per request. Estimate a new live-testing request plan against the persistent remaining allowance before broader runs. Existing cumulative caps remain in force; this plan is not an unlimited spend authorization. Never reset counters. Use provider-permitted storage only.

## 4. Live score and explanations with incomplete information

Replace the blanket 100%-coverage dependency with a validated model of observed activity and uncertainty. Specify minimum evidence and fair comparison conditions before tuning against demo routes. Normalize observations for assessed route length and consistent sampling; account for capped/missing sections so well-documented routes do not automatically beat poorly documented routes.

Retain the PDF's six initial components and separate evidence confidence. Investigate score intervals/sensitivity to plausible missing evidence and recommendation stability. Recommend only when the supported advantage survives uncertainty and fits the extra-time preference. Show insufficient evidence when the ranking cannot be defended. Do not label speculative bounds as statistically calibrated confidence.

Use held-out route cases to check that density, staffed/help categories, road type, turn burden and long gaps behave as intended. Enable live scoring only after model, provider-use and acceptance checks. Display score, meaningful component explanation and at most three short tradeoff reasons. The sample score alone does not count as completion.

## 5. Low-activity stretches and help gaps

Display the longest observed low-activity stretch, total observed low-activity distance and longest observed help gap on the route. Keep unassessed sections visually distinct and disclose the assessed distance. A partial observation must not become a claim about the entire journey. Establish enough evidence on the demo routes to validate the PDF's whole-route conclusions; if uncertainty could conceal a longer gap, disclose that limitation explicitly.

Calibrate the provisional fewer-than-two-open-listings threshold using real observations. Compare highlighted segments with team observations after dark.

## 6. Android, Google Maps and hosting

Fix the recorded native map painting outside the sheet. Verify text wrapping, corners, scrolling, rotation, background/resume and manual Back. Test on the final hosted APK, including startup after Render inactivity, failed connection recovery, team-code flow and two devices. Improve clear handling of concurrent comparisons; current backend accepts only one at a time. Load tests use mocked providers before any budgeted live test.

Validate external Maps opening, correct origin/destination/mode and chosen corridor for each demo route. Current waypoint method may add stops or permit recalculation. Verify actual outcomes; do not promise exact polyline preservation. A backend health response is not authenticated end-to-end acceptance.

## 7. Field acceptance and delivery

Record 10-20 distinct North Bengaluru journey cases: office/Manyata/Sahakar in both directions, ordinary residential street to office, commercial-to-residential, transit-to-home, and known main-road/internal-shortcut comparisons. Include after-dark observations. Palace or a Phoenix location enters the list only after the exact place and service-area eligibility are verified.

For each case retain a privacy-conscious test record of endpoint correctness, alternatives, scan/hours/road coverage, shown score/reasons, observed open/closed examples, marked gaps, handoff and pass/fail. Avoid collecting unrelated people's identities. Distinguish desk/API checks from on-site checks. Fix discrepancies and adjust weights on calibration cases; recheck separate validation cases.

Select two or three authentic reel journeys only after these checks. Produce the final versioned APK, verified package, source push/deployment, and completed Word/Markdown handoff with the acceptance matrix. No fake routes, sample scores presented as live, or unverified green ticks.

## Ownership and timing

Engineering: location/boundary, scanning, road evidence, scoring, explanations, native fixes, automated tests and deployment. Bengaluru team: physical in-area GPS, entrances, after-dark ground checks and real Maps corridor observations. The user in Kanpur can test device behavior, GPS recovery and outside-area handling.

Planning estimate: 3-5 focused engineering days, with 2-3 team field sessions after the first corrected build. This is an estimate, not a guaranteed acceptance date; data quality, required model revisions and phone/team availability determine final sign-off. Re-estimate after the first measured scan comparison. Scope is completion of the roadmap, not merely enabling a feature flag.
