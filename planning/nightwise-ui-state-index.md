# NightWise Bengaluru UI state index

Current visual direction, 9 September 2026. Twenty-four principal mobile states are generated across six boards for the shared Android/iOS app. All route values are synthetic; map areas are labelled placeholders. The intended app uses the actual Bengaluru map through native SDKs. These files are visual references, not coded screens.

## Board files

- [01 — Journey setup](D:/Aevy%20TV%20(%20Achina%20Mayya%20)/Nightwise/planning/assets/ui/01-journey-setup.png)
- [02 — Comparison and evidence](D:/Aevy%20TV%20(%20Achina%20Mayya%20)/Nightwise/planning/assets/ui/02-compare-and-evidence.png)
- [03 — Uncertainty and alternatives](D:/Aevy%20TV%20(%20Achina%20Mayya%20)/Nightwise/planning/assets/ui/03-uncertainty-and-alternatives.png)
- [04 — Errors and recovery](D:/Aevy%20TV%20(%20Achina%20Mayya%20)/Nightwise/planning/assets/ui/04-errors-and-recovery.png)
- [05 — Handoff and information](D:/Aevy%20TV%20(%20Achina%20Mayya%20)/Nightwise/planning/assets/ui/05-handoff-and-information.png)
- [06 — Android and iOS app states](D:/Aevy%20TV%20(%20Achina%20Mayya%20)/Nightwise/planning/assets/ui/06-mobile-app-states.png)

## State behavior

| ID | State | Primary transition and invariant |
| --- | --- | --- |
| 01 | Start | Explicit location action or manual input; compare disabled until concrete inputs selected |
| 02 | Find AEOS | Choose the supplied AEOS pin; no invented street address |
| 03 | Manual origin | Choose a real public landmark after denied/unavailable location |
| 04 | Ready | Confirm origin/gate, AEOS and mode; begin comparison |
| 05 | Comparing | Show actual stage; cancel returns to preserved form; no made-up progress percentage |
| 06 | More activity selected | Explain extra time and observed evidence; include activity-not-safety qualification |
| 07 | Fastest selected | Selection updates card, map line and handoff together |
| 08 | Evidence | Distinguish listed-open, unknown hours, potential help, coverage and evidence time |
| 09 | Missing hours | Suppress numeric score and recommendation when evidence is inadequate |
| 10 | Incomplete scan | Failed sections are unknown; retry only if recoverable; no automatic zero counts |
| 11 | One route | State actual number returned; no comparison claim |
| 12 | Similar activity | No forced winner; preserve fastest selection |
| 13 | No route | Edit origin/mode or retry when useful; retain destination |
| 14 | Network failure | Preserve form; distinguish network retry from quota wait |
| 15 | Beyond demo coverage | Offer shorter journey or direct Maps handoff without activity analysis |
| 16 | Daytime | Current hours do not forecast tonight; no nightly recommendation from daytime evidence |
| 17 | Handoff | Name the selected route; tell user Maps can change it and to check preview |
| 18 | Return/recompare | Retain selection locally as permitted; no silent repeated scan |
| 19 | About | Explain purpose and limits in plain language |
| 20 | Privacy | Optional location, manual origin, no continuous tracking, provider processing |
| 21 | Launch | Brief native splash/app launch transition; no fake progress or unnecessary wait |
| 22 | Optional location | App-owned explanation only when useful; native OS prompt after tap, manual choice equally usable |
| 23 | Location off | Manual origin remains primary; settings optional; refresh permission status on return |
| 24 | Offline launch | Show connection requirement; allow editing, no live route or activity claim |

## Variants reusing those layouts

| Variant | Base layout | Required difference |
| --- | --- | --- |
| Location granted | 04 | Editable readable origin; unnecessary coordinate precision omitted |
| Location prompt/pending | 01, 22 | Android/iOS owns the permission dialog; browser owns its preview dialog; do not imitate or trigger automatically |
| No search results / ambiguous text | 02–03 | Inline explanation, correct query and actual selection required |
| Missing input / same origin and destination | 01–04 | Inline field-specific message, preserve other values |
| Out-of-area destination | 02–04 | Explain Bengaluru demo area and offer editing |
| Cancelled comparison | 04 | Restore inputs, ignore later stale responses |
| Three or four routes | 06–07 | Additional cards scroll; unique labelled map lines; no expectation of minimum alternatives |
| Quota or cost cutoff | 14–15 | Explain temporary unavailability; disable futile immediate retries |
| Soon-closing place | 08–09 | Arrival-time uncertainty; do not count as definitely open throughout the journey |
| Search result cap | 08–09 | Counts remain observed, completeness limitation visible |
| No usable data on any route | 09 | No score or activity-based ranking; still allow ordinary navigation choice |
| Score enabled after feasibility | 06–08 | Estimated Night Activity Score with comparable denominator and separate data quality; no safety probability |
| Maps app unavailable | 17 | Use web fallback when supported; do not promise an installed app opens |
| Terms / provider attribution | 19–20 | Same readable information layout; verified provider text and owner contact required before publication |
| Large text, keyboard, narrow screen | All | Natural scrolling, no clipped controls, accessible focus and labels |
| Desktop | All | Shared flow and data; two-column form/results plus larger map, readable max-width content |
| Native platform controls | All | Real Android/iOS status bars and safe areas; Android Back and iOS system gestures; no browser chrome in apps |
| Approximate position | 04, 23 | Ask for an editable starting point; do not assume campus gate precision |
| Native map resume | 06–18 | Recreate/restore provider view as needed without re-running paid analysis automatically |

## Design decisions to carry into implementation

Use midnight navy with teal for the selected activity option, blue for alternatives and amber for uncertainty. Labels and selected controls must also communicate meaning. Keep result times prominent and the fastest option selectable. Use a compact map above mobile cards and keep attribution clear. The working name remains NightWise.

Use the exact AEOS coordinates only for the supplied place pin; check the entrance locally. Manyata gate and Sahakar Nagar landmark remain to be chosen. Driving is provisional. Generic search results must not claim an origin is selected merely because a neighbourhood name was typed.

The generated boards show a reusable visual system; microcopy and interaction rules in this file and the UX specification are authoritative where raster text differs. In particular, add the missing nearby activity qualification on screen 06; never treat screen 10's generated 40% as a coverage threshold. See `nightwise-ui-generation-record.md` for exact prompts and inspection notes.
