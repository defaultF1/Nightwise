# Replacing Google's map in Nightwise

Research checked 15 September 2026. This is a local plan, not a completed provider migration or a claim of equal data coverage.

## Bookmark and working agreement

- Baseline commit: `ff2fb300990ebdbf316dd60307ecbd9c13a97120`.
- Local annotated tag: `nightwise-local-before-map-replacement-2026-09-15`.
- Current experimental branch: `codex/map-replacement-research`.
- The baseline includes the cleaner wording, existing Google implementation, and the CCTV/layers plan. Its production build and three targeted browser checks passed in the preceding task.
- Development stays local. No GitHub push, Render deployment, key deletion or remote configuration change without a new explicit request. This preference is also recorded in the root `AGENTS.md`.
- Existing ignored private configuration remains on this PC; Git does not back up those secrets. No keys are copied into this document or committed.
- To restore later, first commit or safely save experiment work. Then create a new local branch at the tag, for example `git switch -c codex/restore-google-baseline nightwise-local-before-map-replacement-2026-09-15`. Do not discard uncommitted work or overwrite the published branch history.

## Recommendation

Prototype **MapLibre GL JS** inside the existing React/Capacitor WebView, using licensed OpenStreetMap-based vector tiles. It supports the visual ingredients we need: markers, styled lines, camera controls and clustered point layers. MapLibre is a renderer, not a source of routes, business hours or traffic. Its native Android/iOS renderer is a fallback if WebView performance is inadequate, but would require additional native integration. [MapLibre](https://maplibre.org/)

Start with a separate local preview using user-supplied coordinates, appropriately licensed OSM infrastructure and independently sourced route/POI fixtures. Preserve the working Google mode as a separate complete provider configuration.

The requirement is the same interaction design, not identical Google road labels, business coverage, route choices or ETA. Those need a provider benchmark before we can claim parity.

## Feature-by-feature plan

| Current feature | Replacement approach | What needs checking |
|---|---|---|
| Blue origin/current location and red destination | Reuse our coordinate values and colour constants; convert to MapLibre longitude-first positions | Latitude/longitude order, GPS accuracy circle, endpoint snapping |
| Yellow shops, pink pharmacies, purple hospitals, green petrol/CNG | Custom symbols or image icons with the current colours and shapes | Pins must come from a source permitted on this basemap; same business IDs/coordinates cannot be assumed across providers |
| Selected white route and grey alternatives | Separate clickable GeoJSON line layers, selected route above others | Draw complete provider geometry; preserve selection, bounds and segment overlays |
| Tap for place name and hours | Popup/detail sheet linked to stable provider-qualified IDs | Attribute source and keep estimated/unknown schedules explicit |
| Full screen / minimise | Reuse the existing expanded-map hook, resize the same renderer | Keyboard, Back, focus, safe areas and orientation |
| Dark, light and blue themes | Three compatible vector styles | Road-label readability; reload custom layers after style changes |
| Smooth embedded scrolling | Render the map in the WebView's normal layout | Hypothesis: this avoids today's separate native-surface clipping problem; Redmi testing is still required |
| CCTV and traffic-signal layers | Separate toggleable GeoJSON sources with clusters | Date/status disclosures, exclusions and route association from the saved infrastructure plan |
| Search, addresses and saved places | New autocomplete/reverse-geocoding provider adapter | Landmark matches, entrance accuracy, provider-specific IDs, Bengaluru and Kanpur coverage |
| Car, motorbike, walk; distance and duration | New routing adapter | Motorcycle must not silently become bicycle; supported profiles and traffic model |
| Up to five hours ahead | Keep departure input only where provider output supports its meaning | A future timestamp alone does not create predictive traffic; business hours and travel-time forecasting are separate |
| Night Activity Score | Reuse scoring after normalising new POI, schedule and road evidence | Coverage changes can change comparability and score; retain confidence and unknown states |
| External navigation | Keep a separate handoff adapter | A renderer does not provide turn-by-turn navigation; another navigation app may recalculate the route |

Official implementation examples: [markers](https://maplibre.org/maplibre-gl-js/docs/examples/add-a-default-marker/), [route lines](https://maplibre.org/maplibre-gl-js/docs/examples/add-a-geojson-line/), [clusters](https://maplibre.org/maplibre-gl-js/docs/examples/create-and-style-clusters/).

## Candidate services

**First managed candidate: Geoapify.** Its product family offers map tiles, address autocomplete, reverse geocoding, Places and Place Details, which can include opening hours when supplied. This gives us a coherent initial experiment, but its open-data business coverage in our two regions is not measured. Address autocomplete is not proof that every business-name query will work. [Places](https://www.geoapify.com/places-api/), [details](https://www.geoapify.com/place-details-api/), [autocomplete](https://www.geoapify.com/address-autocomplete/).

Its routing documentation lists drive, motorcycle and walk modes, route geometry, step information, and free-flow or approximated traffic. That is not verified live traffic parity with Google. The response documentation mentions alternatives, but the published request parameter list inspected here does not clearly expose how to request them. Confirm the supported alternatives/departure interface before choosing it; do not invent parameters or generate cosmetic duplicate alternatives. [Routing reference](https://apidocs.geoapify.com/docs/routing/).

**Tile-only alternative: MapTiler.** It can supply maps to the MapLibre ecosystem, with its own key and attribution requirements. It would not by itself replace our route and shop APIs. Use it if the map styling/coverage benchmark is better; that adds another provider to operate. [MapTiler SDK](https://docs.maptiler.com/sdk-js/), [keys](https://docs.maptiler.com/cloud/api/authentication-key/), [attribution](https://docs.maptiler.com/guides/map-design/attribution/add-attribution/).

**Longer-term alternative: self-hosted routing/open data.** Valhalla is an open routing project worth investigating if the managed option fails our route requirements. It requires separate road-data imports, graph updates, hosting and operations. Its capabilities are not a promise that our current free Render service can run it or that it includes a live traffic feed. This pass did not validate a deployed engine. [Valhalla](https://valhalla.github.io/valhalla/).

Do not substitute the public OpenStreetMap tile server for a production hosting plan, bulk-download its standard tiles for offline packs, or use the public Nominatim API for autocomplete. Use a suitable hosted service or our own infrastructure. [Tile policy](https://operations.osmfoundation.org/policies/tiles/), [Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/).

## Provider separation and existing code

Google's standard Routes and Places policies require mapped results to appear on a Google map. A MapLibre preview must therefore not reuse Google route polylines or mapped Google POIs. Keep Google credentials and the existing map together in the baseline mode; use independently licensed replacement data for the experiment. Source attributions remain required for the chosen data. [Routes policy](https://developers.google.com/maps/documentation/routes/policies), [Places policy](https://developers.google.com/maps/documentation/places/web-service/policies).

Changes identified in the repository:

- Keep `MapHandle.draw/fit/touch/destroy` in `src/maps/adapter.ts` as the boundary; split Google and MapLibre implementations behind a local configuration switch.
- Reuse `src/maps/pins.ts` colours and `src/maps/use-expanded-map.ts`. Make `src/LiveMap.tsx` choose a normal map container in MapLibre mode; do not apply Android Google-map transparency, clipping or native scroll synchronisation there.
- `src/domain/types.ts` currently accepts only sample/google route sources, and `src/providers/live.ts` rejects other providers. Add explicit source/schema validation rather than pretending alternative results came from Google.
- Separate server route/search/place adapters from `server/google.ts`. Preserve request limits but count replacement provider credits separately from Google requests.
- Version caches by provider, dataset, mode and departure; never reuse a Google result simply because endpoint coordinates match. Apply each provider's own storage/freshness rules.
- Namespace favourites by provider. Keep existing Google place IDs for rollback; do not pass them to another provider or silently substitute similarly named businesses.
- Existing unknown-hours fallback uses a Google-specific reason string. Normalise missing-hours reason codes before connecting a new provider; retain explicit estimates and do not raise confirmed-open coverage with assumed schedules.
- Keep Render, Upstash, local preferences and scoring structure. Revalidate security origins, new credentials and data notices only locally in this phase.

## Cost and rollout gates

MapLibre itself is open source; map hosting, route/search/detail calls and device bandwidth still have costs. Geoapify currently advertises 3,000 credits/day on its free plan, with limited commercial use. Credits are not complete comparisons: detail requests, tiles and routing options must be budgeted separately. Verify plan terms and measured cost before committing to a provider. No new account, paid plan or provider calls were created for this research. [Pricing](https://www.geoapify.com/pricing/).

1. **Visual prototype:** same endpoints, colours, route-selection interactions, popups, themes, full screen and layer toggles; authorised non-Google data only. No production switch.
2. **Small provider benchmark:** AEOS to Manyata and reverse; AEOS to Sahakar Nagar; Manyata to Sahakar Nagar; AEOS to Bengaluru Palace; and a user-chosen Kanpur journey without publishing home coordinates. Compare landmark search, valid distinct alternatives, road access, mode support, hours availability, special-day handling, response time and cost. Target at least 20 shop listings plus 10 help-point listings for a first hours audit, expanding when results conflict; this does not establish whole-region coverage.
3. **Feature acceptance:** GPS remains device-based; data adapters preserve provenance; zero accidental Google requests in replacement mode; no duplicated markers; layer toggles do not request routes; cached source/version visible. Test WebGL availability, context loss, rapid theme changes, cold start, keyboard and Back on a Redmi.
4. **Decision with the user:** present measured regressions and gains. Do not claim equal opening-hours coverage or live traffic until the benchmark supports it. Publish or replace the shared APK only after a new explicit request.

Next concrete step: a reversible local MapLibre visual prototype. Production provider selection remains open pending the data benchmark.
