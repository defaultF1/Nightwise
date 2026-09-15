# Mappls access request draft

To: apisupport@mappls.com

Subject: NightWise — enable place coordinates/hours and traffic-camera report access

Hello Mappls team,

We are migrating NightWise, a React web app packaged for Android using Capacitor, to Mappls. Our priority pilot area is AEOS to Manyata Tech Park in North Bengaluru and approximately 20 km around these locations. Android application ID: `in.nightwise.demo`.

Please advise on credentials, service entitlements, trial quotas and pricing for:

We have now created NightWise Web, NightWise Backend (Cloud) and NightWise Android in the console. On 16 September 2026 our Cloud key successfully returned two AEOS–Manyata routes and three fuel listings from POI Along the Route. However, those POIs lack coordinates and hours, and Place Detail returns only address, name and eloc. Please enable Location Coordinates (subtemplate 5), suitable entrance coordinates and opening-hours data for our use case. We need sample schedules and update timestamps to assess opening at passing time.

1. Vector Web Maps, custom colored markers, clickable route polylines and fullscreen, including supported authentication inside Capacitor WebViews.
2. Autosuggest, geocoding and reverse geocoding.
3. Driving, motorbike and walking routes, distinct alternatives, traffic-aware ETA and departures up to five hours ahead. Please identify which products support each feature.
4. POI Along the Route for shops/food, pharmacies, hospitals and petrol/CNG stations: category IDs, accurate coordinates, pagination, multi-category access and route-length limits.
5. Opening hours, 24-hour status, special/holiday hours and source-update timestamps. Which fields and coverage are available in our pilot area?
6. Your Navigation SDK page advertises upcoming traffic-camera alerts. Please provision the required Navigation SDK / Nearby Reports / Route Report Summary access, with the exact traffic-camera and speed-breaker category IDs. We need to display these as layers before navigation starts, particularly around AEOS–Manyata and Kanpur. Please distinguish traffic enforcement cameras from general surveillance CCTV, and provide coverage, verification/update dates and permitted display/caching terms. Mobile Maps SDK is active on our Android app, but Navigation SDK is not listed. Please confirm whether access can be enabled on our existing keys or needs separate credentials. We are not requesting private live video feeds.
7. Permission to cache responses for less than five minutes and refresh on the next request after expiry, plus attribution and retention requirements.

The app compares route activity evidence and displays nearby help points. We need to understand data gaps rather than imply that listed hours or camera locations are live operational observations.

We also found the Route Events Summary web plugin (`libraries=routesummary`, `mappls.routeSummary`). Please confirm access on our Web key and the route ID/route-index response needed to call it; our current `route_eta` response contains geometry, distance and duration but no route ID. We would prefer the existing static keys with the necessary entitlements where supported.

Please share current documentation and sample response schemas, and explain which services need additional approval or a commercial agreement.

Thank you.
