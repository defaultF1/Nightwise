# North Bengaluru and Kanpur: area, hours and route review

Checked 14 September 2026. These are desk research and software checks, not a field survey or a complete inventory of either city.

## Implemented locally

- North Bengaluru now accepts journey endpoints within 20 km of the supplied AEOS pin (13.0628268, 77.5940888). Kanpur retains its 20 km circle centred at 26.48, 80.30. These are product coverage circles, not administrative boundaries. Both endpoints must be in the same region. The tester can be physically elsewhere when selecting endpoints manually.
- Bengaluru road evidence: a fresh 22 km OpenStreetMap query, 196,038 ways and 979,088 original geometry points. Partitioned into 266 tiles so a comparison reads the nearby tiles instead of indexing the whole city. Provenance and per-tile hashes are in `data/roads/north-bengaluru-22km-provenance.json`. Kanpur retains its 22 km extract from 10 September.
- Hospitals are searched already; they now have purple H markers, separately from pink pharmacies/clinics, green fuel stations and yellow shops. Dense maps reserve marker space for each category. At most 60 place pins are drawn; the schedule list retains the returned listings.
- `Open 24 hours` uses an explicit current Google 24/7 schedule or complete continuous current seven-day coverage. Regular-only schedules say `Usually open 24 hours`. Holiday closures, temporary closures, stale information, malformed schedules and contradictory current status cannot acquire this label. Adjacent opening periods are merged so midnight is not a false closing time.
- Hospital listing hours do not imply that every outpatient department or doctor is available around the clock.
- Missing shop/pharmacy/fuel hours retain the previously requested category estimates, labelled as estimates. Hospitals have no invented opening schedule. Estimated fuel hours never become confirmed `Open 24 hours`.
- Google Maps handoff retains three ordered points on the selected route. These can appear as stops; Maps may still recalculate roads between them.
- Same-journey comparisons can be reused from device session memory for less than five minutes. The cache holds at most three comparisons, retains the original check time, separates direction/endpoints/access-code context and does not renew itself on reuse. Known opening/closing boundaries expire it sooner. A changed journey, expired entry or explicit Refresh triggers a network comparison. Reopening a fully terminated app starts fresh. No route-history cache is written to phone storage.
- Server Nearby and Place Details reuse is also limited to five minutes. Explicit Refresh bypasses both device and server Places reuse; this requires deployment of the updated backend schema before distributing the next APK. Switching an already displayed route or changing the extra-time preference does not scan again. Initial place-search circles are 150 m around returned route samples, not city-wide circles; capped-query refinements stay tied to those samples. Identical query footprints are shared. Map SDK loads and autocomplete are separate from this comparison cache.
- When a saved journey reaches five minutes (or an earlier known opening/closing boundary), the next request explicitly bypasses server Places reuse too. Expiry itself makes no background request. Failed refreshes retain the requirement for a fresh retry instead of reviving the old result. Browser tests confirmed no request at expiry and a forced fresh request on the next comparison.

## Live server observations

The saved `.env.evidence` code authenticated successfully. The older `.env` code did not. No credential is recorded in this report.

After the user supplied the current code, `.env` was updated locally to that value. It remains gitignored.

| Journey | Google alternatives returned | Distances | Travel times at check |
|---|---:|---|---|
| AEOS → Manyata | 3 | 6.091 / 4.795 / 5.381 km | about 12 / 12 / 14 min |
| Manyata → AEOS | 3 | 7.374 / 5.232 / 7.246 km | about 15 / 16 / 18 min |
| Kanpur area test pin → Kakadeo area test pin | 1 | 3.278 km | about 11 min |

Kanpur's test coordinates were explicitly area test pins, not a claimed home or school entrance. Google is not guaranteed to return multiple alternatives for every journey. Travel times change.

All six AEOS/Manyata paths contained 220–418 provider vertices. Endpoints snapped within approximately 27 m of AEOS and 4 m of Manyata. Each direction produced three distinct handoff-point sets; each route sends three points. Geometry lengths differed from Google's reported road distance by less than 0.5% in the rounded check. This verifies the returned shapes, not actual turn-by-turn navigation on a phone.

The three comparisons consumed 3 Routes requests, 0 Nearby searches and 0 Place Details requests. The deployed shared ledger ended at Routes **100/100**, Nearby **2000/2000**, Autocomplete **38/100**, Details **82/100**. Nearby was already exhausted before these comparisons. Every returned analysis had zero places and zero scan/hour coverage. Thus this run verifies real route responses, not current shop availability or a reliable activity recommendation. Increasing only Details will not fix the missing Nearby scans.

The deployed backend is still the previous version and advertises 10 km for Bengaluru. Local changes have not been pushed, deployed or packaged. Fresh shop/hospital checks await authorization and increased server allowances; maximum proposed check is three more comparisons / 360 Nearby requests. No connected Android device was detected in this session.

## Primary-source schedule cross-checks

These entries help validate schedule handling. They are not silently inserted as Google observations, and a locality match alone does not establish that a place is on the selected road. A real place ID, coordinates and route proximity must match before it contributes to a live comparison. Business websites may lag special-day changes.

| Business / location | What its own source states | Handling |
|---|---|---|
| Apollo Pharmacy, Sahakara Nagar, #2 G116/3, 60 Feet Road | 9 am–11 pm, every day | Prefer this branch's actual schedule over a pharmacy-category estimate. [Source](https://www.apollopharmacy.in/medical-stores/bangalore/apollo_pharmacy_sahakara_nagar-14597) |
| Apollo Pharmacy, Kodigehalli Main Road-2; Amruthahalli; CQAL Layout; Godrej Woodman's; Hebbal | Nearby-branch list gives 7 am–11 pm daily | Branch-specific evidence; not the same schedule as every Apollo pharmacy. [Source](https://www.apollopharmacy.in/medical-stores/bangalore/apollo_pharmacy_sahakara_nagar-14597) |
| Several other branches on Apollo's nearby list | Ambiguous `0:00 AM - 12:00 PM` formatting | Do not interpret ambiguous text as 24/7. Request structured Google periods. [Source](https://www.apollopharmacy.in/medical-stores/bangalore/apollo_pharmacy_sahakara_nagar-14597) |
| Manipal Hospital, Hebbal | Official pages describe 24-hour ambulance services and emergency care | Applies to emergency support; not a promise about every outpatient appointment. [Ambulance](https://www.manipalhospitals.com/hebbal/mars/) · [Emergency care](https://www.manipalhospitals.com/hebbal/specialities/accident-and-emergency-care/) |
| IndianOil Swathi Petroleum Station, Kyalasanahalli | Monday–Sunday, 6 am–11 pm | A concrete counterexample to treating every petrol pump as confirmed always open. [Source](https://locator.iocl.com/indianoil-swathi-petroleum-station-petrol-pump-kyalasanahalli-bengaluru-183688/Home) |
| IndianOil B L Auto Fills, Bhadauria Chauraha, Kakadeo | Open 24 Hours | Candidate for a 24-hour listing; still match the Google place and route. [Source](https://locator.iocl.com/location/uttar-pradesh/kanpur/kakadeo) |
| Regency Hospital Tower-1, A2 Sarvodaya Nagar, Kanpur | OPD 9 am–6 pm; blood bank 24×7 | Keep OPD hours separate from emergency/blood-bank hours. [Branch](https://regencyhealthcare.in/locations/hospital-in-kanpur-tower-1/) · [Emergency department](https://regencyhealthcare.in/specialities/emergency-and-intensive-care/) |
| Rama Hospital, Mandhana, Kanpur | 24×7 emergency and trauma care | Emergency-service evidence, not all departments. [Source](https://ramahospital.com/rama-hospital-mandhana/) |
| Apollo Pharmacy, Naubasta Kanpur | 9 am–11 pm every day | Branch-specific weekly hours. [Source](https://www.apollopharmacy.in/medical-stores/kanpur_nagar/apollo_pharmacy_naubasta_kanpur-11650) |
| Reliance SMART Bazaar, Z Square Mall, Bada Chowraha, Kanpur | 10 am–11 pm Monday–Sunday | Demonstrates a shop open beyond the general 8 pm estimate. [Source](https://stores.reliancesmartbazaar.com/reliance-smart-bazaar-shopping-outlet-mg-road-kanpur-280083/Home) |

Google's documented 24/7 sentinel is a Sunday 00:00 open event without a closing event. Current hours cover the next seven days and can include exceptional days. [Google Places resource documentation](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places)

## Remaining limits and deployment requirements

1. Approve/raise the live scan allowances and rerun the three complete comparisons. Exhausted Nearby allowance is the confirmed current cause of absent place results on the tested server.
2. Deploy this code with `ROAD_DATA_PATH=data/roads/north-bengaluru-22km.json`, including its sibling tile directory; an existing Render environment override will otherwise keep loading the old extract. The local `.env` path has been updated with an ignored backup retained.
3. Native marker rendering and navigation need the next APK/device test. APK packaging remains on hold as requested.
4. Full-area support means users can choose in-area journeys; it does not mean every shop throughout a 20 km radius was scanned. The app requests places near route samples, keeps result caps/missing hours visible and cannot prove a street is empty from absent listings.
5. The freshly returned Google paths classify at roughly 76–90% for AEOS→Manyata, 31–95% for Manyata→AEOS and 84% for the tested Kanpur route. Most unknown segments are flyover/grade or competing parallel-road matches, not absent extract coverage. They remain unknown. A real residential way 18.4 km from AEOS classified completely in a targeted outer-area check.

No claim of perfect city coverage, route safety, ground verification or all shops being open is supported by these results.

## Software validation

The complete 184-test unit suite passed after the area, hospital, tiled-road and exhausted-budget changes. Subsequent cache/scoping tests passed separately, including only scanning returned-route footprints, shared samples, five-minute expiration, early expiration at a closing boundary, changed journey/access-code isolation and explicit refresh bypass. TypeScript checks passed. Browser regressions cover hospital labels/colour on a 320 px screen, schedules and estimates, transparent native-map ancestors, offline tutorial, route switching/handoff and reuse/refresh of a comparison. These are browser/mocked-provider tests; no extra paid Google requests were made for them.
