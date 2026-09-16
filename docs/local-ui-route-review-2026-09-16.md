# Local score, controls and route-choice revision

This revision stays local. It does not deploy Render, push to GitHub or change the previously delivered APK.

## Score

The shared frontend/backend formula is now `night-activity-v8-weighted-listings`; see [the v8 method](night-activity-score-v8.md). It applies across supported journeys and all three travel modes. It is not an AEOS-only uplift. Weights remain fixed and sparse factors are not rescaled to 100. More estimated listings can earn meaningful activity points while supplied opening schedules still carry more weight. The UI explains that a low activity score is not a conclusion that a road is unsafe.

## Controls and Android navigation

One in-app listbox component handles travel mode, departure, extra time (0/5/10/15/20 minutes), tutorial scenarios and navigation choice. It supports keyboard navigation, Escape, Android Back, outside taps and scrollable options. Travel and departure controls share the same dimensions, including after a longer departure label is selected. Car and Leave now remain defaults.

Android checks the enabled installed packages for the two supported route integrations: Google Maps (`com.google.android.apps.maps`) and Mappls (`com.mmi.maps`). Only detected choices appear. It checks again when the sheet opens or the app resumes, and handles uninstall between detection and launch. It does not enumerate every app on the device or upload the installed-app list. Existing manifest package queries are sufficient; no broad package-list permission is added. See [Android package visibility documentation](https://developer.android.com/training/package-visibility/declaring).

The browser offers directions websites with explicit wording; it does not claim to detect installed apps. An empty Android list offers a browser fallback. Existing origin/destination/mode/via-point handoff rules remain. Actual reception by another app still needs a physical phone check.

## Map panel

The header, route buttons, endpoints, legend and nearby-place sections now use one surface and consistent padding. Legends use two columns; camera details are shorter and remain attributed. Endpoints join route geometry when fitting the viewport, so a snapped road endpoint cannot leave the user's actual pin cropped. Light-theme route overlays are narrower than the selected route so its outline remains visible. Handoff content remains scrollable to the bottom action.

## Search for a second route

Requests use balanced/short preferences for all modes and fewer-turn/highway preferences only for supported driving mode. If only one distinct route remains, up to three searches avoid interior points on that route, then up to two try passing through a nearby point on either side. These are bounded provider routing requests; there are no invented route lines. Fallback routes must preserve endpoints, have at least 15% different roads, stay within detour limits, and avoid substantial out-and-back excursions for the via-point fallback.

The worst case is nine route API requests for driving, seven for bike/walk. Search previews remain a single request. Existing caching and budget reservations apply. Request counts are not exact Geoapify billable credits: avoidance can add credits. See [Geoapify routing documentation](https://apidocs.geoapify.com/docs/routing/).

An actual provider check for AEOS → Phoenix Mall of Asia (13.070634, 77.590775) returned:

| Mode | Fastest | Alternative |
| --- | --- | --- |
| Car | 18 min, 2.353 km | 25 min, 3.010 km |
| Bike | 18 min, 2.353 km | 25 min, 3.010 km |
| Walk | 21 min, 1.231 km | 27 min, 1.602 km |

These were route-only provider checks on 16 September 2026, not a fresh place scan or field drive. One preliminary via-point result retraced approximately 724 m and was rejected. A second usable route cannot be guaranteed for every endpoint pair; the app keeps the usable first route and explains the limitation after exhausting its bounded search.

## Verification

263 unit/backend tests passed. Nineteen focused browser cases cover the score, all themes, departure payload, persistent extra-time choices, installed-app list states, handoff URLs and map layout/full-screen behavior. One obsolete text assertion was corrected and the affected cases rerun successfully. TypeScript, the hosted web/server build, and Android `compileDebugJavaWithJavac` passed. Android installed-app cases simulate the bridge; they do not replace physical-phone acceptance.

The grid visible in the geometry/layout test screenshot is a test tile, not the production map. Production continues to request Geoapify street tiles. The selected departure label omits the timezone suffix while calculations retain the service timezone. The local review website is `http://127.0.0.1:4189/` while its development server is running.
