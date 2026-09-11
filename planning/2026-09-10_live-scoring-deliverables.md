# NightWise implementation status

Hosted software verification and a Redmi live comparison passed. The phone comparison at 2026-09-10T10:00:16.156Z returned 3 real routes, 3 score ranges and outcome insufficient. Final 0.9.1 device smoke passed after the UI correction; the full live request was on 0.9.0.

| PDF requirement | Actual position |
| --- | --- |
| Works without login | Implemented. No account; live access uses the shared team code. |
| Enter a destination | Implemented. Search, chosen-place details, arbitrary in-area coordinates, saved places and swap remain available. |
| Get current location after permission | Redmi native GPS returned an out-of-pilot result consistent with Kanpur and retained AEOS. Location settings launch works. In-area native GPS still requires a phone inside the pilot. |
| Show at least two routes | Real alternatives have been demonstrated. Google can return fewer than two for a particular request; no alternative is invented. |
| Show time and distance | Implemented using Google values. Actual polyline bends remain provider geometry. |
| Scan places along each route | Improved scan allocation and refinement implemented. The feature works with incomplete results; exhaustive coverage is not guaranteed. |
| Return a Night Activity Score | Live score ranges implemented and automated tests passed. Hosted score ranges verified. |
| Identify the longest low activity stretch | Calculation returns an evidence-supported distance range when scans or hours are incomplete. This is not an exact claim that an unobserved road is empty. |
| Explain the recommended route | Decision and plain-language explanation implemented. Recommendations require separated bounds; overlap produces an honest no-recommendation explanation. |
| Open selected route in Google Maps | Redmi 0.9.0 launched Google Maps for Alternative 1 and retained results after activity resume. Physical Back, exact road preservation and a repeated final 0.9.1 handoff remain unverified. Maps URLs cannot guarantee an exact selected polyline. |

Ground checks and reel production are excluded from this coding task.
