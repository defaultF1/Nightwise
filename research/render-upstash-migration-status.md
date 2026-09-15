# Render and Upstash: map replacement checkpoint

This is the historical pre-hosting assessment. For the implemented production setup, use [Render hosted setup](render-hosted-setup.md).

Checked against the repository on 15 September 2026. Dashboard settings have not been inspected or changed. This branch is a GitHub checkpoint of the local Geoapify preview, not a completed production migration.

## What to keep now

- Keep the existing Render service, linked production branch, build/start commands and environment variables until a hosted Geoapify version is tested.
- Keep `GOOGLE_MAPS_SERVER_KEY`, existing Google browser-map configuration, `PILOT_ACCESS_CODE`, `ENABLE_*`, `PILOT_*`, `MAX_NEARBY_QUERIES`, road-data paths and `ALLOWED_ORIGINS`. The Google backend still reads these settings.
- Keep `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, the database and its existing counter record. Never copy a private token into a `VITE_*` variable.
- Keep local private `.env` files and `.local/geoapify.env` out of Git. `.env.example` is a tracked template, not a credentials file.

Upstash is currently the Google backend's persistent request counter: it remembers how many API calls have been used across server restarts and reserves calls atomically across instances. It is not the current five-minute places/results cache. The Geoapify preview does not read the Upstash variables.

The Google counter key is `nightwise:pilot-budget:v1`; it must have no expiry. Do not delete/reset it as part of changing the map. Retain those totals if changing allowances. The current Google config ceilings are 500 Routes, 20,000 Nearby, 500 autocomplete and 500 details calls; these are application limits, separate from provider billing and quotas.

## Why changing environment variables alone is insufficient

| Area | Current implementation | Required before hosted Geoapify testing |
| --- | --- | --- |
| Server startup | `server/geoapify-index.ts` binds to `127.0.0.1:8788` | Honor Render's `PORT` and listen on `0.0.0.0`; retain loopback defaults locally |
| Build/start | `build:server` still builds the Google entry point | Add explicit Geoapify production build/start commands |
| Access | Only localhost port 4176 origins; team access code not enforced | Configure web/native origins and enforce team access for paid API operations, including map tiles |
| API URLs | Geoapify requests use the page origin; tiles use `location.origin` | Support a hosted API base consistently for comparisons, place search, reverse geocoding and tiles, including Android |
| Usage storage | `.local/geoapify-usage.json` on the server filesystem | Add a persistent Geoapify counter store, preferably the existing Upstash database with a separate key; include tile calls |
| Allowances | Hardcoded Geoapify limits | Add validated Geoapify-specific settings; do not assume Google `PILOT_*` values affect this provider |
| Data files | Local road and place data | Verify required tracked data files load from the deployed working directory |

Current Geoapify limits are 150 route, 300 nearby, 100 details, 150 autocomplete and 1,500 tile requests. These count attempted upstream requests, not exact Geoapify credits, and do not reset daily automatically. JSON responses are cached for five minutes and tiles for 24 hours in process memory; restarting loses that cache.

## Settings for the future hosted trial

These are preparation notes, not instructions to switch the existing service now.

1. Use a separate Render trial service or staging environment to preserve the working Google service during verification.
2. Set the server-side secret `GEOAPIFY_API_KEY`. The current Geoapify entry point already reads this name, but the hosting gaps above still need implementation.
3. Wire the existing `PILOT_ACCESS_CODE`, allowed origins and Upstash REST credentials into the Geoapify server. Use a separate counter key from `nightwise:pilot-budget:v1`; a configurable Geoapify key is not implemented yet.
4. Build the frontend with `VITE_MAP_PROVIDER=geoapify`. Implement and test hosted URL support before relying on `VITE_API_BASE_URL` / `VITE_ANDROID_API_BASE_URL`: the current Geoapify path ignores these variables.
5. Verify map tiles, destination search, address lookup, three-or-fewer distinct provider routes, line selection, place pins/hours, labelled estimated scores, caching, access control and persistent counters. Test Mappls handoff on an actual phone; outgoing links do not require a Mappls API key.
6. Only after that verification, decide whether to change the production linked branch/service and build a phone APK against its public API URL.

Render requires public web services to bind on `0.0.0.0` and provides a port through `PORT`: [Render web services](https://render.com/docs/web-services). Its Environment page supports Save only, Save and deploy, or Save, rebuild, and deploy; frontend build-time settings require rebuilding: [Render environment variables](https://render.com/docs/configure-environment-variables).

The existing database's REST endpoint and token are available in Upstash's console: [Upstash REST API](https://upstash.com/docs/redis/features/restapi). There is no need to create a second database just to support another provider; separate counter keys can share the existing database once the integration is implemented.
