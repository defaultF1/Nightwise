# AEOS–Manyata directory and route review — 15 September 2026

Implemented only in the local Geoapify preview at http://127.0.0.1:4176/. No push, deployment or APK.

## What is saved

`src/data/aeos-manyata-directory.json` contains 205 named records within 200 metres of at least one checked road option: 164 shops/food outlets, 30 pharmacies/clinics, 5 hospitals and 6 fuel stations. `research/aeos-manyata-place-directory.csv` is the browsable/exportable list with coordinates, source URLs, hours and available source dates. Category counts describe mapped listings, not verified business licences or field inspections.

Sources:

- Actual Geoapify Places responses for displayed paths, saved on 15 September. The provider permits caching and storing Places data: https://www.geoapify.com/places-api/ . These records can contain inherited OSM omissions and old business details.
- A fresh OpenStreetMap Overpass query for medical/fuel records in the route neighbourhood, database timestamp `2026-09-15T13:10:45Z`. Query: `nwr(13.036,77.585,13.067,77.626)[~"^(amenity|healthcare)$"~"^(pharmacy|hospital|clinic|doctors|fuel)$"];out center tags meta;`. The saved directory keeps named matches within 200 m of the route lines, excludes private/no-access listings and deduplicates matching name/category/nearby-coordinate records against the Geoapify entries. Different OSM objects can still describe related departments; they are not automatically combined by hospital name.
- Manipal Hebbal's official facility hours were cross-checked against its named OSM building and Kirloskar Business Park address: https://www.manipalhospitals.com/hebbal/contact-us/ . The recorded facility schedule is 24 hours; this does not establish round-the-clock outpatient appointments.

There are 36 recorded schedules. The remaining records have no usable schedule saved. OSM records with available edit dates range from 19 October 2011 to 1 February 2026. An old edit date is not proof of closure, and today's download date is not proof of a fresh field survey. The UI retains the original edit date where known. This is not an exhaustive census of every business along the roads.

Two broader shop-extract requests timed out (Overpass 504 and another instance timeout). They were not treated as complete inventories. The checked provider scan remains the shop-directory source for this iteration.

## Official candidates not silently inserted

- Apollo Kempapura Village's own page gives daily 9 am–11 pm and publishes a directions coordinate of 13.04958, 77.60208: https://www.apollopharmacy.in/medical-stores/bangalore/apollo_pharmacy_kempapura_village_bangalore-15725 . That coordinate failed the 200 m filter for the checked paths, so the branch was excluded from the on-route directory. Apollo's nearby-store widget has conflicting/ambiguous hours; it was not used to override branch schedules.
- Motherhood's Hebbal page separates consultations 9 am–7 pm from 24/7 emergency care: https://www.motherhoodindia.com/hebbal/?speciality=2288 . Its schedule was not attached to the differently named OSM children's-hospital object without a stronger identity match.
- The IndianOil Jai Hanuman official locator URL returned 403. No hours were invented from that failed lookup. The existing BP record lists 06:00–22:00, demonstrating why petrol stations must not all be called confirmed 24-hour facilities.

## App behaviour

- “Show local directory pins” enables saved records, including those with unknown current hours. Same-name/category live pins within 60 m take precedence to reduce duplicate markers.
- “Browse local places” filters the selected route's saved listings and links to sources. Switching routes recomputes proximity locally and does not trigger more Places requests.
- The local directory is packaged data and does not refresh its saved date on reload. Its records do not raise live scan coverage, open-place counts or activity scores. Live Places searches retain their five-minute cache/refresh rules.
- Pins within 200 m indicate geographic proximity, not a verified walkable entrance or access across a divided road. Some may require a detour.

## Why two routes became three

The original requests used `balanced`, `short` and `less_maneuvers`. Balanced and fewer-turn preferences returned the same geometry for this journey, leaving two unique options. This is provider behaviour, not a two-route UI limit.

The updated car adapter makes at most one extra `avoid=highways` request if fewer than three options remain. A candidate must have correct endpoints, no more than three times the fastest returned duration, and at least 15% of its length more than 50 m from each existing path. This is a duplicate/detour screen, not ground validation. Failed or overlapping candidates leave the successful primary routes intact. Three routes are not guaranteed for every pair of endpoints. Search travel previews still make one routing request per suggestion.

Official routing inputs and additional avoidance costs: https://apidocs.geoapify.com/docs/routing/ . No route is labelled highway-free: the provider can still use avoided roads when alternatives are impractical.

Live AEOS→Manyata car check after the changes:

| Option | Distance | Estimated time | Live retained listings | Hospitals | Pharmacies |
| --- | --- | --- | --- | --- | --- |
| Fastest | 4,556 m | 13.2 min | 99 | 1 | 1 |
| Alternative 1 | 6,065 m | 29.2 min | 105 | 1 | 1 |
| Alternative 2 | 5,235 m | 29.4 min | 123 | 1 | 2 |

This took about 21 seconds, 4 routing and 14 Places requests. Separate diagnostic probes earlier used 1 routing and 2 Places requests. Healthcare-only results included records omitted by the combined-category response, so healthcare and fuel now have separate query groups. Extra candidate roads are scanned only after being retained among the displayed options. Times use Geoapify's approximated traffic model and differ from Google's measured estimates.

Live opening-hours coverage remains about 5–8%; the activity-ranking gate still applies. Local storage alone cannot repair missing opening-hours evidence.

## Validation

TypeScript and the Geoapify build passed. Targeted tests cover proximity, direction reversal, no Google-mode directory leakage, unknown hours, pin deduplication, separate healthcare/fuel requests, and the bounded third-route fallback. Browser checks showed three route choices, coloured medical/hospital pins, working directory search/toggle and fullscreen/minimize, with no JavaScript errors or Google requests in the comparison flow. These are browser and API checks, not Android field tests.
