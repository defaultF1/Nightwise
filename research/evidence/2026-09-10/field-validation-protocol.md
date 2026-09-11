# NightWise field validation protocol

Status: ready to execute after the corrected candidate build; no field result is pre-filled. Bengaluru team performs local checks. Kanpur can verify GPS and outside-area recovery only. Prefer normal planned journeys with a passenger observing; the driver does not operate or record the app while driving. No detour into an inaccessible location is required to collect evidence.

## Journey set

Use 16 distinct origin-destination-direction cases: eight calibration cases and eight held-out validation cases. Confirm all entrances before locking the set. Reserve 2-3 authentic reel journeys only after passing the checks. Do not replace a failed case with a favourable one without retaining the failure and its reason. Different API refreshes of the same journey are not distinct field routes. Reverse direction is a separate case because access, dividers and alternatives differ.

| Case | Intended journey | Split | Check emphasis |
| --- | --- | --- | --- |
| C01 | AEOS to Manyata agreed public gate | Calibration | Primary comparison and shared corridors |
| C02 | Manyata agreed public gate to AEOS | Calibration | Reverse access and divider |
| C03 | AEOS to agreed Sahakar Nagar public landmark | Calibration | Short trip and one-route handling |
| C04 | Sahakar Nagar landmark to AEOS | Calibration | Reverse approach |
| C05 | Manyata public gate to Sahakar Nagar landmark | Calibration | Shortcut versus main-road evidence |
| C06 | Sahakar Nagar landmark to Manyata public gate | Calibration | Directional access |
| C07 | Phoenix Mall of Asia public vehicle exit to AEOS | Calibration | Mall interior versus roadside activity |
| C08 | AEOS to Bengaluru Palace agreed public entrance | Calibration | Longer journey and gate selection |
| V01 | An ordinary in-area street to AEOS using GPS | Held out | Unnamed origin, accurate fresh fix |
| V02 | Different ordinary street to Manyata public gate | Held out | GPS beyond presets |
| V03 | Public transit stop to agreed in-area destination | Held out | Listed stop versus actual service |
| V04 | Restaurant departure after 22:00 to in-area destination | Held out | Closing during the journey |
| V05 | In-area endpoint near the pilot boundary to AEOS | Held out | Boundary and provider detour |
| V06 | Verified pharmacy frontage to a different in-area destination | Held out | Help access and weekly schedule |
| V07 | Commercial street to an in-area residential street | Held out | Spatial coverage bias |
| V08 | Different known flyover/service-road pair | Held out | Road classification and Maps handoff |

Exact V-case coordinates are supplied by participants with consent and remain private; case labels alone do not define a runnable route. Bengaluru Palace and mall centers are not substituted for verified gates. Driving mode remains the pilot mode; no two-wheeler result is claimed.

## Capture for each case

Record app/build version, device/OS, approximate or precise permission, location settings, GPS timestamp and accuracy, confirmed entrance labels, departure and passing times in IST, provider mode, route distances/durations, offered alternatives, request counter before/after if available, cold-start latency, source/age basis for hours, coverage by route and any refusal to score. Use an opaque case ID in exported results; keep private-home coordinates out of the public report.

At preselected safe observation points on each candidate corridor, record whether a listed establishment is visible from that road, whether the public entrance is reachable, whether it is operating, any posted weekly/exceptional hours, and the observation timestamp. Ask the operator before documenting a schedule and permission for continued reuse. Record contradictions and unlisted places, not only confirmations. Observe both candidate corridors during comparable time windows; a single driven route does not validate the alternative's activity. Revisit disputed or near-closing points.

Record map clipping during sheet scroll, route/card selection agreement, pin colours/labels, Back at every screen, permission-denial recovery, background/resume, keyboard/cutout overlap, refresh cancellation, offline behavior and Maps launch. Compare the external preview's actual corridor with the selected one; record any reroute or intermediate stop. Do not call launch alone a successful handoff.

## Acceptance and calibration

Freeze candidate thresholds/weights before held-out cases. Compare source schedules with observed operating state, and classified roads with locally confirmed route segments. Report numerator, denominator, mismatch type, geographic coverage and exclusions. Do not fit an apparent accuracy percentage from convenient shops alone. Assessors should record corridor observations before seeing the proposed rank where practical.

Proposed release conditions: every required device flow passes; no unknown evidence is converted to closed/empty; no duplicate or indoor-only facility inflates roadside help; recommendations respect the extra-time constraint and remain stable under the documented uncertainty checks; every retained recommendation has a reproducible factual explanation. There must be 2-3 passed authentic demo journeys. Any material contradiction in a claimed help point or selected corridor blocks that case until resolved. This is a small usability and evidence-consistency pilot, not a statistical safety validation.

16 complete Google comparisons would require at least 16 Routes attempts and potentially up to 1,920 nearby attempts at the current per-comparison cap, before repeats and Details. The last snapshot had 12 Routes and 747 nearby remaining. Execution therefore needs a staged measured budget and explicit allowance approval if limits must rise. Do not reset counters. No field appointments, provider messages or API-limit changes have been made by this protocol.
