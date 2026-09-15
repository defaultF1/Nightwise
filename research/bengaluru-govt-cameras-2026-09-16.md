# Government and security cameras around AEOS–Manyata: deep research and integration

Researched 16 September 2026 (fresh pass, superseding the Mappls-only camera research). Scope: the 20 km radius around AEOS (13.0628, 77.5941) and Manyata Tech Park (13.0477, 77.6199). Every count below was verified live during this research; inference is labelled as inference.

## The bottom line

Only one coordinate-level camera dataset is publicly reusable: **OpenStreetMap** (`man_made=surveillance`), with **2,829 mapped surveillance objects inside our 20 km radius** (2,803 camera-type after filtering; 332 within 5 km of Manyata), largely from the local "Surveillance in Bengaluru" community mapping project started by Thejesh GN in 2019. License ODbL — the same license and attribution line as our existing road data. This dataset is now integrated into the app (see "What we shipped" below). Every other source is either aggregate counts, junction names without coordinates, or police-internal data.

## Government camera programs (what exists on the ground)

### Bengaluru Safe City Project (Nirbhaya Fund)
- Master System Integrator: Honeywell Automation India; reported value ₹496.57–600 crore; plan of ~7,000–7,500 cameras at ~3,000 locations plus an Integrated Command & Control Centre.
- Phase 1 (inaugurated March 2023, PIB PRID 1904143): 4,100 cameras at ~1,640 locations, 400 body-worn cameras, 30 safety islands, 96 viewing centres. Phase 2: ~3,400 further cameras (2,800 fixed, 280 high-res, 400 PTZ). Full completion as of Sep 2026 is not press-confirmed.
- No per-camera or per-pole location list has ever been published; the public RFP (mirrored by Thejesh GN and Scribd) carries no verifiable site annexure.

### Bengaluru Traffic Police (ITMS / ANPR / RLVD / speed)
- ITMS live since Dec 2022: 250 ANPR + 80 red-light cameras at 50 junctions (integrator Matrix Security & Surveillance, analytics Videonetics). The **50-junction list is public by name** at btp.karnataka.gov.in/232/itms-camera's/en.
- In or near our radius: R T Nagar Taralubalu Junction, CAL Cross, Navaranga Circle, Sampige Road 18th Cross, Bhashyam Circle, New BEL Road Ramaiah Hospital, Sadashivanagar PS Junction, Cunningham Road, Mariyappa Circle, Banaswadi 7th Main, Dodda Banaswadi Main Rd. **Hebbal, Nagawara, Veeranapalya, Esteem Mall, Mekhri Circle and the ORR interchanges are NOT on the ITMS list.**
- **Ballari Road elevated corridor (our corridor's spine): 8 speed-trap cameras, 4 per direction, enforcing 80 km/h** (Deccan Herald). Exact positions unpublished.
- BTP claims 9,000+ CCTV cameras city-wide and 1,500+ live-monitored junctions — informational text only, no list.

### The invisible giant: MCCTNS geotags
Bengaluru police have geotagged **5,35,815 public and private road-facing cameras** into MCCTNS as of 30 April 2025 (Deccan Herald). This is the best camera-location database in existence for the city and it is **police-internal only** (investigators' app). An RTI for locations would likely be refused on RTI Act Section 8 security grounds (inference).

### Karnataka Public Safety (Measures) Enforcement Act, 2017 (Act 44 of 2017)
Mandates CCTV with 30-day retention at establishments where >100 people gather at a time or >500 visit per day: malls, industrial complexes, religious places, schools/colleges, hospitals, sports venues, railway and bus stations. Implication (inference, legally grounded): Manyata Tech Park, Elements/Esteem malls, Aster CMI and Columbia Asia Hebbal, large fuel stations and similar POIs along our routes can be presumed camera-covered even where no point is mapped.

### BBMP / Smart City, Metro, Railways
- BSCL ₹96-crore ICCC at BBMP HQ integrates 14 agencies' feeds; BBMP installs cameras ward-wise (e.g. 301 in JB Nagar PS limits). Counts only, no maps.
- Metro on our corridor: Nagawara (Pink Line underground) targeted ~Dec 2026, Hebbala (Blue Line) ~Sep 2027 — no operational metro CCTV inside the core corridor yet.
- Railways: per-station counts only (KSR 71, Yeshwantpur 35, Cantonment commissioned).

## Open data comparison (all checked directly)

| Source | Points in our area | Coordinates? | License | Verdict |
|---|---|---|---|---|
| OpenStreetMap (Overpass) | 2,829 (20 km), 332 within 5 km of Manyata | Yes | ODbL | **Integrated** |
| OpenCity "Bengaluru CCTV" KML | 1,541 city-wide | Yes | Mislabelled CC-NC; actually a 2023 OSM snapshot | Skip — stale subset of OSM |
| data.gov.in "Bangalore CCTV" (BSCL, 2022) | unverifiable (portal 403s) | unknown | GODL-India | Unverified; check in a browser someday |
| BTP ITMS junction list | 50 junctions (~12 nearby) | Names only | none stated | Context/geocoding aid |
| IFF Project Panoptic (Bengaluru) | project-level prose + RTI PDFs | No | CC-BY | Citation for "about this data" |
| Kaggle/GitHub/Mapillary/Wikimapia | none | — | — | Do not exist for this purpose |

## What we shipped (the improvement)

1. **Bundled dataset** `src/data/cameras-north-bengaluru.json`: 2,803 camera points (OSM data timestamp 2026-09-15), slimmed to id/lat/lon/zone/cameraType/operator. Provenance in `data/cameras/north-bengaluru-20km-provenance.json`.
2. **Map layer** (`src/domain/camera-layer.ts` + LiveMap): cyan "C" pins for OSM-mapped cameras within 60 m of the selected route, with a toggle, a per-route count, the data timestamp, and the caveat that a mapped location does not confirm a camera is installed, working, recording or monitored. Covered by the existing "© OpenStreetMap contributors" attribution.
3. Cameras are display evidence only; they do not enter the Safety Score in this build.

### Refreshing the data
Re-run against Overpass and regenerate the JSON (also recorded in provenance):
`[out:json][timeout:120];(node["man_made"="surveillance"](around:20000,13.0553,77.6070);way["man_made"="surveillance"](around:20000,13.0553,77.6070););out center tags;`

## Honest limits to keep in the product voice

- OSM coverage is crowdsourced and uneven: dense where mappers walked (the AEOS/Bellary Road cluster is well mapped), sparse elsewhere. **Absence of a pin never means absence of a camera** — BTP alone claims 9,000+ against ~2,800 mapped.
- Only ~40 mapped nodes name an operator (BTP, NETRA, BBMP, police); ALPR tagging is essentially absent (2 nodes).
- A mapped camera is not evidence of recording, monitoring, lighting or response. The app must keep saying this wherever cameras appear.
- Improving the map itself (adding cameras we verify on the ground) feeds OpenStreetMap under ODbL and helps every user of this data — a good community loop for the pilot team.
