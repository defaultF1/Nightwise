# Deploy the Geoapify website and API

This guide supersedes the local-only migration checklist. The Google backend is retained for rollback.

## Render settings

Use the existing Node web service. Change these settings and deploy the latest commit:

| Setting | Value |
| --- | --- |
| Branch | `codex/map-replacement-research` |
| Build command | `npm ci --include=dev && npm run build:hosted` |
| Start command | `npm run start:hosted` |
| Health check path | `/api/health` |

Keep the existing repository root setting if it already builds Nightwise from the repo root. This runs the website and backend on one HTTPS address.

## Environment variables

| Name | Value/action |
| --- | --- |
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `NODE_VERSION` | `22` |
| `GEOAPIFY_API_KEY` | Keep the private key already added |
| `PILOT_ACCESS_CODE` | Keep your existing team code, 16–120 characters |
| `UPSTASH_REDIS_REST_URL` | Keep your existing HTTPS REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Keep your existing read/write REST token |
| `PORT` | Leave Render's supplied value |
| `ALLOWED_ORIGINS` | Keep existing entries. The Render service URL is included automatically through `RENDER_EXTERNAL_URL`. Add any custom website domain as an exact HTTPS origin. Native localhost origins are included automatically. |

Keep Google keys and `PILOT_*` settings for rollback. They do not control Geoapify limits. The hosted build selects Geoapify and its team-code screen automatically and clears old browser API URL / Google browser map key overrides for that build. Never put server keys, team codes or Upstash tokens into `VITE_*` variables.

## Upstash

Use the existing database. Startup initializes `nightwise:geoapify:usage:v1` with SET NX only if absent; it does not overwrite existing counts. The Google key `nightwise:pilot-budget:v1` remains untouched. Both records have no expiry.

Every uncached upstream request is reserved atomically before dispatch, including tiles. Invalid/expiring records or Redis failures stop upstream calls. Do not delete counters to restart the allowance; raise the cumulative configured limit after reviewing actual provider usage. Earlier local preview usage is not imported into the new hosted-provider ledger and still counts toward provider billing.

Optional cumulative production trial limits:

| Variable | Default |
| --- | ---: |
| `GEOAPIFY_ROUTE_LIMIT` | 500 |
| `GEOAPIFY_NEARBY_LIMIT` | 5000 |
| `GEOAPIFY_DETAILS_LIMIT` | 500 |
| `GEOAPIFY_AUTOCOMPLETE_LIMIT` | 500 |
| `GEOAPIFY_TILES_LIMIT` | 20000 |

These are request ceilings, not purchased credits or a daily reset. Geoapify billing and plan quotas still apply. JSON responses use a five-minute cache and tiles up to 24 hours. The bounded in-memory cache clears on restart; Redis usage counters persist. Search sessions and active comparisons are process-local, so use one Render instance for this team trial.

## Verify deployment

1. Open the public HTTPS service URL on a phone using mobile data.
2. Enter the team code once. It is remembered on that browser/device.
3. Check AEOS to Manyata: map preview, route comparison, coloured pins, route-line selection, estimated scores, fullscreen and Mappls handoff.
4. `/api/health` should show `provider: geoapify`. `/api/status` should show `ready: true`, `accessCodeRequired: true`, `budgetStorage: upstash`.
5. Restart/redeploy and verify that the stored counters and saved team code still work.

The public website works on modern Android and iPhone browsers over any internet connection without the developer laptop. The supported journey area remains 20 km around AEOS; this is not worldwide routing coverage. Opening hours remain incomplete and travel times use approximated traffic rather than verified live traffic measurements.

The old APK contains the old frontend. A future Geoapify APK needs the public URL in `VITE_ANDROID_API_BASE_URL`; do not use `build:hosted` for an APK because that command targets same-origin browsers. Mappls native launch still needs phone testing. Using the website does not require an APK.

Render free services may sleep when inactive, so first use can wait for startup. Always-on hosting requires an appropriate paid Render plan selected by the user. No billing changes are made by this code.

References: [Render web services](https://render.com/docs/web-services), [Render environment variables](https://render.com/docs/configure-environment-variables), [Upstash REST API](https://upstash.com/docs/redis/features/restapi).
