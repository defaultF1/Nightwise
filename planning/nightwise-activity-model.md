# NightWise activity model version sample activity v1

Implemented in M3 on 9 September 2026. This is an experimental model tested with independently authored synthetic observations. It has not been calibrated against Bengaluru field conditions. M4 now displays numeric sample scores with an explicit uncalibrated label. Live-derived ranking remains disabled by default pending provider-use and calibration decisions.

## Inputs and sampling

Route geometry is validated and sampled every 200 m, including both endpoints and the final partial segment. Distances use a spherical Earth radius of 6,371,008.8 m and great-circle interpolation. Repeated points, short paths, bends, loops and dateline interpolation have synthetic tests. A comparison allows at most 120 unique queries; exceeding it fails explicitly. Equivalent exact-coordinate queries are reused within that comparison. The initial query radius is 150 m.

Nearby scans carry query ID, timestamp, completion state and place observations. Place IDs are deduplicated per route while all sample associations are retained. Off-radius observations are excluded. Contradictory hours or substantially conflicting coordinates become unknown. Categories must be consistent across repeated observations. Nearby listings never establish access from a flyover, campus or adjoining street.

## Hours and evidence quality

The tutorial clock is fixed and displayed as 9 September 2026 at 8:30 pm IST. All alternatives are evaluated at that same instant. Weekly periods have explicit opening and closing weekdays/minutes and an IANA timezone. Overnight and week-wrap periods, boundaries and overlapping intervals are handled. An empty schedule is unknown, not closed; always-open requires an explicit flag. The initial close-soon calculation uses the Bengaluru clock and the full route duration plus a 15-minute margin. It is not an arrival-time availability guarantee or a general daylight-saving transition predictor.

Scans and place observations older than 15 minutes or more than one minute in the future are excluded. Failed, missing, duplicated/conflicting or result-capped searches cannot establish complete coverage. Unknown opening hours remain unknown. Observed counts on a partial response are partial counts, not a census. When every search is unavailable, the UI uses unavailable/null counts.

## Along-route coverage and gaps

Each interval between adjacent samples is unknown if either endpoint has unusable activity evidence. With usable endpoints, an interval is active when a confirmed open listing is associated with either endpoint, otherwise it is low observed activity. A listing with unknown hours prevents a low-state claim at that sample unless a different confirmed open listing already supplies positive activity evidence.

Coverage sums actual interval lengths, including the final short interval. Unknown intervals split low-observed-activity runs. A complete longest-gap value is withheld when overall evidence is incomplete; the internal longest observed run remains separate. These sampled gaps are estimates of listing evidence, not surveyed emptiness or street safety.

## Experimental comparison

All core route evidence must be assessable before an activity comparison: complete distance-weighted scan and activity coverage and known hours for every included place. Any candidate with incomplete evidence or a soon-closing listing suppresses an automatic activity recommendation for the set. This conservative initial rule requires later pilot evaluation.

The original weights are preserved: open-place density 25; reliable main-road fraction 20; open potential-help density 15; gap continuity 15; maneuver simplicity 15; time-relevant transport evidence 10. Unsupported components are omitted from every alternative together, with the same denominator. This tutorial normally uses the three core components, denominator 55; it supplies no road or transport evidence.

Uncalibrated normalizers: open-place density saturates at 8 per km, help density at 2 per km, gap continuity decreases from 1 to 0 over a 1,500 m gap, maneuver simplicity decreases over 10 maneuvers per km, transport density saturates at 3 per km. Longer routes do not gain points merely by accumulating more listings. Scores remain within 0–100 internally and are not safety probabilities or universal route ratings.

Differences below 10 internal points are treated as similar. A more-active alternative is not selected automatically when its detour exceeds either 10 minutes or 35% of the fastest duration. The fastest route always remains selectable. Supported text describes evidence density and gap differences; unsupported main-road or lighting claims never appear. These thresholds are engineering hypotheses, not validated real-world cutoffs.

## Implementation and tests

Code lives in src/domain/geometry.ts, hours.ts, activity.ts, comparison.ts and analyze-comparison.ts. tests/unit/activity.test.ts exercises invariants independently of the UI. Browser tests in tests/browser/module3.spec.ts check the integration. See the M3 handoff for final measured test results and unresolved live/device validation.

## M4 additions

The live adapter interprets current opening evidence conservatively and keeps missing close horizons unknown. Total low-activity distance is now computed alongside the longest gap; both complete values are withheld for incomplete evidence. Observed partial totals remain separate. Server/provider tests use mocks. Turn counts are parsed from route-step maneuvers; main-road and transport components remain absent unless reliable inputs exist. The server has a separate, default-off experimental live-scoring switch. See the current M4 checkpoint for actual validation and remaining dependencies.
