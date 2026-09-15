# Safety Score implementation and hosting status

## Implemented locally

The user's 16 September decision is to include traffic-camera evidence in the Safety Score. This supersedes the earlier proposal to keep cameras separate from scoring. The Google and Geoapify bookmarks remain intact; no deployment or push was performed.

The existing animated ring now says **Safety Score**, with up to seven signals. With all seven present, weights total 100: open places 21.25, main roads 17, help points 12.75, continuity 12.75, fewer turns 12.75, transport 8.5, camera coverage 15. The six previous signals retain their relative weights, so the score is unchanged when cameras are unavailable. Only signals present for every compared route participate; available weights rescale to 100. Consequently cameras may contribute more than 15% if some other signals are missing. This is disclosed in the method, not a fixed 15-point cap.

The camera component averages (1) camera density, capped at two mapped cameras per kilometre, and (2) the fraction of one-kilometre route sections containing a mapped camera. These are product heuristics, not empirically validated crime-risk coefficients. A higher score is not a guarantee of safety. The recommendation retains the existing detour preference and requirement for comparable opening-hours evidence.

Evidence must identify the exact route geometry and provider route association. Records with repeated IDs or positions within 20 metres are deduplicated. A 40-metre geometry check rejects mismatched pins; it does not establish which parallel road a camera observes. Provider route association is required before this check. Speed breakers and unclassified reports do not earn camera points. Freshness is less than five minutes, and report expiry may invalidate sooner. Complete empty results count as zero; partial, missing, malformed, future-dated and stale evidence is excluded.

The map adapter supports cyan camera markers, a camera-layer toggle, and per-route camera count/density. The score and pins update locally at evidence expiry without background API calls. Optional malformed camera results cannot invalidate otherwise usable live route results. The response parser targets the documented Mappls Route Report Summary schema and requires an explicitly confirmed camera category allowlist and expiry unit.

## Not connected yet

**There is no live camera feed in this build.** The parser and display path are prepared, but the backend does not call Mappls route reports. No real camera pins or counts have been invented. The restored branch still uses the Google map/backend adapter; completing Mappls routing, maps, place coordinates/hours and report transport remains migration work. This score change does not complete that migration.

The successful Mappls route sample in `.local/mappls/route-response.json` had no provider `routeId`. Both the [Web Route Events Summary plugin](https://developer.mappls.com/documentation/sdk/Web/Mappls%20Web%20Plugins/routesummary/readme/) and [Android Route Report Summary](https://developer.mappls.com/documentation/sdk/android/docs/v2.0.2/Route-Report-Summary/) require it. The docs do not confirm our camera category IDs or account access. Navigation SDK advertising camera alerts does not prove our credentials expose those reports. We have not received a separate CCTV key.

Before connecting the feed, Mappls must clarify the routing request that returns the report-compatible routeId, entitlement for Web/Cloud or the Android bridge, camera category IDs, expiry units, response completeness/pagination and display/cache permissions. An empty or denied report response must not be called "no cameras". Shop coordinates/hours access is a separate outstanding requirement. See `mappls-access-request.md` for the prepared, unsent request.

## What to change in Render now

**Nothing for this local score change. Do not switch the deployed provider or build commands yet.** The currently hosted Geoapify branch and this Google-checkpoint-based Mappls development branch are different implementations. Publishing this unfinished migration would replace the hosted provider before parity is ready.

- Keep existing provider keys and environment values. They are required for the running service and rollback. Do not delete Google or Geoapify credentials.
- Keep `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` as they are.
- The code uses `ENABLE_EXPERIMENTAL_SCORING=true` to enable server scoring when this branch is eventually deployed. Keep `ENABLE_LIVE_REQUESTS`, `ENABLE_PLACE_SEARCH` and `ENABLE_ACTIVITY_ANALYSIS` enabled for those features, but changing these now does not connect Mappls cameras.
- `PILOT_ACCESS_CODE` is ignored by the new local branch; removing it from the current deployment is not required for this score change. Only remove it when deploying a version that has removed the gate.
- Do not add a made-up CCTV environment key. The private Mappls keys are saved locally, but `MAPPLS_SERVER_KEY` / `VITE_MAPPLS_WEB_KEY` are not yet consumed by the running provider implementation. Adding them to Render alone cannot activate Mappls.
- Before the eventual migration deploy, use the hosted HTTPS backend URL for Android, and configure origins for the actual web domain and Android WebView (`https://localhost`, or the app's actual configured scheme). CORS origins identify app origins, not a user's phone IP or Wi-Fi. Use the app package/signing certificate for native SDK credentials and the deployed web domain for web keys.

## What to change in Upstash now

**Nothing.** Keep the existing database, REST URL/token and all allowance counters. Do not flush the database, delete counters, recreate credentials or assign a five-minute expiry to spending ledgers.

This change adds no camera API calls and no Redis keys. Five-minute comparison reuse currently happens in device session memory. When the real report transport is connected, introduce a separate bounded camera-request budget and, if Mappls permits shared caching, separate cache records with expiry. Those records must be keyed by provider route ID, route index, category set and relevant route context; they must never reuse camera results across different alternatives. Reserve allowance before calls, request only displayed routes, and reuse results when the user switches route selection. A later request after five minutes must fetch fresh evidence. Do not scan the entire 20 km area for each journey.

## Validation

Compilation, offline unit checks and production bundles are checked locally. Synthetic camera fixtures test validation and scoring; they do not establish live camera availability. Browser and phone checks remain with the user. Results: TypeScript compilation passed; the full offline unit suite passed 208 checks across 26 files, and the camera suite then passed all 8 checks after adding a further recommendation regression case (209 distinct passing checks). Frontend production build and server bundle passed. Vite still reports the existing non-blocking warning for a JavaScript chunk larger than 500 kB. No live camera requests, browser/phone tests, APK build, push or deployment were performed.
