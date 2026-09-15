# Selected-route pins and zoom rendering — 15 September 2026

Local Geoapify preview only. Google defaults and provider credentials are unchanged.

## Findings and changes

- The saved directory allowed 200 m around a route; the live scan uses 150 m around sampled points. Those are nearby searches, not proof that a business fronts the selected street. The saved AEOS–Manyata fastest-route response had 131 directory records within 200 m but only 23 within 50 m. Parallel-road pins made the selected white route look mismatched.
- Geoapify map pins now require distance of at most 50 m from the selected polyline. This is applied before the live pin limit, and also to saved directory pins. Switching routes replaces the visible pins. Coordinates are never snapped or moved onto a road. The wider directory and nearby activity evidence remain available separately, with the distance distinction explained in the UI. Entrance access is not established by proximity.
- The map previously used 256-pixel raster tiles. It now requests 512-pixel `@2x` images covering the same geographic area, retains 256 CSS-pixel tile coverage, uses zoom levels through 20, and gives high-resolution tiles a separate cache URL. Attribution includes Geoapify, OpenMapTiles and OpenStreetMap.
- An additional blur cause was serial tile downloads: rapid zoom could leave old, stretched parent tiles visible while newer tiles waited. The server now permits four requests in flight with starts spaced by 220 ms, and abandons obsolete tile requests when the browser disconnects. Existing usage caps remain unchanged. Brief loading while new tiles arrive is still possible; raster tiles do not provide unlimited vector zoom.

Provider reference: https://apidocs.geoapify.com/docs/maps/ documents the same-area @2x (512 × 512) tiles and levels up to 20.

## Validation

- Pin filtering, reverse travel, route switching, off-route listings not consuming the visible allowance, and preserved evidence/coordinates covered by unit tests.
- Tile endpoint test covers zoom/scale validation and the exact upstream retina path.
- Scheduler test uses mocked requests and an isolated ledger: up to four concurrent requests, start spacing, and cancelled queued requests spending no allowance.
- TypeScript and Geoapify frontend production build passed. Existing large-bundle warning remains.
- MapLibre browser regression rendered and hit-tested a real GeoJSON route layer without Google requests.
- Browser comparison used the previously saved actual three-route Geoapify response, avoiding new routing/place requests. Expected visible business pins matched all three options: 23 / 27 / 30. This is display verification, not a new ground survey.
- Actual provider map requests were checked at device pixel ratio 2: 45 returned tiles were 512 × 512, canvas width was 1080 physical pixels for 540 CSS pixels, and zoom requests advanced through levels 14–17. No page errors, failed tile responses, or Google requests were observed. The final close-up screenshot was visually inspected; street labels and building outlines were sharp after loading.
- Local verification script: `.local/verify-route-zoom.mjs`; screenshot: `tmp/geoapify/route-zoom-retina.png` (ignored local artifacts).

Preview: http://127.0.0.1:4176/ with local API at http://127.0.0.1:8788/. No push, hosted deployment, or APK was made.
