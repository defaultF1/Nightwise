# Mappls migration plan

Research date: 15 September 2026. Status: Google source checkpoint restored locally; Mappls integration awaits credentials and service entitlements. No production deployment changed.

## Bookmarks

- Google baseline: `nightwise-local-before-map-replacement-2026-09-15`, commit `ff2fb30`.
- Preserved Geoapify hosted version: `nightwise-geoapify-hosted-before-mappls-2026-09-15`, commit `585abb3`.
- New local development branch: `codex/mappls-migration`, starting from the Google baseline.

These are source checkpoints. Switching source does not change Render, installed APKs, ignored build outputs or already-running processes. Before any future switch, preserve outstanding work and rebuild the intended version. Never use a destructive reset to switch providers.

## Requirements and evidence

Priority area: AEOS to Manyata Tech Park and the surrounding approximately 20 km. This is a coverage priority, not a claim that every listing in that radius is verified.

| Existing feature | Mappls approach | Remaining confirmation |
| --- | --- | --- |
| Interactive map, colored pins, route lines, popups, fullscreen | Vector Web Maps SDK with our existing presentation | WebView support and account restrictions for the Capacitor APK |
| Search and endpoint addresses | Autosuggest, geocoding and reverse geocoding | Enable services; verify AEOS and the intended Manyata entrance |
| Routes and ETA | Routing API, with traffic-aware product where enabled | Modes, alternatives, future departure and account entitlement; never manufacture three routes |
| Shops, pharmacies, hospitals, fuel | POI Along the Route plus entitled details | Category master, coordinates, pagination, hours and coverage |
| Opening at passing time | Evaluate supplied schedule at estimated arrival in Asia/Kolkata | Rich hours availability, holidays and freshness; a schedule is not a live observation |
| Night Activity Score | Retain our calculation and animated score UI using normalized evidence | Preserve missing-evidence handling; same design cannot guarantee identical scores from different data |
| Navigation handoff | Mappls deep link or supported external app | Confirm mode and waypoint support; fastest without intermediate stops, alternatives with supported points |
| CCTV layer | Separate optional overlay | No public CCTV inventory/feed API verified; request access and documentation |

### Current authentication

The official Web SDK main branch documents authentication introduced in August 2025. It uses a static key as `access_token`, obtained from the Mappls Auth Console. Older OAuth examples belong to legacy documentation. Enable the relevant Web/Cloud/Mobile services for the app. Restrict browser credentials by supported domains and server credentials by supported server restrictions. Keep server credentials out of frontend bundles and Git.

Sources: [Web SDK and authentication](https://github.com/mappls-api/mappls-web-maps-js), [Auth Console](https://auth.mappls.com/console/), [REST documentation](https://developer.mappls.com/documentation/sdk/rest-apis/Readme/).

### Route and place data

The routing documentation distinguishes basic routing, traffic-adjusted ETA and traffic-aware route choice. Future departures require confirmation of the predictive product rather than treating today's ETA as a forecast.

Source: [Routing API](https://developer.mappls.com/documentation/sdk/rest-apis/mappls-routing-api/readme/).

POI Along the Route accepts encoded route geometry and category, with a configurable corridor buffer and paginated results. The published default is ten results per page. Multi-category searching and longer routes can require premium access; the documented standard route-length limit is 30 km. A 20 km study radius does not guarantee every route fits that limit. Request the official category list and coordinate/hours fields before assuming they are present.

Source: [POI Along the Route](https://developer.mappls.com/documentation/sdk/rest-apis/mappls-poi-along-the-route-api/readme/).

SDK release notes mention `hourOfOperation`, which establishes that an hours field exists in some responses, not that all local listings or trial accounts receive it.

Source: [Android release notes](https://developer.mappls.com/documentation/sdk/Legacy/android%20Legacy/docs/v1.0.14/).

### CCTV: unresolved access requirement

Targeted official-document searches did not establish a publicly available CCTV API or a separate self-service CCTV key. Ask Mappls whether they license camera locations for this region, and whether they can provide installation type, verification date and operational status. These are separate from live video access. Do not label a marker as a working camera without supporting data.

Route Reports describe report categories and publication status. Published/unpublished does not mean a camera is working/offline. RealView imagery is not proof of a live surveillance feed. Only enable a CCTV layer after the actual dataset, rights and freshness are established.

Sources: [Route Report Summary](https://developer.mappls.com/documentation/sdk/Legacy/android%20Legacy/docs/v1.0.11/Route-Report-Summary/), [RealView](https://about.mappls.com/api/realview-api/).

## Implementation sequence after provisioning

1. Add an explicit provider setting, retaining Google adapters and credentials. Provider selection must cover maps, search, routing and places together, with no silent provider mixing or fallback.
2. Implement Mappls server adapters into the existing route/place models. Keep request budgets, team access and Upstash. Partition caches by provider, geometry, category, travel mode and departure time as applicable.
3. Fetch place evidence only for routes displayed in the comparison. Deduplicate overlapping requests and place IDs, handle pagination, and attach each point to the appropriate route using its real coordinates.
4. Subject to provider caching terms, reuse results for less than five minutes. On expiry, request fresh data; do not present failed refreshes as current results. Distinguish API retrieval time from the source's own update time.
5. Replace the map renderer while retaining route-click selection, category colors, fullscreen controls, endpoint preview and score design. Preserve required provider attribution.
6. Keep Driving and Leave now as defaults. Enable other modes and up-to-five-hour future departures only against supported API behavior. Show the actual number of distinct routes returned.
7. Add independently switchable place/CCTV layers when data is available. CCTV should not affect scoring until evidence quality and weighting are defined.
8. Run compiler/build/error checks. The user performs interactive and phone testing, as requested. Review AEOS entrance, Manyata entrance, road geometry, route-specific counts, hours and navigation behavior before considering deployment.

## Needed from the account owner

- Create a NightWise application in the Mappls Auth Console and enable/request Web Maps and Cloud search/routing/place services.
- Obtain the correct restricted credentials through private local configuration, not a committed file.
- Ask support for rich opening hours, POI categories/coordinates, mode/alternative/predictive support, Capacitor support, quotas, pricing and five-minute cache permission.
- Request CCTV metadata access separately; no confirmed key can be supplied until Mappls provisions that product.

See `mappls-access-request.md` for a draft to send. Nothing has been sent on the user's behalf.
