# NightWise

Android-first Bengaluru route comparison preview for a small tutorial team. Version 0.8.0-team-preview. This is an experimental activity-information app; it does not measure personal safety, lighting or crime.

## Implemented

- Search Bengaluru origins and destinations, use a one-time location reading, swap endpoints, or reset to the supplied AEOS–Manyata preset.
- Confirm pins and available addresses before requesting alternatives.
- Inspect separate scan, opening-hours and road confidence; unknown evidence stays unknown.
- View listed open pharmacies, hospitals and petrol pumps, with estimated gaps between help points.
- Choose an additional travel-time allowance, save favourite places locally, and explicitly refresh comparisons.
- Persistent Black, Light and Blue themes, full intro video and immersive Android layout.
- Blue start pins, red destinations, yellow shops, pink medical places and green fuel stations, with a colour legend.
- Expand shop schedules to see current and regular weekly opening times, closed days and reported special dates in Bengaluru time. Missing schedules remain unknown; typical weekly estimates are labelled separately.
- Read the route strip from Start to Destination, with plain explanations of open places, few open places and missing information.

Google opening schedules are evaluated at estimated passing times. Live activity scores remain withheld: real scans still have incomplete opening hours, capped search coverage and missing road evidence. Community reporting is outside this version. Bengaluru Palace is an example search, not a preset with invented coordinates.

## Local setup

Use Node.js 22 or newer. Run `npm ci`, copy `.env.example` to a private `.env`, then run `npm run build` and `npm run preview -- --port 4173`. Start the API separately with `npm run server`. Tutorial mode needs no provider calls.

Live maps, routes, searches and activity scans each have explicit environment switches. Supply restricted credentials only in private configuration. Never put the server key in a `VITE_` variable. Request limits persist in the private budget ledger; do not reset the ledger to bypass a limit. Review cloud billing for actual charges.

Google favourites retain only place IDs and user-entered labels; details are resolved again when selected. User-entered pins and preferences remain on the device. Route and shop responses stay in session memory. This app does not build a permanent Google opening-hours database.

## Android build

Install a compatible JDK and Android SDK, configure `android/local.properties`, and run `npm run android:sync`. Add `GOOGLE_MAPS_ANDROID_KEY` to private `.local/android-maps.properties`, restricted to the package and signing certificate. Then run `android/gradlew.bat :app:assembleDebug` from the Android folder. The Windows helper `npm run android:build` expects the project-local toolchain under `.tools`.

For USB development, reverse API port 8787 with ADB. An installed app used away from the developer computer needs a reachable HTTPS backend and a build configured for that endpoint. This GitHub repository hosts source; it does not deploy that backend. Generated APKs, credentials, private notes and phone screenshots are excluded.

## Free Render with a persistent allowance

Deploy the `codex/journey-updates` branch as a Node web service with build command `npm ci --include=dev && npm run build:server` and start command `node build-server/index.mjs`. Set `HOST=0.0.0.0`, `PORT=10000` and a private `PILOT_ACCESS_CODE` of at least 16 characters. Use `/api/status` as the health path. Keep the Google request switches off during setup.

Set `UPSTASH_REDIS_REST_URL` to the HTTPS REST endpoint and `UPSTASH_REDIS_REST_TOKEN` to the normal write-capable token, without surrounding quotes. Both values are required together. The counter is stored under `nightwise:pilot-budget:v1`; no disk is required in this mode. Health output includes `budgetStorage` and `budgetReady`, without credentials or usage counts. A healthy process does not mean Google access or budget migration is complete.

Before activating the hosted service, stop local Google requests and migrate the latest four counters as one JSON string, with no expiry, using `SET nightwise:pilot-budget:v1 '<JSON copied from the stopped local ledger>' NX` in the private Redis console. This is a command template, not literal data: never initialize an existing pilot with zero counters or overwrite an existing Redis value. If the key already exists, inspect and reconcile it before continuing. The running app never creates or resets a missing counter. Preserve the approved cumulative limits; hosting is not a fresh allowance.

Reservations are atomic across instances. A database outage, invalid counter, expired key or uncertain reservation blocks the subsequent Google request. Writes are not automatically retried. Route and shop data are not stored in Redis. Free Render can take time to wake from inactivity; validate the cold-start experience before sharing the final HTTPS-configured APK.

## Verification and limitations

Run `npm test` for unit/backend checks. With the preview on port 4173 and live maps disabled, run `npx playwright test` for browser checks. Set `PLAYWRIGHT_BASE_URL` to use a separate test preview while keeping a live preview enabled. Run `npm run build:server` to bundle the API.

The preview has been exercised on a Redmi Android 10 phone. Physical Back-button and GPS acceptance, public entrance checks, exact external Google Maps route preservation and real journey validation remain release requirements. The local road extract covers North Bengaluru; other Bengaluru journeys can return routes with missing road evidence. Long journeys can exceed scan allowances and show no activity comparison.

The source includes OpenStreetMap-derived data with attribution in the app and data files. Optional iOS packaging and public app-store release are not included in this preview.




