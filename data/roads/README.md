# North Bengaluru road research extract

## 14 September 2026 expansion

The current default is `north-bengaluru-22km.json`: a tile manifest for a 22 km query around AEOS, supporting a 20 km journey-endpoint circle. Keep the sibling `north-bengaluru-22km-tiles/` directory with it. It contains 196,038 original OSM ways and 979,088 geometry points across 266 tiles. The loader reads tiles around the requested route paths and deduplicates whole ways by ID, retaining geometry and elevation information. Per-tile hashes, the source query, date and license are recorded in `north-bengaluru-22km-provenance.json`. Existing deployments must update their `ROAD_DATA_PATH` override to this manifest. `scripts/fetch-expanded-roads.mjs` explicitly rebuilds it; it never runs automatically on a journey request.

The road-loading check on the same AEOS/Manyata/Kanpur paths used about 107–154 MB process RSS with tiles, compared with 227–436 MB while reading and parsing the full Bengaluru extract repeatedly. This is a local measurement, not a Render load test. Road matching results were unchanged. Unknown parallel-road and grade-separated sections remain unknown. Historical extract notes follow.

Version 0.9.0 defaults to `north-bengaluru-10km.json`, a 14.5 MB compact representation of the already-collected 10 km AEOS query: 58,613 ways and 280,746 geometry points. `north-bengaluru-10km-provenance.json` records source provenance and hashes. Only IDs, original geometry and highway/elevation tags were retained; no Google content was added. The loader permits 65,000 ways and 350,000 points within its unchanged 30 MB file cap. A route leaving the extract remains partially unknown. The original narrow extract below remains as historical source material.

Unknown distances now include reason totals for no candidate, alignment mismatch, grade separation, ambiguous parallel roads and unsupported highway class. Their sum accounts for unknown route distance. Larger geographic coverage does not imply better matching accuracy on already-covered routes.

This OpenStreetMap extract covers 13.02–13.085 N and 77.57–77.65 E around the AEOS–Manyata demonstration. The Google map can still cover all Bengaluru; road evidence outside this extract stays unknown.

The raw response is preserved in north-bengaluru-overpass.json. provenance.json contains the exact query, retrieval time, extent, source and attribution. It was fetched once with scripts/fetch-road-extract.mjs. No download happens during app startup or comparison.

Data © OpenStreetMap contributors, available under the Open Database License 1.0: https://www.openstreetmap.org/copyright and https://opendatacommons.org/licenses/odbl/1-0/ . Retain the raw data, provenance and this attribution when sharing the source package. No Google data has been added to this extract.

The classifier uses explicit highway tags, short route intervals, proximity and direction. Main means motorway/trunk/primary/secondary/tertiary and their links. Internal means residential/living_street/service. Other tags, ambiguous parallel matches and grade-separated matches remain unknown. These are research categories; they do not establish road width, illumination, public access, staff presence or safety. The local thresholds need corridor validation before live recommendations.

## Kanpur live pilot

Kanpur uses a 20 km product coverage circle centred at 26.48 N, 80.30 E. This is an editorial service boundary, not an administrative boundary or a shop coordinate. The 22 km OSM query provides a margin around it. `kanpur-22km.json` contains 40,160 ways and 354,837 original geometry points (15.7 MB); provenance records the 10 September 2026 retrieval, query, hashes and ODbL attribution. Kanpur road classification uses a local latitude projection. Bengaluru presets, tutorial and their extract remain unchanged. Incomplete road matches remain unknown.
