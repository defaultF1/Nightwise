# Tutorial street map

The bundled derivative is `src/data/tutorial-map.json`. It contains 4,035 OpenStreetMap street ways around the two supplied endpoints and three stored road paths in each direction. The map and route highlights use the same coordinates and geographic scale. No Google map tiles, routes or Places content are stored in this dataset.

Source: the 10 September 2026 Overpass highway extract. Its timestamp and SHA-256 are embedded in the JSON. Run `node scripts/prepare-tutorial-map.mjs <raw-overpass-json>` to reproduce it. The raw query was `[out:json][timeout:35];way(around:10000,13.0628268,77.5940888)[highway];out geom;`.

Map data © OpenStreetMap contributors, licensed under ODbL 1.0: https://www.openstreetmap.org/copyright and https://opendatacommons.org/licenses/odbl/1-0/. This derivative remains available under that licence; the application source licence is separate. The bundled map visibly links the attribution page.

Paths are computed on connected OSM node IDs, respecting mapped one-way and vehicle-access restrictions. Reverse paths are computed independently. Straight endpoint chords are never substituted. The AEOS pin is about 65 m from its nearest included public road node; Manyata is about 4 m away. This highway-only extract lacks turn-restriction relations. These stored paths and modelled durations are for the tutorial, not offline navigation. Live mode exclusively uses current Google provider geometry.

Tutorial activity and schedules are deterministic teaching fixtures and are separate from this OSM road dataset. The UI identifies that context as Tutorial mode, without repeated fixture disclaimers. Live missing-hour, unassessed-area and experimental-score labels remain intact.
