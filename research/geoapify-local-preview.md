# Geoapify local preview — 15 September 2026

Local URL: http://127.0.0.1:4176/ (choose **Live routes**). API: http://127.0.0.1:8788/.

## Scope and rollback

This is an opt-in local experiment on `codex/map-replacement-research`. Google remains the default provider outside the new preview command. No GitHub push, Render environment change, deployment or APK was made for this experiment. Existing Google credentials were preserved.

The baseline tag is `nightwise-local-before-map-replacement-2026-09-15` (`ff2fb300990ebdbf316dd60307ecbd9c13a97120`). Preserve newer work before switching back; use a separate checkout for a baseline comparison. Do not reset or clean the current worktree.

From the repository root, run these in separate terminals:

```powershell
npm run server:geoapify
npm run dev:geoapify
```

The server reads `GEOAPIFY_API_KEY` from the ignored `.local/geoapify.env`. This key is already configured on this computer. It is not included in frontend URLs or committed files. The preview binds to loopback and is intended for this computer, not a distributed APK. Its CORS allowlist contains only the local preview origin.

## Implemented

| Feature | Local implementation |
| --- | --- |
| Map and route display | MapLibre, Geoapify raster tiles, existing route colours and map controls |
| Place pins | Separate shop, pharmacy/clinic, hospital and petrol colours; details on tap |
| Full screen | Expand/minimize, route selection and touch controls; all three themes |
| Search | Geoapify autocomplete, addresses, straight-line distance, provider road-time previews, selection and saved IDs |
| Current location | Device/browser permission and GPS; Geoapify reverse address lookup, retaining the coordinate if lookup fails |
| Modes | Car, motorbike and walking requests mapped to provider modes |
| Alternatives | Balanced, shortest and fewer-turn requests; identical returned geometry deduplicated; up to three distinct routes |
| Departure | Now to five hours ahead for evaluating hours; travel time is not a departure-specific traffic forecast |
| Place scans | Queries around displayed routes, shared scan areas reused, 150 m proximity filter, paginated results and cap/failure tracking |
| Opening hours | Parse supplied OSM weekly expressions in Indian time, overnight periods, 24/7 and passing-time closures |
| Unknown data | Missing schedules remain unknown in evidence; existing category estimates remain labelled estimates and do not raise confirmed-hours coverage. Ambiguous/holiday schedules do not receive a missing-hours fallback |
| Activity scoring | Existing formula retained; this provider's preview withholds ranking below 50% usable hours or 80% scan coverage. These are conservative trial gates, not validated safety thresholds |
| Cost controls | API cache expires after five minutes; forced refresh bypasses it. Tiles have separate 24-hour caching. Serial requests and independent local request counters/caps |
| Navigation handoff | Existing external Google Maps link remains user-initiated. Fastest has no stops; alternatives carry up to three guide points. This cannot lock the navigation app to an exact polyline |

Favourites are isolated by provider. Comparison cache is session memory in a separate preview origin. API caches are in server memory. The local ledger and submitted ratings are stored under `.local/`; location histories are not written there.

## Measured evidence

AEOS → Manyata, supplied endpoint pins, car request on 15 September:

| Result | Fastest returned | Alternative |
| --- | --- | --- |
| Distance | 4,556 m | 6,065 m |
| Provider estimated time | 13.2 min | 29.2 min |
| Nearby listings retained | 91 | 98 |
| Listings with usable schedules | 5.5% | 6.1% |
| Planned scan coverage | 100% | 100% |

The comparison used **3 routing requests and 8 places requests**. An immediate repeat used **0 new routing, places or details requests**. Planned scan coverage means our planned queries returned uncapped results; it does not establish complete coverage of all businesses on the road.

Motorbike returned three distinct geometries; walking returned two. Search found Manyata and returned five address suggestions with distance/time estimates. Geoapify reverse lookup returned an approximate address near AEOS. These observations establish working API integration, not ground validation or parity with Google's route quality. Returned values can change on later requests.

## Verification

- 207 unit tests passed across 26 files, including seven new provider tests for hours, geography, categories, geometry, mode mapping, deduplication, handoff and sparse-evidence gating.
- TypeScript and both Google-default and Geoapify frontend builds passed. Vite reports large bundle chunks; bundle optimisation remains future work.
- Mobile-width Edge checks passed for all three themes: route selection, marker popup, fullscreen/minimize and no horizontal overflow; no JavaScript errors or Google network requests in the comparison flow.
- A real GeoJSON line was hit-tested successfully after configuring MapLibre's Vite worker explicitly. The committed browser regression test uses generated local tiles and no paid provider requests.
- Actual search, Enter submission, returned travel estimates and choosing the destination passed. A reduced-height viewport was checked; this is not a real Android keyboard test. Simulated browser GPS followed by an actual Geoapify reverse lookup populated the origin address. The 10 relevant provider/location tests and TypeScript check also passed after connecting that lookup.

Run the renderer regression with the local preview active:

```powershell
$env:NIGHTWISE_TEST_GEOAPIFY='1'
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:4176'
npx playwright test tests/browser/geoapify-map.spec.ts
```

## Remaining before replacing the shared app

- Opening-hours coverage is much weaker in this measured sample. The preview correctly withholds a live activity ranking. Better licensed business-hours evidence or separately verified local data is needed for comparable coverage.
- Geoapify routing uses approximated traffic, not measured live congestion. Future departure traffic, exact route preservation in other navigation apps and comprehensive shop coverage are not established.
- Only the 20 km AEOS area is enabled in this backend. Kanpur is retained in the original app but not enabled for this provider experiment.
- Test native Android keyboard, WebGL lifecycle, GPS and external handoff on a real device before packaging. No new APK has been built.
- CCTV and traffic-signal map layers remain a separate planned task. This change does not assert operational CCTV coverage or add camera scoring.
- Recheck current hosting, data attribution, credit usage and provider plan terms before public rollout. The local counters measure requests, not exact provider credits.

References: [Geoapify routing](https://apidocs.geoapify.com/docs/routing/), [Places](https://apidocs.geoapify.com/docs/places/), [Maps](https://apidocs.geoapify.com/docs/maps/), [MapLibre v6 worker setup](https://maplibre.org/maplibre-gl-js/docs/guides/v5-to-v6-migration-guide/).
