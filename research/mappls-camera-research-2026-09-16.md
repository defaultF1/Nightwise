# Mappls camera and road-alert research

Update: the user has chosen camera evidence as a Safety Score component. See [the current implementation and hosting status](safety-score-and-hosting-2026-09-16.md). Live camera access remains unconfirmed.

Checked in the user's Edge browser on 16 September 2026, following review of the account's actual allocations.

See the [expanded traffic-camera research and credential mapping](mappls-traffic-cameras-deep-dive-2026-09-16.md) for the freemium access matrix, Report Category Master and integrated Directions Plugin example.

## Confirmed developer feature

The official [Navigation SDK product page](https://about.mappls.com/api/navigation-sdk/) explicitly describes automated alerts for upcoming traffic cameras, potholes and traffic hazards. This establishes a developer-facing traffic-camera feature; the previous research should not be interpreted as saying Mappls has no camera capability.

It does not establish a general surveillance-CCTV inventory, camera working status, live video access, speed-breaker coverage in our pilot area or entitlement under our current account.

## APIs worth enabling and evaluating

- [Android 2.0.2 Nearby Reports](https://developer.mappls.com/documentation/sdk/android/docs/v2.0.2/Nearby-Report/): bounds-based report retrieval using `MapplsNearbyReport`, with report ID, creation timestamp, coordinates and category. Could support a viewport layer if the required camera/hazard categories are available.
- [Android 2.0.2 Route Report Summary](https://developer.mappls.com/documentation/sdk/android/docs/v2.0.2/Route-Report-Summary/): `MapplsRouteSummary` accepts a route ID and optional `routeIdx`, category IDs and node. `routeIdx` limits reports to a selected route. Records include category IDs/names, coordinates, description, expiry and report icons. Published/unpublished is report publication status, not equipment operational status.

The docs do not enumerate the exact CCTV/traffic-camera/speed-breaker category IDs. Do not invent these or assume all reports are verified infrastructure.

## Account observations

Additional official web integration: [Route Events Summary plugin](https://developer.mappls.com/documentation/sdk/Web/Mappls%20Web%20Plugins/routesummary/readme/) loads `libraries=routesummary` with the normal static `access_token` and exposes `mappls.routeSummary({map, routeId, index, categories}, callback)`. The documentation requires appropriate account access; it does not establish a separately issued camera key. Our Cloud route sample did not include the required route ID, so request the correct routing/report entitlement and route-ID response option from support. Do not substitute our local route ID or infer a valid provider route ID.

The Android app has Mobile Maps SDK and Intouch SDK allocations; Navigation SDK was not listed. No explicitly named Nearby Reports or Route Report Summary allocation appeared in the reviewed Android/Cloud lists. This is an entitlement uncertainty, not proof that a request would fail. No paid entitlement was purchased and no report endpoint was called during this research.

## Integration proposal

1. Ask Mappls to identify and provision Navigation SDK road alerts, Nearby Reports and Route Report Summary as appropriate. Request exact camera and speed-breaker categories and sample data around AEOS–Manyata, within the approximately 20 km priority area.
2. Prefer route-index-filtered reports for displayed routes. Fetch nearby reports only for the visible map area when a road-alert layer is enabled; avoid an indiscriminate city scan.
3. Render separate Traffic cameras and Road hazards layers. Use CCTV only when the source explicitly labels a record as CCTV. Keep source timestamps and report expiry; never imply a camera is working based solely on a marker.
4. Keep the current external-navigation flow. Obtain report data access independently if possible rather than adding full embedded navigation solely to obtain markers.
5. Cache briefly only within agreed terms, deduplicate report IDs and discard expired records. The user has approved camera evidence as a Safety Score component; connect only validated, route-associated records to the prepared calculation.

## Specific support request

Please enable or quote Navigation SDK traffic-camera/road-hazard alerts and the Nearby Reports / Route Report Summary APIs for NightWise. We want the traffic-camera, CCTV (if distinct) and speed-breaker markers shown in the Mappls consumer app, primarily around AEOS and Manyata Tech Park in North Bengaluru. Please provide category IDs, update/verification timestamps, sample responses, pricing and permission to display these reports as custom map layers before starting navigation. Confirm whether our current Mobile Maps SDK allocation covers this data or requires separate entitlements. We are not requesting private live CCTV video feeds.

This request has been prepared only; it has not been sent.
