# NightWise validation plan

Prepared before implementation. These are planned checks; none of the live-app checks below has been executed.

## Evidence required for the pilot

| Area | Test | Pass condition |
| --- | --- | --- |
| No-login flow | Fresh Android/iOS install and optional browser session | Compare a journey without account creation. |
| Location | Grant, deny, timeout, inaccurate origin | Manual origin remains usable; no hidden continuous tracking. |
| Search | Ambiguous, long, empty and out-of-area destinations | Clear selection or validation; no guessing. |
| Route alternatives | Provider returns zero, one, two, and more alternatives | UI matches actual results; no fabricated route. |
| Route cards | Compare geometry, distance, time and selection | Every card references the same route that its map line and handoff use. |
| Sampling | Straight, curved, very short and looped synthetic routes | Distances follow the polyline and include the final partial section. |
| Deduplication | One place returned by adjacent queries | Counted once per route; still associated with all relevant sections. |
| Shared corridors | Two alternatives overlap | Equivalent evidence is reused appropriately; each route is scored consistently. |
| Place distance | Side roads, parallel streets, flyover and campus | Nearby does not become a claim of accessible help; known uncertainty is surfaced. |
| Hours | Open, closed, unknown, overnight, and soon-closing examples | No substitution of unknown with closed/open; evaluation time is visible. |
| Place categories | Hospital/police/hotel without known hours | Potential help category does not automatically mean confirmed staffed. |
| Search cap | Query reaches maximum returned results | Counts described as observed; completeness limitation retained. |
| Query failure | Partial timeout or provider rate limit | Missing sections remain unknown; no confident score based on zeros. |
| Low-activity stretches | Several known low-evidence sections separated by unknown sections | Gaps measured along route; unknown sections are not silently bridged. |
| Score direction | More observed open evidence; longer low-evidence gap | Controlled changes move the relevant score component in the expected direction. |
| Score comparability | One factor unavailable on a candidate | Same available component set/denominator or recommendation withheld. |
| Route length | Similar evidence density on routes of different lengths | Longer route is not rewarded simply for having more sample points. |
| Detour and ties | Small evidence improvement with large extra time; equal scores | Explain the tradeoff; no forced recommendation. |
| Unsupported signals | No road classification or lighting information | No invented main-road, lighting, crime, or safety claims. |
| Stale response | User changes destination during analysis | Old response cannot replace the new journey. |
| API budget | Repeated taps, too-long route, quota limit | Requests stay bounded; errors remain honest and recoverable. |
| Keys and logs | Browser bundle/network and server logs | Server credential absent from client; precise journeys not unnecessarily logged. |
| Content retention | End of analysis, cache settings, diagnostic logs | Retention matches the confirmed provider permissions. |
| Device handoff | Installed Android and iOS apps; Google Maps installed/uninstalled; optional browser preview | Correct origin/destination/mode and selected corridor checked on both OSes; divergences documented. |
| Native maps | App launch, scroll, background/resume, route-card taps | Native map visible, interactive, correctly layered, aligned with selection and attributed on both OSes. |
| Native location | Precise/approximate, deny, services off, settings return | Manual input always works; no background collection; no silent gate-level precision claim. |
| Platform behavior | Android Back, iOS safe areas, keyboard, system text size | No clipped actions or lost journey; platform navigation remains usable. |
| Distribution | Signed Android APK and iOS beta install/update on real devices | Expected app identity/signing, correct server environment and successful launch on both platforms. |
| UX accessibility | Keyboard, screen reader, large type, small viewport | Journey can be completed and compared without relying solely on the map/color. |
| Re-entry | Return from Google Maps | Selected journey remains understandable; no unexpected new scan. |

Use synthetic, independently created fixtures for pure analysis checks. Do not build a permanent test-data archive of provider responses unless its retention is permitted. Automated tests later should focus on geometry, deduplication, uncertainty, scoring invariants, and request bounds; real-device checks are required for navigation handoff.

## Focused ten-person reel rehearsal

The latest user scope is at most ten participants with Bengaluru journeys from Manyata Tech Park and Sahakar Nagar to AEOS (13.0628268, 77.5940888). Select and check the exact public origins and office entrance. Validate these two journeys before adding more cases; one route is an acceptable truthful outcome. An optional third origin can be chosen locally if needed for a comparison example.

Record task completion, time-tradeoff comprehension, missing-data comprehension, and Google Maps handoff differences. Proposed internal targets: 8/10 complete unaided, 8/10 explain the tradeoff, and all ten understand that activity is not a safety guarantee after reading the UI. These are rehearsal targets, not safety validation or statistical population claims. Use the actual shoot phone and time window. See the research report for storyboard and request-budget assumptions.

## Optional broader ten-to-twenty-journey local pilot

If expanding beyond the reel, select 10 distinct public landmark pairs, then repeat a subset in a later time window to observe changed hours. The city is Bengaluru, with initial coverage around Sahakar Nagar and Manyata Tech Park. Additional pairs beyond the two AEOS journeys remain unverified. Include:

1. Office area to a residential-area public landmark.
2. Transit station to residential-area landmark.
3. Mall to residential-area landmark.
4. Restaurant to destination after 10 pm.
5. Known shortcut versus a main-road option.
6. Commercial corridor versus quieter internal-road option.
7. Two similar alternatives with little activity difference.
8. A destination likely to produce only one viable route.
9. Route with an apparent lengthy low-activity section.
10. Flyover, divided road, gated campus, or similar access ambiguity.

Do not claim a real-world comparison has passed because a preselected demo looks persuasive. Record inconvenient examples and failure cases. The person doing local validation should use familiar journeys and should not be asked to enter an unfamiliar area solely to validate the product.

## Observation record template

For each case, record: case ID; public origin/destination labels; city; travel mode; local date/time; device/browser; number of alternatives; selected route; displayed durations/distances; request counts and response time; query-success coverage; opening-hours completeness; observed longest low-activity section; explanation; map-handoff match/difference; observer notes; follow-up required.

Keep provider data transient according to the confirmed terms. Retain independent observations and aggregate operational metrics as appropriate; omit personal home addresses and full location histories.

## Demo readiness decisions

- At least two prevalidated journeys return multiple real alternatives and useful evidence; a one-route case is handled properly.
- 2-3 presentation examples can be explained using actual evidence, with no fabricated live values.
- Non-default route handoff has been checked on the intended demo phone and known differences are disclosed.
- Missing data never appears as definitive low activity or a safety claim.
- Scoring weights, thresholds, coverage rules and limitations are written down after calibration.
- Actual per-comparison request counts and latency fit the agreed budget and demo conditions.
- API restrictions, attribution, privacy content, and provider-use decisions are resolved before public use.
- Proposed performance target: useful comparison within about 10-15 seconds on pilot routes. Measure the real distribution before promising this; a bounded loading/failure state is required if it cannot be met.

If the evidence model or handoff fails these checks, classify the result as a limited prototype and revise the plan. A polished screen is not proof of route accuracy or nighttime conditions.
