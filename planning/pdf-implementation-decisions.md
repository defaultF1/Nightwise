# PDF implementation decisions

Updated 10 September 2026. This records implementation choices for the roadmap, not evidence that real Bengaluru routes have been validated.

## Activity and help evidence

Sample route geometry every 200 m and search within 150 m, up to the comparison query cap. Deduplicate by place ID within each route and retain sample associations. The provisional low-activity threshold is fewer than two confirmed-open listings near a sample. Unknown searches and uncertain hours stay unknown. Adjacent samples estimate intervening distance; this is not a survey of the whole street.

The staffed-place output is explicitly a proxy: distinct open listings in cafe, restaurant, store, convenience store, supermarket, petrol pump, hospital, police, pharmacy and hotel categories. It does not claim actual staff presence. Transport listings remain a separate signal and do not establish service frequency or people present.

Help points include open petrol pumps, hospitals, police, pharmacies and hotels. The longest help gap measures contiguous intervals with no listed open help point at either boundary. Unknown intervals split the gap and prevent a whole-route claim. A cafe can keep activity high while the help gap remains long.

## Scoring version three

Retain the PDF's six weights: open density 25, main roads 20, help evidence 15, activity continuity 15, simplicity 15 and transport 10. Counts are normalized by route length. Help evidence combines normalized help density at 75% and staffed-category density at 25%, then applies up to a 50% reduction as the longest help gap reaches 2 km. Those choices are provisional and need field calibration.

Main-road share penalizes internal-road exposure within its existing weight. Simplicity uses total turns per kilometre plus an additional penalty for turns estimated to enter internal roads. The classifier checks the beginning of the provider step geometry against the local OSM road extract. Ambiguous, missing or grade-separated matches stay unknown. The additional turn adjustment is used only when available for every candidate route. Missing signals are not filled with zero; comparable weights are rescaled and disclosed.

Rank all scored alternatives by descending score, then duration and ID for deterministic ties. Show the recommended route first, with the activity rank visible. Preserve the existing minimum advantage and maximum detour gates; travel time affects the recommendation decision rather than adding a seventh score component. Unknown or soon-closing evidence can withhold a recommendation entirely.

## Map and provider boundaries

Retain step distances, maneuvers and available step polylines. Group contiguous low-activity segments and label up to the three longest. Web maps show text labels; native markers expose titles and explanations when tapped. This rendering still needs live native map validation.

The full Bengaluru map is supported when enabled. The local OSM evidence remains North Bengaluru only. The supplied AEOS to Manyata pins are the tutorial; no claim is made that their public gates or selected live corridors are validated. Google Maps can recalculate the handed-off route.

## Deliberate roadmap adaptations

General caching of Places content is not implemented. Google's current Places policy restricts caching outside stated exceptions; place IDs are exempt. The existing comparison-level exact-query deduplication, limits and explicit requests reduce usage without a general results cache. Do not interpret this as permission to cache opening hours. Source checked 10 September 2026: https://developers.google.com/maps/documentation/places/web-service/policies

Standalone Geocoding remains optional, as stated in the PDF. The implemented path requires choosing a place-search result or supplying valid coordinates. Do not add another paid service solely to satisfy a setup list when the product flow does not need it.

The PDF's Chennai test examples are replaced by Bengaluru under the user's instructions. Database, community reporting, continuous tracking, lighting/crime scores and full navigation remain outside the MVP.

## Deferred by the user

No GitHub push or hosting now. Keep the deployment recipe local. Keep the seven proposed enhancements for later: expanded journey selection and swap, explicit endpoint confirmation, standalone confidence indicator, interactive help-point map, extra-time preference, saved places and a dedicated freshness control. Existing related capabilities and the PDF-required help-gap metric remain in scope.

## After billing

Confirm billing, then restart and enable only the service under test. Check one Routes request, embedded maps, one explicit search and a capped activity comparison in stages. Keep experimental scoring off until provider-use review and local calibration are resolved. Review both keys' application restrictions and the server key's outbound IP at the actual deployment location.

Validate 10–20 Bengaluru journeys, including AEOS–Manyata in both directions, metro-to-home, commercial-to-residential and internal-road versus main-road examples after dark. Check hours coverage, exact entrances, actual alternatives, low-activity thresholds and handoff route changes. Select two or three reel journeys only after those observations. Record real outcomes; sample results cannot substitute for this work.
