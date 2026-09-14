# Nightwise map infrastructure and full-screen map plan

## Decision

Prioritise AEOS–Manyata Tech Park in both directions, then the existing 20 km service circle centred on AEOS. Add a full-screen map control first. Introduce cameras and traffic signals later as optional information about the selected route, with visible source dates. Keep these records separate from the Night Activity Score until there is evidence supporting their use in ranking.

The available sources support a substantial starting inventory, but not a complete or live account of infrastructure. A camera record does not establish that equipment is operational, monitored, facing the road or recording the traveller. An old signal schedule does not establish the current red/green phase. These distinctions determine the interface and the implementation requirements.

The technical assessment and inventory were checked on 14 September 2026. This document distinguishes downloaded research records, proposed features and locally implemented work. No infrastructure records have been added to the production app.

## Scope and geographic boundary

Use the application's existing supplied pins: AEOS at 13.0628268, 77.5940888 and Manyata Tech Park at 13.047697, 77.619939. The initial boundary remains a 20,000 m great-circle radius around AEOS, matching `SERVICE_REGIONS`. This is a product service area, not an administrative definition of North Bengaluru. It includes Manyata. The research also records distance to Manyata so the two radii can be compared without silently changing the backend boundary.

Priority one is the actual Google-returned AEOS–Manyata alternatives and the reverse journey. Priority two is other journeys whose endpoints pass the current regional check. Route geometry can leave an endpoint circle; features should be matched to the complete displayed geometry wherever source coverage exists, and missing coverage should remain visible. Kanpur is a later ingestion region. No Bengaluru record should be relabelled or extrapolated to Kanpur.

The imported research source is geographically restricted. Its camera snapshot uses a Bengaluru administrative boundary; its signal extract uses a rectangular boundary ending at latitude 13.18 N. Our AEOS circle extends farther north. Therefore, the numbers below mean records found in the available source inside the circle, not every camera or signal in that circle.

## Verified source inventory

The source that inspired this work exposes downloadable map datasets in addition to its visual website. Its camera file explicitly identifies ODbL 1.0 and OpenStreetMap attribution. Its signal file also identifies OSM/ODbL provenance. These are useful for a research baseline. A production import should preferably be generated from an independently maintained OSM extract, with a versioned source manifest, rather than depending on another application's asset URL remaining available.[^1][^2]

| Inventory | Downloaded source | Inside AEOS 20 km | Interpretation |
|---|---:|---:|---|
| Surveillance records | 2,818 | 2,722 | Equipment records, not all confirmed cameras |
| Camera/ALPR records tagged public, outdoor or traffic | — | 2,451 | Candidates for review; not verified operating devices |
| Camera records with unclear access/category | — | 143 | Hold for review |
| Non-camera or unspecified equipment | — | 72 | Exclude from camera count |
| Private or indoor records | — | 56 | Exclude from public-road layer |
| Logical signal locations | 579 | 556 | Source clusters; includes crossings and single-road locations |
| OSM signal nodes represented by those locations | — | 1,337 | Not 1,337 independent junctions |
| Signal timing document links | 124 | Not spatially resolved | Citywide document register, not 124 local signals |

The camera snapshot has an OSM base timestamp of 9 September 2026. Among the 2,722 regional records, 552 include a survey/check-date field and 1,814 include a direction field. Presence of either field is not validation of its content. All 2,722 records also fall within 20 km of Manyata; this does not mean the two circles are identical or that records outside the source boundary are absent.[^1]

The signal snapshot's OSM base timestamp is 5 September 2026. None of the 556 regional logical locations is marked verified in that source. Its cluster positions and names are useful candidates, but must not be treated as independently checked junction entrances.[^2]

The reproducible registers accompanying this document are:

- `infrastructure/aeos-20km-camera-records.csv`: all 2,722 regional records, source links, coordinates, timestamps, classification and unknown working status.
- `infrastructure/aeos-20km-signal-records.csv`: all 556 regional signal locations, OSM identifiers and source verification fields.
- `infrastructure/timing-source-register.json`: 124 original document names and download URLs.
- `infrastructure/inventory-summary.json`: counts, filters, source bounds and nearest candidates.
- `prepare-infrastructure-inventory.py`: the filtering and export logic. It reads the downloaded source snapshots from the research staging directory.

These files are a source inventory. They are not a list of verified assets beside today's Google routes. The app must perform route matching before reporting route-specific counts.

## Sources and what each can support

| Source | Useful material | Access and freshness | Implementation decision |
|---|---|---|---|
| OpenStreetMap | Signal nodes, camera tags, road geometry | Open data with attribution and database licence obligations; community coverage varies | Preferred long-term infrastructure source |
| theTraffic camera snapshot | Structured OSM surveillance records | Public dated file; ODbL identified | Research baseline and comparison reference |
| theTraffic signal snapshot | Grouped nodes, road approaches, source IDs | Dated processed OSM file; cluster verification false | Research baseline; review clustering before adopting |
| BTP documents through OpenCity | Named junction diagrams and timing tables | 124 document links retrieved through CKAN; licence not stated in returned metadata | Historical reference; do not activate as live timing |
| Thejesh GN surveillance project | OSM mapping and download guidance | Describes the original community mapping workflow | Source discovery and attribution context |
| Mappls/BTP/Arcadis | Potential live signal information | A 2025 company filing describes a consumer-app integration | Partner enquiry, not an available Nightwise feed |
| Public road-problem reports | Potential pothole/waterlogging context | No authorised, sufficiently current integration established | Defer pending access, moderation and expiry rules |
| Google Routes and Places | Current route alternatives and returned place information | Existing authenticated services, usage caps and product terms | Continue existing pipeline; do not bulk export into OSM inventory |

Thejesh GN documents that surveillance contributions go to OSM and explains retrieval through Overpass. This establishes an independent data-source path; a partnership with theTraffic is not the only way to implement a mapped-camera layer.[^3]

Public Overpass is suitable for bounded research or scheduled extraction, not a fresh citywide request from every phone. The initial direct endpoint request returned HTTP 406 and a second public endpoint timed out. Those failures must not be interpreted as zero infrastructure. This inventory therefore uses the explicitly dated published snapshots. A production refresh path remains to be established and tested.[^4]

## Local signal findings

Two source documents were downloaded, text-extracted and visually checked. The Hebbal sheet contains Hebbal Flyover and Kodigehalli Gate. The Nagavara sheet contains Mariappa/CMR Circle and Nagavara Junction. Both PDFs have creation metadata from March 2010. The portal's November 2025 metadata update is not the signal schedule's effective date.[^5][^6]

For example, the Hebbal table has different cycle lengths across daily windows, while the Nagavara page includes a separate CMR table with a blinking-mode window. These are examples of why parsing the wrong block, approach or day can produce an incorrect result. They are not instructions for today's journey. Neither PDF establishes current operation or an offset needed to compute a countdown.

Initial location candidates near AEOS include Amrutahalli Main Road/Bellary Road, Bellary Road signal records, Hebbal service-road records, Jakkur Road/Arkavathy Layout Main Road and Outer Ring Road records. Their proximity to AEOS is insufficient to say a selected route crosses them. Flyovers and adjacent service roads require a road-level match.

A MapmyIndia stock-exchange filing dated 25 September 2025 describes live signal information for 125+ Bengaluru smart signals in its Mappls app. This is evidence of a possible partnership channel, not evidence that Nightwise can access that feed, that all AEOS–Manyata junctions are covered, or that its API is free. A third-party feed contract, current coverage list and technical access are still required.[^7]

## Feature and requirements register

| ID | Requirement | First release | Completion evidence |
|---|---|---|---|
| MAP-01 | Expand/minimize existing map | Implement locally now | Same map instance and selected route; no new comparison request |
| MAP-02 | Phone layout and dismissal | Implement locally now | Portrait/landscape, theme checks, Escape and Android Back |
| MAP-03 | Preserve map interactions | Implement locally now | Existing route buttons and marker data retained; pan/zoom usable |
| INF-01 | Optional camera layer | Next implementation | Reviewed candidates matched to selected route; source date visible |
| INF-02 | Optional signal layer | Next implementation | Deduplicated physical junctions and crossing-specific matches |
| INF-03 | Marker details | Next implementation | Category, source link, date, distance and unknown operating state |
| INF-04 | Coverage/freshness | Required with layers | Known source footprint; outside coverage cannot display zero as complete |
| INF-05 | Independent source refresh | Required for production | Successful bounded extraction, manifest and rollback tested |
| INF-06 | Native marker capacity | Required with layers | Existing help points remain usable under dense infrastructure data |
| TIM-01 | Historical timing references | Optional research view | Correct block/approach/date and reuse terms reviewed |
| TIM-02 | Live countdown | Deferred dependency | Authorised feed, freshness contract, failure behaviour and field validation |
| REP-01 | Road-problem layer | Deferred dependency | Feed rights, moderation, geometry, expiry and resolution state |
| SCORE-01 | Infrastructure affects score | Not in first release | Separate evidence and validation supporting the weighting |

## How it should appear in Nightwise

In the embedded map header, place a labelled expand icon: **Full screen**. On tap, let the map fill the application's available screen area. The control becomes **Minimize map**. Keep the selected route and route choices; collapse lengthy place-count prose while expanded. Keep endpoint labels compact and preserve provider attribution. Do not put a second full-screen control over the Google logo or marker details.

The full-screen view should reserve most of its height for the map. A horizontal route-choice row can scroll when three or four choices exceed the screen width. The map itself must remain interactive. On web, direct pan/zoom is appropriate while expanded; embedded maps can retain cooperative gestures so scrolling the page remains possible. The offline tutorial can expand its existing street diagram without making a map request. It remains an offline diagram rather than becoming a live navigation view.

For the later infrastructure feature, add a **Map layers** control with three straightforward groups: **Open places**, **Mapped cameras** and **Traffic signals**. Keep open places enabled initially and the two new layers off, so the current experience is not flooded with markers. Camera and signal icons must have distinct shapes, not just new colours that conflict with hospitals, pharmacies and fuel stations.

A camera detail card should say **Mapped camera**, then show the source's category and last survey date if one is present. Otherwise show the snapshot date and **Working status not verified**. An unnamed feature can be labelled **Camera near this route** rather than inventing a shop or junction name. An available direction tag may be displayed as text; a triangular cone would imply a field of view that the data does not establish.

A signal card should say **Mapped traffic signal** and name the junction if reliable. Do not display red/amber/green state without a live source. A route summary can say **Mapped cameras near this route: N** and **Mapped signal locations: N** once matching is implemented. Until physical junction deduplication is validated, avoid promising that the second number equals stops or independent intersections.

When coverage is missing, say **Infrastructure data unavailable for part of this route**. When a complete source query returns no matching records, say **No mapped records found near this route**. Neither message means a road has no cameras or signals. Infrastructure counts do not replace the existing opening-hours information.

## Data contract and route matching

Create a separate infrastructure schema containing `id`, `kind`, `latitude`, `longitude`, `sourceId`, `sourceUrl`, `sourceUpdatedAt`, `retrievedAt`, `snapshotVersion`, `licence`, `reviewState` and `coverageId`. Optional fields include direction, equipment type, survey date and associated road IDs. Keep `operationalStatus` unknown unless a source explicitly verifies it. Do not turn an OSM edit date into a field-verification date.

Use OSM type plus ID as a stable identity. Deduplicate overlapping spatial tiles by that identity. For signals, retain raw node IDs even if grouped into a junction record. Avoid collapsing unrelated nearby signals merely because their coordinates are close. The existing route geometry helpers can propose nearby candidates; a separate matcher must evaluate road association and grade separation.

For the pilot, start with a 50 m camera-candidate corridor and a 30 m signal-candidate corridor around the displayed polyline. These are proposed retrieval thresholds, not validated visibility ranges. Review sensitivity at 25/50/100 m. Signals should additionally match the approached road or crossing; a signal beneath the Hebbal flyover must not be counted as a stop on the flyover. Cameras across walls, inside compounds or on parallel streets cannot be assumed to cover the route.

Compute route candidates once for the alternatives already returned by Google. Do not generate extra Google routes to discover infrastructure. Keep results keyed by route geometry, mode and snapshot version. Selecting another displayed alternative selects its existing matched subset. Reversing the journey requires directional matching again, even when the nearby camera inventory overlaps.

For the first trial, maintain a reviewed corridor overlay for AEOS–Manyata and the reverse journey. Store explicit inclusions/exclusions with a reason, source and review date. This narrows the initial validation task without presenting a citywide automated match as complete. A location on a map should never become an assertion of active surveillance merely because a reviewer accepted its position.

## Architecture and operating cost

Separate infrastructure ingestion from the paid live-comparison path. A maintenance command should fetch the bounded OSM area, validate the response, filter categories, produce spatial tiles and write a manifest containing extraction time, extent, record counts and checksum. Do not update the active version on a partial response, timeout or suspiciously large record-count drop. Keep the last good version for rollback.

Serve only the route corridor or visible infrastructure tiles from the backend. Use conditional requests and a version identifier so changing layers or expanding the map can reuse already downloaded records. A proposed daily check and weekly replacement is sufficient for a first static infrastructure pilot, subject to source update frequency. It must not be presented as a live refresh interval.

The existing five-minute journey reuse policy and infrastructure versions serve different purposes. Static signal locations do not need a new Google request every five minutes. Google content has its own storage restrictions; a short duration alone does not establish permission to cache all Places content. Keep the OSM inventory separate and check service-specific allowed storage before expanding any Google cache.[^8]

Full-screen expansion should create zero additional Routes, Nearby or Details calls. It should reuse the mounted map, not create a second Google map instance. Map display and tile activity remain governed by the provider's SDK behaviour; this is not a promise that every type of map usage is free. Public OSM data access does not eliminate hosting or maintenance cost.

The first infrastructure release should impose a visible-marker budget separate from the 60 existing place pins. Prefer clustering for dense records and retain all eligible records in a list, with the displayed count distinguished from the total matched count. Native Android and the browser need equivalent behaviour. Route switching must remove old layer markers before inserting the new subset, without removing endpoint or help markers.

## Full-screen implementation

The local implementation expands the existing `LiveMap` or `RouteDiagram` element. It does not move the map to a newly mounted component. A shared hook temporarily makes background siblings inert and invisible, locks background scrolling, removes ancestor clipping and restores those properties on minimize. Focus stays within the expanded view; Escape minimizes before the parent sheet handles it. The application's existing Android Back listener checks for an expanded map first.

The CSS uses the dynamic viewport height, safe-area padding and a flexible central map area. In landscape, secondary legend text can be hidden to preserve map space. There is no animated map-size interpolation because the native map and WebView must agree on geometry during layout changes. Existing native viewport and nested-scroll synchronisation remain in use.

Android renders its Google map beneath the WebView, which is why replacing this with an opaque browser modal can make the map disappear. The provider documentation explains this transparency requirement. Google's browser control documentation confirms the familiar full-screen affordance; using a shared app control keeps it consistent with the native implementation. Modal keyboard behaviour follows the WAI interaction pattern.[^9][^10][^11]

## Validation and release sequence

First, validate the full-screen change with mocked provider data: small portrait screens, landscape, all three themes, open and failed map states, repeated expand/minimize, route selection, keyboard focus, parent-sheet preservation and no additional comparison calls. Mocked checks prove application behaviour, not Google rendering or Android compositor behaviour.

Second, test a physical Android phone: expand a loaded map, drag and zoom, tap a pharmacy/hospital marker, switch alternatives, rotate, press Back once, scroll after minimizing, open the endpoint preview, and repeat with a slow connection. Capture whether the same map remains visible and whether safe-area controls can be reached. Real-phone validation remains required before packaging the new control as verified.

Third, implement infrastructure ingestion and the reviewed AEOS–Manyata subset. Validate stable IDs, exclusions, source bounds, nearby-but-off-road cases, flyover/service-road separation and dataset rollback. Verify no unknown camera gets a working-status assertion and no stale signal sheet drives a countdown. Keep infrastructure flags off until these checks pass.

Fourth, add layer toggles and marker cards, then validate both native and web marker behaviour. Only after the corridor pilot passes should the rest of the 20 km area be enabled. Kanpur follows through the same ingestion contract with its own measured coverage; it is not a condition for the Bengaluru pilot.

| Milestone | Dependency | Exit condition |
|---|---|---|
| Full-screen control | Existing map component | Browser checks plus physical-phone validation |
| Research baseline | Public snapshots and source documents | Registers and provenance captured; complete |
| Production infrastructure source | Reliable extract and licence/attribution packaging | Bounded refresh succeeds; failures preserve last version |
| AEOS–Manyata layers | Road-level matching and reviewed records | Both directions render correct candidates |
| Wider 20 km coverage | Full source footprint and matching checks | Gaps explicit; no false complete-coverage claim |
| Live signal timers | External access agreement and current feed | Approach, state, timestamp, freshness and failure handling verified |

## Remaining decisions and limits

There is enough information to build the full-screen control and prototype static infrastructure layers. There is not enough to claim live CCTV operation, complete regional coverage, current signal countdowns, or safer routes from camera counts. Those gaps are explicit product boundaries, not reasons to block the expandable map.

Before production ingestion, preserve the ODbL attribution and database obligations, verify any processed-data reuse terms, and avoid treating the website's UI code as licensed merely because its OSM datasets are open. The OpenCity response did not state a licence for the timing documents; retain source links as research references until reuse is clarified. No enquiry has been sent to a third party.[^12]

Recommended next implementation: reviewed static camera and signal layers for AEOS–Manyata, after physical testing of full screen. Keep current Google time estimates and Night Activity Score logic. The separate free-text geocoding fallback discussed earlier remains a distinct task and is not solved by infrastructure records.

## Sources

[^1]: theTraffic, [Surveillance camera snapshot](https://www.thetraffic.in/data/surveillance_cameras.v1.json), OSM base 9 September 2026; retrieved 14 September 2026. Counts in this report are independently filtered from this file. The dataset declares ODbL 1.0 and credits OpenStreetMap contributors and Thejesh GN's project.
[^2]: theTraffic, [Signal intersection snapshot](https://www.thetraffic.in/data/intersections.v1.json), OSM base 5 September 2026; generated 7 September 2026. Location counts are filtered from this file. See also [methodology](https://www.thetraffic.in/methodology).
[^3]: Thejesh GN, [Surveillance in Bengaluru](https://thejeshgn.com/projects/surveillance-in-bengaluru/) and [How to Download Surveillance in Bengaluru Data](https://thejeshgn.com/2022/05/30/how-to-download-surveillance-in-bengaluru-data/), 30 May 2022; accessed 14 September 2026.
[^4]: Overpass API maintainers, [Commons and public service usage](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html); accessed 14 September 2026. Endpoint errors described above were observed during this assessment.
[^5]: Bengaluru Traffic Police via OpenCity, [Hebbal Flyover and Kodigehalli Gate timing sheet](https://data.opencity.in/dataset/f1146fbc-5208-4991-ac0b-8c1371fc567c/resource/176f9707-2ff1-4de8-8b51-676a535be214/download/743ca31f-fa3f-4ed8-a8a3-9467154c38e0.pdf), printed page 60; PDF metadata March 2010. [Dataset metadata API](https://data.opencity.in/api/3/action/package_show?id=bengaluru-city-traffic-signal-data) supplied the 124-resource register.
[^6]: Bengaluru Traffic Police via OpenCity, [Mariappa Circle and Nagavara Junction timing sheet](https://data.opencity.in/dataset/f1146fbc-5208-4991-ac0b-8c1371fc567c/resource/55f66eee-0f35-4aa0-86a6-a8791b410aae/download/39a8a5a4-fab7-4815-a528-a6878e070637.pdf), printed page 30; PDF metadata March 2010.
[^7]: C.E. Info Systems / MapmyIndia, [Mappls live traffic signal announcement](https://nsearchives.nseindia.com/corporate/MAPMYINDIA_25092025094753_Press_Release_25_Sept_2025.pdf), 25 September 2025, PDF pages 2–3. Historical product announcement; not a verified third-party API entitlement.
[^8]: Google, [Places API policies and attributions](https://developers.google.com/maps/documentation/places/web-service/policies); accessed 14 September 2026.
[^9]: Capacitor, [Google Maps plugin documentation](https://capacitorjs.com/docs/apis/google-maps); accessed 14 September 2026. Local package version is 8.0.1.
[^10]: Google, [Maps JavaScript controls](https://developers.google.com/maps/documentation/javascript/controls); accessed 14 September 2026.
[^11]: W3C WAI, [Modal dialog interaction pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/); accessed 14 September 2026.
[^12]: OpenStreetMap Foundation, [Copyright and licence](https://www.openstreetmap.org/copyright); accessed 14 September 2026. Consult the linked ODbL text and attribution guidance for distribution requirements.
