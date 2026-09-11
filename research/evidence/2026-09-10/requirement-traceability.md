# Research traceability to the roadmap

Status: desk-research coverage complete; app and field acceptance remain as recorded in the main report. Original modules come from PDF pages 6–8; this mapping distinguishes them from the project's grouped sprint modules.

| PDF module | Research decision or evidence | Still needed |
| --- | --- | --- |
| 1 Frontend app | Native clipping mechanism, insets, GPS states, understandable evidence labels | Corrected APK and device regression |
| 2 Backend API | Render cold start, durable Redis, bounded concurrency and request attribution | Hosted cold-start/concurrency check and experiment instrumentation |
| 3 Route fetcher | Real detailed geometry verified; alternatives not guaranteed; India road flags and entrance fields researched | Bounded feature availability check and public gate confirmation |
| 4 Route sampler | Same-footprint covering refinement; naive shrink leaves gaps | Equal-budget discovery experiment |
| 5 Places scanner | API cap/type/field limits, hours priority and targeted Details design | Measured extra yield without bypassing the shared budget |
| 6 Place deduplicator | IDs plus physical identity/access review; mall/tenant and cross-source overlap limitations | Reconciled candidates and duplicate challenge cases |
| 7 Activity analyzer | Dated versus weekly hours, holidays, passing-time uncertainty; 671 OSM expressions audited | Corrected edge cases and source-versus-observed checks |
| 8 Low-activity detector | Known/unknown gap interval prototype | Implementation and corridor observations |
| 9 Road-type analyzer | Expanded OSM extract gave no tested-route gain; reason-code and sequence design | Licensed association design, diagnostic segments and local truth |
| 10 Scoring engine | Fixed-weight component bounds; saturation and missing-turn issue identified | Permitted data, calibration and held-out validation |
| 11 Explanation generator | Deterministic evidence-supported tradeoff with extra time and refusal when unresolved | Accepted live examples |
| 12 Google Maps handoff | URL cannot carry full selected polyline; shaping points can become stops | Actual external corridor agreement on final build |

| Agreed enhancement | Research resolution | Final acceptance |
| --- | --- | --- |
| Flexible journey selection | AEOS 10 km operational circle; ordinary device/manual coordinates; restricted provider search | In-area ordinary street, swap and outside-area cases |
| Endpoint confirmation | Separate campus identity from accessible gate; documented entrance fields | Correct public entrances and both pins/addresses |
| Evidence confidence | Fixed denominators, cap/failure/unknown reasons separate from score | Clear live labels and no missing-to-zero conversions |
| Help points | Scheduled opening, actual access and CNG/service-specific status separate | Verified relevant help and honest gap bounds |
| Extra-time preference | Recommendation must fit preference; retain actual alternatives for user choice | Boundary preference cases and selection synchronization |
| Saved places | User labels/independent pins local; provider IDs with appropriate re-resolution/retention | Relaunch, deletion and no personal login |
| Freshness | New checked-at time only after successful refresh; schedules distinguished from observation | Failed refresh, stale screen and reopen cases |

Additional user requests covered: immersive fullscreen, Back/keyboard and rounded-sheet native clipping; blue start/red destination/yellow shops/pink medical/green fuel legend and device selection checks; Bengaluru Palace replacing GrowthSchool in examples; team HTTPS backend and cold-start behavior. These do not replace scoring and field acceptance.

Excluded by accepted scope: community submissions/votes, crime or measured lighting scores, private-house counts, continuous tracking, full in-app navigation and mandatory iOS delivery. They are not silently counted as missing research.
