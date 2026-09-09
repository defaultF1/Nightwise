# NightWise rehearsal and phone checklist

Updated 10 September 2026. Version 0.6.2 passed 21 recorded Redmi 9 checks. Android Back and native GPS grant/denial still need manual verification. The phone is currently disconnected. No completed field rehearsal is claimed.

## Review without billing

Use http://localhost:4173 or install output/apk/nightwise-0.6.3-debug.apk. Start in Tutorial mode. All Google requests and embedded map creation are paused in this build. A tutorial illustrates behavior; its paths, scores and durations are not real AEOS–Manyata measurements.

1. Launch normally and watch the complete local intro. Confirm there is no Skip button; test Settings > Replay intro and reduced-motion behavior.
2. Open the destination picker, type “manayata”, select Manyata Tech Park, and confirm Tutorial mode remains selected. Search an unknown name and verify the clear paused-search message. Coordinate entry remains available.
3. Compare the supplied AEOS–Manyata tutorial. Select each route and explain the time difference. Open activity details and identify open, closed and unknown observations, longest stretch and total low-activity distance.
4. In Settings > Tutorial scenarios, check incomplete data, all evidence unavailable, places closing soon, similar activity, a large detour, one route, no routes and connection failure. Missing evidence must never become zero activity or a safety guarantee.
5. Change among Blue, Mono Light and Mono Dark. Close and reopen; verify the chosen appearance persists. Check scrolling and buttons at normal and enlarged text sizes.
6. Open the handoff sheet and inspect its explanation. The actual external Google Maps app is a separate service; the tutorial sends endpoints, never its fictional path. No paid API call is needed to construct that link.

## Intended phone review when connected

Reconnect the phone for the remaining manual checks and the 0.6.3 regression. Enable Developer options and USB debugging, then accept the computer's prompt. From the project folder run `powershell -ExecutionPolicy Bypass -File scripts/connect-phone.ps1 -Install`. This installs the latest prebilling APK on exactly one authorized device and sets up local USB forwarding. It does not activate Google billing or API calls.

Record device model, Android version and APK version without a serial number. Check portrait and landscape, keyboard scrolling, launch playback, theme persistence, location denial, approximate location and one-time location grant. Location is optional and never tracked in the background. Use Android Back from every sheet, results, loading and the home screen. Background/resume must not create a new comparison automatically.

Once billing is separately enabled, verify native map visibility, map touch beneath sheets, the stale-result refresh message and external Google Maps launch with and without the Maps app installed. If a phone is unavailable, mark each device result NOT TESTED rather than inheriting browser results.

## Reel sequence around forty five seconds

| Time | Screen or action | Suggested narration |
| --- | --- | --- |
| 0–4 seconds | Launch and home | “This is NightWise, built around our Bengaluru commute.” |
| 4–10 seconds | AEOS to Manyata | “Choose your starting point and destination.” |
| 10–20 seconds | Route cards | “Compare the travel time and available activity evidence.” |
| 20–30 seconds | Details and unknown evidence | “Look at listed open places and longer low-activity stretches. Missing information stays unknown.” |
| 30–38 seconds | Select another route | “Decide whether the extra time is worthwhile.” |
| 38–45 seconds | Handoff preview | “Then check the route and entrance in Google Maps.” |

For a tutorial recording keep “Sample data” visible and say the demonstration uses sample observations. For a live recording use only genuinely returned data and the actual available alternatives. Do not promise two routes if the provider returns only one. Do not describe listings as verified people or staff, and do not call a route safe.

## Actual corridor checks after billing

Confirm the public AEOS approach and the exact Manyata gate with the user. The supplied pins may be inside properties. Check both departure and return travel if relevant; do not assume a gate permits both directions or is open at night. A passenger or stationary tester should operate the app; the driver should not do the recording.

Run one bounded real comparison first. Check map geometry, travel time, available alternatives, opening-hour coverage and road-match coverage. Check that Google Maps preserves a useful corridor after adding preview waypoints, and record any extra stops or changed path. Only then evaluate whether the demo supports an activity recommendation. Keep a clearly labelled tutorial fallback ready.

## Ten participant observation sheet

Use planning/M06-participant-results.csv. Assign P01–P10 without names or exact journey histories. For each participant record whether they selected a destination, understood sample/live status, found the time tradeoff, identified missing evidence and opened the handoff. Record PASS, FAIL or NOT TESTED. Ten participants are a usability rehearsal, not validation of safety outcomes.
