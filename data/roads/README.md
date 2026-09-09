# North Bengaluru road research extract

This OpenStreetMap extract covers 13.02–13.085 N and 77.57–77.65 E around the AEOS–Manyata demonstration. The Google map can still cover all Bengaluru; road evidence outside this extract stays unknown.

The raw response is preserved in north-bengaluru-overpass.json. provenance.json contains the exact query, retrieval time, extent, source and attribution. It was fetched once with scripts/fetch-road-extract.mjs. No download happens during app startup or comparison.

Data © OpenStreetMap contributors, available under the Open Database License 1.0: https://www.openstreetmap.org/copyright and https://opendatacommons.org/licenses/odbl/1-0/ . Retain the raw data, provenance and this attribution when sharing the source package. No Google data has been added to this extract.

The classifier uses explicit highway tags, short route intervals, proximity and direction. Main means motorway/trunk/primary/secondary/tertiary and their links. Internal means residential/living_street/service. Other tags, ambiguous parallel matches and grade-separated matches remain unknown. These are research categories; they do not establish road width, illumination, public access, staff presence or safety. The local thresholds need corridor validation before live recommendations.
