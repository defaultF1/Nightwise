# Provider use review draft

Status: prepared, not sent. Address to the Google Maps Platform account support channel. No project identifiers or credentials are included here.

We are preparing a small Android route-comparison pilot in North Bengaluru. We display Google Maps and request driving alternatives from Routes API. For a user-initiated journey we sample the returned route, request nearby business categories and current/regular opening hours from Places API, deduplicate IDs within that comparison, and show source-attributed listings. We propose deterministic activity counts, a weighted Night Activity Score and a short explanation comparing alternatives. We do not claim personal safety, infer crime, train models or implement continuous tracking.

Please confirm in writing the permitted design and any required contractual permission for these specific operations under our account agreement:

1. Creating and displaying route-level counts, scheduled-open density, gap estimates and a proprietary weighted score from Places API listings. Which exception, if any, to section 3.2.3(c) covers this? Does processing only during the user session affect the answer?
2. Using Places coordinates to associate listings with a Routes polyline and to enforce a 10 km service boundary. We note the explicit point-in-polygon example in the general terms. Would provider-side Autocomplete locationRestriction plus device/user coordinates for service eligibility be the appropriate design?
3. Comparing a Google Routes polyline with independently licensed OSM road tags to estimate main/internal road share and resolve grade separation. No tracing of Google imagery or alteration of OSM from Google data is planned.
4. Keeping non-reconstructable engineering aggregates for QA, including counts of unknown hours, scan failures and request totals. Which aggregates may be retained and for how long? We have not built a permanent Google shop-hours database.
5. If Places Aggregate is the appropriate product for derived metrics, can its count-derived Customer Values be combined with scheduled-open evidence from a separately licensed source? Does the special permission extend to ordinary Places Details hours, or remain limited to Aggregate POI Counts? We understand operating status is not an open-at-arrival filter.
6. Confirm storage permissions separately for place IDs, coordinates, Google-provided names/addresses, schedules, routes, and customer-entered saved-place labels. We will implement explicit expiry/deletion and attribution where required.

References: [general terms](https://cloud.google.com/maps-platform/terms), [service-specific terms sections 13 and 14](https://cloud.google.com/maps-platform/terms/maps-service-terms), [Places policies](https://developers.google.com/maps/documentation/places/web-service/policies). Please identify any account-specific terms or permissions that supersede these public documents.

This draft is an external dependency for the proposed Google-derived scoring architecture, not a request to enable another API or increase spending.
