# Infrastructure research inventory

These are dated research records, not verified working equipment and not production app data.

The CSV files contain filtered OpenStreetMap-derived database records. © OpenStreetMap contributors. Available under the [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/). See [OpenStreetMap copyright and attribution](https://www.openstreetmap.org/copyright).

Camera source: https://www.thetraffic.in/data/surveillance_cameras.v1.json (OSM base 2026-09-09T04:20:20Z).

Signal source: https://www.thetraffic.in/data/intersections.v1.json (OSM base 2026-09-05T07:43:36Z).

Credit: theTraffic for the published snapshots and processing; [Thejesh GN's Surveillance in Bengaluru](https://thejeshgn.com/projects/surveillance-in-bengaluru/) for the community mapping reference.

Both files are filtered to 20 km from the current AEOS pin. Source boundaries do not cover the full service circle. The signal CSV preserves upstream clustering and verification fields; no new verification has been asserted.

The timing JSON is a source-link register from OpenCity's public CKAN metadata response, retrieved 2026-09-14. It does not redistribute the timing PDFs or grant rights to use them. The returned metadata did not specify their licence.

To reproduce the inventories, download the two snapshot URLs into `tmp/infrastructure-research/cameras-snapshot.json` and `tmp/infrastructure-research/intersections-snapshot.json`, then run `python research/prepare-infrastructure-inventory.py` from the repository root. Future source changes can produce different counts. Preserve the snapshot version when comparing results.
