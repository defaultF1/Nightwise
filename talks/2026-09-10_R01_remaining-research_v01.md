# NightWise remaining deliverables research

NightWise has a working Android journey interface and hosted Google route/listing pipeline, but its central live score and recommendation remain unaccepted. The research supports a concrete implementation sequence: resolve the permitted data-use design, improve bounded discovery and uncertainty handling, fix native map clipping and location recovery, and validate actual North Bengaluru journeys. More API calls or a larger map extract alone will not complete these requirements.

This report covers all twelve roadmap modules and ten acceptance criteria, the seven agreed journey enhancements, North Bengaluru service eligibility, published shop schedules, help points, road classification, hosting and the reel validation programme. Findings reflect source checks on 10 September 2026. Technical decisions are distinguished from experiments still needed. Community submissions, crowd voting, full in-app navigation, crime scoring and measured street-lighting remain outside the agreed first version.[^1]

## Research findings and decisions

| Workstream | Research outcome | Remaining acceptance evidence |
| --- | --- | --- |
| Shop discovery | A covering subdivision design is ready for a bounded experiment; uncapped search is not a street census | Same-footprint provider comparison and useful coverage per request |
| Opening hours | Existing Google fields are appropriate; OSM parsing was measured and holiday failures identified | Corrected exceptional schedules and actual operating-state checks |
| Road evidence | Larger extract collected; no gain on the tested routes; new provider road-feature fields identified | Reason-coded mismatches and verified flyover/service-road cases |
| Activity score | Conservative interval method specified; proprietary Google-derived scoring needs use-rights resolution | Licensed inputs, implementation, calibration and held-out cases |
| GPS and area | Coordinate-based service model and recovery flow specified | Physical successful fix, boundary and ordinary-street journeys |
| Native UI and handoff | Native/WebView compositing explains a credible clipping mechanism; fix strategy specified | Corrected APK on phone and actual external corridor agreement |
| Hosting and testing | Persistent budget is appropriate; free hosting and remaining quota constrain rehearsal | Cold start, simultaneous users and 16-case validation programme |

Desk research is sufficiently developed to start implementation and targeted experiments. It does not establish that a business will open tonight, that a particular gate is public, or that a proposed score is calibrated. External provider clarification and local field observations are finite, named dependencies, not questions that further general web searches can settle.

## Measured baseline and evidence inventory

The authenticated Render comparison at 13:22 IST on 10 September returned three genuine AEOS-to-Manyata driving alternatives. The result exercised the hosted server, Google services and shared Redis allowance. No live score was returned; the switch remained off and all three analyses were non-comparable under the current strict gate.[^2]

| Measure | Fastest | Alternative 1 | Alternative 2 |
| --- | --- | --- | --- |
| Distance | 4.795 km | 5.381 km | 6.091 km |
| Duration at check | 17.2 min | 17.9 min | 21.4 min |
| Route geometry points | 303 | 305 | 220 |
| Listings considered | 230 | 254 | 201 |
| Unknown-hour listings | 84 | 78 | 80 |
| Known-hours coverage | 63.5% | 69.3% | 60.2% |
| Complete scan coverage | 50.0% | 51.7% | 73.8% |
| Classified road distance | 90.0% | 83.6% | 76.2% |

The same result assessed activity on 87.5%, 85.2% and 73.8% of route distance. These daytime figures do not establish an improvement over the earlier morning run: opening states change with passing time, and alternative labels can be reordered. Compare routes by geometry/direction and matching time conditions when evaluating a code change.

The public-source package contains 21 operator location records, 671 OSM elements with opening-hours tags, and 58,613 OSM highway ways covering the 10 km query area. Fourteen operator records have clear regular schedules and one published coordinate; six pharmacy schedules are ambiguous, and Aster CMI has two coordinates separated by about 212 m. Only four OSM entries carry an explicit hours-verification date. Of the OSM elements, 143 have indoor or floor tags and 11 same-name nearby pairs need duplicate review. These counts cannot be added to Google counts.[^2]

Only 1, 2 and 1 operator records, and 18, 26 and 5 OSM hours elements, were within 100 m of the respective live route polylines. Even these are candidates: a divider, flyover, compound wall or internal mall floor can make a nearby place irrelevant to someone on that road. The wider collection is useful for new journeys; it is not a demonstrated large coverage gain on AEOS-Manyata.

## Data rights and storage architecture

The public Google terms prohibit creating content from Google Maps Content and give point-in-polygon use of Places coordinates as an example. Standard Places policies also restrict caching beyond documented exceptions. These provisions create a material unresolved question for a proprietary score, route-level derived dataset and local service-area analysis using Places coordinates. A session-only implementation does not by itself establish permission. The account's applicable agreement and a written provider response must settle the proposed design.[^3]

There is a narrower documented opportunity: Places Aggregate permits qualifying transformed Customer Values from POI Counts and limited caching of those counts for that purpose. However, its published request schema has geographic, category, business operating-status, rating and price filters, with no arrival-time or weekly-opening filter. Operational means a business operates during its defined hours; it is not proof that the shop is open now. Aggregate therefore does not replace the required nighttime-hours evidence, and its exception must not be extended automatically to ordinary Places Details data.[^4][^5]

Recommended architecture separates provenance at ingestion rather than combining every source into an undifferentiated shop table. Every observation needs a source ID, retrieval time, hours basis, applicable dates, location basis, access status and permitted retention. Keep Google display data distinct from OSM and independently verified schedules. Do not use scraped Google Maps pages, reviews or Popular Times as a substitute API. The reviewed Places field reference provides no general live pedestrian-count feed.[^6]

| Data | Proposed treatment |
| --- | --- |
| Google place IDs | Persist as references; re-resolve when needed and handle changed IDs |
| Google coordinates | Enforce the documented temporary-cache limit where used; do not treat it as permission to store names or schedules |
| Google hours and route content | No permanent phone shop database; session display with an explicit provider-approved retention design |
| User-entered labels and independent GPS pins | Store locally with deletion controls and minimal metadata |
| OSM extracts and derived datasets | Retain provenance and comply with ODbL attribution/share-alike obligations where applicable |
| Operator schedules and field records | Record source and reuse permission; website access alone is not a blanket database licence |
| Redis request counts | Durable, non-expiring budget ledger; no provider listing payloads |

The Google service terms permit temporary Places latitude/longitude caching for up to 30 days; Places policies exempt place IDs. These are distinct exceptions, not a general 30-day cache licence for all fields.[^4][^7] OSM's database obligations are also distinct from the app's source-code licence; a produced work and a distributed derivative database require different consideration.[^8][^9]

An account-support draft is prepared with six precise questions covering scoring, route association, service boundaries, road matching, QA aggregates and storage. It has not been sent. If the proposed Google-derived score is not permitted, use independently licensed activity evidence or an appropriate contracted product; that change must be evaluated against the PDF rather than hidden by renaming the score.

## Discovery and result cap handling

The existing scanner requests ten categories at 200 m samples with a 150 m radius. Nearby Search New limits a response to 20 places. A capped response supplies useful positive observations but not a complete absence test. Fewer than 20 results also does not prove that all physical shops are represented in Google's database.[^10]

Specify the target universe before comparing plans: customer-facing food, retail, essential help and relevant public-transport places. Expand only supported searchable types; Google distinguishes searchable and response-only type tables. A business with several types still counts once per physical identity, and a mall plus its internal tenants must not inflate roadside density.[^11]

The preferred experiment is a balanced, bounded refinement of saturated query footprints. Four child circles with centers offset by plus or minus 75 m on each axis from a 150 m parent center, each with radius 150 divided by the square root of two, cover the parent disk. A geometry prototype checked all 70,681 integer-metre points in that disk and found no uncovered point. Child results outside the original footprint must be excluded, and duplicate IDs retained only once. This validates geometry, not provider yield.

Simply shrinking the radius to 75 m while leaving samples 200 m apart creates a 50 m centerline gap. It would make the search look less capped while checking less of the road. Category partitioning is a second experiment: use the same footprint and a documented union of type groups, retaining multi-type deduplication. Neither refinement can guarantee a census, and children that still reach their cap remain partial.

Pre-register a first pilot of at most one Routes request, 30 additional nearby calls and 12 targeted Details calls, using the shared persistent allowance. Allocate matched cells across all alternatives, including dense and sparse sections, before viewing the ranking. Measure capped-cell rate, new unique IDs, newly usable hours, time-window comparability, latency and requests per newly assessed metre. Do not publish a percentage improvement until this comparison runs. The current public backend lacks a research endpoint for these variants; calling a local key outside its shared ledger is not an acceptable substitute.

Hours fields are already requested by Nearby; Details is not a guaranteed cure. The targeted sample should use missing-hour IDs drawn from all routes, including shared IDs only once, to measure whether Details actually adds usable schedule information. Field masks should request required fields only; adding unrelated reviews and atmosphere fields adds cost and data obligations without solving opening-hours coverage.[^12][^13]

## Opening hours and help point semantics

Evaluate business status first, then complete dated current periods, then clearly labelled regular weekly periods where no special-date conflict exists. Current hours cover a rolling seven-day date window and can be truncated at its boundaries. Overnight periods, missing close times, midnight boundaries and business-status closures need explicit treatment. An absent schedule remains unknown, while a valid schedule can explicitly identify a closed day.[^6]

The implementation must answer the Wednesday example exactly: 09:00-22:00 on ordinary days and either closed all Wednesday or 10:00-21:00 Wednesday, depending on the actual supplied schedule. It must also handle split shifts, Tuesday-to-Wednesday overnight openings, a holiday override, closing before arrival and an unknown future exception. These are deterministic time rules; an LLM is unnecessary.

The existing arrival estimate distributes total duration by distance. That is a coarse approximation under uneven traffic. Request step time information when available and compare earliest/latest passing-time scenarios around closing boundaries. The API's available route/step fields should be interpreted according to their documented static or traffic-aware semantics; do not call a proportional estimate an exact ETA. If a shop's state changes within the arrival uncertainty window, mark its availability uncertain.[^14]

An isolated research run of opening_hours version 3.14.0 evaluated all 671 OSM expressions in Asia/Kolkata. It parsed 632: 622 without warnings and ten with warnings. Thirty-nine failed, comprising all 34 holiday-rule entries and five other malformed/unsupported expressions. The library reported no Indian public-holiday definitions. At the chosen 21:00 timestamp, parsed expressions projected 402 open and 230 closed; these are duplicate-unresolved, unverified schedule projections, not people observed on the road.[^15]

Keep holiday-dependent OSM entries unknown until a correct local calendar adapter and the expression semantics are validated. A government holiday calendar would not prove that each private shop closes. Pin the parser version and review its LGPL and bundled component licences before shipping it; the research installation did not add it to the application. Retain raw expressions, parse errors and review status.[^16]

For help points, show public-access status separately from scheduled opening. Hospitals require an emergency entrance or service-specific hours, not an assumption that every department runs continuously. Hotels and police locations are potential assistance categories, not confirmed staff counts. A petrol station does not establish CNG availability; verify that separately or label it simply Fuel. A transit stop's existence does not establish a service running at the passing time.

## Road classification and map geometry

The expanded 34 MB OSM file is valuable for geographic coverage but exceeds the production loader's 30 MB, 30,000-way and 250,000-point limits. Research corridor subsets passed through the existing loader and returned exactly the same 90.0%, 83.6% and 76.2% classifications as the hosted extract on the three tested paths. Do not install the entire file and silently fall back to an empty analyzer.[^2]

The current algorithm excludes grade-separated best matches and ambiguous parallel roads, uses a 15 m distance/25-degree alignment rule, and maps only selected highway classes to main/internal. The new extract includes 1,336 grade-flagged ways and 6,900 ways outside those classified types; the groups can overlap. These inventory counts do not identify which mechanism caused each live unknown segment.

The next implementation should emit reason codes for no nearby candidate, alignment failure, competing road classes, unresolved grade and unsupported type. Use route continuity and graph connectivity to resolve candidates conservatively. Sequence-based map-matching literature supports considering the road network across multiple observations, but results from a 2009 Seattle GPS study are not accuracy evidence for this Bengaluru classifier. Do not train a model on Google content under the current public restrictions.[^17]

Google also documents experimental flyover and narrow-road details for India. These could provide direct route-level flags for difficult cases; narrow-road information supports DRIVE, and flyover information supports DRIVE and two-wheeler modes. Request the corresponding extra computations and field masks in a future bounded test. The guide says no extra experimental surcharge currently applies, while the reference warns pricing may change. Availability on the specific Bengaluru routes remains untested; absence of a returned feature is not proof that none exists.[^18]

Preserve the provider's real polyline for drawing. OSM classification must not replace it with a simplified invented path. A main-road tag is a road-hierarchy estimate, not a lighting or safety measurement. The proposed tiled OSM distribution needs provenance, a version manifest, a routing buffer beyond eligible endpoints, and explicit handling of paths that leave loaded tiles.

## Scoring and incomplete evidence

The current engine withholds every live score unless all candidate routes have effectively complete scans, hours and activity assessment, with no closing-soon listing. Its six weights match the PDF's initial 25/20/15/15/15/10 proposal. Those weights are uncalibrated. Missing internal-turn evidence is currently treated as zero additional internal-turn penalty; the revised design must preserve that uncertainty instead of rewarding missing information.[^1][^2]

Use fixed component definitions across routes and show coverage separately. Do not divide observed counts by the small fraction that happened to be assessed and extrapolate to the whole route: missingness is concentrated in dense, capped or poorly documented areas. Known-open counts can support a lower bound. Unknown observed listings provide an additional upper count only within a defined discovery universe; capped or unobserved sections require a broad upper bound for a normalized component.

For each normalized component, record an evidence-supported lower and upper value between zero and one. Apply the same six fixed weights to both endpoints. An entirely missing component contributes its full possible interval, not zero and not a secretly redistributed weight. These are assumption bounds, not statistical confidence intervals. A route should be recommended only if its supported advantage survives the relevant missing-data scenarios, meets the extra-time preference and has the required data-use permission.

An arithmetic prototype illustrates the distinction. Invented component intervals produced route A at 75-87.5 points and B at 45.5-60.5, with a robust ordering under those assumptions. A third invented route ranged from 24-95.5 and could not be ranked confidently against A. The prototype validates arithmetic only. It does not set a real NightWise score or prove that the assumed intervals represent street conditions.[^15]

For low-activity stretches, compute a lower length by breaking runs at unknown segments and an upper length by allowing unknown segments to connect low-observed runs. In the synthetic sequence low/unknown/low/active/unknown with 200 m segments, the longest low-observed stretch ranges from 200 to 600 m. State the sampling resolution and evidence universe; an interval about listed activity does not establish that a road is empty. Apply the same distinction to gaps between listed accessible help points.

The current density scale saturates at eight open listings per kilometre. All three daytime routes exceed that value, so this component would give each its maximum contribution. This is a calibration issue, not a reason to choose a higher constant merely to make the demo rank. Compare candidate scales and weights on a separate calibration set, preserve shared-corridor correlations, and assess recommendation reversals on held-out journeys. No numerical threshold can compensate for unknown source validity.

For a supported recommendation, generate one or two sentences from the strongest measured differences and extra time. For an unsupported comparison, say: "Opening times are missing on parts of both routes, so we cannot yet compare nighttime activity reliably." A displayed activity score is an index of the stated evidence, never a probability of being safe. Showing a range or withholding a recommendation is legitimate behavior, but the PDF's demonstration still needs real cases with a defensible score and explanation.

## Service area and current location

Use a versioned operational circle centered on the supplied AEOS coordinate with a 10,000 m radius. It is not the administrative definition of North Bengaluru. Ordinary streets inside it must qualify by coordinates rather than fame or preset names. Both endpoints must be eligible, but a legal driving detour can leave the circle; do not clip its route or pretend out-of-coverage portions were checked.

The supplied Manyata pin is inside the proposed area. Phoenix should mean Phoenix Mall of Asia in Byatarayanapura for this pilot, not an unspecified Phoenix property: Apple's operator page confirms that mall identity/address, and the OSM area-center candidate is about 0.98 km from AEOS. Bengaluru Palace has an independent Wikidata coordinate candidate about 7.15 km from AEOS, inside the proposed circle, but it is not a verified public entrance. Embassy's published Manyata address establishes the Nagavara campus, not a guarantee of any gate's access.[^19][^20][^21]

For Google place search, use the documented Autocomplete circle locationRestriction rather than a loose bias. Keep source lineage for the final endpoint and obtain provider clarification on local geospatial eligibility analysis of Places coordinates. Device GPS and independently supplied manual coordinates can use the circle test. A saved provider place ID should be re-resolved under the approved storage design rather than retaining all returned content forever.[^22]

The current native wrapper merges several location failures into one message and accepts accuracy up to 300 m. The installed geolocation plugin is 8.2.2. Implement explicit states for permission denial, permanent denial, system location off, unavailable Play services, timeout, stale fix and coarse accuracy. Android's SettingsClient supports checking required settings and presenting a user-controlled enable dialog; the app cannot silently turn GPS on.[^23][^24]

Proposed usability policy: seek a recent precise fix, display its accuracy circle, and require pin confirmation when the estimate is too broad for an entrance. Near the service boundary, if distance plus reported uncertainty is inside the radius, accept; if distance minus uncertainty is outside, decline; otherwise request a better fix or manual choice. This is a conservative operational rule, not a calibrated probability: Android's reported accuracy is an estimate, not an absolute error bound. Freeze age/accuracy thresholds before device tests and preserve the destination while returning from Settings.[^25]

## Native maps and navigation handoff

The installed Maps plugin is 8.0.1. Its documentation states that Android renders the native map beneath the WebView and uses the DOM component for position updates. Local code confirms that updateRender moves/resizes the native view; it does not calculate the intersection of all scrolling/clipping ancestors. Forwarding nested scroll events addresses position synchronization but cannot by itself establish clipping to a rounded sheet. This is a source-supported mechanism consistent with the screenshots, still requiring a corrected-build device reproduction.[^26]

Recommended fix: explicitly intersect the map rectangle with the visible sheet viewport, clip the native container, preserve the full map's coordinate origin for touch input, and hide it when the intersection is empty or another modal covers it. Keep lifecycle cleanup and inset updates deterministic. CSS border-radius alone cannot be assumed to clip a separate native surface. Avoid recreating the map on every scroll because it causes state churn and may increase map usage.

Immersive mode should allow system bars to appear transiently by swipe. Controls must remain outside keyboard, cutout and navigation gesture obstruction areas; permanent suppression of Android controls is not the goal. Test the Redmi Android 10 case and a newer edge-to-edge Android configuration, large text, rotation, keyboard, Back and resume.[^27][^28]

Google Maps URLs accept endpoints, travel mode and a limited set of waypoints; they do not accept the full selected polyline. The current three shaping points can influence the corridor but may appear as stops and cannot guarantee identical external navigation. Keep an explicit preview check and compare each agreed demo corridor after launch. If exact preservation remains essential beyond the URL capability, an SDK/navigation redesign would be additional scope, not a hidden completed feature.[^29]

Entrance/navigation-point fields are documented in Places and may help disambiguate complex destinations when available. Request them only where useful, maintain the chosen mode, and verify fallback behavior. A Places navigation-point token for Routes/Navigation SDK should not be assumed to transfer through an ordinary Maps URL.[^10]

## Hosting cost and local preferences

Render Free remains suitable for the explicitly chosen pilot trial. It sleeps after 15 minutes without inbound traffic, can take about a minute to resume, and has ephemeral local storage. Keep request counters in durable Redis, show a visible waking state, and use a bounded queue or clear busy response. The current server's process-local busy flag permits one comparison at a time; ten simultaneous team users do not yet have a proven smooth experience.[^30]

Redis's non-expiring shared counter, atomic reservation and fail-closed behavior are appropriate. Confirm eviction remains disabled for this database; Upstash documents that enabling it allows data removal under capacity pressure. Preserve the budget key across deployment and never initialize a missing production counter to zero. Add request-correlated before/after usage metadata so experiment cost can be measured without attributing another tester's requests to a run.[^31]

At the last hosted snapshot, 12 Routes and 747 nearby requests remained. India list pricing shows Nearby Search Enterprise at USD 10.50 per 1,000 in the first paid tier and Compute Routes Pro at USD 3.00 per 1,000. A hypothetical one-route/120-nearby comparison is therefore USD 1.263 before free allowances, taxes, other SKUs and map instances, if that tariff applies. India pricing eligibility and actual billing must be checked in the account; this calculation is not an invoice.[^32]

Saved Home/Office labels, theme and extra-time preference can stay local without an account. Record whether coordinates came from device/user input or a provider and apply the appropriate retention. Deleting saved places should remove their local data. Refresh must replace the checked-at time only after a successful new analysis; reopening a cached screen must not claim new verification. Show "scheduled open" where only schedules exist, and always distinguish unknown coverage from low observed activity. These enhancements are already built in part; their final-device regression remains required.

## Validation and completion gates

The 16-case field protocol supplies eight calibration and eight held-out journeys, including both directions among AEOS, Manyata and Sahakar Nagar, a mall exit, Bengaluru Palace, an ordinary street with GPS, a boundary case and distinct flyover/service-road examples. Exact gates and private endpoints are to be confirmed locally. Repeated API refreshes are not 16 distinct field journeys. Observing only the selected route cannot validate the activity of an unseen alternative.

Capture source-versus-observed opening state, public access, street visibility, passing time, route geometry agreement, map clipping, Back/resume, GPS quality and request counters. Freeze the candidate rules before held-out testing; retain failures and contradictions. The pilot can establish usability and evidence consistency, not a citywide safety prediction. Its request demand may exceed remaining allowances, so execution needs staged authorization rather than resetting the ledger.

| PDF acceptance criterion | Required next evidence |
| --- | --- |
| No login | Latest APK opens without personal account; shared pilot-code qualification disclosed |
| Enter destination | Searched/manual origin and destination, swap, saved place and out-of-area cases |
| Current location | Successful fresh physical fix, recovery cases and ordinary in-area street trip |
| At least two routes | At least two actual alternatives on the selected reel journeys; honest one-route fallback elsewhere |
| Time and distance | Correct per-route provider values and synchronized selection |
| Nearby scanning | Measured discovery plan, cap/failure flags and fair per-route coverage |
| Night Activity Score | Permitted inputs, tested uncertainty model and held-out live acceptance |
| Longest low-activity stretch | Correct known/unknown bounds and field-consistent corridor observations |
| Simple recommendation | Evidence-supported tradeoff within preference; no unsupported safety claim |
| Google Maps handoff | Actual external route preview/corridor and public entrance agreement |

Implementation order is data-use decision and diagnostic telemetry, bounded scan/hour experiment, road and uncertainty changes, native GPS/map fixes, then hosted/device/field acceptance and final packaging. These stages can overlap where independent. Do not declare 100% PDF completion on the basis of this report, the daytime provider check or synthetic arithmetic.

## Research limits and handoff

No additional Google requests, allowance changes, provider messages, deployment or APK changes were made for this desk-research pass. The prior authenticated comparison remains the live baseline. The hours parser and geometry/scoring prototypes were isolated research executions. A supplementary OSM anchor query returned HTTP 406 and was not used as evidence; a report-helper syntax error was corrected locally. Existing source and independent operator/dataset references bounded the remaining location questions.

Ready deliverables are this implementation brief, the source register, raw and derived public evidence with provenance, parser audit, covering-query/gap/score prototypes, an unsent provider clarification draft and a 16-case field protocol. Remaining external inputs are the applicable provider permission decision, authoritative public entrances and recent on-site operating/access observations. These cannot truthfully be completed through desktop research alone.

## Sources

All online sources below were checked on 10 September 2026. Live documentation may change; the applicable account agreement controls product-use permissions. Local evidence is explicitly distinguished from external documentation.

[^1]: Project roadmap, GPT maps - roadmap.pdf, pages 2-12, user-supplied local document; accepted Bengaluru/Android scope amendments in AGENTS.md.
[^2]: NightWise, hosted-comparison.json, hosted-route-evidence-audit.json, operator-hours.json and OSM provenance files, research/evidence/2026-09-10; authenticated comparison at 2026-09-10T07:52:29Z. Current source: activity.ts, comparison.ts, roads.ts and server modules.
[^3]: Google, [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms), section 3.2.3.
[^4]: Google, [Maps Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms), sections 13 and 14.
[^5]: Google, [Places Aggregate computeInsights reference](https://developers.google.com/maps/documentation/places-aggregate/reference/rest/v1/TopLevel/computeInsights), request filters and operating status.
[^6]: Google, [Places resource reference](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places), business status, opening hours and available fields.
[^7]: Google, [Places policies and attributions](https://developers.google.com/maps/documentation/places/web-service/policies), caching exceptions and display requirements.
[^8]: OpenStreetMap Foundation, [Copyright and licence](https://www.openstreetmap.org/copyright).
[^9]: OpenStreetMap Foundation, [Produced Work guideline](https://osmfoundation.org/wiki/Licence/Community_Guidelines/Produced_Work_-_Guideline).
[^10]: Google, [Nearby Search New](https://developers.google.com/maps/documentation/places/web-service/nearby-search), result limits and entrance/navigation-point fields.
[^11]: Google, [Place Types New](https://developers.google.com/maps/documentation/places/web-service/place-types).
[^12]: Google, [Place Details New](https://developers.google.com/maps/documentation/places/web-service/place-details), fields and SKU groups.
[^13]: Google, [Choose fields to return](https://developers.google.com/maps/documentation/places/web-service/choose-fields).
[^14]: Google, [Compute Routes reference](https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes), route, leg and step fields.
[^15]: NightWise, osm-hours-parser-audit.json and method-experiments.json, research/evidence/2026-09-10; local reproducible research results, not field observations.
[^16]: opening-hours maintainers, [opening_hours.js](https://github.com/opening-hours/opening_hours.js/), documentation and licences; npm version 3.14.0 tested. See also [OSM opening-hours specification](https://wiki.openstreetmap.org/wiki/Key:opening_hours).
[^17]: Paul Newson and John Krumm, [Hidden Markov Map Matching Through Noise and Sparseness](https://www.microsoft.com/en-us/research/publication/hidden-markov-map-matching-noise-sparseness/), ACM SIGSPATIAL GIS, November 2009.
[^18]: Google, [Request flyovers and narrow roads](https://developers.google.com/maps/documentation/routes/flyover-narrow), experimental India feature, updated 1 September 2026; compare Compute Routes reference pricing caveat.
[^19]: Apple, [Apple Hebbal](https://www.apple.com/in/retail/hebbal/), Phoenix Mall of Asia address; OSM way/635509936 in the local evidence extract.
[^20]: Wikidata, [Bengaluru Palace Q3520057](https://www.wikidata.org/wiki/Q3520057), coordinate claim and CC0 data; [Bengaluru Urban district tourism page](https://bengaluruurban.nic.in/en/tourist-place/bangalore-palace/) independently identifies the landmark. Neither establishes a driving entrance.
[^21]: Embassy Office Parks, [Embassy Manyata Business Park](https://www.embassyofficeparks.com/ourportfolio/bangalore/embassy-manyata/), published Nagavara address.
[^22]: Google, [Autocomplete New](https://developers.google.com/maps/documentation/places/web-service/place-autocomplete), locationRestriction; [Place IDs](https://developers.google.com/maps/documentation/places/web-service/place-id), ID handling.
[^23]: Capacitor, [Geolocation plugin documentation v8](https://capacitorjs.com/docs/apis/geolocation); installed geolocation 8.2.2 source and NightWise src/native.ts.
[^24]: Google, [SettingsClient](https://developers.google.com/android/reference/com/google/android/gms/location/SettingsClient); Android, [Change location settings](https://developer.android.com/develop/sensors-and-location/location/change-location-settings).
[^25]: Android, [Request location permissions](https://developer.android.com/develop/sensors-and-location/location/permissions), precise/approximate behavior; Capacitor position timestamp/accuracy documentation.
[^26]: Capacitor, [Google Maps plugin documentation v8](https://capacitorjs.com/docs/apis/google-maps); installed 8.0.1 CapacitorGoogleMap.kt updateRender and NightWise scroll-sync.ts.
[^27]: Android, [Hide system bars for immersive mode](https://developer.android.com/develop/ui/views/layout/immersive).
[^28]: Android, [Display content edge to edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge).
[^29]: Google, [Maps URLs guide](https://developers.google.com/maps/documentation/urls/get-started); [alternative routes documentation](https://developers.google.com/maps/documentation/routes/alternative-routes).
[^30]: Render, [Deploy for Free](https://render.com/docs/free), idle behavior, filesystem and service limitations.
[^31]: Upstash, [Eviction](https://upstash.com/docs/redis/features/eviction); NightWise server/redis-budget.ts and server/app.ts.
[^32]: Google, [Maps Platform India pricing](https://developers.google.com/maps/billing-and-pricing/pricing-india) and [Places usage and billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing). List prices and eligibility are not actual account charges.
