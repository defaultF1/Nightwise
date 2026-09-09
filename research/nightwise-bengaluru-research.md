# NightWise: Bengaluru research and reel preparation

Prepared 9 September 2026. Research and design only. No application implementation, paid API test, account setup, or deployment has started.

## 1. Recommended direction

Build a small, no-login route comparison app for **both Android and iOS**, serving up to 10 participants. Use a real Google map covering Bengaluru, India, with the first validated journeys in north Bengaluru. Focus the shoot on Manyata Tech Park to AEOS and a public starting landmark in Sahakar Nagar to AEOS. Map availability across the city does not establish reliable activity evidence across the city.

The supplied AEOS place pin is the destination authority: **13.0628268, 77.5940888**. These are the place coordinates encoded in the user's link; its zoomed-out viewport longitude is not the office longitude. No street address, office entrance, or approach road has been independently confirmed. [User-supplied AEOS pin](https://www.google.com/maps/search/?api=1&query=13.0628268%2C77.5940888).

Driving is the provisional travel mode. Manyata's exact public gate and Sahakar Nagar's exact starting landmark still need local selection. Route lengths, travel times, alternatives, and opening-hours coverage are unmeasured. Generated screens use clearly identified sample data.

The research supports testing whether people value more route context. It does not establish that NightWise reduces harm or that a particular Bengaluru corridor is safer. The recommended product promise is: **compare estimated activity and extra travel time, understand the evidence, then choose a route.**

## 2. Evidence register

### E1 — Chennai perceptions: The Gender Compass, April 2025

Greater Chennai Corporation's Gender & Policy Lab studied 423 eligible Google Maps two-wheeler users, using convenience and snowball sampling, plus 12 interviews. Data collection ran from mid-December 2024 to early January 2025. Of respondents, **49.4% rated nighttime safety 3 or lower on a five-point scale**. This includes the midpoint; it is inaccurate to recast the figure as 49.4% reporting an unsafe incident.

In a separate question answered by 379 people, **61.19% of women and 46.09% of men cited isolated roads**; **58.95% and 41.15% respectively cited dark or less-lit routes**. The subgroup denominators were 134 women and 243 men, with two other respondents in the total. The study does not distinguish perceived from actual risk and is not representative of Bengaluru. [S1, PDF pp. 11–14, 23](https://chennaicorporation.gov.in/gcc/pdf/The%20Gender%20Compass.pdf).

Our implication: make the reasons for a route choice understandable, while keeping lighting explicitly unmeasured when no suitable evidence exists.

### E2 — Bengaluru street audits: Safetipin, 2021 report

This historical mapping project covered **15,000 audit points across 1,900 km**, using over 100,000 images. Its recommendations identified **327 points with no streetlights** and **3,074 points where streetlights were not working**. These are audit-point findings, not counts of residents, incidents, or unique light fixtures. They do not describe conditions in September 2026 or specifically at AEOS. Do not add the two counts without confirming how categories overlap. [S2, PDF pp. 6, 25](https://safetipin.com/wp-content/uploads/2022/04/safety-mapping-in-bengaluru-safetipin-2021.pdf).

Our implication: Bengaluru has a documented reason to examine street context. Business listings alone cannot reproduce a field audit, and no historic lighting layer is assumed available for the app.

### E3 — Tondiarpet, Chennai: Safetipin / World Bank, 2021

The report describes **1,098 audit points**, comprising 919 Safetipin Nite and 179 My Safetipin audits. Coverage included 321 km of roads and 20,070 photographs. It reported adequate street lighting in **91% of the mapped area**, while **35% had walkable footpaths**. These describe the study area and period; neither is a whole-Chennai or Bengaluru prevalence estimate. Collection followed the second COVID wave, which also limits interpretation of observed activity. [S3, PDF pp. 7, 9–10; printed pp. 12–13, 16–19](https://safetipin.com/wp-content/uploads/2021/12/womens-safety-audit-of-tondiarpet-safetipin-2021.pdf).

Our implication: route conditions have separate dimensions. A strong signal in one dimension should not erase missing information in another.

## 3. What the Chennai precedent actually does

The roadmap refers to two related strands: research about navigation experiences, and Safetipin's structured street-audit approach. The Gender Compass is a study, not evidence of a tested NightWise-style routing algorithm. My Safetipin is part of a broader collection and assessment system.

The app's official feature description lets users choose between routes connecting two places, using audit data; inspect area scores; rate public spaces; and find verified support centres. NightWise can borrow the route-choice and explanation pattern. The support directory and user-audit workflow require separate data and operations, so they remain outside this demo. This is a review of published features, not a live app test. [S4a, My Safetipin features](https://safetipin.com/my-safetipin-app/).

Safetipin's published methodology combines geotagged observations through My Safetipin, vehicle-mounted photography through Safetipin Nite, and place-specific assessments through Safetipin Site. Observable parameters include lighting, openness, visibility, people, security, walking conditions, transport access, and gender diversity; manual audits can add the auditor's feeling. Photographic assessment involves computer vision and trained coders. This is materially different from counting businesses returned by a search API. [S4, current methodology](https://safetipin.com/methodology/).

The Chennai corporation's Gender & Policy Lab also describes citizen safe-mobility audits covering **46 locations with 22 trained citizens**, and work with Safetipin in Semmanchery. This demonstrates an institutional process linking observations to public-space work; it does not validate NightWise's proposed score. [S5, GCC programme page](https://chennaicorporation.gov.in/gcc/department/gender-policylab/).

| Inspiration | NightWise adaptation | Boundary |
| --- | --- | --- |
| Several observable dimensions | Separate listed-open places, potential help points, coverage and low-observed-activity stretches | No conversion into a probability of personal safety |
| Evidence tied to a place and time | Show when the analysis was checked and whether hours are unknown | Listing hours do not prove people are present |
| Explainable assessments | Expandable evidence under each route | Do not copy Safetipin's branding, proprietary weights or dataset |
| Local review | Check the two shoot journeys and the navigation handoff on the target phone | Ten participants support usability rehearsal, not safety validation |
| Multiple collection tools | Start with the smallest permitted evidence pipeline | No community reporting, tracking, SOS, audit network or municipal dashboard in this demo |

The initial score weights remain an uncalibrated proposal. Preserve them in the specification, but lead the reel with observable differences. Show a numeric score only after evidence availability, comparable normalization, and the data-use approach are resolved. A visual concept omitting a score does not silently delete that roadmap requirement.

## 4. Bengaluru map and demo geography

Use the real provider map for the whole Bengaluru search area. Apply bounded analysis per request so a long cross-city route does not exhaust the demonstration budget. Keep geographic scope and evidence coverage separate in both UI and narration. Do not imply the whole city has been surveyed.

| Case | Starting point | Destination | Purpose and outstanding check |
| --- | --- | --- | --- |
| D1 — primary | Manyata Tech Park, public gate to be selected | Supplied AEOS pin | Main reel journey; verify gate, alternatives, access and actual data |
| D2 — secondary | Familiar public landmark in Sahakar Nagar, to be selected | Supplied AEOS pin | Shorter tutorial journey; it may legitimately yield only one route |
| D3 — backup | A second public starting point near either area, selected after D1/D2 checks | Supplied AEOS pin | Use only if it returns a useful real comparison; do not invent an alternative |

AEOS is a destination point, not a verified drivable entrance. Manyata is a large campus rather than one unambiguous origin. Check both with the local participant before recording. Do not route through private gates or assume a nearby business is accessible from a flyover or divided road.

The latest generated designs deliberately show Bengaluru map placeholders. Their roads, if decorative lines appear, carry no geographic meaning. Production maps must use the actual provider-rendered Bengaluru map with unobscured attribution. The 18/22-minute values, 6.4/7.2-km values, counts and coverage on the boards are synthetic design examples, not measurements of D1 or D2.

## 5. Android and iOS delivery

Recommend **React + TypeScript with Capacitor**, a shared interface packaged into Android and iOS apps, with a separately hosted HTTPS backend. Capacitor supports web interfaces alongside native device integrations. This recommendation fits the small tutorial scope and prepared UI; it is not an automatic conversion at the end of development. Test both native platforms from the first map prototype. [S14, Capacitor](https://capacitorjs.com/docs).

Bundle the interface into each app. Keep route analysis and secret credentials on the server. A Node server or Next.js server handlers cannot run inside the installed mobile bundle. The browser preview can reuse the frontend, but the requested deliverables are installable apps on both platforms.

Use the Capacitor Google Maps plugin with native Google Maps SDKs for Android and iOS; validate route polylines, taps, scrolling, styling and attribution early. Android's native map sits beneath the WebView and needs correct transparency and positioning. Use the native geolocation plugin for a one-time, user-initiated position and preserve manual input. No background location permission or tracking feature is planned. [S15, map plugin](https://capacitorjs.com/docs/apis/google-maps), [S16, geolocation](https://capacitorjs.com/docs/apis/geolocation).

| Platform | Proposed tutorial distribution | Requirement |
| --- | --- | --- |
| Android | Signed APK for the small test group | Android build tools, owner-controlled signing key and tester installation opt-in |
| iOS | TestFlight beta | Apple Developer membership, App Store Connect, signed build and first external beta review |
| Browser | Optional preview and clearly identified fallback | Shared frontend and hosted backend; does not replace iOS/Android acceptance |

Android permits direct APK distribution, with installation opt-in. TestFlight supports external beta testers, with review of the first external build. Invite participants through the beta process; they do not need administrative access to the developer account. Public app-store publication is a separate milestone. [S17, Android distribution](https://developer.android.com/distribute/marketing-tools/alternative-distribution), [S18, TestFlight](https://developer.apple.com/testflight/).

iOS compilation needs macOS and Xcode, locally or through a suitable macOS build service. This workspace is Windows; iOS cannot be built locally here with Xcode. Android requires Android Studio and its SDK. Toolchain and account availability have not been established, and nothing has been installed. [S19, build requirements](https://capacitorjs.com/docs/getting-started/environment-setup).

Apple lists membership at USD 99 per year, with regional pricing during enrollment. A macOS build service, if needed, is an additional cost to select later. Membership, signing and review lead time sit outside API usage and implementation-hour estimates. [S20, Apple enrollment](https://developer.apple.com/programs/enroll/).

## 6. Engineering preparation and spending model

The shared app and small backend handle origin/destination input, real alternatives, bounded evidence queries, transparent comparison, and external Google Maps handoff. No database, LLM narration dependency, login, continuous location tracking, or in-app navigation is needed. Use platform-restricted native map credentials, a separate web key only for the browser preview, and server-only credentials for backend services.

Two early feasibility checks matter even with ten users. First, Maps URLs do not take the selected Routes API polyline, so the destination can be correct while the corridor changes; test the non-default option on the actual phone. Second, the permitted use of Places-derived scoring and retention still needs resolution. General terms restrict some derived uses; Aggregate has a separate customer-value provision but does not by itself provide open-at-this-hour evidence. These are unresolved design dependencies, not findings that the app is prohibited. [S6, Maps URLs](https://developers.google.com/maps/documentation/urls/get-started), [S7, general terms](https://cloud.google.com/maps-platform/terms), [S8, service-specific terms](https://cloud.google.com/maps-platform/terms/maps-service-terms), [S9, Aggregate parameters](https://developers.google.com/maps/documentation/places-aggregate/request-parameters).

Nearby Search returns at most 20 places per query, and opening-hours fields invoke Enterprise pricing. Returned counts are observations, not a complete census. Failed checks remain unknown. [S10, Nearby Search](https://developers.google.com/maps/documentation/places/web-service/nearby-search).

### Illustrative request budget, not a quote

Assume three hypothetical 8-km routes, sampled every 200 m including endpoints: 41 locations per route, or 123 Nearby Search Enterprise calls per comparison. These lengths are not the measured AEOS routes. The example assumes one query per sample and no reuse, retries, category splits, or additional detail calls.

| Scenario | Enterprise calls | Eligible India pricing | Standard global pricing |
| --- | ---: | ---: | ---: |
| 10 people × 3 comparisons | 3,690 | USD 0.00 | USD 94.15 |
| 100 comparisons including rehearsal | 12,300 | USD 55.65 | USD 395.50 |

Calculated with the full monthly allowance initially unused: India 7,000 free calls, then USD 10.50/1,000; global 1,000, then USD 35/1,000 at the relevant tier. Other account activity consumes the same allowance. Maps, routing, autocomplete/details, hosting and taxes are extra. India pricing requires account eligibility; being in Bengaluru alone is insufficient. Prices checked 9 September 2026. [S11, India pricing](https://developers.google.com/maps/billing-and-pricing/pricing-india), [S12, global pricing](https://developers.google.com/maps/billing-and-pricing/pricing), [S13, eligibility](https://developers.google.com/maps/billing-and-pricing/india).

Keep the tutorial link limited to the intended group, bound simultaneous analyses and repeated taps, and enforce request limits plus a cutoff. Budget alerts alone are not a spending cap. Do not implement an account system solely for this ten-person shoot, or assume unrestricted provider caching is allowed.

## 7. Revised estimate and user contributions

For the confirmed Android **and** iOS scope, estimate **50–80 focused hours after authorization to code and required account/data decisions**, roughly **9–14 working days**. Account enrollment, macOS access, billing, provider support and Apple beta review may add calendar time. This supersedes the earlier 32–52-hour web-only estimate and is not a delivery promise.

| Work | Hours | Exit evidence |
| --- | ---: | --- |
| Feasibility, credentials and two journey checks | 4–6 | Useful real data; non-default handoff understood |
| Journey flow and map integration | 4–6 | Correct Bengaluru origins/destination and returned alternatives |
| Evidence, comparisons and uncertainty | 8–14 | Bounded cost; missing-data behavior; comparable evidence |
| Responsive UI and recovery states | 4–6 | Core flow on the intended phone; secondary states usable |
| Device rehearsal, ten-person check and polish | 6–10 | Recording flow and fallback verified |
| Integration contingency | 6–10 | Remaining defects resolved |
| Android packaging and native validation | 8–12 | Signed APK; map, permission, Back and handoff checks |
| iOS packaging and native validation | 10–16 | Signed build; safe areas, permission, resume and TestFlight preparation |
| Total | **50–80** | Both-platform demo, subject to feasibility and distribution readiness |

This assumes one travel mode, at least one actual Android phone and one iPhone, two validated journeys and ten participants total across both platforms. The earlier 44–72-hour broad web-pilot figure excluded native packaging and cannot be treated as the current both-platform estimate. A synthetic click-through would not establish live routing behavior.

Needed from the user: travel mode; shoot date; actual Android/iPhone models and OS versions; Manyata public gate and Sahakar Nagar landmark; Google Cloud billing owner and API budget; Apple Developer account status and Mac/build-service access; a local person for entrance and handoff checks. The AEOS destination, city, both target platforms and ten-person audience are supplied. Credentials belong in secret settings, not chat.

Allow about 20–30 minutes for visual review and 60–90 minutes for a focused local rehearsal, plus actual travel if needed. The existing support draft is available for the account owner; no message has been sent.

## 8. UI coverage and reel storyboard

The six new concept boards cover 24 principal mobile states, including app launch, permission choices and offline startup. The earlier three-screen image is retained as visual history; the Bengaluru set is the current direction. Controls, platform safe areas, accessibility and real maps must be implemented as UI later; raster boards are design references.

| Board | States |
| --- | --- |
| 01 — Journey setup | Start; find AEOS; manual origin after location failure; journey ready |
| 02 — Comparison and evidence | Comparing; more-activity option selected; fastest selected; expanded evidence |
| 03 — Uncertainty and alternatives | Missing hours; incomplete scan; one route; similar activity |
| 04 — Errors and recovery | No route; network failure; journey beyond demo coverage; daytime |
| 05 — Handoff and information | Google Maps handoff; return/recompare; about; privacy |
| 06 — Android and iOS app states | Launch; optional location; location off/manual fallback; offline launch |

Location success reuses the ready form; invalid input stays inline. Cancellation returns to setup; quota exhaustion uses recovery with a wait/edit action. Native OS permission dialogs remain system-owned. Test Android Back, iOS safe areas, keyboard, approximate location and app resume. The optional desktop preview reuses the same states. A written checklist records variants.

### Proposed 35–45-second reel

| Window | Screen/action | Suggested narration |
| --- | --- | --- |
| 0–6 s | Show the route comparison problem | “The quickest route does not tell you everything about the journey.” |
| 6–13 s | Choose the agreed Manyata gate and AEOS | “This is our Bengaluru demo, heading to AEOS.” |
| 13–25 s | Compare two actual returned options | “NightWise compares estimated activity with the extra travel time.” |
| 25–34 s | Expand evidence and show unknown fields | “See the available evidence, and what the data cannot tell us.” |
| 34–43 s | Select a route and show Google Maps preview | “Choose your route, then check it in Google Maps.” |

Optional research cutaway: “In a Chennai study, 49.4% rated nighttime safety 3 or lower out of 5.” Show the source and year on-screen; do not label this a Bengaluru statistic. Keep the 2025 study's sampling caveat in the caption or accompanying description. [S1](https://chennaicorporation.gov.in/gcc/pdf/The%20Gender%20Compass.pdf).

Use an unobtrusive “Activity estimates are not a safety guarantee” line on relevant results. If recording a concept fallback, visibly label it “Demo data”; never present generated screens, fixed sample scores, or historical audit information as live conditions. Add numerical route claims to narration only after measurement on the shoot day.

## 9. Ten-person validation and shoot checklist

Run a small usability rehearsal, not a safety-outcomes experiment. Ask participants to select AEOS, compare available options, explain the time tradeoff, identify missing data, select either route, and open the Google Maps preview. Record completion, misunderstandings and handoff differences without storing unnecessary exact journey history.

Proposed operational criteria: at least 8 of 10 complete the core comparison/handoff without coaching; at least 8 of 10 correctly explain the time tradeoff; all ten understand that the activity estimate does not guarantee safety after reading the UI. These are internal acceptance targets, not validated statistical thresholds. Record raw counts and revise confusing copy even if a target is met.

Before shooting: install the signed builds on an Android phone and iPhone; verify entrances and origins; rerun journeys at the intended time; confirm real alternatives; record request counts and latency; check readability, attribution and native lifecycle behavior; test the selected corridor in Google Maps on both systems. Prepare a labelled concept fallback. Record while stationary or with a passenger operating the phone.

Open risks are live provider access, permitted evidence use, current hours coverage, route handoff changes, and incomplete local validation. No source reviewed here resolves those risks. The prepared scope, evidence register, UI states, storyboard, budget model, and validation tasks are ready for the next decision without application coding.

## Source notes

S1–S5 are primary study, product or programme sources. S6–S20 are primary provider documentation. Historical findings are not used as a current route layer. The original 14-page roadmap was read in full and treated as project material, subordinate to the request to prepare without coding. The user's Bengaluru and Android/iOS instructions determine geography and delivery.

The scan-only Gender Compass was downloaded from the GCC domain and its charts, methodology and limitations visually checked. The Bengaluru and Tondiarpet report figures were checked against their PDF pages. No underlying row-level audit dataset, proprietary scoring formula, or live AEOS route observation was acquired. Tool-access failures in the browser did not justify inventing an address or claiming the Maps route was verified.

Official OpenAI documentation lists GPT Image 2; GPT Image 2.5 was not verified. The built-in image generator used here exposes no model-version selector, so no particular model version is claimed. [Official model documentation](https://developers.openai.com/api/docs/models/gpt-image-2).
