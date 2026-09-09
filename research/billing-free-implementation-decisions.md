# NightWise search and road evidence decisions

Checked 9 September 2026. This note records engineering choices that can be implemented without Google billing. No new Google API requests were made for this work.

## Destination search

The supplied AEOS and Manyata pins support immediate local filtering, including common spelling variants. Wider search uses an explicit Search Bengaluru action, not a paid request for every keystroke. The server uses Autocomplete New with an India region and Bengaluru rectangle, then resolves the selected ID through Place Details New. The selected coordinate is checked again against the app bounds. We request only the fields needed for suggestions and coordinates; the application does not separately need Geocoding for that selection flow. Both providers remain paused locally.

Each search session uses a fresh UUID, permits at most six suggestion calls, expires after five minutes and can resolve only an ID actually offered by that session. Place Details consumes the session. Global counts persist across restarts. Autocomplete has a 40-attempt pilot limit and Details has a 20-attempt limit, separate from route and nearby counts. These are request controls, not a promise about the bill. Google session pricing depends on how the session terminates and the fields requested. [Autocomplete documentation](https://developers.google.com/maps/documentation/places/web-service/place-autocomplete), [Place Details](https://developers.google.com/maps/documentation/places/web-service/place-details), [Session pricing](https://developers.google.com/maps/documentation/places/web-service/session-pricing).

Public Nominatim was considered and not integrated. Its public-service policy disallows autocomplete and specifies additional application and rate constraints. The app therefore does not silently substitute that public endpoint for paid Google search. [Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/).

## Road classification

A single Overpass query downloaded road ways inside the declared North Bengaluru rectangle. The raw response, query and provenance are stored locally and shipped with the source. No per-route request is sent to Overpass, and no Google geometry is added to the OSM extract. This supports the user's office corridor while leaving the map's wider Bengaluru coverage independent. [Overpass documentation](https://wiki.openstreetmap.org/wiki/Overpass_API), [OSM attribution and licence](https://www.openstreetmap.org/copyright).

The model interprets highway tags rather than guessing from road names: motorway, trunk, primary, secondary, tertiary and links are the main-road group; residential, living_street and service are the internal-road group. “Unclassified” is not assumed to mean an internal lane. These are project-specific modelling categories, not OSM safety categories. [OSM highway tags](https://wiki.openstreetmap.org/wiki/Key:highway).

Route geometry is examined in intervals no longer than 40 metres. Candidate segments must be within 15 metres and align within 25 degrees. Conflicting classes on similarly close parallel ways, bridges, tunnels and non-zero layers remain unknown. Main/internal/unknown lengths use the same geometric denominator. At least 95 percent classified coverage is required before offering a main-road fraction to the scoring engine. This threshold is a conservative engineering starting point, not a measured accuracy claim. A synthetic test suite checks missing coverage, parallel roads and grade separation. An OSM-geometry smoke check only tests file loading and self-consistency; it is not independent field validation or a Google-route test.

## Remaining evidence decisions

Live activity scoring remains disabled. Google Places listings do not verify staffing, illumination or actual access. Missing hours must not be converted to confirmed closure; incomplete scans must not create apparently empty stretches. The original provider-use question about derived scoring remains unresolved: the implementation review is not a legal clearance. Google content stays in memory and is not exported to the OSM data or source package. [Maps terms](https://cloud.google.com/maps-platform/terms), [Service-specific terms](https://cloud.google.com/maps-platform/terms/maps-service-terms), [Places attribution policy](https://developers.google.com/maps/documentation/places/web-service/policies).

The next live evidence pass must compare the actual provider paths against the road extract, check real opening-hour completeness, measure queries and latency, and confirm that any proposed activity recommendation makes sense around the selected public gates. The user has deferred both billing and physical-phone testing; neither is represented as complete.
