# NightWise: project analysis and build plan

Current delivery update: Android required within 48–72 hours, iOS optional, implementation authorized with credentials deferred. See `nightwise-72-hour-modules.md`; older estimates below are research history. Canonical folder: D:/Aevy TV ( Achina Mayya )/Nightwise.
Prepared and updated 9 September 2026. Status: preparation only; implementation has not started. Latest scope: **Android and iOS apps**, Bengaluru map, north Bengaluru reel journeys to AEOS, at most 10 participants total. See `../research/nightwise-bengaluru-research.md` for research, native delivery, the current **50–80-hour** estimate and request budget. The older web-only estimate is preserved below as a clearly labelled baseline.

NightWise is a focused route-comparison product: help someone compare estimated nighttime activity along available routes, understand the extra travel time, choose a route, and continue in Google Maps. The core challenge is trustworthy, affordable route evidence and a useful handoff. The interface is comparatively straightforward.

## Review coverage and authority

- Reviewed all 14 pages of `C:/Users/LENOVO/Downloads/GPT maps - roadmap.pdf`, including its three embedded product, UI, and engineering diagrams.
- Inspected the workspace, including hidden files. It contains an initialized Git repository with no commits or application files. There is no existing frontend, backend, dependency manifest, deployment configuration, or test suite to audit.
- Checked current primary documentation for the proposed Google services, pricing, restrictions, and Next.js backend support. No paid Maps requests or account changes were made.
- The PDF is a proposed project specification. Its instructions to create accounts, keys, a repository, environment files, and a deployment are future backlog items. They do not override the user's current instruction to plan without coding.
- Pages 13-14 are background material for a future script, not additional app requirements. The GCC Gender Compass PDF was subsequently retrieved from the corporation's website and visually reviewed, including its methodology, charts and limitations. Primary Safetipin reports for Bengaluru and Tondiarpet were also checked. Findings and precise caveats are recorded in the companion research document.

## Scope to preserve

| Included in the first version | Outside the first version |
| --- | --- |
| Shared responsive UI packaged for Android and iOS, usable without login | User accounts, profiles, saved journey history |
| Current location with permission; manually selectable origin | Continuous tracking, tracking links, emergency dispatch |
| Destination autocomplete | Community reports or city audit network |
| Available route alternatives, duration and distance; APK and TestFlight demo delivery | In-app turn-by-turn navigation or broad public store launch |
| Activity evidence along the whole route | Claims about crime, guaranteed safety, or people in private homes |
| Estimated Night Activity Score with explainable components | Reliable street-light coverage or residential activity measurement |
| Estimated low-activity stretches and data limitations | Mandatory database, model training, or an LLM dependency |
| One- or two-line comparison and Google Maps handoff | Multi-city launch in the initial pilot |

The app must use wording about activity and evidence. Neither an open business nor a high score establishes personal safety. Treat business categories as potential help points, not proof of staff availability or access.

## Decisions and inconsistencies

| Item | Roadmap evidence | Planning position |
| --- | --- | --- |
| Pilot location | Page 6: Sahakar Nagar and Manyata Tech Park; page 10: Chennai testing | Resolved by user: Bengaluru, India. Use the whole-city map; validate north Bengaluru journeys to AEOS for the reel. Chennai is research inspiration only. |
| Travel mode | Required as an input, but never fixed | Assume driving for the base estimate; two-wheeler is a separate explicit choice. |
| Product name | NightWise title; SafetyFirst in the flow diagram | Use NightWise as the working name. |
| Route count | 2-4 requested; at least two in acceptance criteria | Request alternatives; show whatever is actually returned. Test multi-route acceptance on prevalidated pairs and handle one-route cases honestly. |
| Sampling distance | 150-200 m, 150-250 m, and 200 m appear | Use 200 m as the initial hypothesis, with explicit cost and coverage validation. |
| Score weights | Suggested example, with room for adjustment | Preserve as the starting hypothesis; do not claim calibration. |
| Database and cache | Database deferred; caching proposed | Keep app data transient. Do not assume a persistent Places cache is permitted. |
| Audience, deadline and budget | User: reel/tutorial for at most 10 people; date and budget not supplied | Use two validated AEOS journeys and bounded requests. Estimates remain conditional; no paid resources provisioned. |

The city and audience are confirmed. The user supplied AEOS's place pin at 13.0628268, 77.5940888; exact entrance and origin gates still need local checking. Driving remains provisional. Mode, shoot date, target phone, and billing readiness remain open.

## Findings that change the build order

### 1. Confirm the permitted use of data before building the score

Google's general terms include restrictions on creating content from Maps content, modifying search-result integrity, and caching. A proprietary route score based on extracted Places results and spatial analysis raises a concrete permitted-use question. This review does not establish whether the exact implementation is permitted. Obtain clarification for this use case before committing the live scoring integration. [Google Maps Platform terms, section 3.2.3](https://cloud.google.com/maps-platform/terms).

The service-specific terms explicitly permit certain substantially transformed customer metrics from Places Aggregate counts and define a 30-day count-cache exception. Ordinary Places latitude/longitude has a separate limited cache exception; this does not permit caching whole business records or opening hours. [Service-specific terms, sections 13-14](https://cloud.google.com/maps-platform/terms/maps-service-terms).

Aggregate is an option to evaluate, not an approved replacement: its documented operating-status filter distinguishes operational and closed businesses, not whether a business is open at this hour. It cannot alone satisfy nighttime activity. [Aggregate request parameters](https://developers.google.com/maps/documentation/places-aggregate/request-parameters).

Decision path: clarify the original Places-based design; evaluate an explicitly permitted analytics approach or independently licensed activity data if necessary. Any change that removes open-hours reasoning requires a scope decision. UI design and synthetic scoring specifications can proceed without claiming live-data feasibility.

### 2. The Google Maps handoff must be tested early

Maps URLs accept origin, destination, mode, and limited waypoints, but do not expose a selected Routes API polyline parameter. Consequently, preserving the precise scored route is not guaranteed. Waypoint support varies by platform. [Maps URLs documentation](https://developers.google.com/maps/documentation/urls/get-started).

Test both the fastest and non-default selected corridor on real phones before building the rest of the experience. A few deliberate intermediate points may help, but can introduce stops or change routing. Show a route-preview expectation and the message that Google Maps may update the route. Do not silently open a different corridor while claiming the chosen route was preserved. Exact route preservation, if mandatory, is a feasibility decision rather than a guaranteed v1 capability.

### 3. Alternatives are conditional

The alternatives guide describes up to three alternatives plus the default, and explicitly allows no alternatives. Its count wording differs from parts of the REST reference, which mention up to three computed routes. Neither establishes a minimum of two. The app should accept one to four returned options without assuming the maximum. Alternatives are unavailable with intermediate waypoints in the initial route request. [Alternative routes guide](https://developers.google.com/maps/documentation/routes/alternative-routes) and [REST reference](https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes).

### 4. Activity observations need uncertainty and cost controls

Nearby Search (New) returns at most 20 places per query. Its opening-hours fields trigger Enterprise pricing. These are sampled search results, not a census. [Nearby Search documentation](https://developers.google.com/maps/documentation/places/web-service/nearby-search).

Planning implications: label observed counts; distinguish open, closed, and unknown hours; detect capped results; track failed or unqueried route segments. A failed query is not evidence of an empty street. Do not compare one thoroughly scanned route with another incompletely scanned route as though evidence were equal.

### 5. Road geometry has a useful but limited new option

Google currently offers experimental narrow-road information for driving in India; flyover information supports driving and two-wheelers. This is worth validating for the pilot, but is not a complete main-road classification and is unsuitable as a mandatory dependency. [Flyovers and narrow roads](https://developers.google.com/maps/documentation/routes/flyover-narrow).

Do not infer 'mostly main roads' merely from a road name or missing narrow-road flags. For two-wheelers, the Routes API also has a required beta warning; the choice affects testing and billing. [Two-wheeler routes](https://developers.google.com/maps/documentation/routes/route_two_wheel).

## Proposed architecture

Use one repository with a shared **React + TypeScript frontend packaged by Capacitor for Android and iOS**, plus a separately hosted HTTPS backend. A Vite-built static frontend is the proposed simple fit. The earlier single Next.js frontend/server deployment is superseded: server route handlers cannot run inside an installed mobile bundle. The backend may use a small TypeScript service; keep its provider adapters separate from shared analysis rules. Capacitor supports shared web UI with native SDK access. [Capacitor](https://capacitorjs.com/docs).

The app handles native Google map presentation, destination selection, one-time location permission, route selection and presentation. Use the Capacitor Google Maps and Geolocation plugins, with a browser preview adapter if useful. Test native map layering, polylines, touch interaction, permission denial, Android Back, iOS safe areas and app resume early. The backend validates journeys, retrieves alternatives, gathers permitted evidence, applies the scoring policy and returns a bounded response. Separate pure analysis from provider integrations so geometry, deduplication, missing-data handling and scoring can be verified with synthetic inputs. [Map plugin](https://capacitorjs.com/docs/apis/google-maps), [Geolocation](https://capacitorjs.com/docs/apis/geolocation).

Planned sequence:

1. Resolve origin, destination, travel mode, and current evaluation time.
2. Validate city coverage, input bounds, rate limits, and request budget.
3. Fetch route alternatives and retain the provider's route identifiers and geometry.
4. Sample each route at an initial 200 m interval, including short final sections.
5. Plan nearby queries; reuse equivalent queries within the same analysis when permitted, while preserving route coverage.
6. Deduplicate place IDs within each route and associate evidence with route sections.
7. Determine hours evidence, potential help points, observed activity coverage, and unknown sections.
8. Measure contiguous low-observed-activity sections by distance along the route.
9. Apply a versioned scoring policy using comparable evidence and return explanations.
10. Let the user choose; open the tested Google Maps handoff for that selection.

Steps 4-9 describe the desired analysis and remain conditional on the data-use decision. No database is needed for the basic flow. No LLM is needed for explanations: factual templates can state the measured tradeoff consistently.

Use separate Android, iOS, optional browser and server credentials, each restricted to its platform and APIs. Native map keys are shipped in the app and must not be treated as server secrets. Backend credentials remain only in hosted secret storage. Hosting must support backend requests, HTTPS, timeouts and abuse controls; a static-only host cannot execute the analysis backend. [Google API security guidance](https://developers.google.com/maps/api-security-best-practices).

For ten participants, prepare a signed Android APK and an iOS TestFlight beta. Public app-store publication is outside the shoot milestone. iOS builds require macOS/Xcode or a suitable macOS build service; this Windows workspace cannot run Xcode locally. Apple membership, app signing, external beta review and actual iPhone access are dependencies. No build tools or accounts have been installed/configured. [Build requirements](https://capacitorjs.com/docs/getting-started/environment-setup), [Android distribution](https://developer.android.com/distribute/marketing-tools/alternative-distribution), [TestFlight](https://developer.apple.com/testflight/).

Autocomplete (New) belongs to Places API (New); it is not a separate project API to enable under the roadmap's name. Geocoding is optional if users select places; enable it only for a confirmed free-text address fallback. Preserve attribution and provide suitable Terms/Privacy pages. [Places policies](https://developers.google.com/maps/documentation/places/web-service/policies).

## Scoring specification to validate

Retain the roadmap's proposed weights as a hypothesis:

| Factor | Initial weight | Evidence needed |
| --- | ---: | --- |
| Open establishments | 25 | Observed open places normalized by route length and coverage |
| Main-road coverage | 20 | Reliable road classification; otherwise unavailable |
| Potential staffed/helpful places | 15 | Categories plus available hours; public access remains uncertain |
| Absence of long low-activity stretches | 15 | Contiguous distance along adequately observed sections |
| Route simplicity | 15 | Meaningful maneuvers per kilometre; avoid counting duplicate steps |
| Transport/public activity | 10 | Time-relevant evidence, not merely a station's existence |

Define each component on 0-1 before applying weights. The low-activity component awards fewer points for a longer gap; do not subtract it twice. Keep the available component set identical across routes in a comparison. If a factor is unsupported, omit it from all candidates and visibly describe the reduced model. Any normalization to 100 must use the same denominator for every candidate; never give a route bonus points for missing evidence.

Use the score only within a calibrated, comparable analysis. It is not a probability and should not imply universal comparability between cities or model versions. Keep confidence separate from activity. With inadequate or unequal evidence, suppress the recommendation and score rather than output a reassuring number. A route with no relevant returned places has no observed activity evidence, not proof of actual emptiness.

Compare activity and extra time separately. Preserve the fastest option; do not automatically recommend a large detour for a marginal score difference. Tune a minimum evidence difference and detour limit using the pilot set, then record those constants and the score version. When routes are effectively tied, say so.

For v1, evaluate a journey leaving now. Use local timestamps and available arrival-time information for businesses likely to close during the journey; label uncertainty. A daytime request must not be presented as measured nighttime activity. Future departure times and historical night observations need a separate design.

## API cost model

The following is an illustration of the literal per-sample approach, not a forecast of the final app. Three 10 km routes sampled every 200 m, including endpoints, produce 153 sample locations before any equivalent-query reuse. One opening-hours Nearby Search at each location means 153 Enterprise calls. Separate category queries, retries, or place-detail calls increase that total.

| Nearby Search Enterprise only | Eligible India account | Standard global first paid tier |
| --- | ---: | ---: |
| Published monthly free usage cap | 7,000 calls | 1,000 calls |
| Price per 1,000 calls after that cap | USD 10.50 | USD 35.00 |
| Marginal 153-call comparison after free usage | USD 1.61 | USD 5.36 |
| 100 such comparisons in a month, with full free cap remaining initially | USD 87.15 | USD 500.50 |

Calculated from the published [India pricing](https://developers.google.com/maps/billing-and-pricing/pricing-india) and [global pricing](https://developers.google.com/maps/billing-and-pricing/pricing), checked 9 September 2026. The 100-comparison example uses 15,300 calls and subtracts each applicable free cap once. Other account usage consumes the same allowance. Maps, routing, autocomplete/details, hosting, taxes, and exchange-rate effects are additional. India rates require eligible billing and predominantly Indian usage; user location alone is insufficient. [India billing eligibility](https://developers.google.com/maps/billing-and-pricing/india).

Before live testing: pick a total experiment budget, limit calls per analysis and repeated submissions, record cost-driving request counts, use explicit field masks, and enforce provider quotas plus an application cutoff. A billing alert alone should not be treated as a spending cap. Keep coverage honest if the request budget cannot scan a long route; request a shorter pilot journey or report incomplete evidence. Do not base affordability on unrestricted caching.

## Implementation milestones and time estimate

For the confirmed Android and iOS reel, use **50–80 focused hours, approximately 9–14 working days**, plus external account/review delays. This comprises the 32–52-hour shared app/backend baseline plus 8–12 hours for Android packaging/native checks and 10–16 hours for iOS packaging/native checks. It assumes two validated journeys, one travel mode, an actual phone on each OS and completed design preparation. Full detail is in the research report.

The following original **web-only, broader pilot baseline** is retained for reference and is not the current delivery estimate. Native packaging, Apple membership/build access, signing, and review were excluded from it.

These are focused implementation and validation hours after authorization to code, account access, and the data-use decision. They are planning estimates, not measured throughput or a guaranteed delivery date.

| Milestone | Deliverable and completion evidence | Hours |
| --- | --- | ---: |
| 1. Feasibility and project setup | Confirm provider usage, keys, service access, hosting fit, basic live responses | 4-6 |
| 2. Route flow and early handoff | Origin/destination to real alternatives; non-default route handoff tested | 6-10 |
| 3. Evidence pipeline | Sampling, bounded queries, deduplication, hours states, gap detection | 8-14 |
| 4. Scoring and explanations | Versioned components, uncertainty behavior, factual comparative copy | 4-8 |
| 5. UI implementation | Responsive input/results/detail states and recovery paths | 6-10 |
| 6. Validation and demo polish | 10-20 pilot journeys, phone checks, cost review, 2-3 demo examples | 8-12 |
| Base total | One city, one mode, one visual direction | 36-60 |
| Contingency | Integration fixes and calibration | 8-12 |
| Planning range | Tested pilot/demo | **44-72 hours** |

Allow roughly **7-12 working days**, or about **2-3 calendar weeks**, including review and coordination. An initial end-to-end draft is plausible in **3-5 working days**, subject to live data and handoff quality. External support replies, billing verification, or new data licensing can extend calendar time beyond this range. This is not an estimate for a broad public safety product.

The critical path is permitted data use -> valid live evidence and handoff -> calibrated scoring -> field validation. Visual design can be prepared before those decisions. Do not spend days polishing a recommendation UI before knowing whether the recommended corridor can be opened and supported by data.

## Help needed from the user

1. Confirm travel mode, shoot date, Android/iPhone models and OS versions. Bengaluru, AEOS, both target platforms and at most ten total participants are confirmed.
2. Identify the Google Cloud project/billing owner and approve an experiment and monthly API budget. Later, configure restricted credentials through local or hosting secret settings; do not paste keys into chat.
3. Have the account owner clarify the proposed derived scoring and retention with Google Maps support, or supply an already licensed data source. A draft request is included in the readiness document; it has not been sent.
4. Select the public Manyata gate and Sahakar Nagar starting landmark for the two AEOS journeys. Additional public landmark pairs are optional for the broader pilot; exact home addresses are unnecessary.
5. Review one UI direction and confirm the working name. Budget around 20-30 minutes for that review.
6. Arrange local entrance, route and Google Maps handoff checks on the target phone. Allow 60–90 minutes for the focused rehearsal plus travel as necessary; the broader pilot may take 2–4 hours. The assistant cannot establish real nighttime activity from API listings alone.
7. Supply the backend hosting account/project and privacy/contact details. Identify the Apple Developer account owner and Mac/macOS build-service access. Retain signing keys and certificates under the owner's control. A custom domain and public store launch are optional later milestones.

## Prepared materials and limits

The companion UX specification, validation matrix, and readiness checklist turn the roadmap into reviewable work. The visual concept is illustrative and contains synthetic data. No application code, environment file, package installation, cloud resource, external support message, paid Maps test, or deployment was created in this preparation pass. Live feasibility remains untested until access and the stated decisions are available.

Files: `nightwise-ux-spec.md`, `nightwise-validation-plan.md`, `nightwise-readiness.md`, `nightwise-ui-concept-prompt.md`, and `assets/nightwise-ui-concept.png`, all within the planning folder.
