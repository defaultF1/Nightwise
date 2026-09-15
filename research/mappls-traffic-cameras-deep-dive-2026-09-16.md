# Mappls traffic cameras: integration research and Render settings

Researched 16 September 2026. Scope: the speed-camera and traffic-monitoring locations visible in the Mappls consumer app, with priority around AEOS–Manyata and Kanpur. Sources include official product pages, current public SDK documentation and sample code, plus a fresh read of the user's signed-in Edge console. No camera API entitlement was purchased, support message sent or deployment changed.

## What the consumer app actually offers

Mappls explicitly describes speed-camera location notifications and traffic-camera/monitoring alerts in its consumer app. Its product page attributes these to a traffic-camera and monitoring-system database covering India. This supports the user's observation. The page does not publish the inventory, a location-verification date, or a promise that every consumer marker is exposed under a basic developer key. [Consumer app feature description](https://about.mappls.com/app/)

The developer Navigation SDK separately advertises upcoming traffic-camera warnings, alongside road hazards. Therefore this is also a developer product capability, rather than exclusively a feature of the consumer app. Availability under NightWise's current credentials still needs confirmation. [Navigation SDK](https://about.mappls.com/api/navigation-sdk/)

The Post on Map widget documents Traffic Monitoring subcategories for red-light/speed cameras and accepts user reports. This means the report system can include crowdsourced camera locations. We must establish whether an entitled feed contains the curated inventory, user reports, or both. A published report is not proof that a camera is recording. [Report categories](https://developer.mappls.com/documentation/sdk/widgets/mappls-post-on-map/)

## Strongest integration options

### 1. Web Directions Plugin with route reports: first prototype

Mappls publishes a specific **Direction With EventsAlongTheRoute** example. Its directions options include `Resource: 'route_eta'`, `annotations: 'nodes,congestion'`, and a `routeSummary.summarycallback` callback. This combines directions and reports in one SDK flow. It is a better first experiment than inventing a report-compatible ID from our local route IDs.

The related standalone plugin uses `mappls.routeSummary` with a Mappls map and provider `routeId`; optional route index and categories narrow results. It loads through the normal static `access_token`, with `libraries=routesummary`. There is no separately documented CCTV-key field in this example. [Official directions/report example](https://about.mappls.com/api/web-sdk/vector-plugin-auth2/Direction/mappls-event-alongtheroute-direction-plugin), [standalone plugin](https://github.com/mappls-api/mappls-web-plugins/blob/main/routesummary/readme.md)

Engineering inference: start with the integrated directions example so the SDK can manage its route/report relationship. Confirm the callback payload, per-alternative association, camera categories and whether default plugin UI can be hidden while retaining our existing route cards. The public example establishes the integration mechanism; it has not been run using NightWise's key and does not prove dataset parity.

For the React/Capacitor app, this could preserve our existing layout with a Mappls WebGL map and custom markers. Android WebView authentication and allowed origin must be checked with Mappls; a normal website domain registration does not automatically establish WebView support.

### 2. Android Directions Widget: native fallback

The current Android documentation exposes `showRouteReportSummary(Boolean)` and `showRouteReportSummaryOnMap(Boolean)`. These are directly relevant to displaying road reports during route planning. [Directions Widget options](https://github.com/mappls-api/mappls-android-sdk/blob/main/docs/v2.0.3/Direction-Widget.md)

This would require a native Capacitor bridge or native map view. The drop-in widget brings its own UI, so custom map rendering plus report callbacks is preferable if exact NightWise layout parity is required. The two private Android configuration files already downloaded are SDK initialization inputs; they are packaged with the app, not pasted into Render environment fields.

### 3. Route Report Summary: strongest input for route scoring

The Android API accepts a provider route ID, selected-route index and category filters. Its documented records include coordinates, category identifiers, publication status and expiry. This association is the best fit for counting cameras along each displayed alternative. It avoids assigning nearby parallel-road cameras to a route just because they are close geometrically. [Route Report Summary](https://developer.mappls.com/documentation/sdk/android/docs/v2.0.2/Route-Report-Summary/)

Our earlier Cloud `route_eta` response did not contain a report-compatible route ID. The current Android sample has a `routeRefresh` setting, but its builder call is commented out; that is not evidence of a supported REST fix. Ask for the correct API/SDK route-ID contract, or let the integrated Directions Plugin own that flow. Do not add guessed routing parameters.

### 4. Nearby Reports: map exploration layer

`MapplsNearbyReport` accepts a geographic bounding box. The official Android demo retrieves reports within a selected box and creates map markers from their coordinates. This is suitable for an optional visible-area Traffic cameras / Road hazards layer. [Nearby Reports documentation](https://developer.mappls.com/documentation/sdk/android/docs/v2.0.2/Nearby-Report/), [official demo source](https://github.com/mappls-api/mappls-android-sdk/blob/main/app/src/main/java/com/mappls/sdk/demo/activity/restapis/NearbyReportActivity.kt)

Engineering decision: nearby reports can populate exploration pins, but cannot establish road-specific camera coverage without reliable route/road association. Keep them out of the route score until matched. Bound requests to the displayed area, debounce map movement, cancel superseded requests and cache briefly when permitted.

### 5. Full Navigation SDK: optional later step

Its traffic/safety event callbacks are relevant if NightWise later provides embedded turn-by-turn navigation. We should first obtain camera data for the comparison screen; adding a whole navigation engine is unnecessary if the report APIs provide the required records. Continue external navigation handoff in the initial migration.

## The access issue is now better documented

The official Android SDK method matrix marks **Report Category Master**, **Nearby Reports**, **Route Report Summary**, **Navigation Traffic/Safety Events** and **MapEventsPlugin** as **not allowed in the freemium plan**. Mobile Maps SDK initialization alone does not grant every method. This is published plan information, not a measured denial for our account or an exact price quote. Request a trial or commercial allocation for the required methods. [SDK access matrix](https://github.com/mappls-api/mappls-android-sdk/blob/main/docs/v2.0.3/sdk_methods.md)

Fresh Edge console inspection found 20 Web APIs and 31 Cloud APIs, with no explicitly named Report Category Master, Nearby Reports or Route Report Summary entry. Web showed Mobile Maps SDK and Intouch SDK allocations. The Cloud list contains generic `getEvents` and device/alarm services; their names do not establish traffic-camera inventory access. Nothing was enabled, bought or removed.

**Report Category Master** is an important additional request: it should supply the category identifiers, avoiding guessed numeric camera codes. Exact classification, licence permissions and whether all consumer-app cameras are included must come from Mappls.

## Render: exact credential mapping

The following are the intended migration variable names. They are already used as names in our private saved credential file, but **the current application provider does not consume them yet**. Adding them now will not activate Mappls or cameras. Prepare them for the migration deployment; keep the currently working service configuration unchanged.

| Variable / file | Where its value comes from | Where it belongs |
|---|---|---|
| `MAPPLS_SERVER_KEY` | Console → Applications → NightWise Backend → Credentials → Static Key | Render backend secret, once the Mappls server adapter is wired |
| `VITE_MAPPLS_WEB_KEY` | Console → Applications → NightWise Web → Credentials → Static Key | Frontend build environment; Render only if Render builds that frontend. APK builds need it locally if using the Web SDK |
| `a.conf`, `a.olf` | NightWise Android → Config Files | Native Android SDK asset/configuration files, not Render variables |
| `UPSTASH_REDIS_REST_URL` | Existing Upstash database | Keep the existing Render value |
| `UPSTASH_REDIS_REST_TOKEN` | Existing Upstash database | Keep the existing Render value |

`VITE_` values are compiled into frontend assets: only the domain-restricted Web key belongs there. Keep the Cloud key server-side. One appropriately entitled static key can access multiple services; a new key per shop, hospital, route or camera category is not required by the documented plugin flow. Do not create `CCTV_API_KEY` or `MAPPLS_CCTV_KEY` as if a distinct product credential had been issued.

Keep Google/Geoapify environment values for the deployed service and rollback. Keep the existing app feature flags and budgets. No Render setting can grant a Mappls entitlement. Do not switch the provider, build command or branch until the actual migration is ready.

## Upstash and API cost plan

No Upstash changes are needed for this research or the prepared score code. Do not delete or reset allowance records.

After access is confirmed, reserve a separate camera-request allowance before requests. Query only displayed alternatives, share an in-flight request when identical comparisons overlap, and reuse camera results on route selection. If Mappls permits server caching, key it by provider, route ID, route index and category set, with at most five minutes of freshness and earlier expiry for expiring reports. Cache expiry and cumulative spending counters must be separate. A later user request after expiry obtains fresh data; no background city-wide polling is required.

A new API fetch means newly fetched provider data, not that each physical camera was inspected today. Display source verification dates only when supplied. No official source reviewed establishes a latest verification date or a camera count for our two pilot areas.

## Rollout gates

1. Obtain report/category access and confirmation that the feed includes the traffic cameras seen in the consumer app. Confirm permitted use in NightWise's Safety Score and caching/attribution requirements.
2. Run one bounded AEOS–Manyata comparison through the entitled integration. Capture route IDs, category values, coordinates and timestamps privately; verify each alternative's records. Repeat for a representative Kanpur journey.
3. Connect the real payload to the prepared normalizer. Preserve the same shop/hospital/pharmacy/fuel pins and verify separate POI coordinates/hours access. Add cyan traffic-camera markers and route counts.
4. Use route-associated camera evidence in the existing seven-signal Safety Score. Keep missing/incomplete evidence excluded, deduplicate locations and expire old records. Nearby exploration pins alone do not earn score points.
5. Complete compilation and offline checks; provide the local preview/APK for the user's phone checks. Only then prepare the actual Render deployment settings. Keep both previous bookmarks.

## Exact request to send Mappls (prepared, not sent)

To: apisupport@mappls.com

Subject: NightWise — traffic-camera dataset and Route Report access for Android/Web

We want to show the speed cameras, red-light/traffic-monitoring camera locations and road hazards visible in the Mappls consumer app inside NightWise's route-comparison screen, before navigation starts. We use React/Capacitor Android (`in.nightwise.demo`) and have NightWise Web, NightWise Backend (Cloud) and NightWise Android registrations.

Please provide trial access or pricing for Report Category Master, Nearby Reports, Route Report Summary / Web Directions Plugin route-summary callbacks, and Navigation Traffic/Safety Events only if required for this dataset. Confirm whether these expose the same camera inventory as the consumer app or only user-submitted reports, and whether our existing static keys/config files can be enabled.

Please supply camera category IDs, report-compatible routing/routeId instructions, callback/API schemas, expiry units, pagination/completeness semantics and available verification timestamps. We need coverage examples around AEOS–Manyata in North Bengaluru and Kanpur, approximately 20 km in each priority area. Please confirm permission to show custom camera markers, use camera density as one component of our Safety Score, and cache responses for up to five minutes. Also confirm Web SDK authentication inside Capacitor's Android WebView and whether a server-side report API is available.

We want camera locations and report metadata, not video feeds. Please identify the minimum allocation that supports this and any additional costs. Do not activate a paid plan without our approval.
