# Mappls console setup — 16 September 2026

Configured through the user's signed-in Edge session. No changes to Render, Upstash or deployed app code in this setup step.

## Applications

- **NightWise Web**: Web application, active. Domain `nightwise-f5fu.onrender.com`. IP field left empty. The domain restriction identifies the website, not the user's network or device.
- **NightWise Backend**: Cloud application, created successfully and active. IP field left empty. Keep its static key exclusively on the backend. A future server-IP restriction would identify backend egress, not restrict end-user networks.
- **NightWise Android**: existing Android entry renamed from `Nightwise Web`. Package `in.nightwise.demo`. Signing certificate field populated using the SHA-256 fingerprint from `.tools/android-user/debug.keystore`, the keystore associated with the project's Android build environment. This is an app-signing identity, not a phone identifier. Update the registration if the signing certificate changes for release distribution.

## Verified allocations

- Web: 20 active API allocations, including map initialization, vector tiles, autosuggest, geocoding/reverse geocoding, nearby search, route POIs, Place Detail, Route ADV and Route ETA.
- Backend: 31 active API allocations, including search, route POIs, Place Detail, Route ADV and Route ETA. Traffic-optimized Route Traffic was not listed on this Cloud app; traffic-adjusted ETA and traffic-optimized routing must not be conflated.
- Android: 33 active API allocations, including Route Traffic, Route ETA, route POIs and Place Detail. Two SDK allocations: Mobile Maps SDK and Intouch SDK.
- No explicitly named CCTV, speed-breaker, Route Reports or predictive-departure product was visible in the reviewed allocations. Other generic tracking/event products are not evidence of those datasets.

## Pending integration

The Android configuration archive was found in the user's Documents folder and passed ZIP integrity checking. Its `.a.conf` and `.a.olf` files were copied to `.local/mappls/android/a.conf` and `.local/mappls/android/a.olf`; both paths are ignored by Git. These files are staged privately for integration, not yet wired into the Android SDK. The separate Web and Cloud keys were copied through Edge into ignored `.local/mappls/web-key.txt`, `server-key.txt` and `credentials.env`. No credentials were committed or added to frontend source.

## Direct account checks

Three narrowly scoped Cloud requests were made on 16 September to verify the actual credential/response contract, separately from user-facing app testing:

- Routing `route_eta/driving` for AEOS–Manyata: HTTP 200, two routes with geometry, duration and distance. No route ID was present in the returned top-level or route fields.
- POI Along the Route, fuel category `TRNPMP`, 150 m buffer around the first returned route: HTTP 200, three listings. Fields include place ID, name, address, distance and category; no coordinates or hours.
- Place Detail for one of those returned listings: HTTP 200, only `address`, `name` and `eloc`. No coordinates or hours. This is a sample observation, not an audit of every listing.

Official Place Detail documentation labels Location Coordinates as subtemplate 5, an additional entitlement: https://developer.mappls.com/documentation/sdk/rest-apis/mappls-maps-place-details-api-example/Readme/

No further scans were run. Raw diagnostic responses are stored privately under `.local/mappls/` for this integration check; they are not a verified place inventory.

## Public-access code change

Removed startup loading of saved team codes, the Settings code field and backend team-code checks. The migration branch ignores legacy `PILOT_ACCESS_CODE` and reports `accessCodeRequired: false`. Existing rate limits, budgets and supported-region validation remain. The Android example API base now uses the HTTPS hosted address; the actual private environment files already use that address. Both 20 km service circles remain defined in `src/domain/journey.ts`.

TypeScript, frontend production build and server bundle passed. Vite retained a non-blocking large-chunk warning. Existing test expectations were updated for public access, but the test suite and browser/phone tests were not run, following the user's preference.

Render and Upstash have not changed. Do not remove settings from the currently deployed Geoapify service merely because this local branch changed: its deployment still runs different code. The user will apply hosting instructions after the Mappls implementation is ready.

Console setup alone does not migrate the app. Remaining work includes retrieving configuration, implementing Mappls renderer/native bridge and server adapters, preserving route/place/score behavior, validating build errors, and packaging a new APK. The existing published APK is still the Geoapify build. The Google source checkpoint and Geoapify bookmark remain preserved.

The user performs interactive phone testing. Do not describe enabled allocations as verified API responses or confirmed opening-hours coverage.
