# CCTV and map layers: bounded recheck and implementation plan

Status: planning only. No app changes, deployment, paid Google requests or APK build in this recheck.

## Data checked on 15 September 2026

- The X post could not be fetched directly (403). Rechecked the public data files from theTraffic identified in the earlier research.
- Camera source: https://www.thetraffic.in/data/surveillance_cameras.v1.json. Successfully fetched again. OSM base remains 9 September 2026 at 04:20:20 UTC; 2,818 surveillance records. This is the same published snapshot version as the previous research, not a new camera survey.
- Signal source: https://www.thetraffic.in/data/intersections.v1.json. Successfully fetched again. OSM base remains 5 September 2026 at 07:43:36 UTC; 579 logical signal locations, generated 7 September. These have no confirmed live signal phase or countdown.
- Existing spatial inventory from these versions: 2,722 surveillance records within 20 km of AEOS, also within 20 km of Manyata. Of these, 2,451 are camera/ALPR candidates tagged public, outdoor or traffic; 143 need access review; 72 non-camera/unspecified and 56 private/indoor records were excluded. These are regional inventory counts, not cameras on one journey or verified operating cameras.
- Existing signal inventory: 556 logical signal locations within the AEOS circle. Upstream signal bounds cut off part of the circle, so this is incomplete geographic coverage.
- Community source: https://thejeshgn.com/projects/surveillance-in-bengaluru/ describes OpenStreetMap/Overpass extraction. Its linked Safe City tender locations include proposed equipment and must not be treated as confirmed installations.
- Primary direct Overpass refresh returned HTTP 406; the alternate Kumi endpoint timed out after 25 seconds. No newer direct extract was obtained. A failed refresh must retain the previous dated snapshot; retrieval time must never replace the source date.

## First release: AEOS–Manyata and surrounding 20 km

1. Prepare a versioned infrastructure file with stable OSM IDs, coordinates, equipment/access tags, original edit/survey dates, source date, attribution and `workingStatus: unknown`. Exclude private/indoor and non-camera entries. Keep uncertain access records out of the default layer. Use the existing AEOS service circle first; filling the complete union of both 20 km circles needs an additional source extraction.
2. Add a Layers button beside Full screen / Minimise in both embedded and expanded live maps. Options: Shops, Pharmacies, Hospitals, Petrol/CNG, Mapped CCTV and Traffic signals. Preserve current place-layer defaults; start CCTV/signals off to avoid clutter. Save preferences on the device.
3. Use teal camera icons and orange signal icons, distinct shapes as well as colours. At low zoom, cluster infrastructure points; at close zoom show individual icons. Keep selected route and endpoint pins above overlays. Layer toggles must update overlays on the existing map instance without fetching routes or shops again.
4. Scope the default view to the selected route. Provide an explicit Nearby area view for exploring the surrounding map. Start with a 50 m camera and 30 m signal candidate distance, then check road association, direction, bridge/layer and parallel service-road ambiguity. These distances find nearby candidates; they do not represent camera viewing range. Ambiguous points can appear as nearby but must not inflate route-associated totals.
5. A camera card says Mapped CCTV, location/type, source date, and Working status not verified. Show operator/direction only if supplied; no fabricated viewing cones. Signal cards show mapped junction information, with no live colour or countdown. Route summaries say mapped CCTV locations near this route, never CCTV coverage percentage.
6. Keep infrastructure separate from the Night Activity Score for this first release. Camera presence does not establish operation, visibility or lower risk. Missing camera records do not establish absence.

## Delivery and cost

Serve versioned public infrastructure assets from our own hosting, with a small manifest and device caching. A future daily source check can publish a new validated version; source failures retain the last good version with its original date. This is a proposed refresh policy, not an automation created by this task. Do not query Overpass on every journey or send these overlays to Google Places. Existing Google map/route usage and hosting bandwidth still apply. Upstash can remain dedicated to current counters/feedback; it is not necessary for a small static camera dataset.

Preserve OpenStreetMap attribution and the source's ODbL notice with the distributed infrastructure data. Credit theTraffic and the community mapping source. Camera map locations are not video-feed access.

## Implementation sequence and acceptance

- Data schema, filtering, version manifest and malformed-data rejection first.
- Shared layer state and separate infrastructure overlay methods in the web/Android map adapter; avoid rebuilding routes when toggling a layer.
- Layers panel, marker details, clustering and selected-route filtering next.
- Validate AEOS to Manyata and reverse; camera IDs/counts must not duplicate when routes share roads.
- Check private-tag exclusion, flyover/service-road ambiguity, source failure/offline reuse, and missing date/status handling.
- Test small Android screens, light/dark themes, full-screen transitions, Back button, marker taps and rapid layer toggles. Confirm no extra Google Routes/Places calls on layer switches.
- Recheck on a physical phone before an APK release. Kanpur comes later with a separately checked dataset; do not reuse Bengaluru inventory there.
