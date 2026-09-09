# NightWise live setup

> Latest 9 September update: all three keys are configured privately; billing and phone tests are deferred. Google requests and embedded maps are explicitly paused. The latest APK is output/apk/nightwise-prebilling-debug.apk (0.6.0-prebilling). Search, OSM road classification, rehearsal materials and source/deployment preparation are implemented. Read planning/nightwise-current-status.md for current acceptance status; older statements below are historical.


Current journey: AEOS (13.0628268, 77.5940888) to the supplied Manyata Tech Park pin (13.047697, 77.619939). Driving. The exact public gate and approach still need a local check.

## Google Cloud steps

Use project `sylvan-surf-508114-p1` in https://console.cloud.google.com/ . Billing is for the project owner to configure. No billing settings have been changed by this work.

1. In APIs and Services > Library, enable Maps JavaScript API, Maps SDK for Android, Routes API and Places API (New).
2. Browser key: restrict applications to Websites. For this local preview allow `http://localhost:4173/*`, `http://127.0.0.1:4173/*`, `http://localhost:5173/*`, `http://127.0.0.1:5173/*`. Restrict its API to Maps JavaScript API. Add only the final actual HTTPS site origin if hosting later. The supplied value is already in ignored `.env.local`; do not copy it into documentation.
3. Android key: restrict applications to Android apps, package `in.nightwise.demo`, and the SHA-1 of this APK's signing certificate. Restrict its API to Maps SDK for Android. The supplied value is already in ignored `.local/android-maps.properties`; Gradle reads it into the manifest when building. Read `output/apk/module-05-signing.txt` after this build for the exact certificate fingerprint.
4. Create a separate server key. Restrict its APIs to Routes API and Places API (New). Apply an IP-address application restriction for the backend's public outbound IP; for a laptop test that is the laptop network's public outbound IP, not 127.0.0.1. Update this restriction when moving to hosting. Do not reuse the browser/Android key for server calls.
5. Open `.env` in the project root in a local editor. Enter the server key after `GOOGLE_MAPS_SERVER_KEY=`. Do not put it in any VITE variable and do not paste it into a report, screenshot, or chat.
6. This session already has a local backend running. After changing `.env`, tell me to restart that instance so the new settings take effect. Do not start a second copy on the same port. For a fresh session with no backend running, use `Start NightWise API.cmd`. Reload http://localhost:4173 . Settings > Check connection reads configuration without calling Google. Switch to Live routes and compare once for the first real routing check.
7. Activity scanning is separately controlled by `ENABLE_ACTIVITY_ANALYSIS`. Opening-hours fields trigger the Nearby Search Enterprise SKU. Leave it false for the initial routing/key test; set true and restart when ready for the bounded activity test. The default maximum is 120 nearby requests per comparison, 600 across the entire pilot, and 10 route calls across the pilot. A full scan must fit the remaining budget or no nearby requests start. Failed attempts count and are never automatically retried.
8. `ENABLE_EXPERIMENTAL_SCORING` stays false until the documented provider-use and local-calibration work is resolved. Connecting credentials does not resolve those requirements. The live evidence/scoring code is present; a full PDF MVP still needs this validation.

The pilot ledger is `.local/pilot-budget.json`, containing counts only. It does not reset each day or on restart. Do not delete it to bypass limits. One backend process owns a lock; after an unexpected crash, verify that no old server process is running before removing a stale `.lock` file. Google Cloud quota controls should also be set conservatively in APIs and Services > each API > Quotas. A billing alert alone is not a hard spend cap. Map SDK loads are separate from the backend ledger: tutorial mode loads no map, and a live map is created only when opened.

## Android USB review

Connect the intended Android phone, enable Developer options > USB debugging and accept its authorization prompt. Use `scripts/connect-phone.ps1` to check for one authorized phone, install the new APK and forward the phone's local API port to this computer. The debug app permits cleartext only to loopback for this USB test. It does not enable general cleartext networking. A distributed live APK needs an HTTPS backend; the USB arrangement is not team hosting.

The client keys are application credentials and necessarily appear in the browser bundle or Android package. Restrictions protect their use. Server credentials remain server-only. No key values belong in recovery notes or Word handoffs.

## Official references checked 9 September 2026

- Routes request and field masks: https://developers.google.com/maps/documentation/routes/compute_route_directions
- Nearby Search fields and pricing tiers: https://developers.google.com/maps/documentation/places/web-service/nearby-search
- Key restrictions: https://developers.google.com/maps/api-security-best-practices
- Capacitor maps and Android transparency: https://capacitorjs.com/docs/apis/google-maps
- Maps handoff and waypoint limits: https://developers.google.com/maps/documentation/urls/get-started

No measured live route latency or cost is claimed until a real authenticated comparison succeeds. Current limits apply to this application, not to other uses of the same billing account.

## Hosting before team use

The current API is local and has not been deployed. A team live build needs one HTTPS backend instance, a persistent writable disk for BUDGET_LEDGER_PATH, exact allowed app/site origins, and a private team access code. Do not use an ephemeral or independently replicated budget ledger: it would lose or split the request allowance. Keep API keys in host secret settings and update the server key IP restriction for the host. Set VITE_ANDROID_API_BASE_URL to that HTTPS address and rebuild the APK before off-USB testing.

## Current switches before activation

The server credential is now present. Keep ENABLE_LIVE_REQUESTS=false, ENABLE_PLACE_SEARCH=false, ENABLE_ACTIVITY_ANALYSIS=false and ENABLE_EXPERIMENTAL_SCORING=false until the corresponding test is deliberately resumed. VITE_ENABLE_LIVE_MAPS=false prevents embedded map creation in the current web build and APK. Enabling maps requires rebuilding. No Cloud API test should be attempted while the user keeps billing paused. Search adds separate PILOT_AUTOCOMPLETE_LIMIT=40 and PILOT_DETAILS_LIMIT=20 counters; existing routeCalls=1 must be retained.
