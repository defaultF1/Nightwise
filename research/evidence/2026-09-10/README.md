# North Bengaluru evidence collection — 10 September 2026

Status: **research checkpoint; live scoring and roadmap acceptance remain incomplete.** This package contains newly collected public evidence. It does not change the APK, hosted service, Google request allowances or live score switch.

## Completed desk research follow-up

The [remaining deliverables report](../../2026-09-10_remaining-deliverables-research.md) covers all PDF workstreams and agreed additions. This phase adds research results and execution specifications, not new Google scans or verified street observations.

- [Source register](source-register.json): 32 numbered entries with direct source URLs and local evidence references.
- [OSM parser audit](osm-hours-parser-audit.json): 632 expressions parsed, 39 failed, ten parsed with warnings; India holiday rules are unresolved.
- [Method experiments](method-experiments.json): covering query subdivision, a naive shrink gap, and explicitly synthetic gap/score intervals.
- [Area candidates](service-area-candidates.json): supplied/independent coordinates and AEOS distances; all entrances remain unverified.
- [Provider clarification draft](provider-review-draft.md): six concrete questions, not sent.
- [Field validation protocol](field-validation-protocol.md): eight calibration and eight held-out cases, all unrun.
- [Requirement traceability](requirement-traceability.md): every original module and all seven agreed enhancements mapped to research and remaining checks.

Research scripts are isolated under `tmp/evidence-lab`; application dependencies were not changed. The public hosted endpoint does not expose the proposed experiment variants. Future Google experiments must use the shared Redis counter and preserve existing caps; do not run a local provider key against an independent file ledger.

## Hosted verification follow-up — 13:22 IST

After the user supplied the existing access code, one authenticated AEOS–Manyata comparison succeeded through Render and the shared Redis budget (HTTP 200). The code was saved only in the ignored local environment file; it is absent from this evidence package. Provider route/listing payloads were processed in memory; aggregate results are in [hosted-comparison.json](hosted-comparison.json).

| Route | Distance | Duration at check | Known hours | Complete scan coverage | Classified road distance |
| --- | --- | --- | --- | --- | --- |
| Fastest | 4.795 km | 17.2 min | 63.5% | 50.0% | 90.0% |
| Alternative 1 | 5.381 km | 17.9 min | 69.3% | 51.7% | 83.6% |
| Alternative 2 | 6.091 km | 21.4 min | 60.2% | 73.8% | 76.2% |

The response contained 303/305/220 geometry points, 230/254/201 listings, and 84/78/80 unknown-hour listings respectively. All unknown-hour reasons reported missing usable opening/closing times. Regular fallback count and special-date listing count were zero; this does not establish that holidays never affect those businesses. Zero live scores were returned, as configured.

Activity-assessed distance was 87.5/85.2/73.8% at this daytime check. This is not a demonstrated pipeline improvement over the earlier morning result: different passing times change how many places are scheduled open, and route labels/order can change. These figures cannot be presented as night-time acceptance.

The enlarged OSM extract was filtered into research corridor subsets that fit the existing road loader's limits. Re-running the same road classifier against the same in-memory provider paths gave **exactly the same coverage** as the hosted dataset on all three routes. The larger file helps extend geographic scope but did not resolve missing road classifications here. Grade separation, ambiguity and unmatched geometry need separate diagnosis; the result does not identify their individual contributions. The full expanded extract exceeds the current production loader's size and element limits and must not be installed wholesale.

Proximity review found **1/2/1 operator records** and **18/26/5 OSM hours elements** within 100 m of the three route polylines. These overlap across routes and are not confirmed new shops. They have not been merged into Google results or used to raise route scores. See [hosted-route-evidence-audit.json](hosted-route-evidence-audit.json). Actual entrances, divided-road access, indoor visibility and source identity still need reconciliation.

Returned cumulative allowance: **18 Routes / 753 nearby / 2 autocomplete / 2 details**, with limits 30/1500/40/20. This leaves 12 Routes and 747 nearby at that snapshot. One hosted comparison was initiated in this follow-up; no atomic before-snapshot exists, so its exact nearby-request delta is not claimed. These are counters, not charges; user testing can change them. No automatic retry, budget increase, deployment or score enablement occurred.

## What was collected

| Collection | Result | Meaning |
| --- | --- | --- |
| Business operator websites | 21 distinct location records | 14 have a clear regular daily schedule and one published coordinate; 6 have ambiguous time formatting; 1 hospital has conflicting coordinates |
| OpenStreetMap opening hours | 671 mapped elements in a 10 km search around supplied AEOS pin | Candidate schedules, not 671 confirmed distinct/open roadside businesses |
| Explicit OSM hours verification dates | 4 of 671 | Dates are 2023-08-20, 2024-09-09, 2026-05-07 and 2026-06-25; none establishes verification today |
| Indoor/floor-tagged OSM elements | 143 | Need access and street-visibility checks; absence of indoor tags does not establish outdoor access |
| Possible OSM duplicate pairs | 11 | Same normalized name within 100 m; candidates only, not automatically merged |
| Expanded OSM road/path extract | 58,613 ways; 280,746 geometry points | Successful complete query response for the 10 km area; not integrated or field verified |
| Initial public collection Google requests / field visits | 0 / 0 | Hosted follow-up is recorded separately above; no field visit occurred |

The geographic search is a **10 km radius around AEOS (13.0628268, 77.5940888)**. It is not yet an accepted service-boundary implementation, a road-distance limit, or a survey of every lane. The actual Manyata gate and Sahakar Nagar journey entrance remain to be confirmed. Every listed coordinate is a published point, not a verified public entrance.

The OSM category breakdown includes 156 restaurants, 36 fast-food entries, 27 cafés, 9 pharmacies, 8 hospitals and 8 fuel entries. Category totals do not establish reachable help availability. Full counts and extraction quality metrics are in [summary.json](summary.json).

## Concrete schedule examples

These are published regular hours retrieved on 10 September, **not observations that a shop was open at that time**. Holiday exceptions were not confirmed. The Apollo Sahakara and Hegde source pages also contain nearby branch cards; those cards were deduplicated when transcribing the register.

| Location | Published daily hours, IST | Source |
| --- | --- | --- |
| Apollo Sahakara Nagar | 09:00–23:00 | [Apollo operator page](https://www.apollopharmacy.in/medical-stores/bangalore/apollo_pharmacy_sahakara_nagar-14597) |
| Apollo RK Hegde Nagar | 09:00–23:00 | [Apollo operator page](https://www.apollopharmacy.in/medical-stores/bengaluru/apollo_pharmacy_rk_hegde_nagar_bangalore-18448) |
| Third Wave Coffee, Sahakar Nagar | 08:00–23:59 | [Operator page](https://stores.thirdwavecoffeeroasters.com/store-pages/third-wave-coffee-sahakar-nagar-bengaluru) |
| IndianOil Seagull Petro Park | 06:00–22:00 | [Operator locator](https://locator.iocl.com/indianoil-seagull-petro-park-ioc-dealer-petrol-pump-kanaka-nagar-bengaluru-183958/Home) |
| IndianOil KV Jairam Fuel Center | 06:00–22:30 | [Operator locator](https://locator.iocl.com/indianoil-kv-jairam-fuel-center-petrol-pump-jakkur-bengaluru-183602/Home) |
| KFC Hegdenagar | 11:00–23:00 | [Operator page](https://restaurants.kfc.co.in/kfc-kfc-hegdenagar-bangalore-restaurants-dr-srk-nagar-bengaluru-481085/Home) |
| Pizza Hut Sahakara Nagar | 11:00–23:00 | [Operator page](https://restaurants.pizzahut.co.in/pizza-hut-sahakar-nagar-pizza-restaurant-sahakar-nagar-bengaluru-1211/Home) |

Six Apollo branch cards use ambiguous midnight/noon formatting. Those entries remain unknown rather than being interpreted as 24-hour shops. Aster CMI publishes two coordinates about **212 m apart**. Its [emergency page](https://www.asterhospitals.in/aster-cmi-bangalore/emergency_care/zomato) describes 24/7 emergency availability, while its [hospital page](https://www.asterhospitals.in/hospitals/aster-cmi-bangalore) also describes a round-the-clock pharmacy. This does not mean all hospital departments are open, and the correct public entrance is unresolved. CNG availability at the two fuel outlets is unverified.

## Checked with the existing hours function

The actual app's `evaluateHours` function was run against the 14 clear operator schedules for Thursday 10 September 2026:

| Passing time, IST | Scheduled open | Scheduled closed |
| --- | --- | --- |
| 21:00 | 14 | 0 |
| 22:30 | 12 | 2 |
| 23:30 | 1 | 13 |

This demonstrates the user's proposed time-based comparison on real published schedules. It is a **schedule projection**, not a live route comparison: these 14 locations are not assigned to a selected road and have no verified holiday overrides. Full per-location results are in [schedule-projections.json](schedule-projections.json). The hospital and ambiguous hours were excluded.

## Why this does not yet raise route coverage

1. A listing must be associated with the actual provider route, entrance and estimated passing time. Straight-line proximity can attach shops across a divider or inside a private estate.
2. Google, OSM and operator records need identity reconciliation. The nearby OSM pharmacy found beside one Apollo point has a different name; it must not be merged merely because it is 23 m away. Likewise, 11 possible OSM duplicate pairs are not a confirmed duplicate count.
3. Weekly schedules need a separately labelled basis. A website fetched today does not prove its hours were recently verified. OSM syntax is retained verbatim rather than passed through a partial parser that silently drops holidays or overnight periods. See [OSM opening-hours documentation](https://wiki.openstreetmap.org/wiki/Key:opening_hours).
4. Google Nearby Search has a maximum of 20 results per request. Full returned pages remain censored evidence; additional sources do not prove that every business was found. See [Google Nearby Search documentation](https://developers.google.com/maps/documentation/places/web-service/nearby-search).
5. Missing shops or unknown hours must not make a road look empty. Indoor complexes also cannot inflate visible roadside activity automatically.

The historical morning baseline had known hours **60.7–69.4%**, complete scans **50.0–73.8%**, and assessed activity distance **7.4–29.5%** across three routes. Source: `talks/records/hours-live078.json`. The new daytime hosted check is recorded above; the different time and route ordering prevent interpreting changes as an implementation improvement.

The existing road extract was queried over a roughly 7.2 by 8.7 km rectangle, not the new 10 km radius. Its raw way coordinates can extend beyond the requested rectangle and must not be mistaken for coverage there. The new independent 10 km query succeeded with **58,613 highway-tagged ways and 280,746 geometry points** (including paths and other highway classes). It is saved separately and has not replaced production data. Selected full ways may extend outside the radius. A successful response is not proof OSM maps every road, and geometry does not establish public access, working lighting or field conditions.

## Files and reproduction

- [operator-hours.json](operator-hours.json): operator source URLs, coordinates, weekly schedules, limitations and explicit unverified fields. No Google API response content.
- [osm-opening-hours.json](osm-opening-hours.json): original Overpass response.
- [osm-provenance.json](osm-provenance.json): exact query, retrieval timestamp, OSM data timestamp, SHA-256 and licence.
- [osm-candidates.json](osm-candidates.json): normalized research records retaining raw opening-hours expressions; excludes contact details from the derived table.
- [reconciliation-candidates.json](reconciliation-candidates.json): candidates requiring identity checks, not automatic merges.
- [summary.json](summary.json): computed counts.
- [osm-roads-provenance.json](osm-roads-provenance.json): expanded road query, timestamp, category counts, licence and hash. Raw geometry is in `osm-roads-10km.json` (approximately 34 MB).
- [schedule-projections.json](schedule-projections.json): results from the existing app hours evaluator.

OpenStreetMap data: © OpenStreetMap contributors, [ODbL 1.0](https://www.openstreetmap.org/copyright). Keep attribution and licence with extracts and derived datasets. Operator pages are retained as links and compact factual research notes, not copied page archives; application reuse needs a provider-specific data-use approach. Google content storage restrictions are not bypassed by this package.

Research scripts are retained in `tmp/build-evidence-register.mjs`, `tmp/project-operator-hours.ts`, `tmp/collect-osm-hours.mjs` and `tmp/collect-expanded-roads.mjs`. No provider credentials are included.

## Next acceptance work

The authenticated comparison and preliminary geometry-proximity audit are complete. Next resolve identities and public-road access, investigate capped scans and unknown road classifications, and measure any resulting implementation improvement on the same journeys. Then perform physical checks after dark. No alternative local paid script was used to bypass the shared counter. Browser control failed this session, so public collection used web search and direct operator/Overpass requests.

This is progress toward the PDF evidence deliverables. It is not a completed live-scoring module, a safety validation, or a reason to mark the remaining acceptance criteria green.
